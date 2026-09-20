const fs = require("fs");

const file = "./src/routes/exams.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("EXAMS_CACHE_TTL_MS")) {
  console.log("Exams cache already added.");
  process.exit(0);
}

const routerMarker =
  "const router = Router();";

if (!s.includes(routerMarker)) {
  throw new Error("Router marker not found");
}

s = s.replace(
  routerMarker,
`${routerMarker}

const EXAMS_CACHE_TTL_MS =
  10 * 60 * 1000;

let examsCache = null;
let examsInFlight = null;
`
);

const routeRe =
  /router\.get\('\/',[\s\S]*?\n\}\);\n\n\/\/ ============================================================\n\/\/ TEMPORARY: DEBUG CUTOFFS/m;

const match = s.match(routeRe);

if (!match) {
  throw new Error("GET / exams route not found");
}

const replacement = `router.get('/', async (_req, res, next) => {
  try {
    if (
      examsCache &&
      examsCache.expiresAt > Date.now()
    ) {
      return res.json(
        examsCache.payload
      );
    }

    if (examsInFlight) {
      const payload =
        await examsInFlight;

      return res.json(payload);
    }

    examsInFlight =
      (async () => {
        const { rows } =
          await pool.query(\`
            SELECT
              id,
              name,
              description AS desc,
              active
            FROM exams
            ORDER BY name
          \`);

        const hasUptac =
          rows.some(
            (exam) =>
              exam.id === 'uptac'
          );

        if (!hasUptac) {
          rows.push({
            id: 'uptac',
            name: 'UPTAC',
            desc:
              'Uttar Pradesh Technical Admission Counselling for engineering admissions.',
            active: true,
          });
        }

        return {
          data: rows,
        };
      })();

    try {
      const payload =
        await examsInFlight;

      examsCache = {
        payload,
        expiresAt:
          Date.now() +
          EXAMS_CACHE_TTL_MS,
      };

      return res.json(payload);
    } finally {
      examsInFlight = null;
    }
  } catch (error) {
    examsInFlight = null;
    next(error);
  }
});

// ============================================================
// TEMPORARY: DEBUG CUTOFFS`;

s = s.replace(
  routeRe,
  replacement
);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Exams cache added."
);
