import "dotenv/config";
import fs from "node:fs/promises";

import {
  pool
} from "./src/db/pool.js";


const OUTPUT =
  "./all-db-colleges-fee-input.json";


async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "BUILD ALL DATABASE COLLEGES FEE INPUT"
  );

  console.log(
    "======================================="
  );

  console.log("");


  const result =
    await pool.query(`
      SELECT
        c.id,
        c.name
      FROM colleges c
      ORDER BY c.name
    `);


  const rows =
    result.rows.map(
      row => ({
        college_id:
          row.id,

        college_name:
          row.name,

        academic_year:
          null,

        official_website:
          null,

        source_url:
          null,

        fee_source_url:
          null,

        source_type:
          null,

        queue_status:
          "SOURCE_DISCOVERY_REQUIRED"
      })
    );


  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      rows,
      null,
      2
    ),

    "utf8"
  );


  console.log(
    "TOTAL COLLEGES IN DATABASE:",
    rows.length
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );


  console.log("");

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );


  await pool.end();
}


main().catch(
  async error => {
    console.error(
      "FAILED:",
      error.message
    );


    try {
      await pool.end();
    } catch {}


    process.exitCode = 1;
  }
);