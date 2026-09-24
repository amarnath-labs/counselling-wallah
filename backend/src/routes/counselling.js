import { Router } from 'express';
import { pool } from '../db/pool.js';
import { gzipSync } from 'node:zlib';
import { redisGetJson, redisSetJson } from '../services/redisCache.js';
import { buildHistoricalAdmissionIntelligence } from '../services/historicalAdmissionIntelligence.js';
const router = Router();

const RESULTS_CACHE_VERSION =
  String(
    process.env.RESULTS_CACHE_VERSION ||
    'v3'
  ).trim() || 'v3';


const RESULTS_CACHE_TTL_MS =
  5 * 60 * 1000;
const REDIS_RESULTS_TTL_SECONDS =
  30 * 60;
const RESULTS_CACHE_MAX_ENTRIES =
  1000;

const resultsCache = new Map();
const resultsInFlight = new Map();

function makeResultsCacheKey(values) {
  return [
    values.examId,
    values.rank,
    values.year,
    values.round,
    values.category,
    values.requestedQuota || '',
    values.requestedGender || '',
    values.homeState || '',
    values.requestedLimit || '',
  ].join('|');
}

function readResultsCache(key) {
  const entry = resultsCache.get(key);

  if (!entry) return null;

  if (
    Date.now() - entry.createdAt >
    RESULTS_CACHE_TTL_MS
  ) {
    resultsCache.delete(key);
    return null;
  }

  return entry;
}

function writeResultsCache(key, payload) {
  if (resultsCache.has(key)) {
    resultsCache.delete(key);
  }

  while (
    resultsCache.size >=
    RESULTS_CACHE_MAX_ENTRIES
  ) {
    const oldestKey =
      resultsCache.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    resultsCache.delete(oldestKey);
  }

  const serialized =
    JSON.stringify(payload);

  const gzipped =
    gzipSync(
      serialized,
      {
        level: 1,
      }
    );

  resultsCache.set(key, {
    createdAt:
      Date.now(),

    payload,

    serialized,

    gzipped,
  });
}

function sendCachedResults(
  req,
  res,
  entry
) {
  const acceptEncoding =
    String(
      req.headers[
        'accept-encoding'
      ] || ''
    ).toLowerCase();

  res.type('application/json');

  res.vary(
    'Accept-Encoding'
  );

  if (
    acceptEncoding.includes(
      'gzip'
    )
  ) {
    res.set(
      'Content-Encoding',
      'gzip'
    );

    res.set(
      'Content-Length',
      String(
        entry.gzipped.length
      )
    );

    return res.send(
      entry.gzipped
    );
  }

  res.set(
    'Content-Length',
    String(
      Buffer.byteLength(
        entry.serialized
      )
    )
  );

  return res.send(
    entry.serialized
  );
}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function isJeeMainInstitute(
  collegeName,
  collegeType
) {
  const name = normalize(collegeName);
  const type = normalize(collegeType);

  // IIT must NEVER appear in JEE Main.
  if (
    type === 'iit' ||
    name.includes(
      'indian institute of technology'
    ) ||
    name.startsWith('iit ')
  ) {
    return false;
  }

  return (
    type === 'nit' ||
    type === 'iiit' ||
    type === 'gfti' ||
    type === 'gftis' ||

    name.startsWith(
      'national institute of technology'
    ) ||

    name.includes(
      'indian institute of information technology'
    )
  );
}


/*
|--------------------------------------------------------------------------
| COUNSELLING EVENTS
|--------------------------------------------------------------------------
*/

router.get(
  '/events',
  async (req, res, next) => {
    try {
      const params = [];

      let query = `
        SELECT
          name,
          event_date_text AS date,
          status,
          is_demo AS "isDemo"
        FROM counselling_events
      `;

      if (req.query.examId) {
        params.push(
          String(
            req.query.examId
          ).trim()
        );

        query += `
          WHERE exam_id = $1::text
        `;
      }

      query += `
        ORDER BY id
      `;

      const { rows } =
        await pool.query(
          query,
          params
        );

      res.json({
        data: rows,
      });

    } catch (error) {

      console.error(
        'COUNSELLING EVENTS ERROR:',
        error
      );

      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| COUNSELLING RESULTS
|--------------------------------------------------------------------------
*/

router.get(
  '/results',
  async (req, res, next) => {

    try {

      /*
      |--------------------------------------------------------------------------
      | EXAM
      |--------------------------------------------------------------------------
      */

      const examId =
        normalize(
          req.query.examId ||
          'jee-main'
        );


      /*
      |--------------------------------------------------------------------------
      | INPUTS
      |--------------------------------------------------------------------------
      */

      const rank =
        Number(
          req.query.rank
        );

      const studentRank =
        req.query.rank
          ? Number(
              req.query.rank
            )
          : null;


      if (
        studentRank !== null &&
        (
          !Number.isFinite(
            studentRank
          ) ||
          studentRank <= 0
        )
      ) {
        return res.status(400).json({
          error:
            'rank must be a positive number.',
        });
      }


      const category =
        String(
          req.query.category ||
          'OPEN'
        ).trim();

      const year =
        Number(
          req.query.year ||
          (
            examId === 'uptac'
              ? 2025
              : 2026
          )
        );


      /*
      |--------------------------------------------------------------------------
      | ROUND
      |--------------------------------------------------------------------------
      |
      | Frontend sends:
      |
      |   round=1
      |
      | UPTAC database stores:
      |
      |   Round 1
      |
      | Therefore normalize UPTAC rounds here.
      |--------------------------------------------------------------------------
      */

      let round =
        String(
          req.query.round ||
          '1'
        ).trim();

      /*
      |--------------------------------------------------------------------------
      | OPTIONAL RESPONSE LIMIT
      |--------------------------------------------------------------------------
      |
      | Existing frontend behavior remains unchanged when limit is absent.
      |
      | Example:
      |
      |   ?limit=50
      |
      | Useful for high-traffic first-page/mobile requests.
      |--------------------------------------------------------------------------
      */

      const requestedLimitRaw =
        Number.parseInt(
          String(
            req.query.limit ||
            ''
          ),
          10
        );

      const requestedLimit =
        Number.isInteger(
          requestedLimitRaw
        ) &&
        requestedLimitRaw > 0
          ? Math.min(
              requestedLimitRaw,
              500
            )
          : null;



      if (examId === 'uptac') {

        const roundNumber =
          round
            .replace(
              /^round\s*/i,
              ''
            )
            .trim();

        if (
          /^\d+$/.test(
            roundNumber
          )
        ) {
          /*
           * UPTAC production database stores rounds as:
           * Round 1, Round 2, Round 3...
           */
          round =
            roundNumber;
        }
      }


      /*
      |--------------------------------------------------------------------------
      | OPTIONAL FILTERS
      |--------------------------------------------------------------------------
      */

      const requestedQuota =
        req.query.quota
          ? String(
              req.query.quota
            ).trim()
          : null;

      const requestedGender =
        req.query.gender
          ? String(
              req.query.gender
            ).trim()
          : null;

      const homeState =
        req.query.homeState
          ? String(
              req.query.homeState
            ).trim()
          : null;


      /*
      |--------------------------------------------------------------------------
      | VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isInteger(rank) ||
        rank <= 0
      ) {
        return res.status(400).json({
          error:
            'Valid rank is required',
        });
      }

      if (
        !Number.isInteger(year)
      ) {
        return res.status(400).json({
          error:
            'Valid year is required',
        });
      }


      /*
      |--------------------------------------------------------------------------
      | SUPPORTED EXAMS
      |--------------------------------------------------------------------------
      */

      const SUPPORTED_COUNSELLING_EXAMS = [
        'jee-main',
        'jee-advanced',
        'uptac',
      ];


      /*
      |--------------------------------------------------------------------------
      | BLOCK UNSUPPORTED EXAMS
      |--------------------------------------------------------------------------
      */

      if (
        !SUPPORTED_COUNSELLING_EXAMS.includes(
          examId
        )
      ) {

        return res.json({
          data: [],

          meta: {
            examId,
            rank,
            year,
            round,
            category,

            quota:
              requestedQuota,

            gender:
              requestedGender,

            homeState,

            count: 0,

            message:
              `${examId} data is not available yet. ` +
              `JoSAA data will not be used for this exam.`,
          },
        });
      }


      /*
      |--------------------------------------------------------------------------
      | SQL PARAMETERS
      |--------------------------------------------------------------------------
      */

      const resultsCacheKey =
        makeResultsCacheKey({
          examId,
          rank,
          year,
          round,
          category,
          requestedQuota,
          requestedGender,
          homeState,
          requestedLimit,
        });

      const cachedEntry =
        readResultsCache(
          resultsCacheKey
        );

      if (cachedEntry) {
        res.set(
          'X-TruMarg-Cache',
          'LOCAL'
        );

        return sendCachedResults(
          req,
          res,
          cachedEntry
        );
      }

      const redisCacheKey =
        `trumarg:${RESULTS_CACHE_VERSION}:results:${resultsCacheKey}`;

      const redisPayload =
        await redisGetJson(
          redisCacheKey
        );

      if (redisPayload) {
        writeResultsCache(
          resultsCacheKey,
          redisPayload
        );

        const redisEntry =
          readResultsCache(
            resultsCacheKey
          );

        if (redisEntry) {
          res.set(
            'X-TruMarg-Cache',
            'REDIS'
          );

          return sendCachedResults(
            req,
            res,
            redisEntry
          );
        }
      }


      const params = [
        rank,       // $1
        year,       // $2
        round,      // $3
        category,   // $4
      ];

      let paramIndex = 5;


      /*
      |--------------------------------------------------------------------------
      | BASE QUERY
      |--------------------------------------------------------------------------
      */

      let query = `
        SELECT
          c.id AS college_id,
          c.name AS college_name,
          c.city,
          c.state,
          c.type,

          b.id AS branch_id,
          b.name AS branch_name,

          co.year,
          co.round,
          co.category,
          co.quota,
          co.gender,

          co.opening_rank AS "openingRank",
          co.closing_rank AS "closingRank",

          co.source_label AS source,
          co.is_verified AS "isVerified",
          co.verification_status AS "verificationStatus",
          co.source_url AS "sourceUrl",
          co.retrieved_at AS "retrievedAt"

        FROM cutoffs co

        INNER JOIN branches b
          ON b.id = co.branch_id

        INNER JOIN colleges c
          ON c.id = b.college_id

        WHERE
          co.year = $2

          AND co.round = $3

          AND co.category = $4

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT:
          |
          | Do NOT require:
          |
          |   opening_rank <= user rank
          |
          | A student with rank 3000 can be eligible
          | for a historical cutoff that opened at 32326
          | and closed at 50510.
          |
          | We therefore use closing rank as the
          | minimum historical eligibility boundary.
          |--------------------------------------------------------------------------
          */

          AND co.closing_rank >= $1
      `;


      /*
      |--------------------------------------------------------------------------
      | JEE MAIN
      |--------------------------------------------------------------------------
      |
      | JEE Main:
      |
      | NIT   ✅
      | IIIT  ✅
      | GFTI  ✅
      | IIT   ❌
      |
      */

      if (
        examId === 'jee-main'
      ) {

        query += `
          AND (
            LOWER(c.type) IN (
              'nit',
              'iiit',
              'gfti',
              'gftis'
            )

            OR LOWER(c.name) LIKE
              'national institute of technology%'

            OR LOWER(c.name) LIKE
              '%indian institute of information technology%'
          )

          AND LOWER(c.type) <> 'iit'

          AND LOWER(c.name) NOT LIKE
            'indian institute of technology%'

          AND LOWER(c.name) NOT LIKE
            'iit %'
        `;
      }


      /*
      |--------------------------------------------------------------------------
      | JEE ADVANCED
      |--------------------------------------------------------------------------
      |
      | JEE Advanced:
      |
      | IIT ✅
      |
      */

      if (
        examId === 'jee-advanced'
      ) {

        query += `
          AND (
            LOWER(c.type) = 'iit'

            OR LOWER(c.name) LIKE
              'indian institute of technology%'

            OR LOWER(c.name) LIKE
              'iit %'
          )
        `;
      }


      /*
      |--------------------------------------------------------------------------
      | UPTAC
      |--------------------------------------------------------------------------
      */

      if (
        examId === 'uptac'
      ) {

        query += `
          AND co.counselling_type = 'UPTAC'

          AND co.verification_status = 'VERIFIED'

          AND co.is_verified = true
        `;
      }


      /*
      |--------------------------------------------------------------------------
      | GENDER
      |--------------------------------------------------------------------------
      */

      if (
        requestedGender
      ) {

        const gender =
          normalize(
            requestedGender
          );


        /*
        |--------------------------------------------------------------------------
        | UPTAC GENDER
        |--------------------------------------------------------------------------
        */

        if (
          examId === 'uptac'
        ) {

          if (
            gender.includes(
              'female'
            )
          ) {

            query += `
              AND (
                LOWER(co.gender) LIKE '%female%'

                OR LOWER(co.gender)
                  LIKE '%both male and female%'
              )
            `;

          } else if (
            gender.includes(
              'male'
            )
          ) {

            query += `
              AND (
                LOWER(TRIM(co.gender)) =
                  'both male and female seats'
              )
            `;

          } else {

            query += `
              AND (
                LOWER(TRIM(co.gender)) =
                  'female'

                OR LOWER(TRIM(co.gender)) =
                  'both male and female seats'
              )
            `;
          }

        } else {

          /*
          |--------------------------------------------------------------------------
          | EXISTING JEE GENDER LOGIC
          |--------------------------------------------------------------------------
          */

          if (
            gender.includes(
              'female'
            )
          ) {

            query += `
              AND co.gender IN (
                'Female-only (including Supernumerary)',
                'Gender-Neutral'
              )
            `;

          } else {

            query += `
              AND co.gender =
                'Gender-Neutral'
            `;
          }
        }
      }


      /*
      |--------------------------------------------------------------------------
      | QUOTA / HOME STATE ELIGIBILITY
      |--------------------------------------------------------------------------
      |
      | Priority:
      |
      | 1. Explicit quota wins.
      |
      | 2. Otherwise for JEE Main:
      |
      |    AI:
      |      valid regardless of home state.
      |
      |    HS:
      |      college state must match student's home state.
      |
      |    OS:
      |      college state must differ from student's home state.
      |
      | Special quota codes are NOT guessed automatically.
      |
      */

      if (
        requestedQuota
      ) {
        params.push(
          requestedQuota
        );

        const quotaParam =
          `$${paramIndex++}`;

        query += `
          AND co.quota =
            ${quotaParam}
        `;
      }

      else if (
        examId === 'jee-main' &&
        homeState
      ) {
        params.push(
          homeState
        );

        const homeStateParam =
          `$${paramIndex++}`;

        query += `
          AND (
            UPPER(
              TRIM(co.quota)
            ) = 'AI'

            OR (
              UPPER(
                TRIM(co.quota)
              ) = 'HS'

              AND LOWER(
                TRIM(c.state)
              ) = LOWER(
                TRIM(
                  ${homeStateParam}
                )
              )
            )

            OR (
              UPPER(
                TRIM(co.quota)
              ) = 'OS'

              AND LOWER(
                TRIM(c.state)
              ) <> LOWER(
                TRIM(
                  ${homeStateParam}
                )
              )
            )
          )
        `;
      }


      /*
      |--------------------------------------------------------------------------
      | ORDER
      |--------------------------------------------------------------------------
      */

      query += `
        ORDER BY
          co.closing_rank ASC,
          c.name ASC,
          b.name ASC
        LIMIT 500
      `;


      /*
      |--------------------------------------------------------------------------
      | EXECUTE QUERY
      |--------------------------------------------------------------------------
      */

      console.log(
        '[COUNSELLING] Query params:',
        {
          examId,
          rank,
          year,
          round,
          category,
          quota:
            requestedQuota,
          gender:
            requestedGender,
          homeState,
        }
      );

      let payloadPromise =
        resultsInFlight.get(
          resultsCacheKey
        );

      if (!payloadPromise) {
        payloadPromise =
          (async () => {
            const queryResult =
              await pool.query(
                query,
                params
              );

            const { rows } =
              queryResult;

            console.log(
              '[COUNSELLING] DB rows:',
              rows.length
            );

            /*
            |--------------------------------------------------------------------------
            | REMOVE DUPLICATES
            |--------------------------------------------------------------------------
            */

            const seen =
              new Set();

            const uniqueRows =
              rows.filter(
                (row) => {

                  const key = [
                    row.college_id,
                    row.branch_id,
                    row.year,
                    row.round,
                    row.category,
                    row.quota,
                    row.gender,
                  ].join('|');

                  if (
                    seen.has(key)
                  ) {
                    return false;
                  }

                  seen.add(key);

                  return true;
                }
              );

            /*
            |--------------------------------------------------------------------------
            | FINAL JEE MAIN SAFETY FILTER
            |--------------------------------------------------------------------------
            */

            let finalRows =
              uniqueRows;

            if (
              examId === 'jee-main'
            ) {
              finalRows =
                uniqueRows.filter(
                  (row) =>
                    isJeeMainInstitute(
                      row.college_name,
                      row.type
                    )
                );
            }

            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

            const totalCount =
              finalRows.length;

            const responseRows =
              requestedLimit
                ? finalRows.slice(
                    0,
                    requestedLimit
                  )
                : finalRows;

            const responsePayload = {
              data:
                responseRows,

              meta: {
                examId,
                rank,
                year,
                round,
                category,

                quota:
                  requestedQuota,

                gender:
                  requestedGender,

                homeState,

                count:
                  responseRows.length,

                totalCount,

                limit:
                  requestedLimit,
              },
            };

            writeResultsCache(
              resultsCacheKey,
              responsePayload
            );

            void redisSetJson(
              redisCacheKey,
              responsePayload,
              REDIS_RESULTS_TTL_SECONDS
            );

            return responsePayload;
          })();

        resultsInFlight.set(
          resultsCacheKey,
          payloadPromise
        );
      }

      let responsePayload;

      try {
        responsePayload =
          await payloadPromise;
      } finally {
        if (
          resultsInFlight.get(
            resultsCacheKey
          ) === payloadPromise
        ) {
          resultsInFlight.delete(
            resultsCacheKey
          );
        }
      }

      res.set(
        'X-TruMarg-Cache',
        'DB'
      );

      return res.json(
        responsePayload
      );

    } catch (error) {

      console.error(
        'COUNSELLING RESULTS ERROR:',
        error
      );

      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| HISTORICAL CUTOFF INTELLIGENCE
|--------------------------------------------------------------------------
|
| Read-only additive endpoint.
| Existing /results logic remains unchanged.
|
*/

/*
|--------------------------------------------------------------------------
| BATCH CSAB HISTORICAL MATCHES
|--------------------------------------------------------------------------
|
| Additive/read-only endpoint.
| Existing counselling result logic remains unchanged.
|
*/

router.post(
  '/csab-matches',
  async (req, res, next) => {
    try {
      const rawBranchIds =
        Array.isArray(
          req.body?.branchIds
        )
          ? req.body.branchIds
          : [];

      const branchIds =
        [
          ...new Set(
            rawBranchIds
              .map(Number)
              .filter(
                (id) =>
                  Number.isInteger(id) &&
                  id > 0
              )
          ),
        ];

      if (
        branchIds.length === 0
      ) {
        return res.json({
          data: {},
          meta: {
            requested: 0,
            matched: 0,
          },
        });
      }

      if (
        branchIds.length > 1000
      ) {
        return res.status(400).json({
          error:
            'Maximum 1000 branchIds are allowed.',
        });
      }


      const studentRank =
        Number(
          req.body?.rank
        );

      if (
        !Number.isFinite(
          studentRank
        ) ||
        studentRank <= 0
      ) {
        return res.status(400).json({
          error:
            'rank must be a positive number.',
        });
      }


      const category =
        req.body?.category
          ? String(
              req.body.category
            ).trim()
          : null;

      const requestedQuota =
        req.body?.quota
          ? String(
              req.body.quota
            ).trim()
          : null;

      const gender =
        req.body?.gender
          ? String(
              req.body.gender
            ).trim()
          : null;


      const csabQuotaAliases = {
        AI: 'All India',
        'ALL INDIA': 'All India',

        HS: 'Home State',
        'HOME STATE': 'Home State',

        OS: 'Other State',
        'OTHER STATE': 'Other State',

        GO: 'Home State for Goa',
        'HOME STATE FOR GOA':
          'Home State for Goa',

        JK:
          'Jammu & Kashmir (UT)',
        'JAMMU & KASHMIR (UT)':
          'Jammu & Kashmir (UT)',

        LA: 'Ladakh (UT)',
        'LADAKH (UT)':
          'Ladakh (UT)',
      };


      const csabQuota =
        requestedQuota
          ? (
              csabQuotaAliases[
                requestedQuota
                  .toUpperCase()
              ] ||
              requestedQuota
            )
          : null;


      const result =
        await pool.query(
          `
            SELECT
              c.branch_id,
              c.year,
              c.round,
              c.category,
              c.quota,
              c.gender,
              c.opening_rank,
              c.closing_rank

            FROM cutoffs c

            WHERE c.branch_id =
              ANY($1::bigint[])

              AND c.counselling_type =
                'CSAB_SPECIAL'

              AND c.year BETWEEN
                2024 AND 2026

              AND (
                $2::text IS NULL
                OR c.category = $2
              )

              AND (
                $3::text IS NULL
                OR c.quota = $3
              )

              AND (
                $4::text IS NULL
                OR c.gender = $4
              )

            ORDER BY
              c.branch_id,
              c.year DESC,

              CASE
                WHEN c.round ~ '^[0-9]+$'
                THEN c.round::integer
                ELSE 999
              END,

              c.round
          `,
          [
            branchIds,
            category,
            csabQuota,
            gender,
          ]
        );


      const rowsByBranch =
        new Map();


      for (
        const row
        of result.rows
      ) {
        const branchId =
          Number(
            row.branch_id
          );

        if (
          !rowsByBranch.has(
            branchId
          )
        ) {
          rowsByBranch.set(
            branchId,
            []
          );
        }

        rowsByBranch
          .get(branchId)
          .push({
            year:
              Number(
                row.year
              ),

            round:
              row.round,

            category:
              row.category,

            quota:
              row.quota,

            gender:
              row.gender,

            openingRank:
              row.opening_rank === null
                ? null
                : Number(
                    row.opening_rank
                  ),

            closingRank:
              Number(
                row.closing_rank
              ),
          });
      }


      const data = {};


      for (
        const branchId
        of branchIds
      ) {
        const csabRows =
          rowsByBranch.get(
            branchId
          ) || [];

        const intelligence =
          buildHistoricalAdmissionIntelligence({
            studentRank,
            josaaRows: [],
            csabRows,
          });

        const csab =
          intelligence?.csab;


        data[
          String(branchId)
        ] = {
          available:
            Boolean(
              csab?.available
            ),

          bucket:
            csab
              ?.historicalBucket ||
            null,

          weightedRankRatio:
            csab
              ?.weightedRankRatio ??
            null,
        };
      }


      const matched =
        Object.values(data)
          .filter(
            (item) =>
              item.available
          )
          .length;


      return res.json({
        data,

        meta: {
          requested:
            branchIds.length,

          matched,

          years: [
            2024,
            2025,
            2026,
          ],

          counsellingType:
            'CSAB_SPECIAL',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/cutoff-history',
  async (req, res, next) => {
    try {
      const branchId =
        Number(
          req.query.branchId
        );

      if (
        !Number.isInteger(branchId) ||
        branchId <= 0
      ) {
        return res.status(400).json({
          error:
            'A valid branchId is required.',
        });
      }

      const studentRank =
        req.query.rank
          ? Number(
              req.query.rank
            )
          : null;


      if (
        studentRank !== null &&
        (
          !Number.isFinite(
            studentRank
          ) ||
          studentRank <= 0
        )
      ) {
        return res.status(400).json({
          error:
            'rank must be a positive number.',
        });
      }


      const category =
        req.query.category
          ? String(
              req.query.category
            ).trim()
          : null;

      const requestedQuota =
        req.query.quota
          ? String(
              req.query.quota
            ).trim()
          : null;

      const gender =
        req.query.gender
          ? String(
              req.query.gender
            ).trim()
          : null;


      /*
      |--------------------------------------------------------------------------
      | JoSAA / CSAB quota aliases
      |--------------------------------------------------------------------------
      */

      const quotaAliases = {
        AI: {
          josaa: 'AI',
          csab: 'All India',
        },

        'ALL INDIA': {
          josaa: 'AI',
          csab: 'All India',
        },

        HS: {
          josaa: 'HS',
          csab: 'Home State',
        },

        'HOME STATE': {
          josaa: 'HS',
          csab: 'Home State',
        },

        OS: {
          josaa: 'OS',
          csab: 'Other State',
        },

        'OTHER STATE': {
          josaa: 'OS',
          csab: 'Other State',
        },

        GO: {
          josaa: 'GO',
          csab: 'Home State for Goa',
        },

        'HOME STATE FOR GOA': {
          josaa: 'GO',
          csab: 'Home State for Goa',
        },

        JK: {
          josaa: 'JK',
          csab: 'Jammu & Kashmir (UT)',
        },

        'JAMMU & KASHMIR (UT)': {
          josaa: 'JK',
          csab: 'Jammu & Kashmir (UT)',
        },

        LA: {
          josaa: 'LA',
          csab: 'Ladakh (UT)',
        },

        'LADAKH (UT)': {
          josaa: 'LA',
          csab: 'Ladakh (UT)',
        },
      };


      const quotaPair =
        requestedQuota
          ? (
              quotaAliases[
                requestedQuota
                  .toUpperCase()
              ] || {
                josaa:
                  requestedQuota,

                csab:
                  requestedQuota,
              }
            )
          : null;


      const result =
        await pool.query(
          `
          SELECT
            c.year,
            c.round,
            c.category,
            c.quota,
            c.gender,
            c.opening_rank,
            c.closing_rank,
            c.counselling_type,
            c.source_label,
            c.source_url,
            c.is_verified,

            b.id AS branch_id,
            b.name AS branch_name,

            col.id AS college_id,
            col.name AS college_name

          FROM cutoffs c

          JOIN branches b
            ON b.id = c.branch_id

          JOIN colleges col
            ON col.id = b.college_id

          WHERE c.branch_id = $1

            AND c.counselling_type IN (
              'JOSAA',
              'CSAB_SPECIAL'
            )

            AND c.year BETWEEN
              2024 AND 2026

            AND (
              $2::text IS NULL
              OR c.category = $2
            )

            AND (
              $3::text IS NULL

              OR (
                c.counselling_type = 'JOSAA'
                AND c.quota = $3
              )

              OR (
                c.counselling_type = 'CSAB_SPECIAL'
                AND c.quota = $4
              )
            )

            AND (
              $5::text IS NULL
              OR c.gender = $5
            )

          ORDER BY
            c.year DESC,

            CASE
              WHEN c.round ~ '^[0-9]+$'
              THEN c.round::integer
              ELSE 999
            END,

            c.round
          `,
          [
            branchId,
            category,
            quotaPair?.josaa || null,
            quotaPair?.csab || null,
            gender,
          ]
        );


      const josaa = [];
      const csab = [];


      for (
        const row
        of result.rows
      ) {
        const item = {
          year:
            Number(row.year),

          round:
            row.round,

          category:
            row.category,

          quota:
            row.quota,

          gender:
            row.gender,

          openingRank:
            row.opening_rank === null
              ? null
              : Number(
                  row.opening_rank
                ),

          closingRank:
            Number(
              row.closing_rank
            ),

          verified:
            Boolean(
              row.is_verified
            ),

          sourceLabel:
            row.source_label,

          sourceUrl:
            row.source_url,
        };


        if (
          row.counselling_type ===
          'JOSAA'
        ) {
          josaa.push(item);
        }

        if (
          row.counselling_type ===
          'CSAB_SPECIAL'
        ) {
          csab.push(item);
        }
      }


      const intelligence =
        studentRank !== null
          ? buildHistoricalAdmissionIntelligence({
              studentRank,
              josaaRows:
                josaa,
              csabRows:
                csab,
            })
          : null;


      const firstRow =
        result.rows[0] || null;


      return res.json({
        data: {
          college:
            firstRow
              ? {
                  id:
                    firstRow.college_id,

                  name:
                    firstRow.college_name,
                }
              : null,

          branch: {
            id:
              branchId,

            name:
              firstRow
                ? firstRow.branch_name
                : null,
          },

          filters: {
            rank:
              studentRank,

            category,
            quota:
              requestedQuota,
            gender,
          },

          josaa,
          csab,

          intelligence,
        },

        meta: {
          years: [
            2024,
            2025,
            2026,
          ],

          josaaCount:
            josaa.length,

          csabCount:
            csab.length,

          totalCount:
            result.rows.length,
        },
      });

    } catch (error) {
      console.error(
        'CUTOFF HISTORY ERROR:',
        error
      );

      next(error);
    }
  }
);


export default router;