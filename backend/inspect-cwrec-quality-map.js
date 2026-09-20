import 'dotenv/config';

import {
  pool,
} from './src/db/pool.js';


/* =========================================================
   NORMALIZATION SQL EXPRESSION
========================================================= */

const normalizeSql = (expression) => `
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        LOWER(
          COALESCE(
            ${expression},
            ''
          )
        ),
        '&',
        ' and ',
        'g'
      ),
      '[^a-z0-9]+',
      ' ',
      'g'
    ),
    '\\s+',
    ' ',
    'g'
  )
`;


/* =========================================================
   MAIN
========================================================= */

async function main() {
  try {
    console.log(
      '\n========================================'
    );

    console.log(
      'CW-REC QUALITY CANONICAL MAPPING AUDIT'
    );

    console.log(
      '========================================\n'
    );


    /* =====================================
       QUALITY COLLEGES WITH CANONICAL NAMES
    ===================================== */

    const qualityCanonical =
      await pool.query(`
        SELECT DISTINCT

          qm.college_id
            AS quality_college_id,

          canonical.name
            AS quality_college_name,

          qm.nirf_rank,

          qm.nirf_score,

          qm.placement_rate,

          qm.median_package,

          qm.academic_year,

          qm.verification_status

        FROM
          college_quality_metrics qm

        LEFT JOIN colleges canonical
          ON canonical.id::text =
             qm.college_id

        ORDER BY
          qm.nirf_rank ASC
          NULLS LAST
      `);


    console.log(
      'Quality metric rows:',
      qualityCanonical.rows.length
    );


    console.log(
      '\n=== QUALITY CANONICAL SAMPLE ==='
    );

    console.table(
      qualityCanonical.rows.slice(
        0,
        25
      )
    );


    /* =====================================
       EXACT NORMALIZED-NAME MATCH
    ===================================== */

    const exactMatches =
      await pool.query(`
        WITH

        uptac_colleges AS (

          SELECT DISTINCT

            c.id::text
              AS uptac_college_id,

            c.name
              AS uptac_college_name,

            ${normalizeSql(
              'c.name'
            )}
              AS normalized_name

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
        ),


        quality_colleges AS (

          SELECT DISTINCT ON (
            qm.college_id
          )

            qm.college_id
              AS quality_college_id,

            canonical.name
              AS quality_college_name,

            ${normalizeSql(
              'canonical.name'
            )}
              AS normalized_name,

            qm.nirf_rank,

            qm.nirf_score,

            qm.placement_rate,

            qm.median_package,

            qm.academic_year,

            qm.verification_status

          FROM
            college_quality_metrics qm

          INNER JOIN colleges canonical
            ON canonical.id::text =
               qm.college_id

          ORDER BY

            qm.college_id,

            qm.academic_year
              DESC NULLS LAST,

            qm.retrieved_at
              DESC NULLS LAST
        )


        SELECT

          u.uptac_college_id,

          u.uptac_college_name,

          q.quality_college_id,

          q.quality_college_name,

          q.nirf_rank,

          q.nirf_score,

          q.placement_rate,

          q.median_package,

          q.academic_year,

          q.verification_status

        FROM
          uptac_colleges u

        INNER JOIN quality_colleges q
          ON q.normalized_name =
             u.normalized_name

        WHERE
          u.normalized_name <> ''

        ORDER BY
          q.nirf_rank ASC
          NULLS LAST,
          u.uptac_college_name
      `);


    console.log(
      '\nExact normalized-name matches:',
      exactMatches.rows.length
    );


    console.log(
      '\n=== EXACT QUALITY MATCHES ==='
    );

    console.table(
      exactMatches.rows
    );


    /* =====================================
       QUALITY COLLEGES WITH NO DIRECT MATCH
    ===================================== */

    const unmatchedQuality =
      await pool.query(`
        WITH

        uptac_colleges AS (

          SELECT DISTINCT

            c.id::text
              AS college_id,

            c.name
              AS college_name,

            ${normalizeSql(
              'c.name'
            )}
              AS normalized_name

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
        ),


        quality_colleges AS (

          SELECT DISTINCT ON (
            qm.college_id
          )

            qm.college_id,

            canonical.name
              AS college_name,

            ${normalizeSql(
              'canonical.name'
            )}
              AS normalized_name,

            qm.nirf_rank,

            qm.nirf_score

          FROM
            college_quality_metrics qm

          INNER JOIN colleges canonical
            ON canonical.id::text =
               qm.college_id

          ORDER BY

            qm.college_id,

            qm.academic_year
              DESC NULLS LAST
        )


        SELECT

          q.college_id,

          q.college_name,

          q.nirf_rank,

          q.nirf_score

        FROM
          quality_colleges q

        WHERE NOT EXISTS (

          SELECT 1

          FROM
            uptac_colleges u

          WHERE
            u.normalized_name =
            q.normalized_name
        )

        ORDER BY
          q.nirf_rank ASC
          NULLS LAST

        LIMIT 100
      `);


    console.log(
      '\n=== QUALITY COLLEGES WITHOUT EXACT UPTAC MATCH ==='
    );

    console.table(
      unmatchedQuality.rows
    );


    /* =====================================
       IMPORTANT UPTAC GOVERNMENT COLLEGES
    ===================================== */

    const targets =
      await pool.query(`
        SELECT DISTINCT

          c.id::text
            AS college_id,

          c.name
            AS college_name

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

          AND (

            LOWER(c.name)
              LIKE '%kamla nehru%'

            OR LOWER(c.name)
              LIKE '%engineering & technology%lucknow%'

            OR LOWER(c.name)
              LIKE '%engineering and technology%lucknow%'

            OR LOWER(c.name)
              LIKE '%bundelkhand%'

            OR LOWER(c.name)
              LIKE '%ajay kumar garg%'

            OR LOWER(c.name)
              LIKE '%harcourt%'

            OR LOWER(c.name)
              LIKE '%madan mohan malaviya%'

          )

        ORDER BY
          c.name
      `);


    console.log(
      '\n=== IMPORTANT UPTAC TARGETS ==='
    );

    console.table(
      targets.rows
    );


  } catch (error) {
    console.error(
      '\nQUALITY MAPPING AUDIT ERROR:\n',
      error
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}


main();