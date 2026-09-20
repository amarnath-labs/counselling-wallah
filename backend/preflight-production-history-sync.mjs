import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const localPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prodPool = new Pool({
  connectionString: process.env.PRODUCTION_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const localHistory = await localPool.query(`
    SELECT
      COUNT(*)::int AS rows,
      COUNT(DISTINCT branch_id)::int AS branches
    FROM cutoffs
    WHERE counselling_type IN (
      'JOSAA',
      'CSAB_SPECIAL'
    )
      AND year BETWEEN 2024 AND 2026
  `);

  console.log(
    "LOCAL HISTORY:",
    localHistory.rows[0]
  );

  const prodHistory = await prodPool.query(`
    SELECT
      COUNT(*)::int AS rows,
      COUNT(DISTINCT branch_id)::int AS branches
    FROM cutoffs
    WHERE counselling_type IN (
      'JOSAA',
      'CSAB_SPECIAL'
    )
      AND year BETWEEN 2024 AND 2026
  `);

  console.log(
    "PRODUCTION HISTORY:",
    prodHistory.rows[0]
  );

  const localBranches = await localPool.query(`
    SELECT DISTINCT branch_id
    FROM cutoffs
    WHERE counselling_type IN (
      'JOSAA',
      'CSAB_SPECIAL'
    )
      AND year BETWEEN 2024 AND 2026
      AND branch_id IS NOT NULL
    ORDER BY branch_id
  `);

  const ids =
    localBranches.rows.map(
      row => row.branch_id
    );

  const prodBranches = await prodPool.query(`
    SELECT id
    FROM branches
    WHERE id = ANY($1::int[])
  `, [ids]);

  const existing =
    new Set(
      prodBranches.rows.map(
        row => Number(row.id)
      )
    );

  const missing =
    ids.filter(
      id => !existing.has(Number(id))
    );

  console.log(
    "Local historical branch IDs:",
    ids.length
  );

  console.log(
    "Matching production branch IDs:",
    existing.size
  );

  console.log(
    "Missing production branch IDs:",
    missing.length
  );

  if (missing.length > 0) {
    console.log(
      "First missing IDs:",
      missing.slice(0, 50)
    );
  }

  const localColumns = await localPool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cutoffs'
    ORDER BY ordinal_position
  `);

  const prodColumns = await prodPool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cutoffs'
    ORDER BY ordinal_position
  `);

  const localSet =
    new Set(
      localColumns.rows.map(
        r => r.column_name
      )
    );

  const prodSet =
    new Set(
      prodColumns.rows.map(
        r => r.column_name
      )
    );

  console.log(
    "Columns only in LOCAL:",
    [...localSet].filter(
      c => !prodSet.has(c)
    )
  );

  console.log(
    "Columns only in PRODUCTION:",
    [...prodSet].filter(
      c => !localSet.has(c)
    )
  );

} finally {
  await localPool.end();
  await prodPool.end();
}
