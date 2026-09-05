import { Router } from 'express';
import { pool } from '../db/pool.js';
import { gzipSync } from 'node:zlib';

const router = Router();


const RESULTS_CACHE_TTL_MS = 60 * 1000;
const RESULTS_CACHE_MAX_ENTRIES = 200;

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
            `Round ${roundNumber}`;
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
        });

      const cachedEntry =
        readResultsCache(
          resultsCacheKey
        );

      if (cachedEntry) {
        return sendCachedResults(
          req,
          res,
          cachedEntry
        );
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
      | QUOTA
      |--------------------------------------------------------------------------
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

            const responsePayload = {
              data:
                finalRows,

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
                  finalRows.length,
              },
            };

            writeResultsCache(
              resultsCacheKey,
              responsePayload
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

export default router;