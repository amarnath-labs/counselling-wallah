import 'dotenv/config';
import crypto from 'node:crypto';
import axios from 'axios';
import { pool } from './pool.js';
import {
  findCollegeMatch,
} from './collegeNameMatcher.js';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const SOURCE = 'GOOGLE_PLACES';
const SEARCH_URL =
  'https://places.googleapis.com/v1/places:searchText';

const PAGE_SIZE = 5;
const REQUEST_DELAY_MS = Number(
  process.env.GOOGLE_PLACES_DELAY_MS || 250
);

const FORCE =
  process.argv.includes('--force');

const LIMIT_ARG =
  process.argv.find((x) =>
    x.startsWith('--limit=')
  );

const LIMIT = LIMIT_ARG
  ? Number(LIMIT_ARG.split('=')[1])
  : null;

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\b(the|of|and|for|campus|university|institute|college|technology|engineering)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value) {
  return new Set(
    normalize(value)
      .split(' ')
      .filter(Boolean)
  );
}

function tokenOverlap(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);

  if (!A.size || !B.size) {
    return 0;
  }

  let common = 0;

  for (const token of A) {
    if (B.has(token)) {
      common++;
    }
  }

  return common / Math.max(
    A.size,
    B.size
  );
}

function addressConfidence(
  address,
  college
) {
  const haystack =
    normalize(address);

  let score = 0;
  let checks = 0;

  for (const value of [
    college.city,
    college.state,
  ]) {
    if (!value) continue;

    checks++;

    const needle =
      normalize(value);

    if (
      needle &&
      haystack.includes(needle)
    ) {
      score++;
    }
  }

  return checks
    ? score / checks
    : 0.5;
}

function confidenceForCandidate(
  candidate,
  college
) {
  const name =
    candidate?.displayName?.text || '';

  const address =
    candidate?.formattedAddress || '';

  const nameScore =
    tokenOverlap(
      name,
      college.name
    );

  const geoScore =
    addressConfidence(
      address,
      college
    );

  return (
    nameScore * 0.80 +
    geoScore * 0.20
  );
}

function makeExternalReviewId(
  placeId,
  review,
  index
) {
  const stable =
    review?.name ||
    [
      review?.authorAttribution
        ?.displayName,
      review?.publishTime,
      review?.rating,
      review?.text?.text,
      index,
    ].join('|');

  const hash =
    crypto
      .createHash('sha1')
      .update(stable)
      .digest('hex')
      .slice(0, 24);

  return `${placeId}-${hash}`;
}

async function ensureStatsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS
    college_review_stats (
      id BIGSERIAL PRIMARY KEY,
      college_id TEXT NOT NULL
        REFERENCES colleges(id)
        ON DELETE CASCADE,
      source TEXT NOT NULL,
      external_place_id TEXT,
      source_display_name TEXT,
      source_address TEXT,
      rating NUMERIC(3,2),
      review_count INTEGER,
      bayesian_rating NUMERIC(5,3),
      review_score NUMERIC(6,2),
      match_confidence NUMERIC(5,4),
      source_url TEXT,
      raw_metadata JSONB,
      last_synced_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),
      UNIQUE (college_id, source)
    )
  `);
}

async function getColleges() {
  /*
  |--------------------------------------------------------------------------
  | TRUMARG JOSAA-ONLY GOOGLE REVIEW EXTRACTION
  |--------------------------------------------------------------------------
  |
  | Only:
  | IIT
  | NIT
  | IIIT
  | GFTI
  |
  |--------------------------------------------------------------------------
  */

  const result =
    await pool.query(`
      SELECT DISTINCT
        id,
        name,
        city,
        state,
        LOWER(
          COALESCE(
            type,
            ''
          )
        ) AS type

      FROM colleges

      WHERE
        LOWER(
          COALESCE(
            type,
            ''
          )
        ) IN (
          'iit',
          'nit',
          'iiit',
          'gfti',
          'gftis'
        )

        OR LOWER(name)
          LIKE
          'indian institute of technology%'

        OR LOWER(name)
          LIKE
          'iit %'

        OR LOWER(name)
          LIKE
          'national institute of technology%'

        OR LOWER(name)
          LIKE
          '%indian institute of information technology%'

      ORDER BY
        name
    `);

  return result.rows;
}

async function alreadyFresh(
  collegeId
) {
  if (FORCE) {
    return false;
  }

  const result =
    await pool.query(
      `
      SELECT 1
      FROM college_review_stats
      WHERE college_id = $1
        AND source = $2
        AND last_synced_at >
          NOW() - INTERVAL '30 days'
      LIMIT 1
      `,
      [
        collegeId,
        SOURCE,
      ]
    );

  return result.rowCount > 0;
}

async function searchGoogle(
  college
) {
  const query =
    [
      college.name,
      college.city,
      college.state,
      'India',
    ]
      .filter(Boolean)
      .join(', ');

  const response =
    await axios.post(
      SEARCH_URL,
      {
        textQuery: query,
        pageSize: PAGE_SIZE,
        languageCode: 'en',
        regionCode: 'IN',
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type':
            'application/json',
          'X-Goog-Api-Key':
            API_KEY,
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.rating',
            'places.userRatingCount',
            'places.googleMapsUri',
            'places.reviews',
          ].join(','),
        },
      }
    );

  return (
    response.data?.places || []
  );
}

function chooseCandidate(
  candidates,
  college,
  allColleges
) {
  const scored =
    candidates.map(
      (candidate) => {
        const candidateName =
          candidate?.displayName
            ?.text || '';

        const projectMatch =
          findCollegeMatch(
            candidateName,
            allColleges
          );

        const matchedSameCollege =
          projectMatch?.college?.id ===
          college.id;

        const localConfidence =
          confidenceForCandidate(
            candidate,
            college
          );

        const matcherScore =
          Number(
            projectMatch?.score || 0
          );

        const confidence =
          matchedSameCollege
            ? Math.max(
                localConfidence,
                matcherScore
              )
            : localConfidence * 0.70;

        return {
          candidate,
          confidence,
          matchedSameCollege,
          matcherType:
            projectMatch
              ?.matchType ||
            'unknown',
        };
      }
    )
    .sort(
      (a, b) =>
        b.confidence -
        a.confidence
    );

  const best =
    scored[0] || null;

  if (!best) {
    return null;
  }

  /*
   * Strict safety rule:
   * - preferred: matcher resolves back
   *   to same project college
   * - otherwise local confidence
   *   must be extremely high
   */
  const safe =
    (
      best.matchedSameCollege &&
      best.confidence >= 0.82
    ) ||
    best.confidence >= 0.93;

  return safe
    ? best
    : null;
}

async function saveSourceRegistry(
  collegeId,
  sourceUrl,
  status
) {
  await pool.query(
    `
    INSERT INTO
      college_review_sources
    (
      college_id,
      source,
      source_url,
      source_status,
      last_synced_at,
      created_at,
      updated_at
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT
      (college_id, source)
    WHERE college_id IS NOT NULL
    DO UPDATE SET
      source_url =
        EXCLUDED.source_url,
      source_status =
        EXCLUDED.source_status,
      last_synced_at =
        NOW(),
      updated_at =
        NOW()
    `,
    [
      collegeId,
      SOURCE,
      sourceUrl,
      status,
    ]
  );
}

async function saveStats({
  collegeId,
  candidate,
  confidence,
  matcherType,
}) {
  const rating =
    Number.isFinite(
      Number(candidate?.rating)
    )
      ? Number(candidate.rating)
      : null;

  const count =
    Number.isFinite(
      Number(
        candidate
          ?.userRatingCount
      )
    )
      ? Number(
          candidate
            .userRatingCount
        )
      : 0;

  await pool.query(
    `
    INSERT INTO
      college_review_stats
    (
      college_id,
      source,
      external_place_id,
      source_display_name,
      source_address,
      rating,
      review_count,
      match_confidence,
      source_url,
      raw_metadata,
      last_synced_at,
      created_at,
      updated_at
    )
    VALUES
    (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,$10,
      NOW(),NOW(),NOW()
    )
    ON CONFLICT
      (college_id, source)
    DO UPDATE SET
      external_place_id =
        EXCLUDED.external_place_id,
      source_display_name =
        EXCLUDED.source_display_name,
      source_address =
        EXCLUDED.source_address,
      rating =
        EXCLUDED.rating,
      review_count =
        EXCLUDED.review_count,
      match_confidence =
        EXCLUDED.match_confidence,
      source_url =
        EXCLUDED.source_url,
      raw_metadata =
        EXCLUDED.raw_metadata,
      last_synced_at =
        NOW(),
      updated_at =
        NOW()
    `,
    [
      collegeId,
      SOURCE,
      candidate?.id || null,
      candidate
        ?.displayName
        ?.text || null,
      candidate
        ?.formattedAddress || null,
      rating,
      count,
      confidence,
      candidate
        ?.googleMapsUri || null,
      JSON.stringify({
        matcherType,
      }),
    ]
  );
}

async function saveReview(
  collegeId,
  placeId,
  sourceUrl,
  review,
  index
) {
  const reviewText =
    review?.text?.text?.trim();

  if (!reviewText) {
    return false;
  }

  const externalId =
    makeExternalReviewId(
      placeId,
      review,
      index
    );

  const author =
    review
      ?.authorAttribution
      ?.displayName ||
    null;

  const rating =
    Number.isFinite(
      Number(review?.rating)
    )
      ? Number(review.rating)
      : null;

  const language =
    review?.text
      ?.languageCode ||
    'en';

  const existing =
    await pool.query(
      `
      SELECT id
      FROM college_reviews
      WHERE college_id = $1
        AND source = $2
        AND external_review_id = $3
      LIMIT 1
      `,
      [
        collegeId,
        SOURCE,
        externalId,
      ]
    );

  if (existing.rowCount) {
    await pool.query(
      `
      UPDATE college_reviews
      SET
        author_name = $1,
        rating = $2,
        review_text = $3,
        language = $4,
        source_url = $5
      WHERE id = $6
      `,
      [
        author,
        rating,
        reviewText,
        language,
        sourceUrl,
        existing.rows[0].id,
      ]
    );

    return true;
  }

  await pool.query(
    `
    INSERT INTO college_reviews
    (
      college_id,
      source,
      external_review_id,
      author_name,
      rating,
      review_text,
      language,
      source_url,
      created_at
    )
    VALUES
    (
      $1,$2,$3,$4,$5,
      $6,$7,$8,NOW()
    )
    `,
    [
      collegeId,
      SOURCE,
      externalId,
      author,
      rating,
      reviewText,
      language,
      sourceUrl,
    ]
  );

  return true;
}

async function main() {
  if (!API_KEY) {
    throw new Error(
      'GOOGLE_PLACES_API_KEY is missing in backend/.env'
    );
  }

  await ensureStatsTable();

  const allColleges =
    await getColleges();

  const colleges =
    LIMIT
      ? allColleges.slice(0, LIMIT)
      : allColleges;

  console.log(
    '========================================'
  );
  console.log(
    'GOOGLE PLACES COLLEGE REVIEW EXTRACTION'
  );
  console.log(
    '========================================'
  );
  console.log(
    'Colleges:',
    colleges.length
  );
  console.log(
    'Force:',
    FORCE
  );

  const stats = {
    processed: 0,
    skippedFresh: 0,
    matched: 0,
    unmatched: 0,
    reviewsSaved: 0,
    failed: 0,
  };

  const unmatched = [];

  for (
    let i = 0;
    i < colleges.length;
    i++
  ) {
    const college =
      colleges[i];

    console.log(
      `\n[${i + 1}/${colleges.length}] ${college.name}`
    );

    try {
      if (
        await alreadyFresh(
          college.id
        )
      ) {
        stats.skippedFresh++;
        console.log(
          '  fresh -> skipped'
        );
        continue;
      }

      const candidates =
        await searchGoogle(
          college
        );

      const best =
        chooseCandidate(
          candidates,
          college,
          allColleges
        );

      if (!best) {
        stats.unmatched++;

        unmatched.push({
          college_id:
            college.id,
          college_name:
            college.name,
          city:
            college.city,
          state:
            college.state,
          candidates:
            candidates.map(
              (x) => ({
                id: x.id,
                name:
                  x.displayName
                    ?.text,
                address:
                  x.formattedAddress,
              })
            ),
        });

        await saveSourceRegistry(
          college.id,
          null,
          'NEEDS_REVIEW'
        );

        console.log(
          '  no safe Google match'
        );

        continue;
      }

      const candidate =
        best.candidate;

      const sourceUrl =
        candidate.googleMapsUri ||
        null;

      await saveStats({
        collegeId:
          college.id,
        candidate,
        confidence:
          best.confidence,
        matcherType:
          best.matcherType,
      });

      await saveSourceRegistry(
        college.id,
        sourceUrl,
        'DATA_IMPORTED'
      );

      let saved = 0;

      const reviews =
        Array.isArray(
          candidate.reviews
        )
          ? candidate.reviews
          : [];

      for (
        let r = 0;
        r < reviews.length;
        r++
      ) {
        if (
          await saveReview(
            college.id,
            candidate.id,
            sourceUrl,
            reviews[r],
            r
          )
        ) {
          saved++;
        }
      }

      stats.matched++;
      stats.reviewsSaved +=
        saved;

      console.log(
        `  matched -> ${candidate.displayName?.text || candidate.id}`
      );

      console.log(
        `  confidence -> ${best.confidence.toFixed(3)}`
      );

      console.log(
        `  rating -> ${candidate.rating ?? 'N/A'}`
      );

      console.log(
        `  review count -> ${candidate.userRatingCount ?? 0}`
      );

      console.log(
        `  review texts saved -> ${saved}`
      );
    } catch (error) {
      stats.failed++;

      console.error(
        '  FAILED:',
        error?.response
          ?.data ||
        error.message
      );
    }

    stats.processed++;

    await sleep(
      REQUEST_DELAY_MS
    );
  }

  await import('node:fs/promises')
    .then(
      ({ writeFile }) =>
        writeFile(
          './google-review-unmatched.json',
          JSON.stringify(
            unmatched,
            null,
            2
          ),
          'utf8'
        )
    );

  console.log(
    '\n========================================'
  );
  console.log(
    'EXTRACTION COMPLETE'
  );
  console.log(
    '========================================'
  );
  console.table(stats);

  await pool.end();
}

main().catch(
  async (error) => {
    console.error(
      '\nFATAL:',
      error
    );

    try {
      await pool.end();
    } catch {}

    process.exit(1);
  }
);
