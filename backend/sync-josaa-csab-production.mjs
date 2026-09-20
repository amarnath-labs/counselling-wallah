import "dotenv/config";
import pg from "pg";
import fs from "fs";

const { Pool } = pg;

const LOCAL_URL =
  process.env.DATABASE_URL;

const PROD_URL =
  process.env.PRODUCTION_DATABASE_URL;

if (!LOCAL_URL) {
  throw new Error(
    "Local DATABASE_URL is not configured."
  );
}

if (!PROD_URL) {
  throw new Error(
    "PRODUCTION_DATABASE_URL is not configured."
  );
}

const localPool =
  new Pool({
    connectionString: LOCAL_URL,
  });

const prodPool =
  new Pool({
    connectionString: PROD_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });


const TARGET_TYPES = [
  "JOSAA",
  "CSAB_SPECIAL",
];

const TARGET_YEARS = [
  2024,
  2025,
  2026,
];


function stamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
}


function quoteIdentifier(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}


async function getCutoffColumns(
  client
) {
  const result =
    await client.query(`
      SELECT
        column_name,
        is_identity,
        is_generated
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'cutoffs'
      ORDER BY ordinal_position
    `);

  return result.rows;
}


async function getCounts(
  client
) {
  const result =
    await client.query(`
      SELECT
        counselling_type,
        year,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE counselling_type = ANY($1::text[])
        AND year = ANY($2::int[])
      GROUP BY
        counselling_type,
        year
      ORDER BY
        counselling_type,
        year
    `, [
      TARGET_TYPES,
      TARGET_YEARS,
    ]);

  return result.rows;
}


async function getForeignKeysReferencingCutoffs(
  client
) {
  const result =
    await client.query(`
      SELECT
        n.nspname AS schema_name,
        c.relname AS table_name,
        con.conname AS constraint_name
      FROM pg_constraint con
      JOIN pg_class c
        ON c.oid = con.conrelid
      JOIN pg_namespace n
        ON n.oid = c.relnamespace
      WHERE con.contype = 'f'
        AND con.confrelid =
          'public.cutoffs'::regclass
      ORDER BY
        n.nspname,
        c.relname,
        con.conname
    `);

  return result.rows;
}


async function insertBatch(
  client,
  table,
  columns,
  rows
) {
  if (!rows.length) {
    return;
  }

  const quotedColumns =
    columns.map(
      quoteIdentifier
    );

  const values = [];

  const groups =
    rows.map(
      (row, rowIndex) => {
        const placeholders =
          columns.map(
            (column, columnIndex) => {
              values.push(
                row[column]
              );

              const parameterIndex =
                rowIndex *
                  columns.length +
                columnIndex +
                1;

              return `$${parameterIndex}`;
            }
          );

        return `(${placeholders.join(", ")})`;
      }
    );

  const sql = `
    INSERT INTO ${quoteIdentifier(table)}
      (${quotedColumns.join(", ")})
    VALUES
      ${groups.join(", ")}
  `;

  await client.query(
    sql,
    values
  );
}


let localClient;
let prodClient;

try {
  localClient =
    await localPool.connect();

  prodClient =
    await prodPool.connect();


  console.log(
    "\n======================================"
  );
  console.log(
    "TRUMARG TARGETED COUNSELLING SYNC"
  );
  console.log(
    "======================================\n"
  );


  /*
  |--------------------------------------------------------------------------
  | 1. Verify databases
  |--------------------------------------------------------------------------
  */

  const localDb =
    await localClient.query(`
      SELECT
        current_database() AS name
    `);

  const prodDb =
    await prodClient.query(`
      SELECT
        current_database() AS name
    `);

  console.log(
    "LOCAL DB:",
    localDb.rows[0].name
  );

  console.log(
    "PRODUCTION DB:",
    prodDb.rows[0].name
  );


  /*
  |--------------------------------------------------------------------------
  | 2. Safety: abort if another table references cutoffs
  |--------------------------------------------------------------------------
  */

  const referencingFKs =
    await getForeignKeysReferencingCutoffs(
      prodClient
    );

  if (referencingFKs.length > 0) {
    console.table(
      referencingFKs
    );

    throw new Error(
      "ABORTED: another production table references cutoffs. Nothing changed."
    );
  }

  console.log(
    "\nForeign keys referencing cutoffs: NONE"
  );


  /*
  |--------------------------------------------------------------------------
  | 3. Verify compatible schemas
  |--------------------------------------------------------------------------
  */

  const localColumnInfo =
    await getCutoffColumns(
      localClient
    );

  const prodColumnInfo =
    await getCutoffColumns(
      prodClient
    );

  const localNames =
    localColumnInfo.map(
      row => row.column_name
    );

  const prodNames =
    prodColumnInfo.map(
      row => row.column_name
    );

  const missingInProd =
    localNames.filter(
      name =>
        !prodNames.includes(name)
    );

  const missingInLocal =
    prodNames.filter(
      name =>
        !localNames.includes(name)
    );

  if (
    missingInProd.length ||
    missingInLocal.length
  ) {
    console.log(
      "Missing in production:",
      missingInProd
    );

    console.log(
      "Missing in local:",
      missingInLocal
    );

    throw new Error(
      "ABORTED: cutoffs schemas are different."
    );
  }

  console.log(
    "cutoffs schema compatible: YES"
  );


  /*
  |--------------------------------------------------------------------------
  | 4. Load verified LOCAL historical rows
  |--------------------------------------------------------------------------
  */

  const localHistory =
    await localClient.query(`
      SELECT *
      FROM cutoffs
      WHERE counselling_type = ANY($1::text[])
        AND year = ANY($2::int[])
      ORDER BY
        counselling_type,
        year,
        branch_id,
        round,
        category,
        quota,
        gender
    `, [
      TARGET_TYPES,
      TARGET_YEARS,
    ]);

  console.log(
    "\nLocal rows selected:",
    localHistory.rows.length
  );

  if (
    localHistory.rows.length !==
    226683
  ) {
    throw new Error(
      `ABORTED: Expected 226683 verified local rows, found ${localHistory.rows.length}.`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 5. Backup current PRODUCTION target rows
  |--------------------------------------------------------------------------
  */

  const prodBefore =
    await prodClient.query(`
      SELECT *
      FROM cutoffs
      WHERE counselling_type = ANY($1::text[])
        AND year = ANY($2::int[])
      ORDER BY id
    `, [
      TARGET_TYPES,
      TARGET_YEARS,
    ]);

  const backupFile =
    `./production-josaa-csab-before-sync-${stamp()}.json`;

  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      prodBefore.rows,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    "Production target backup rows:",
    prodBefore.rows.length
  );

  console.log(
    "Backup file:",
    backupFile
  );


  console.log(
    "\nLOCAL COUNTS"
  );

  console.table(
    await getCounts(
      localClient
    )
  );

  console.log(
    "\nPRODUCTION BEFORE"
  );

  console.table(
    await getCounts(
      prodClient
    )
  );


  /*
  |--------------------------------------------------------------------------
  | 6. Columns to copy
  |--------------------------------------------------------------------------
  |
  | Do not copy serial/identity id.
  |
  */

  const copyColumns =
    localColumnInfo
      .filter(
        column =>
          column.column_name !== "id" &&
          column.is_identity !== "YES" &&
          column.is_generated === "NEVER"
      )
      .map(
        column =>
          column.column_name
      );

  console.log(
    "\nColumns copied:",
    copyColumns.length
  );


  /*
  |--------------------------------------------------------------------------
  | 7. TRANSACTION
  |--------------------------------------------------------------------------
  */

  await prodClient.query(
    "BEGIN"
  );

  try {

    /*
    |----------------------------------------------------------------------
    | Delete ONLY JoSAA + CSAB Special 2024-2026
    |----------------------------------------------------------------------
    */

    const deleted =
      await prodClient.query(`
        DELETE FROM cutoffs
        WHERE counselling_type = ANY($1::text[])
          AND year = ANY($2::int[])
      `, [
        TARGET_TYPES,
        TARGET_YEARS,
      ]);

    console.log(
      "\nProduction rows deleted:",
      deleted.rowCount
    );


    /*
    |----------------------------------------------------------------------
    | Batch insert verified local rows
    |----------------------------------------------------------------------
    */

    const BATCH_SIZE =
      250;

    let inserted =
      0;

    for (
      let index = 0;
      index < localHistory.rows.length;
      index += BATCH_SIZE
    ) {
      const batch =
        localHistory.rows.slice(
          index,
          index + BATCH_SIZE
        );

      await insertBatch(
        prodClient,
        "cutoffs",
        copyColumns,
        batch
      );

      inserted +=
        batch.length;

      if (
        inserted % 5000 === 0 ||
        inserted ===
          localHistory.rows.length
      ) {
        console.log(
          `Inserted ${inserted} / ${localHistory.rows.length}`
        );
      }
    }


    /*
    |----------------------------------------------------------------------
    | 8. Exact verification BEFORE COMMIT
    |----------------------------------------------------------------------
    */

    const verify =
      await prodClient.query(`
        SELECT
          counselling_type,
          year,
          COUNT(*)::int AS rows
        FROM cutoffs
        WHERE counselling_type = ANY($1::text[])
          AND year = ANY($2::int[])
        GROUP BY
          counselling_type,
          year
        ORDER BY
          counselling_type,
          year
      `, [
        TARGET_TYPES,
        TARGET_YEARS,
      ]);

    console.log(
      "\nPRODUCTION AFTER INSERT / BEFORE COMMIT"
    );

    console.table(
      verify.rows
    );


    const expected =
      new Map([
        [
          "CSAB_SPECIAL:2024",
          9734,
        ],
        [
          "CSAB_SPECIAL:2025",
          13454,
        ],
        [
          "CSAB_SPECIAL:2026",
          11793,
        ],
        [
          "JOSAA:2024",
          55961,
        ],
        [
          "JOSAA:2025",
          71414,
        ],
        [
          "JOSAA:2026",
          64327,
        ],
      ]);

    for (
      const [
        key,
        expectedCount,
      ]
      of expected
    ) {
      const [
        type,
        yearText,
      ] =
        key.split(":");

      const found =
        verify.rows.find(
          row =>
            row.counselling_type ===
              type &&
            Number(row.year) ===
              Number(yearText)
        );

      if (
        !found ||
        Number(found.rows) !==
          expectedCount
      ) {
        throw new Error(
          `Verification failed for ${key}. Expected ${expectedCount}, found ${found?.rows ?? 0}`
        );
      }
    }

    const total =
      verify.rows.reduce(
        (sum, row) =>
          sum +
          Number(row.rows),
        0
      );

    if (
      total !== 226683
    ) {
      throw new Error(
        `Total verification failed. Expected 226683, found ${total}`
      );
    }


    /*
    |----------------------------------------------------------------------
    | 9. COMMIT
    |----------------------------------------------------------------------
    */

    await prodClient.query(
      "COMMIT"
    );

    console.log(
      "\n======================================"
    );

    console.log(
      "SYNC COMMITTED SUCCESSFULLY"
    );

    console.log(
      "======================================"
    );

  } catch (error) {

    await prodClient.query(
      "ROLLBACK"
    );

    console.error(
      "\nTRANSACTION ROLLED BACK."
    );

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | 10. Final production verification
  |--------------------------------------------------------------------------
  */

  console.log(
    "\nFINAL PRODUCTION COUNTS"
  );

  console.table(
    await getCounts(
      prodClient
    )
  );

}
finally {

  if (localClient) {
    localClient.release();
  }

  if (prodClient) {
    prodClient.release();
  }

  await localPool.end();
  await prodPool.end();
}
