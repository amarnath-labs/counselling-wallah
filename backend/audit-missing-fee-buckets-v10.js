import { pool } from './src/db/pool.js';

async function main() {
  const result = await pool.query(`
    SELECT
      c.id,
      c.name
    FROM colleges c
    LEFT JOIN college_fee_profiles fp
      ON fp.college_id = c.id
    WHERE fp.college_id IS NULL
    ORDER BY c.name
  `);

  const rows = result.rows;

  const buckets = {
    uptac: [],
    josaa_like: [],
    other: []
  };

  for (const row of rows) {
    const id = row.id.toLowerCase();
    const name = row.name.toLowerCase();

    if (id.startsWith('uptac-')) {
      buckets.uptac.push(row);
      continue;
    }

    if (
      /iit|iiit|nit|gfti|spa|bit mesra|pec|manit|mnit|iiitm|jadavpur|nielit/.test(name) ||
      /iit|iiit|nit|manit|mnit|iiitm|nielit/.test(id)
    ) {
      buckets.josaa_like.push(row);
      continue;
    }

    buckets.other.push(row);
  }

  console.log('');
  console.log('========================================');
  console.log('CW-REC MISSING FEE BUCKET AUDIT');
  console.log('========================================');

  console.table([
    {
      total_missing: rows.length,
      uptac_missing: buckets.uptac.length,
      josaa_like_missing: buckets.josaa_like.length,
      other_missing: buckets.other.length
    }
  ]);

  console.log('');
  console.log('=== JOSAA-LIKE MISSING ===');
  console.table(buckets.josaa_like);

  console.log('');
  console.log('=== OTHER NON-UPTAC MISSING ===');
  console.table(buckets.other);

  console.log('');
  console.log('✅ BUCKET AUDIT COMPLETE');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
