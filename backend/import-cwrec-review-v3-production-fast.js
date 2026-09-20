import fs from "fs";
import pg from "pg";
import dns from "node:dns";

const { Client } = pg;

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const productionUrl =
  process.env.PRODUCTION_DATABASE_URL;

if (!productionUrl) {
  console.error("");
  console.error(
    "STOPPED: PRODUCTION_DATABASE_URL is not set."
  );
  process.exit(1);
}

const SEED_FILE =
  "./cwrec-review-v3-seed.json";

const BATCH_SIZE = 50;

/*
|--------------------------------------------------------------------------
| LOAD SEED
|--------------------------------------------------------------------------
*/

if (!fs.existsSync(SEED_FILE)) {
  console.error("");
  console.error(
    `STOPPED: Seed file not found: ${SEED_FILE}`
  );
  process.exit(1);
}

const seed = JSON.parse(
  fs.readFileSync(
    SEED_FILE,
    "utf8"
  )
);

console.log("");
console.log("========================================");
console.log("LOCAL REVIEW V3 SEED");
console.log("========================================");

console.log(
  "review_sources:",
  seed.review_sources?.length ?? 0
);

console.log(
  "college_review_items:",
  seed.college_review_items?.length ?? 0
);

console.log(
  "review_aspect_sentiments:",
  seed.review_aspect_sentiments?.length ?? 0
);

console.log(
  "review_aggregate_snapshots:",
  seed.review_aggregate_snapshots?.length ?? 0
);

/*
|--------------------------------------------------------------------------
| DNS FIX
|--------------------------------------------------------------------------
|
| Windows / ISP DNS was intermittently causing:
|
| getaddrinfo ENOTFOUND ...
|
| Resolve Render PostgreSQL hostname explicitly through
| public DNS and connect through IPv4.
|
*/

dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);

const parsedUrl =
  new URL(productionUrl);

const originalHostname =
  parsedUrl.hostname;

let resolvedIPv4;

try {

  const addresses =
    await dns.promises.resolve4(
      originalHostname
    );

  if (!addresses.length) {
    throw new Error(
      "No IPv4 addresses returned."
    );
  }

  resolvedIPv4 =
    addresses[0];

} catch (error) {

  console.error("");
  console.error(
    "DNS RESOLUTION FAILED:",
    error.message
  );

  process.exit(1);
}

console.log("");
console.log(
  "Render DB hostname:",
  originalHostname
);

console.log(
  "Resolved IPv4:",
  resolvedIPv4
);

/*
|--------------------------------------------------------------------------
| BUILD CONNECTION
|--------------------------------------------------------------------------
*/

const client =
  new Client({

    host:
      resolvedIPv4,

    port:
      Number(
        parsedUrl.port || 5432
      ),

    database:
      decodeURIComponent(
        parsedUrl.pathname.replace(
          /^\//,
          ""
        )
      ),

    user:
      decodeURIComponent(
        parsedUrl.username
      ),

    password:
      decodeURIComponent(
        parsedUrl.password
      ),

    ssl: {
      rejectUnauthorized: false,
      servername:
        originalHostname
    },

    connectionTimeoutMillis:
      30000,

    keepAlive:
      true,

    keepAliveInitialDelayMillis:
      10000,

    query_timeout:
      120000,

    statement_timeout:
      120000
  });

client.on(
  "error",
  (error) => {

    console.error("");
    console.error(
      "POSTGRES CONNECTION EVENT:",
      error.message
    );

  }
);

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function valueForJsonColumn(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  return JSON.stringify(value);
}

async function tableCount(table) {

  const result =
    await client.query(
      `
        SELECT
          COUNT(*)::int AS count
        FROM ${table}
      `
    );

  return result.rows[0].count;
}

async function insertBatch({
  table,
  columns,
  rows,
  transform
}) {

  if (!rows.length) {
    return;
  }

  const parameters = [];
  const valueGroups = [];

  rows.forEach(
    (row, rowIndex) => {

      const placeholders = [];

      columns.forEach(
        (column, columnIndex) => {

          const value =
            transform
              ? transform(
                  row,
                  column
                )
              : (
                  row[column] ??
                  null
                );

          parameters.push(value);

          const position =
            rowIndex *
              columns.length +
            columnIndex +
            1;

          placeholders.push(
            `$${position}`
          );
        }
      );

      valueGroups.push(
        `(${placeholders.join(",")})`
      );
    }
  );

  const sql = `
    INSERT INTO ${table} (
      ${columns.join(", ")}
    )
    VALUES
      ${valueGroups.join(",\n")}
    ON CONFLICT (id)
    DO NOTHING
  `;

  await client.query("BEGIN");

  try {

    await client.query(
      sql,
      parameters
    );

    await client.query(
      "COMMIT"
    );

  } catch (error) {

    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {}

    throw error;
  }
}

async function importInBatches({
  label,
  table,
  columns,
  rows,
  transform
}) {

  console.log("");
  console.log(
    `Importing ${label}...`
  );

  if (!rows.length) {

    console.log(
      "  No rows."
    );

    return;
  }

  for (
    let start = 0;
    start < rows.length;
    start += BATCH_SIZE
  ) {

    const batch =
      rows.slice(
        start,
        start + BATCH_SIZE
      );

    await insertBatch({
      table,
      columns,
      rows: batch,
      transform
    });

    console.log(
      `  ${
        Math.min(
          start + batch.length,
          rows.length
        )
      }/${rows.length}`
    );
  }
}

async function restoreDuplicateLinks(
  reviewRows
) {

  const links =
    reviewRows.filter(
      (row) =>
        row.duplicate_of !== null &&
        row.duplicate_of !== undefined
    );

  console.log("");
  console.log(
    "Restoring duplicate relationships..."
  );

  console.log(
    `  Links: ${links.length}`
  );

  if (!links.length) {
    return;
  }

  for (
    let start = 0;
    start < links.length;
    start += BATCH_SIZE
  ) {

    const batch =
      links.slice(
        start,
        start + BATCH_SIZE
      );

    const params = [];
    const valueRows = [];

    batch.forEach(
      (row, index) => {

        const idPosition =
          index * 2 + 1;

        const duplicatePosition =
          index * 2 + 2;

        params.push(
          row.id,
          row.duplicate_of
        );

        valueRows.push(
          `(
            $${idPosition}::bigint,
            $${duplicatePosition}::bigint
          )`
        );
      }
    );

    await client.query(
      "BEGIN"
    );

    try {

      await client.query(
        `
          UPDATE
            college_review_items AS cri

          SET
            duplicate_of =
              values_to_apply.duplicate_of

          FROM (
            VALUES
              ${valueRows.join(",")}
          )
          AS values_to_apply(
            id,
            duplicate_of
          )

          WHERE
            cri.id =
              values_to_apply.id

            AND cri.duplicate_of
              IS DISTINCT FROM
                values_to_apply.duplicate_of
        `,
        params
      );

      await client.query(
        "COMMIT"
      );

    } catch (error) {

      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {}

      throw error;
    }

    console.log(
      `  ${
        Math.min(
          start + batch.length,
          links.length
        )
      }/${links.length}`
    );
  }
}

async function resetSequence(
  table
) {

  await client.query(
    `
      SELECT
        setval(
          pg_get_serial_sequence(
            '${table}',
            'id'
          ),

          COALESCE(
            (
              SELECT MAX(id)
              FROM ${table}
            ),
            1
          ),

          EXISTS (
            SELECT 1
            FROM ${table}
          )
        )
    `
  );
}

/*
|--------------------------------------------------------------------------
| IMPORT
|--------------------------------------------------------------------------
*/

try {

  await client.connect();

  /*
  |--------------------------------------------------------------------------
  | VERIFY TARGET
  |--------------------------------------------------------------------------
  */

  const targetResult =
    await client.query(
      `
        SELECT
          current_database()
            AS database_name,

          current_user
            AS database_user,

          inet_server_addr()::text
            AS server_ip,

          inet_server_port()
            AS server_port
      `
    );

  const target =
    targetResult.rows[0];

  console.log("");
  console.log("========================================");
  console.log("TARGET DATABASE");
  console.log("========================================");
  console.log(target);

  const targetIp =
    String(
      target.server_ip || ""
    );

  if (
    targetIp.includes(
      "127.0.0.1"
    ) ||
    targetIp.includes(
      "::1"
    )
  ) {

    throw new Error(
      "REFUSED: target database is localhost."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CURRENT COUNTS
  |--------------------------------------------------------------------------
  */

  console.log("");
  console.log(
    "Current production counts:"
  );

  for (
    const table
    of [
      "review_sources",
      "college_review_items",
      "review_aspect_sentiments",
      "review_aggregate_snapshots"
    ]
  ) {

    console.log(
      `${table}:`,
      await tableCount(table)
    );
  }

  /*
  |--------------------------------------------------------------------------
  | 1. REVIEW SOURCES
  |--------------------------------------------------------------------------
  |
  | IDs preserved intentionally.
  |
  */

  await importInBatches({

    label:
      "review_sources",

    table:
      "review_sources",

    columns: [
      "id",
      "name",
      "source_type",
      "base_url",
      "created_at"
    ],

    rows:
      seed.review_sources || []

  });

  /*
  |--------------------------------------------------------------------------
  | 2. COLLEGE REVIEW ITEMS
  |--------------------------------------------------------------------------
  |
  | Preserve original IDs so:
  |
  | review_aspect_sentiments.review_item_id
  |
  | remains valid.
  |
  | duplicate_of is initially NULL.
  | Relationships restored in the next stage.
  |
  */

  const reviewItems =
    (
      seed.college_review_items ||
      []
    ).map(
      (row) => ({
        ...row,
        duplicate_of: null
      })
    );

  await importInBatches({

    label:
      "college_review_items",

    table:
      "college_review_items",

    columns: [
      "id",
      "college_id",
      "source_id",
      "source_review_id",
      "source_url",
      "author_display_name",
      "review_title",
      "review_date",
      "observed_at",
      "content_type",
      "content_access",
      "evidence_strength",
      "programme_level",
      "course",
      "course_verified",
      "department",
      "branch_text",
      "branch_verified",
      "rating",
      "rating_scale",
      "duplicate_status",
      "duplicate_of",
      "raw_payload",
      "created_at"
    ],

    rows:
      reviewItems,

    transform:
      (row, column) => {

        if (
          column ===
          "raw_payload"
        ) {
          return valueForJsonColumn(
            row[column]
          );
        }

        return (
          row[column] ??
          null
        );
      }

  });

  /*
  |--------------------------------------------------------------------------
  | 3. DUPLICATE LINKS
  |--------------------------------------------------------------------------
  */

  await restoreDuplicateLinks(
    seed.college_review_items ||
    []
  );

  /*
  |--------------------------------------------------------------------------
  | 4. ASPECT SENTIMENTS
  |--------------------------------------------------------------------------
  */

  await importInBatches({

    label:
      "review_aspect_sentiments",

    table:
      "review_aspect_sentiments",

    columns: [
      "id",
      "review_item_id",
      "aspect",
      "target_branch",
      "scope",
      "sentiment",
      "evidence_summary",
      "created_at"
    ],

    rows:
      seed.review_aspect_sentiments ||
      []

  });

  /*
  |--------------------------------------------------------------------------
  | 5. AGGREGATE SNAPSHOTS
  |--------------------------------------------------------------------------
  */

  await importInBatches({

    label:
      "review_aggregate_snapshots",

    table:
      "review_aggregate_snapshots",

    columns: [
      "id",
      "college_id",
      "source_id",
      "source_url",
      "aggregate_rating",
      "rating_scale",
      "review_count",
      "verified_review_count",
      "observed_values",
      "observation_status",
      "programme_scope",
      "evidence_strength",
      "observed_at",
      "notes",
      "raw_payload",
      "created_at"
    ],

    rows:
      seed.review_aggregate_snapshots ||
      [],

    transform:
      (row, column) => {

        if (
          column ===
            "observed_values" ||
          column ===
            "raw_payload"
        ) {

          return valueForJsonColumn(
            row[column]
          );
        }

        return (
          row[column] ??
          null
        );
      }

  });

  /*
  |--------------------------------------------------------------------------
  | 6. RESET SERIAL SEQUENCES
  |--------------------------------------------------------------------------
  */

  console.log("");
  console.log(
    "Resetting PostgreSQL sequences..."
  );

  for (
    const table
    of [
      "review_sources",
      "college_review_items",
      "review_aspect_sentiments",
      "review_aggregate_snapshots"
    ]
  ) {

    await resetSequence(
      table
    );

    console.log(
      `  ${table}: OK`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FINAL COUNTS
  |--------------------------------------------------------------------------
  */

  console.log("");
  console.log("========================================");
  console.log("REVIEW V3 IMPORT COMPLETE");
  console.log("========================================");

  for (
    const table
    of [
      "review_sources",
      "college_review_items",
      "review_aspect_sentiments",
      "review_aggregate_snapshots"
    ]
  ) {

    console.log(
      `${table}:`,
      await tableCount(table)
    );
  }

  console.log("");
  console.log(
    "Review V3 production import successful."
  );

} catch (error) {

  console.error("");
  console.error("========================================");
  console.error("IMPORT FAILED");
  console.error("========================================");

  console.error(
    error.message
  );

  if (error.code) {
    console.error(
      "PostgreSQL/Error code:",
      error.code
    );
  }

  process.exitCode = 1;

} finally {

  try {
    await client.end();
  } catch {}

}

