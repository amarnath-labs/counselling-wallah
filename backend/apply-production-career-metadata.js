import "dotenv/config";
import fs from "node:fs/promises";
import { pool } from "./src/db/pool.js";

try {
  const sql = await fs.readFile(
    "./src/db/migrations/career-question-metadata-v6.sql",
    "utf8"
  );

  await pool.query(sql);

  console.log(
    "CAREER METADATA V6 MIGRATION SUCCESS"
  );
}
catch (error) {
  console.error("FAILED:");
  console.error(error.message);

  if (error.code) {
    console.error(
      "CODE:",
      error.code
    );
  }

  if (error.detail) {
    console.error(
      "DETAIL:",
      error.detail
    );
  }

  process.exitCode = 1;
}
finally {
  await pool.end();
}
