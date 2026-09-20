import { pool } from "./src/db/pool.js";
import { CAREER_QUESTION_BANK } from "./src/data/careerQuestionBank.js";

console.log("");
console.log("========================================");
console.log("BACKEND QUESTION BANK");
console.log("========================================");

console.log("Total JS questions:", CAREER_QUESTION_BANK.length);

const byStage = {};

for (const question of CAREER_QUESTION_BANK) {
  const stage = question.stage || "MISSING_STAGE";

  byStage[stage] =
    (byStage[stage] || 0) + 1;
}

console.table(
  Object.entries(byStage).map(
    ([stage, questions]) => ({
      stage,
      questions,
    })
  )
);

console.log("");
console.log("FIRST QUESTION SAMPLE:");
console.dir(
  CAREER_QUESTION_BANK[0],
  {
    depth: 10,
    colors: true,
  }
);

console.log("");
console.log("========================================");
console.log("DATABASE career_questions COLUMNS");
console.log("========================================");

const columns = await pool.query(
  "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'career_questions' ORDER BY ordinal_position"
);

console.table(columns.rows);

console.log("");
console.log("========================================");
console.log("DATABASE STAGE COUNTS");
console.log("========================================");

const counts = await pool.query(
  "SELECT stage, COUNT(*)::int AS questions FROM career_questions WHERE active = true GROUP BY stage ORDER BY stage"
);

console.table(counts.rows);

await pool.end();
