import fs from "node:fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Database connection string missing");
}

const pool = new Pool({
  connectionString
});

try {

  const result = await pool.query(`
    SELECT
      c.id::text AS college_id,
      c.name AS college_name,
      c.website,

      fp.fee_year,
      fp.tuition_fee_per_semester,
      fp.academic_fee_per_semester,
      fp.hostel_fee_per_semester,
      fp.mess_fee_per_semester,
      fp.first_semester_fee,
      fp.annual_academic_fee,
      fp.annual_total_fee,
      fp.total_course_fee

    FROM colleges c

    LEFT JOIN college_fee_profiles fp
      ON fp.college_id = c.id::text

    WHERE

      /* IIT */
      LOWER(c.name) LIKE '%indian institute of technology%'
      OR LOWER(c.name) ~ '(^|[^a-z])iit([^a-z]|$)'

      /* NIT */
      OR LOWER(c.name) LIKE '%national institute of technology%'
      OR LOWER(c.name) ~ '(^|[^a-z])nit([^a-z]|$)'

      /* IIIT */
      OR LOWER(c.name) LIKE '%indian institute of information technology%'
      OR LOWER(c.name) LIKE '%international institute of information technology%'
      OR LOWER(c.name) ~ '(^|[^a-z])iiit([^a-z]|$)'

      /* IIEST */
      OR LOWER(c.name) LIKE '%indian institute of engineering science and technology%'

      /* IISc */
      OR LOWER(c.name) LIKE '%indian institute of science%'

      /* known GFTI patterns in your DB */
      OR LOWER(c.name) LIKE '%central university%'
      OR LOWER(c.name) LIKE '%school of planning%'
      OR LOWER(c.name) LIKE '%sant longowal%'
      OR LOWER(c.name) LIKE '%gati shakti vishwavidyalaya%'
      OR LOWER(c.name) LIKE '%tezpur university%'
      OR LOWER(c.name) LIKE '%assam university%'
      OR LOWER(c.name) LIKE '%mizoram university%'
      OR LOWER(c.name) LIKE '%gurukula kangri%'
      OR LOWER(c.name) LIKE '%jnu%'
      OR LOWER(c.name) LIKE '%jawaharlal nehru university%'
      OR LOWER(c.name) LIKE '%ghani khan choudhary%'
      OR LOWER(c.name) LIKE '%central institute of technology kokrajar%'
      OR LOWER(c.name) LIKE '%north eastern regional institute%'
      OR LOWER(c.name) LIKE '%punjab engineering college%'
      OR LOWER(c.name) LIKE '%puducherry technological university%'
      OR LOWER(c.name) LIKE '%shri mata vaishno devi university%'
      OR LOWER(c.name) LIKE '%guru ghasidas%'
      OR LOWER(c.name) LIKE '%national institute of food technology%'
      OR LOWER(c.name) LIKE '%national institute of advanced manufacturing technology%'

    ORDER BY c.name;
  `);

  const rows = result.rows;

  const prepared = rows.map(row => {

    const fields = {
      tuition_fee_per_semester:
        row.tuition_fee_per_semester,

      academic_fee_per_semester:
        row.academic_fee_per_semester,

      hostel_fee_per_semester:
        row.hostel_fee_per_semester,

      mess_fee_per_semester:
        row.mess_fee_per_semester,

      first_semester_fee:
        row.first_semester_fee,

      annual_academic_fee:
        row.annual_academic_fee,

      annual_total_fee:
        row.annual_total_fee,

      total_course_fee:
        row.total_course_fee
    };

    const missing_fields =
      Object.entries(fields)
        .filter(
          ([, value]) =>
            value == null
        )
        .map(
          ([field]) =>
            field
        );

    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      website:
        row.website,

      fee_year:
        row.fee_year,

      available_fields:
        8 - missing_fields.length,

      missing_count:
        missing_fields.length,

      missing_fields,

      status:
        missing_fields.length === 8
          ? "NO_FEE_DATA"
          : missing_fields.length === 0
            ? "COMPLETE"
            : "NEEDS_ENRICHMENT"
    };
  });

  fs.writeFileSync(
    "./josaa-fee-work-queue.json",
    JSON.stringify(
      prepared,
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "JOSAA-FIRST FEE QUEUE"
  );

  console.log(
    "========================================"
  );

  console.table(
    prepared.map(
      (x, i) => ({
        no: i + 1,
        college:
          x.college_name,
        available:
          `${x.available_fields}/8`,
        missing:
          x.missing_count,
        status:
          x.status
      })
    )
  );

  console.log("");

  console.log(
    "JoSAA-like colleges found:",
    prepared.length
  );

  console.log(
    "No fee data:",
    prepared.filter(
      x =>
        x.status ===
        "NO_FEE_DATA"
    ).length
  );

  console.log(
    "Need enrichment:",
    prepared.filter(
      x =>
        x.status ===
        "NEEDS_ENRICHMENT"
    ).length
  );

  console.log(
    "Complete:",
    prepared.filter(
      x =>
        x.status ===
        "COMPLETE"
    ).length
  );

  console.log("");
  console.log(
    "Saved: ./josaa-fee-work-queue.json"
  );

} finally {
  await pool.end();
}
