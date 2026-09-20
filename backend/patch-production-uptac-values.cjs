const fs = require("fs");

const file = "./src/routes/counselling.js";
let s = fs.readFileSync(file, "utf8");

const marker = "export default router;";

if (s.includes("/admin/debug-production-uptac-values")) {
  console.log("Audit endpoint already exists.");
  process.exit(0);
}

const block = `

router.get(
  '/admin/debug-production-uptac-values',
  async (req, res) => {
    try {
      const rounds = await pool.query(\`
        SELECT
          year,
          round,
          COUNT(*)::int AS count
        FROM cutoffs
        WHERE
          LOWER(COALESCE(counselling_type, '')) = 'uptac'
        GROUP BY year, round
        ORDER BY year DESC, round
      \`);

      const categories = await pool.query(\`
        SELECT
          category,
          COUNT(*)::int AS count
        FROM cutoffs
        WHERE
          LOWER(COALESCE(counselling_type, '')) = 'uptac'
        GROUP BY category
        ORDER BY count DESC
      \`);

      const samples = await pool.query(\`
        SELECT
          year,
          round,
          category,
          opening_rank,
          closing_rank
        FROM cutoffs
        WHERE
          LOWER(COALESCE(counselling_type, '')) = 'uptac'
        ORDER BY year DESC
        LIMIT 20
      \`);

      return res.json({
        ok: true,
        rounds: rounds.rows,
        categories: categories.rows,
        samples: samples.rows,
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: error.message,
      });
    }
  }
);

`;

s = s.replace(
  marker,
  block + marker
);

fs.writeFileSync(file, s, "utf8");

console.log("Production UPTAC value audit endpoint added.");
