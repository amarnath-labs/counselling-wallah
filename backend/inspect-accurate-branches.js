import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    process.env.DB_URL,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined
});

async function main() {
  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "ACCURATE DATABASE BRANCHES"
  );
  console.log(
    "======================================="
  );
  console.log("");

  const collegeResult =
    await pool.query(`
      SELECT
        id,
        name
      FROM colleges
      WHERE LOWER(name)
        LIKE '%accurate institute%'
      ORDER BY name
    `);

  if (
    collegeResult.rows.length === 0
  ) {
    throw new Error(
      "Accurate Institute not found in colleges table."
    );
  }

  console.log("COLLEGE MATCHES");
  console.table(
    collegeResult.rows
  );

  const collegeIds =
    collegeResult.rows.map(
      row => row.id
    );

  const branchResult =
    await pool.query(
      `
      SELECT DISTINCT
        b.id,
        b.college_id,
        b.name
      FROM branches b
      WHERE b.college_id =
        ANY($1::text[])
      ORDER BY
        b.college_id,
        b.name
      `,
      [collegeIds]
    );

  const rows =
    branchResult.rows.map(
      row => {
        const name =
          String(
            row.name || ""
          );

        const feeWaiver =
          /fee\s*waiver|\btfw\b|\bfw\b/i.test(
            name
          );

        return {
          id:
            row.id,

          college_id:
            row.college_id,

          name,

          fee_waiver:
            feeWaiver
              ? "yes"
              : "no"
        };
      }
    );

  console.log("");
  console.log(
    "BRANCHES"
  );

  console.table(rows);

  const normal =
    rows.filter(
      row =>
        row.fee_waiver ===
        "no"
    );

  const fw =
    rows.filter(
      row =>
        row.fee_waiver ===
        "yes"
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
        rows.length
    }
  ]);

  console.log("");
  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );
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
    await pool.end();
  });