const fs = require("fs");

const file = "./src/routes/counselling.js";

let s = fs.readFileSync(file, "utf8");

const marker = "export default router;";

if (!s.includes(marker)) {
  throw new Error("export default router; not found");
}

if (s.includes("/admin/debug-production-uptac")) {
  console.log("Debug endpoint already exists.");
  process.exit(0);
}

const block = `

/*
|--------------------------------------------------------------------------
| TEMPORARY PRODUCTION UPTAC DEBUG
|--------------------------------------------------------------------------
| READ ONLY - remove after diagnosis.
*/

router.get(
  '/admin/debug-production-uptac',
  async (req, res) => {
    try {
      const { rows } = await pool.query(\`
        SELECT
          COUNT(*) FILTER (
            WHERE
              LOWER(
                COALESCE(
                  counselling_type,
                  ''
                )
              ) = 'uptac'
          )::int AS uptac_total,

          COUNT(*) FILTER (
            WHERE
              LOWER(
                COALESCE(
                  counselling_type,
                  ''
                )
              ) = 'uptac'
              AND year = 2025
              AND round = '1'
              AND category = 'OPEN'
          )::int AS round1_open,

          COUNT(*) FILTER (
            WHERE
              LOWER(
                COALESCE(
                  counselling_type,
                  ''
                )
              ) = 'uptac'
              AND year = 2025
              AND round = '1'
              AND category = 'OPEN'
              AND closing_rank >= 50000
          )::int AS rank_50000
        FROM cutoffs
      \`);

      return res.json({
        ok: true,
        ...rows[0],
      });
    } catch (error) {
      console.error(
        '[UPTAC PRODUCTION DEBUG]',
        error
      );

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

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log("Temporary production UPTAC debug endpoint added.");
