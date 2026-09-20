import pg from "pg";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Database connection string missing");
}

const pool = new Pool({
  connectionString
});

try {

  const result = await pool.query(`
    WITH source_stats AS (
      SELECT
        college_id,
        college_name,

        COUNT(*) FILTER (
          WHERE verification_status NOT IN (
            'rejected',
            'stale'
          )
        ) AS total_sources,

        COUNT(
          DISTINCT source_url
        ) FILTER (
          WHERE
            verification_status NOT IN (
              'rejected',
              'stale'
            )
            AND source_url ~* '^https?://'
            AND source_url NOT ILIKE '%PASTE_%'
            AND source_url NOT ILIKE '%PLACEHOLDER%'
        ) AS valid_sources,

        ARRAY_AGG(
          DISTINCT source_kind
        ) FILTER (
          WHERE
            verification_status NOT IN (
              'rejected',
              'stale'
            )
            AND source_url ~* '^https?://'
            AND source_url NOT ILIKE '%PASTE_%'
            AND source_url NOT ILIKE '%PLACEHOLDER%'
        ) AS source_kinds

      FROM fee_source_records

      GROUP BY
        college_id,
        college_name
    )

    SELECT
      college_id,
      college_name,
      total_sources,
      valid_sources,
      source_kinds,

      CASE
        WHEN valid_sources >= 4
          THEN 'COMPLETE_4_SOURCE'

        WHEN valid_sources = 3
          THEN 'COMPLETE_3_SOURCE'

        ELSE
          'MULTI_SOURCE_REQUIRED'
      END AS status

    FROM source_stats

    ORDER BY
      valid_sources ASC,
      college_name ASC;
  `);

  const rows = result.rows;

  const queue =
    rows.filter(
      row =>
        Number(row.valid_sources) < 3
    );

  fs.writeFileSync(
    "./fee-multisource-work-queue.json",
    JSON.stringify(
      queue,
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "MULTI-SOURCE FEE COVERAGE"
  );
  console.log(
    "========================================"
  );

  console.table(
    rows.map(row => ({
      college:
        row.college_name,

      valid_sources:
        Number(
          row.valid_sources
        ),

      status:
        row.status
    }))
  );

  console.log("");
  console.log(
    "Total colleges:",
    rows.length
  );

  console.log(
    "3+ valid sources:",
    rows.filter(
      x =>
        Number(
          x.valid_sources
        ) >= 3
    ).length
  );

  console.log(
    "Need more sources:",
    queue.length
  );

  console.log("");
  console.log(
    "Saved:",
    "./fee-multisource-work-queue.json"
  );

} finally {

  await pool.end();

}
