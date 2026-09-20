import "dotenv/config";

import {
  pool
} from "./src/db/pool.js";


const COLLEGE_ID =
  "uptac-abss-institute-of-technology-meerut-meerut";


async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "ABSS DATABASE BRANCHES"
  );

  console.log(
    "======================================="
  );

  console.log("");


  const result =
    await pool.query(
      `
      SELECT
        id,
        name
      FROM branches
      WHERE college_id = $1
      ORDER BY name
      `,
      [
        COLLEGE_ID
      ]
    );


  console.table(
    result.rows.map(
      row => ({
        id:
          String(
            row.id
          ),

        name:
          row.name,

        fee_waiver:
          /\(\s*FW\s*\)/i.test(
            row.name
          )
            ? "yes"
            : "no"
      })
    )
  );


  const normal =
    result.rows.filter(
      row =>
        !/\(\s*FW\s*\)/i.test(
          row.name
        )
    );


  const fw =
    result.rows.filter(
      row =>
        /\(\s*FW\s*\)/i.test(
          row.name
        )
    );


  console.log("");

  console.log(
    "---------------------------------------"
  );

  console.log(
    "SUMMARY"
  );

  console.log(
    "---------------------------------------"
  );


  console.table([
    {
      type:
        "Normal branches",

      count:
        normal.length
    },

    {
      type:
        "Fee-waiver branches",

      count:
        fw.length
    },

    {
      type:
        "Total branches",

      count:
        result.rows.length
    }
  ]);


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


    process.exitCode =
      1;
  }
);