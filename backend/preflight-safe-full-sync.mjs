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

async function getTables(pool) {
  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const result = [];

  for (const { table_name } of tables.rows) {
    const count = await pool.query(
      `SELECT COUNT(*)::bigint AS count FROM "${table_name}"`
    );

    result.push({
      table: table_name,
      rows: Number(count.rows[0].count),
    });
  }

  return result;
}

try {
  const localTables = await getTables(localPool);
  const prodTables = await getTables(prodPool);

  const localMap = new Map(
    localTables.map(x => [x.table, x.rows])
  );

  const prodMap = new Map(
    prodTables.map(x => [x.table, x.rows])
  );

  const allTables = [
    ...new Set([
      ...localMap.keys(),
      ...prodMap.keys(),
    ]),
  ].sort();

  const comparison = allTables.map(table => ({
    table,
    local_rows:
      localMap.has(table)
        ? localMap.get(table)
        : "MISSING",
    production_rows:
      prodMap.has(table)
        ? prodMap.get(table)
        : "MISSING",
  }));

  console.log(
    "\n=== LOCAL vs PRODUCTION TABLE COUNTS ==="
  );

  console.table(comparison);

  const suspicious = comparison.filter(row =>
    /user|auth|session|payment|order|subscription|billing|token|account/i
      .test(row.table)
  );

  console.log(
    "\n=== POSSIBLE PRODUCTION-SENSITIVE TABLES ==="
  );

  if (suspicious.length) {
    console.table(suspicious);
  } else {
    console.log("No obvious sensitive tables found by name.");
  }

  const onlyLocal = comparison.filter(
    x => x.production_rows === "MISSING"
  );

  const onlyProd = comparison.filter(
    x => x.local_rows === "MISSING"
  );

  console.log("\n=== TABLES ONLY IN LOCAL ===");
  console.table(onlyLocal);

  console.log("\n=== TABLES ONLY IN PRODUCTION ===");
  console.table(onlyProd);

} finally {
  await localPool.end();
  await prodPool.end();
}
