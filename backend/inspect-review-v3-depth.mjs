import { pool } from "./src/db/pool.js";

function print(title) {
  console.log("");
  console.log("========================================");
  console.log(title);
  console.log("========================================");
}

try {

  /*
  ============================================================
  1. RAW PAYLOAD KE TOP-LEVEL KEYS
  ============================================================
  */

  print("RAW PAYLOAD KEYS");

  const keys = await pool.query(`
    SELECT
      key,
      COUNT(*)::int AS count
    FROM college_review_items,
         LATERAL jsonb_object_keys(
           COALESCE(raw_payload, '{}'::jsonb)
         ) AS key
    GROUP BY key
    ORDER BY count DESC, key
  `);

  console.table(keys.rows);


  /*
  ============================================================
  2. IMPORTANT RAW FIELDS COVERAGE
  ============================================================
  */

  print("RAW FIELD COVERAGE");

  const coverage = await pool.query(`
    SELECT

      COUNT(*)::int AS total_reviews,

      COUNT(*) FILTER (
        WHERE NULLIF(
          TRIM(raw_payload->>'review_text'),
          ''
        ) IS NOT NULL
      )::int AS review_text,

      COUNT(*) FILTER (
        WHERE NULLIF(
          TRIM(raw_payload->>'text'),
          ''
        ) IS NOT NULL
      )::int AS text_field,

      COUNT(*) FILTER (
        WHERE NULLIF(
          TRIM(raw_payload->>'content'),
          ''
        ) IS NOT NULL
      )::int AS content_field,

      COUNT(*) FILTER (
        WHERE NULLIF(
          TRIM(raw_payload->>'review_body'),
          ''
        ) IS NOT NULL
      )::int AS review_body,

      COUNT(*) FILTER (
        WHERE NULLIF(
          TRIM(raw_payload->>'overall_sentiment'),
          ''
        ) IS NOT NULL
      )::int AS overall_sentiment,

      COUNT(*) FILTER (
        WHERE NULLIF(
          TRIM(raw_payload->>'sentiment'),
          ''
        ) IS NOT NULL
      )::int AS sentiment_field,

      COUNT(*) FILTER (
        WHERE NULLIF(
          TRIM(raw_payload->>'extraction_note'),
          ''
        ) IS NOT NULL
      )::int AS extraction_note,

      COUNT(*) FILTER (
        WHERE jsonb_typeof(
          raw_payload->'aspect_evidence'
        ) = 'array'
      )::int AS aspect_evidence_array

    FROM college_review_items
  `);

  console.table(coverage.rows);


  /*
  ============================================================
  3. PROGRAMME + VERIFIED STATUS
  ============================================================
  */

  print("PROGRAMME VERIFICATION");

  const programmes = await pool.query(`
    SELECT
      COALESCE(programme_level, '<NULL>') AS programme_level,
      course_verified,
      branch_verified,
      COUNT(*)::int AS count
    FROM college_review_items
    GROUP BY
      programme_level,
      course_verified,
      branch_verified
    ORDER BY count DESC
  `);

  console.table(programmes.rows);


  /*
  ============================================================
  4. ASPECT SCOPES
  ============================================================
  */

  print("ASPECT SCOPE COUNTS");

  const scopes = await pool.query(`
    SELECT
      aspect,
      COALESCE(scope, '<NULL>') AS scope,
      COUNT(*)::int AS count
    FROM review_aspect_sentiments
    GROUP BY
      aspect,
      scope
    ORDER BY
      aspect,
      count DESC
  `);

  console.table(scopes.rows);


  /*
  ============================================================
  5. TARGET BRANCH COVERAGE
  ============================================================
  */

  print("TARGET BRANCH COVERAGE");

  const branches = await pool.query(`
    SELECT
      aspect,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE NULLIF(TRIM(target_branch), '') IS NOT NULL
      )::int AS with_target_branch
    FROM review_aspect_sentiments
    GROUP BY aspect
    ORDER BY aspect
  `);

  console.table(branches.rows);


  /*
  ============================================================
  6. SENTENCE COVERAGE
  ============================================================
  */

  print("EVIDENCE SENTENCE COVERAGE");

  const sentences = await pool.query(`
    SELECT

      COUNT(*)::int AS total_aspect_rows,

      COUNT(*) FILTER (
        WHERE NULLIF(
          TRIM(evidence_summary),
          ''
        ) IS NOT NULL
      )::int AS with_sentence,

      COUNT(*) FILTER (
        WHERE evidence_summary IS NULL
           OR TRIM(evidence_summary) = ''
      )::int AS missing_sentence

    FROM review_aspect_sentiments
  `);

  console.table(sentences.rows);


  /*
  ============================================================
  7. INDIVIDUAL REVIEW RATINGS
  ============================================================
  */

  print("INDIVIDUAL REVIEW RATINGS");

  const ratings = await pool.query(`
    SELECT

      COUNT(*)::int AS total_reviews,

      COUNT(*) FILTER (
        WHERE rating IS NOT NULL
          AND rating_scale IS NOT NULL
          AND rating_scale > 0
      )::int AS usable_ratings,

      COUNT(*) FILTER (
        WHERE rating IS NOT NULL
          AND (
            rating_scale IS NULL
            OR rating_scale <= 0
          )
      )::int AS unusable_ratings

    FROM college_review_items
  `);

  console.table(ratings.rows);


  /*
  ============================================================
  8. PLATFORM AGGREGATES
  ============================================================
  */

  print("PLATFORM AGGREGATE COVERAGE");

  const aggregates = await pool.query(`
    SELECT

      COUNT(*)::int AS total_snapshots,

      COUNT(*) FILTER (
        WHERE aggregate_rating IS NOT NULL
          AND rating_scale IS NOT NULL
          AND rating_scale > 0
      )::int AS usable_numeric_aggregates,

      COUNT(*) FILTER (
        WHERE review_count IS NOT NULL
      )::int AS with_review_count,

      COUNT(*) FILTER (
        WHERE aggregate_rating IS NULL
          AND review_count IS NOT NULL
      )::int AS volume_only

    FROM review_aggregate_snapshots
  `);

  console.table(aggregates.rows);


  /*
  ============================================================
  9. PLATFORM ASPECT RATINGS
  ============================================================
  */

  print("PLATFORM ASPECT RATINGS");

  const platformAspects = await pool.query(`
    SELECT
      aspect,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (
        WHERE rating IS NOT NULL
          AND rating_scale IS NOT NULL
          AND rating_scale > 0
      )::int AS usable
    FROM review_platform_aspect_ratings
    GROUP BY aspect
    ORDER BY aspect
  `);

  console.table(platformAspects.rows);


  /*
  ============================================================
  10. SAMPLE RAW REVIEW ITEMS
  ============================================================
  */

  print("SAMPLE RAW REVIEWS");

  const samples = await pool.query(`
    SELECT
      cri.id,
      cri.college_id,
      rs.name AS source,
      rs.source_type,
      cri.programme_level,
      cri.course,
      cri.branch_text,
      cri.content_access,
      cri.evidence_strength,
      cri.duplicate_status,
      cri.rating,
      cri.rating_scale,
      cri.raw_payload
    FROM college_review_items cri
    LEFT JOIN review_sources rs
      ON rs.id = cri.source_id
    ORDER BY cri.id
    LIMIT 5
  `);

  for (const row of samples.rows) {

    console.log("");
    console.log("----------------------------------------");
    console.log(`REVIEW ITEM ${row.id}`);
    console.log("----------------------------------------");

    console.dir(row, {
      depth: 6,
      colors: true
    });
  }


} catch (error) {

  console.error("");
  console.error("REVIEW V3 DEPTH AUDIT FAILED");
  console.error(error);

} finally {

  await pool.end();
}