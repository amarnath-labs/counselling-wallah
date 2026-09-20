import { pool } from './src/db/pool.js';

async function main() {
  console.log(
    '\n========================================'
  );

  console.log(
    'CW-REC UPTAC HISTORICAL DATA AUDIT'
  );

  console.log(
    '========================================'
  );


  /*
  |--------------------------------------------------------------------------
  | 1. AVAILABLE UPTAC YEARS
  |--------------------------------------------------------------------------
  */

  const years =
    await pool.query(`
      SELECT
        year,
        COUNT(*)::int
          AS rows,

        COUNT(
          DISTINCT branch_id
        )::int
          AS branches,

        COUNT(
          DISTINCT source_label
        )::int
          AS sources

      FROM cutoffs

      WHERE
        counselling_type = 'UPTAC'

      GROUP BY
        year

      ORDER BY
        year DESC
    `);

  console.log(
    '\n=== AVAILABLE UPTAC YEARS ==='
  );

  console.table(
    years.rows
  );


  /*
  |--------------------------------------------------------------------------
  | 2. SOURCE DISTRIBUTION BY YEAR
  |--------------------------------------------------------------------------
  */

  const sources =
    await pool.query(`
      SELECT
        year,
        source_label,
        COUNT(*)::int
          AS rows,

        COUNT(
          DISTINCT branch_id
        )::int
          AS branches

      FROM cutoffs

      WHERE
        counselling_type = 'UPTAC'

      GROUP BY
        year,
        source_label

      ORDER BY
        year DESC,
        rows DESC,
        source_label
    `);

  console.log(
    '\n=== SOURCE DISTRIBUTION ==='
  );

  console.table(
    sources.rows
  );


  /*
  |--------------------------------------------------------------------------
  | 3. GENDER DISTRIBUTION BY YEAR
  |--------------------------------------------------------------------------
  */

  const genders =
    await pool.query(`
      SELECT
        year,
        COALESCE(
          gender,
          '(NULL)'
        )
          AS gender,

        COUNT(*)::int
          AS rows

      FROM cutoffs

      WHERE
        counselling_type = 'UPTAC'

      GROUP BY
        year,
        gender

      ORDER BY
        year DESC,
        rows DESC
    `);

  console.log(
    '\n=== GENDER DISTRIBUTION ==='
  );

  console.table(
    genders.rows
  );


  /*
  |--------------------------------------------------------------------------
  | 4. ROUND DISTRIBUTION BY YEAR
  |--------------------------------------------------------------------------
  */

  const rounds =
    await pool.query(`
      SELECT
        year,
        round,
        COUNT(*)::int
          AS rows

      FROM cutoffs

      WHERE
        counselling_type = 'UPTAC'

      GROUP BY
        year,
        round

      ORDER BY
        year DESC,
        round
    `);

  console.log(
    '\n=== ROUND DISTRIBUTION ==='
  );

  console.table(
    rounds.rows
  );


  /*
  |--------------------------------------------------------------------------
  | 5. CATEGORY DISTRIBUTION
  |--------------------------------------------------------------------------
  */

  const categories =
    await pool.query(`
      SELECT
        year,
        category,
        COUNT(*)::int
          AS rows

      FROM cutoffs

      WHERE
        counselling_type = 'UPTAC'

      GROUP BY
        year,
        category

      ORDER BY
        year DESC,
        rows DESC

      LIMIT 100
    `);

  console.log(
    '\n=== TOP CATEGORIES ==='
  );

  console.table(
    categories.rows
  );


  /*
  |--------------------------------------------------------------------------
  | 6. EXACT HISTORICAL COVERAGE AGAINST VERIFIED 2025 SHADOW
  |--------------------------------------------------------------------------
  |
  | Compare same:
  |
  | branch
  | round
  | category
  | quota
  | gender
  |
  | We intentionally do NOT score anything yet.
  |--------------------------------------------------------------------------
  */

  const coverage =
    await pool.query(`
      WITH shadow AS (

        SELECT DISTINCT
          branch_id::text
            AS branch_id,

          round::text
            AS round,

          category,

          COALESCE(
            quota,
            ''
          )
            AS quota,

          COALESCE(
            gender,
            ''
          )
            AS gender

        FROM
          cw_rec_uptac_cutoffs_2025

      ),

      history AS (

        SELECT DISTINCT
          co.branch_id::text
            AS branch_id,

          co.year,

          REGEXP_REPLACE(
            LOWER(
              TRIM(
                co.round::text
              )
            ),
            '^round\\s*',
            ''
          )
            AS round,

          co.category,

          COALESCE(
            co.quota,
            ''
          )
            AS quota,

          COALESCE(
            co.gender,
            ''
          )
            AS gender

        FROM
          cutoffs co

        WHERE
          co.counselling_type =
            'UPTAC'

          AND co.year < 2025

      ),

      matched AS (

        SELECT
          s.branch_id,
          s.round,
          s.category,
          s.quota,
          s.gender,

          COUNT(
            DISTINCT h.year
          )::int
            AS historical_year_count,

          ARRAY_AGG(
            DISTINCT h.year
            ORDER BY h.year DESC
          )
            FILTER (
              WHERE h.year
                IS NOT NULL
            )
            AS historical_years

        FROM
          shadow s

        LEFT JOIN
          history h

          ON h.branch_id =
            s.branch_id

          AND h.round =
            LOWER(
              TRIM(
                s.round
              )
            )

          AND h.category =
            s.category

          AND h.quota =
            s.quota

          AND h.gender =
            s.gender

        GROUP BY
          s.branch_id,
          s.round,
          s.category,
          s.quota,
          s.gender

      )

      SELECT
        historical_year_count,
        COUNT(*)::int
          AS contexts

      FROM
        matched

      GROUP BY
        historical_year_count

      ORDER BY
        historical_year_count DESC
    `);

  console.log(
    '\n=== EXACT HISTORICAL COVERAGE ==='
  );

  console.table(
    coverage.rows
  );


  /*
  |--------------------------------------------------------------------------
  | 7. SAMPLE MATCHED HISTORIES FOR IMPORTANT CONTEXT
  |--------------------------------------------------------------------------
  */

  const sample =
    await pool.query(`
      SELECT
        c.name
          AS college,

        b.name
          AS branch,

        s.round,

        s.category,

        s.quota,

        s.gender,

        co.year,

        co.opening_rank,

        co.closing_rank,

        co.source_label,

        co.verification_status,

        co.is_verified

      FROM
        cw_rec_uptac_cutoffs_2025 s

      INNER JOIN
        branches b

        ON b.id::text =
          s.branch_id::text

      INNER JOIN
        colleges c

        ON c.id =
          b.college_id

      INNER JOIN
        cutoffs co

        ON co.branch_id::text =
          s.branch_id::text

        AND co.counselling_type =
          'UPTAC'

        AND co.year < 2025

        AND REGEXP_REPLACE(
          LOWER(
            TRIM(
              co.round::text
            )
          ),
          '^round\\s*',
          ''
        ) =
          LOWER(
            TRIM(
              s.round::text
            )
          )

        AND co.category =
          s.category

        AND COALESCE(
          co.quota,
          ''
        ) =
          COALESCE(
            s.quota,
            ''
          )

        AND COALESCE(
          co.gender,
          ''
        ) =
          COALESCE(
            s.gender,
            ''
          )

      WHERE
        s.year = 2025

        AND s.round = '1'

        AND s.category = 'OPEN'

      ORDER BY
        c.name,
        b.name,
        co.year DESC

      LIMIT 50
    `);

  console.log(
    '\n=== HISTORICAL MATCH SAMPLE ==='
  );

  console.table(
    sample.rows
  );


  console.log(
    '\n========================================'
  );

  console.log(
    '✅ READ-ONLY AUDIT COMPLETE'
  );

  console.log(
    'No INSERT / UPDATE / DELETE executed.'
  );

  console.log(
    '========================================'
  );
}

main()
  .catch(error => {
    console.error(
      '\nHISTORICAL AUDIT ERROR:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
