import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.PRODUCTION_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();

for (const table of [
  "review_sources",
  "college_review_items",
  "review_aspect_sentiments",
  "review_aggregate_snapshots"
]) {
  const { rows } = await client.query(
    `SELECT to_regclass('public.${table}') AS table_name`
  );

  console.log(
    `${table}:`,
    rows[0].table_name ? "EXISTS" : "MISSING"
  );
}

await client.end();
