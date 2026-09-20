import { pool } from "./src/db/pool.js";

const COLLEGE_ID =
  "uptac-ajay-kumar-garg-engg-college-ghaziabad";

async function main() {
  console.log("");
  console.log("=======================================");
  console.log("AKGEC DATABASE BRANCHES");
  console.log("=======================================");
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
          String(row.id),

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

  const feeWaiver =
    result.rows.filter(
      row =>
        /\(\s*FW\s*\)/i.test(
          row.name
        )
    );

  console.log("");
  console.log("---------------------------------------");
  console.log("SUMMARY");
  console.log("---------------------------------------");

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
        feeWaiver.length
    },
    {
      type:
        "Total branches",

      count:
        result.rows.length
    }
  ]);

  console.log("");
  console.log("DATABASE HAS NOT BEEN MODIFIED.");
}


main()
  .catch(
    error => {
      console.error(
        "FAILED:",
        error.message
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      try {
        await pool.end();
      } catch {}
    }
  );