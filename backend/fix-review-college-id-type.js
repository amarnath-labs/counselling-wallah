import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString:
    process.env.DATABASE_URL ||
    process.env.DB_URL,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false
});

async function getColumnType(tableName) {
  const result = await client.query(
    `
    SELECT
      data_type,
      udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = 'college_id'
    LIMIT 1
    `,
    [tableName]
  );

  return result.rows[0] || null;
}

async function makeCollegeIdText(tableName) {
  const info =
    await getColumnType(tableName);

  if (!info) {
    console.log(
      `${tableName}.college_id: COLUMN NOT FOUND`
    );
    return;
  }

  console.log(
    `${tableName}.college_id BEFORE:`,
    info.data_type,
    `(${info.udt_name})`
  );

  if (
    info.data_type === "character varying" ||
    info.data_type === "text"
  ) {
    console.log(
      ` -> already compatible`
    );
    return;
  }

  console.log(
    ` -> converting to VARCHAR(255)...`
  );

  await client.query(`
    ALTER TABLE ${tableName}
    ALTER COLUMN college_id
    TYPE VARCHAR(255)
    USING college_id::text
  `);

  const after =
    await getColumnType(tableName);

  console.log(
    `${tableName}.college_id AFTER:`,
    after?.data_type,
    `(${after?.udt_name})`
  );
}

async function main() {
  await client.connect();

  console.log(
    "========================================"
  );
  console.log(
    "REVIEW COLLEGE_ID TYPE SAFE FIX"
  );
  console.log(
    "========================================"
  );

  await client.query("BEGIN");

  try {
    await makeCollegeIdText(
      "college_review_sources"
    );

    await makeCollegeIdText(
      "college_reviews"
    );

    await makeCollegeIdText(
      "college_sentiment_summary"
    );

    await client.query("COMMIT");

    console.log("");
    console.log(
      "COLLEGE_ID TYPE FIX COMPLETE"
    );
    console.log(
      "Existing data preserved."
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

main()
  .catch(error => {
    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });