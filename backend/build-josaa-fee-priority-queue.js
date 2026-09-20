import fs from "node:fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const DB =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!DB) {
  throw new Error("Database connection string missing");
}

const pool = new Pool({
  connectionString: DB
});

const MAPPING_FILE =
  "./josaa-2026-db-mapping.json";

const OUTPUT =
  "./josaa-2026-fee-priority-queue.json";

const mapping =
  JSON.parse(
    fs.readFileSync(
      MAPPING_FILE,
      "utf8"
    )
  )
  .filter(x => x.matched);

const ids =
  mapping.map(
    x => x.college_id
  );

const result =
  await pool.query(
    `
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

    WHERE c.id::text = ANY($1::text[])
    `,
    [ids]
  );

const profileMap =
  new Map(
    result.rows.map(
      x => [
        x.college_id,
        x
      ]
    )
  );

const fields = [
  "tuition_fee_per_semester",
  "academic_fee_per_semester",
  "hostel_fee_per_semester",
  "mess_fee_per_semester",
  "first_semester_fee",
  "annual_academic_fee",
  "annual_total_fee",
  "total_course_fee"
];

const queue =
  mapping.map(j => {

    const db =
      profileMap.get(
        j.college_id
      ) || {};

    const missing_fields =
      fields.filter(
        field =>
          db[field] == null
      );

    const available =
      fields.length -
      missing_fields.length;

    let status;

    if (available === 0) {
      status =
        "NO_FEE_DATA";
    } else if (
      missing_fields.length === 0
    ) {
      status =
        "COMPLETE";
    } else {
      status =
        "NEEDS_ENRICHMENT";
    }

    return {
      josaa_code:
        j.josaa_code,

      josaa_name:
        j.josaa_name,

      college_id:
        j.college_id,

      college_name:
        j.college_name,

      website:
        j.website ||
        db.website ||
        null,

      fee_year:
        db.fee_year || null,

      available_fields:
        available,

      missing_count:
        missing_fields.length,

      missing_fields,

      status
    };
  });

const priority = {
  NO_FEE_DATA: 0,
  NEEDS_ENRICHMENT: 1,
  COMPLETE: 2
};

queue.sort(
  (a, b) =>
    priority[a.status] -
    priority[b.status] ||
    b.missing_count -
    a.missing_count ||
    Number(a.josaa_code) -
    Number(b.josaa_code)
);

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(
    queue,
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
  "JOSAA 2026 FEE PRIORITY QUEUE"
);
console.log(
  "========================================"
);

console.log(
  "Total:",
  queue.length
);

console.log(
  "No fee data:",
  queue.filter(
    x =>
      x.status ===
      "NO_FEE_DATA"
  ).length
);

console.log(
  "Need enrichment:",
  queue.filter(
    x =>
      x.status ===
      "NEEDS_ENRICHMENT"
  ).length
);

console.log(
  "Complete:",
  queue.filter(
    x =>
      x.status ===
      "COMPLETE"
  ).length
);

console.log("");

console.table(
  queue
    .slice(0, 25)
    .map(
      (x, i) => ({
        no: i + 1,
        code:
          x.josaa_code,
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
  "Saved:",
  OUTPUT
);

await pool.end();
