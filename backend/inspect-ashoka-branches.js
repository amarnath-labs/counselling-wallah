import "dotenv/config";
import { pool } from "./src/db/pool.js";

async function main() {
  const collegeId =
    "uptac-ashoka-institute-of-technology-management-varanasi";

  const result = await pool.query(
    "SELECT id, name FROM branches WHERE college_id = $1 ORDER BY name",
    [collegeId]
  );

  console.log("");
  console.log("=======================================");
  console.log("ASHOKA BRANCHES");
  console.log("=======================================");
  console.log("");

  console.table(result.rows);

  console.log("");
  console.log("Total branches:", result.rows.length);

  await pool.end();
}

main().catch(async (error) => {
  console.error("FAILED:", error.message);

  try {
    await pool.end();
  } catch {}

  process.exitCode = 1;
});
