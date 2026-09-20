import "dotenv/config";
import fs from "node:fs/promises";
import { pool } from "./src/db/pool.js";

async function run() {
  try {
    const migration = await fs.readFile(
      "./src/db/migrations/20260907_career_adaptive_v2.sql",
      "utf8"
    );

    console.log("Applying career schema...");
    await pool.query(migration);
    console.log("✅ Career schema applied");

    const seed = await fs.readFile(
      "./src/db/migrations/20260907_seed_career_questions.sql",
      "utf8"
    );

    console.log("Applying career question seed...");
    await pool.query(seed);
    console.log("✅ Career questions seeded");

    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM career_questions) AS questions,
        (SELECT COUNT(*) FROM career_assessments) AS assessments
    `);

    console.log("Database check:");
    console.table(result.rows);
  } catch (error) {
    console.error("❌ CAREER MIGRATION ERROR");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
