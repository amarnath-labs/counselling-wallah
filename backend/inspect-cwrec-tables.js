import 'dotenv/config';

import {
  pool,
} from './src/db/pool.js';


async function showColumns(
  tableName
) {
  const {
    rows,
  } =
    await pool.query(
      `
        SELECT
          column_name,
          data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `,
      [
        tableName,
      ]
    );

  console.log(
    `\n=== ${tableName} ===`
  );

  console.table(
    rows
  );
}


async function main() {
  try {
    const tables = [
      'college_quality_metrics',
      'college_fee_profiles',
      'branch_fees',
      'college_reviews',
      'review_evidence',
      'college_review_scores',
    ];


    for (
      const tableName of
      tables
    ) {
      await showColumns(
        tableName
      );
    }


    const existing =
      await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND (
            table_name ILIKE '%quality%'
            OR table_name ILIKE '%review%'
            OR table_name ILIKE '%fee%'
          )
        ORDER BY table_name
      `);


    console.log(
      '\n=== RELATED TABLES ==='
    );

    console.table(
      existing.rows
    );

  } catch (error) {
    console.error(
      '\nCW-REC TABLE INSPECTION ERROR:\n',
      error
    );
  } finally {
    await pool.end();
  }
}


main();