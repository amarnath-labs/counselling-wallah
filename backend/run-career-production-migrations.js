import "dotenv/config";
import fs from "node:fs/promises";
import { pool } from "./src/db/pool.js";

const migrations = [
  "./src/db/migrations/20260907_career_adaptive_v2.sql",
  "./src/db/migrations/20260907_seed_career_questions.sql",
  "./src/db/migrations/career-question-metadata-v6.sql",
];

try {
  for (const file of migrations) {
    console.log("");
    console.log("========================================");
    console.log("RUNNING:", file);
    console.log("========================================");

    const sql = await fs.readFile(
      file,
      "utf8"
    );

    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");

      console.log("SUCCESS:", file);
    } catch (error) {
      await client.query("ROLLBACK");

      console.error(
        "FAILED:",
        file
      );

      console.error(
        error.message
      );

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

      throw error;
    } finally {
      client.release();
    }
  }

  console.log("");
  console.log(
    "ALL CAREER MIGRATIONS COMPLETED"
  );
} catch (error) {
  console.error("");
  console.error(
    "MIGRATION PROCESS FAILED"
  );

  process.exitCode = 1;
} finally {
  await pool.end();
}
