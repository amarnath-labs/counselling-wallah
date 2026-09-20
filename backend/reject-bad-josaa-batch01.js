import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const DB =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!DB) {
  throw new Error("Database URL missing");
}

const pool = new Pool({
  connectionString: DB
});

const bad = [
  {
    college:
      "Malaviya National Institute of Technology Jaipur",
    urlPart:
      "malaviya-national-institute-of-technology-jaipur/courses"
  },
  {
    college:
      "National Institute of Technology, Manipur",
    urlPart:
      "national-institute-of-technology-manipur/courses"
  }
];

for (const item of bad) {

  const result =
    await pool.query(
      `
      UPDATE fee_source_records

      SET
        verification_status = 'rejected',

        notes =
          CONCAT(
            COALESCE(notes, ''),
            CASE
              WHEN notes IS NULL OR notes = ''
                THEN ''
              ELSE E'\n'
            END,
            'AUTO_REJECT: parser extracted implausible annual academic fee from generic courses page.'
          ),

        updated_at = NOW()

      WHERE
        college_name = $1
        AND source_url ILIKE $2
        AND verification_status <> 'rejected'

      RETURNING
        college_name,
        source_url,
        annual_academic_fee,
        verification_status;
      `,
      [
        item.college,
        `%${item.urlPart}%`
      ]
    );

  console.log(
    item.college,
    "rejected:",
    result.rowCount
  );

  console.table(
    result.rows
  );
}

await pool.end();
