import 'dotenv/config';

import {
  pool,
} from './src/db/pool.js';


async function showColumns(
  tableName
) {
  const { rows } =
    await pool.query(
      `
        SELECT
          column_name,
          data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `,
      [
        tableName,
      ]
    );

  console.log(
    `\n=== ${tableName} COLUMNS ===`
  );

  console.table(
    rows
  );
}


async function showCount(
  tableName
) {
  try {
    const { rows } =
      await pool.query(
        `
          SELECT
            COUNT(*)::int AS count
          FROM ${tableName}
        `
      );

    console.log(
      `${tableName}:`,
      rows[0]?.count
    );
  } catch (error) {
    console.log(
      `${tableName}: ERROR`,
      error.message
    );
  }
}


async function main() {
  try {
    console.log(
      '\n========================================'
    );

    console.log(
      'CW-REC DATA COVERAGE AUDIT'
    );

    console.log(
      '========================================\n'
    );


    /* =====================================
       TABLE COUNTS
    ===================================== */

    console.log(
      '=== TABLE COUNTS ==='
    );

    const tables = [
      'college_quality_metrics',
      'college_fee_profiles',
      'branch_fees',
      'college_reviews',
      'college_review_items',
      'college_review_sentiment',
      'college_review_sources',
      'college_review_stats',
      'review_aggregate_snapshots',
      'review_aspect_sentiments',
      'review_platform_aspect_ratings',
    ];


    for (
      const table of tables
    ) {
      await showCount(
        table
      );
    }


    /* =====================================
       IMPORTANT REVIEW SCHEMAS
    ===================================== */

    await showColumns(
      'college_review_stats'
    );

    await showColumns(
      'review_aggregate_snapshots'
    );

    await showColumns(
      'review_aspect_sentiments'
    );

    await showColumns(
      'college_review_sentiment'
    );

    await showColumns(
      'college_review_items'
    );


    /* =====================================
       UNIQUE UPTAC COLLEGES
    ===================================== */

    const uptacColleges =
      await pool.query(`
        SELECT
          COUNT(
            DISTINCT c.id
          )::int AS count
        FROM cutoffs co

        INNER JOIN branches b
          ON b.id =
             co.branch_id

        INNER JOIN colleges c
          ON c.id =
             b.college_id

        WHERE
          co.counselling_type =
            'UPTAC'
      `);


    console.log(
      '\nUnique UPTAC colleges:',
      uptacColleges.rows[0]?.count
    );


    /* =====================================
       DIRECT QUALITY-ID COVERAGE
    ===================================== */

    const qualityCoverage =
      await pool.query(`
        SELECT
          COUNT(
            DISTINCT c.id
          )::int AS matched_colleges

        FROM cutoffs co

        INNER JOIN branches b
          ON b.id =
             co.branch_id

        INNER JOIN colleges c
          ON c.id =
             b.college_id

        INNER JOIN college_quality_metrics qm
          ON qm.college_id =
             c.id::text

        WHERE
          co.counselling_type =
            'UPTAC'
      `);


    console.log(
      'UPTAC colleges directly matching quality college_id:',
      qualityCoverage.rows[0]?.matched_colleges
    );


    /* =====================================
       DIRECT FEE-ID COVERAGE
    ===================================== */

    const feeCoverage =
      await pool.query(`
        SELECT
          COUNT(
            DISTINCT c.id
          )::int AS matched_colleges

        FROM cutoffs co

        INNER JOIN branches b
          ON b.id =
             co.branch_id

        INNER JOIN colleges c
          ON c.id =
             b.college_id

        INNER JOIN college_fee_profiles fp
          ON fp.college_id =
             c.id::text

        WHERE
          co.counselling_type =
            'UPTAC'
      `);


    console.log(
      'UPTAC colleges directly matching fee college_id:',
      feeCoverage.rows[0]?.matched_colleges
    );


    /* =====================================
       DIRECT REVIEW-ID COVERAGE
    ===================================== */

    const reviewCoverage =
      await pool.query(`
        SELECT
          COUNT(
            DISTINCT c.id
          )::int AS matched_colleges

        FROM cutoffs co

        INNER JOIN branches b
          ON b.id =
             co.branch_id

        INNER JOIN colleges c
          ON c.id =
             b.college_id

        INNER JOIN college_reviews cr
          ON cr.college_id =
             c.id::text

        WHERE
          co.counselling_type =
            'UPTAC'
      `);


    console.log(
      'UPTAC colleges directly matching college_reviews college_id:',
      reviewCoverage.rows[0]?.matched_colleges
    );


    /* =====================================
       SAMPLE UPTAC IDS
    ===================================== */

    const uptacSamples =
      await pool.query(`
        SELECT DISTINCT
          c.id AS college_id,
          c.name AS college_name

        FROM cutoffs co

        INNER JOIN branches b
          ON b.id =
             co.branch_id

        INNER JOIN colleges c
          ON c.id =
             b.college_id

        WHERE
          co.counselling_type =
            'UPTAC'

        ORDER BY
          c.name

        LIMIT 20
      `);


    console.log(
      '\n=== SAMPLE UPTAC COLLEGE IDS ==='
    );

    console.table(
      uptacSamples.rows
    );


    /* =====================================
       SAMPLE QUALITY IDS
    ===================================== */

    const qualitySamples =
      await pool.query(`
        SELECT
          college_id,
          nirf_rank,
          nirf_score,
          placement_rate,
          median_package,
          academic_year,
          verification_status

        FROM college_quality_metrics

        ORDER BY
          academic_year DESC,
          nirf_rank ASC NULLS LAST

        LIMIT 20
      `);


    console.log(
      '\n=== SAMPLE QUALITY IDS ==='
    );

    console.table(
      qualitySamples.rows
    );


    /* =====================================
       SAMPLE FEE IDS
    ===================================== */

    const feeSamples =
      await pool.query(`
        SELECT
          college_id,
          college_name_raw,
          fee_year,
          annual_academic_fee,
          annual_total_fee,
          total_course_fee,
          confidence_score,
          verification_status

        FROM college_fee_profiles

        ORDER BY
          fee_year DESC NULLS LAST,
          confidence_score DESC NULLS LAST

        LIMIT 20
      `);


    console.log(
      '\n=== SAMPLE FEE IDS ==='
    );

    console.table(
      feeSamples.rows
    );


    /* =====================================
       SAMPLE REVIEW IDS
    ===================================== */

    const reviewSamples =
      await pool.query(`
        SELECT
          college_id,
          rating,
          review_source,
          sentiment_label,
          sentiment_score,
          review_date,
          verification_status

        FROM college_reviews

        ORDER BY
          review_date DESC NULLS LAST,
          id DESC

        LIMIT 20
      `);


    console.log(
      '\n=== SAMPLE REVIEW IDS ==='
    );

    console.table(
      reviewSamples.rows
    );


  } catch (error) {
    console.error(
      '\nCW-REC COVERAGE AUDIT ERROR:\n',
      error
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}


main();