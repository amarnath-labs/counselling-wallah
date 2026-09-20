import fs from 'fs';
import pg from 'pg';

const { Client } = pg;

const productionUrl =
  process.env.PRODUCTION_DATABASE_URL;

if (!productionUrl) {
  console.error('');
  console.error('STOPPED: PRODUCTION_DATABASE_URL is not set.');
  console.error('Local DATABASE_URL will NOT be used.');
  process.exit(1);
}

const seed = JSON.parse(
  fs.readFileSync(
    './cwrec-production-seed.json',
    'utf8'
  )
);

const client = new Client({
  connectionString: productionUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

const TABLES = [
  'college_quality_metrics',
  'college_fee_profiles',
  'branch_fees',
  'college_reviews'
];

function q(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

async function getColumns(table) {
  const { rows } = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [table]
  );

  return rows.map(row => row.column_name);
}

async function rowExists(table, row) {

  /*
   * Conservative natural-key checks.
   *
   * We intentionally DO NOT use id because local IDs
   * must not overwrite production IDs.
   */

  if (table === 'college_quality_metrics') {
    const result = await client.query(
      `
        SELECT 1
        FROM college_quality_metrics
        WHERE college_id = $1
          AND academic_year IS NOT DISTINCT FROM $2
          AND source_url IS NOT DISTINCT FROM $3
        LIMIT 1
      `,
      [
        row.college_id,
        row.academic_year,
        row.source_url
      ]
    );

    return result.rowCount > 0;
  }

  if (table === 'college_fee_profiles') {
    const result = await client.query(
      `
        SELECT 1
        FROM college_fee_profiles
        WHERE college_name_normalized = $1
          AND fee_year = $2
        LIMIT 1
      `,
      [
        row.college_name_normalized,
        row.fee_year
      ]
    );

    return result.rowCount > 0;
  }

  if (table === 'branch_fees') {
    const result = await client.query(
      `
        SELECT 1
        FROM branch_fees
        WHERE college_id = $1
          AND branch_id IS NOT DISTINCT FROM $2
          AND fee_scope = $3
          AND academic_year IS NOT DISTINCT FROM $4
          AND source_url IS NOT DISTINCT FROM $5
        LIMIT 1
      `,
      [
        row.college_id,
        row.branch_id,
        row.fee_scope,
        row.academic_year,
        row.source_url
      ]
    );

    return result.rowCount > 0;
  }

  if (table === 'college_reviews') {

    if (row.external_review_id) {
      const result = await client.query(
        `
          SELECT 1
          FROM college_reviews
          WHERE college_id = $1
            AND source IS NOT DISTINCT FROM $2
            AND external_review_id = $3
          LIMIT 1
        `,
        [
          row.college_id,
          row.source,
          row.external_review_id
        ]
      );

      return result.rowCount > 0;
    }

    const result = await client.query(
      `
        SELECT 1
        FROM college_reviews
        WHERE college_id = $1
          AND source IS NOT DISTINCT FROM $2
          AND review_text IS NOT DISTINCT FROM $3
          AND review_date IS NOT DISTINCT FROM $4
        LIMIT 1
      `,
      [
        row.college_id,
        row.source,
        row.review_text,
        row.review_date
      ]
    );

    return result.rowCount > 0;
  }

  return false;
}

async function insertRow(
  table,
  row,
  productionColumns
) {

  const columns = Object.keys(row)
    .filter(column =>
      column !== 'id' &&
      productionColumns.includes(column)
    );

  if (columns.length === 0) {
    throw new Error(
      `${table}: no compatible columns`
    );
  }

  const values =
    columns.map(column => row[column]);

  const placeholders =
    columns.map(
      (_, index) => `$${index + 1}`
    );

  const sql = `
    INSERT INTO ${q(table)} (
      ${columns.map(q).join(', ')}
    )
    VALUES (
      ${placeholders.join(', ')}
    )
  `;

  await client.query(sql, values);
}

try {

  await client.connect();

  const info = await client.query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      inet_server_addr()::text AS server_ip,
      inet_server_port() AS server_port
  `);

  console.log('');
  console.log('========================================');
  console.log('TARGET DATABASE');
  console.log('========================================');
  console.log(info.rows[0]);

  const ip =
    String(info.rows[0].server_ip || '');

  if (
    ip === '::1/128' ||
    ip === '::1' ||
    ip === '127.0.0.1'
  ) {
    throw new Error(
      'REFUSED: target database is localhost.'
    );
  }

  console.log('');
  console.log(
    'Production target accepted.'
  );

  const stats = {};

  await client.query('BEGIN');

  for (const table of TABLES) {

    console.log('');
    console.log(
      `Importing ${table}...`
    );

    const sourceRows =
      seed[table] || [];

    const productionColumns =
      await getColumns(table);

    if (productionColumns.length === 0) {
      throw new Error(
        `Production table missing: ${table}`
      );
    }

    let inserted = 0;
    let skipped = 0;

    for (const row of sourceRows) {

      const exists =
        await rowExists(table, row);

      if (exists) {
        skipped++;
        continue;
      }

      await insertRow(
        table,
        row,
        productionColumns
      );

      inserted++;
    }

    stats[table] = {
      source: sourceRows.length,
      inserted,
      skipped
    };

    console.log(
      `  source:   ${sourceRows.length}`
    );

    console.log(
      `  inserted: ${inserted}`
    );

    console.log(
      `  skipped:  ${skipped}`
    );
  }

  await client.query('COMMIT');

  console.log('');
  console.log('========================================');
  console.log('IMPORT COMPLETE');
  console.log('========================================');

  console.table(stats);

  console.log('');
  console.log('Production row counts:');

  for (const table of TABLES) {
    const result =
      await client.query(
        `SELECT COUNT(*)::int AS count FROM ${q(table)}`
      );

    console.log(
      `${table}: ${result.rows[0].count}`
    );
  }

} catch (error) {

  try {
    await client.query('ROLLBACK');
  } catch {}

  console.error('');
  console.error(
    'IMPORT FAILED:',
    error.message
  );

  process.exitCode = 1;

} finally {

  await client.end();

}
