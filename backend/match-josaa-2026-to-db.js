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

const JOSAA_FILE =
  "./josaa-2026-official-institutes.json";

const OUTPUT =
  "./josaa-2026-db-mapping.json";

const UNMATCHED =
  "./josaa-2026-unmatched.json";

const REVIEW =
  "./josaa-2026-ambiguous.json";

function basicNormalize(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.,:'"()\-\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getType(name) {
  const n = basicNormalize(name);

  if (
    /\bindian institute of technology\b/.test(n) &&
    !/\binformation technology\b/.test(n)
  ) {
    return "IIT";
  }

  if (
    /\bnational institute of technology\b/.test(n)
  ) {
    return "NIT";
  }

  if (
    /\bindian institute of information technology\b/.test(n) ||
    /\biiit\b/.test(n)
  ) {
    return "IIIT";
  }

  if (
    /\binternational institute of information technology\b/.test(n)
  ) {
    return "INTERNATIONAL_IIIT";
  }

  if (
    /\bindian institute of engineering science and technology\b/.test(n)
  ) {
    return "IIEST";
  }

  if (
    /\bindian institute of science\b/.test(n)
  ) {
    return "IISC";
  }

  return "OTHER";
}

function compact(name) {
  return basicNormalize(name)
    .replace(/\bindian institute of technology\b/g, " ")
    .replace(/\bnational institute of technology\b/g, " ")
    .replace(/\bindian institute of information technology\b/g, " ")
    .replace(/\binternational institute of information technology\b/g, " ")
    .replace(/\binstitute of engineering science and technology\b/g, " ")
    .replace(/\bindian institute of science\b/g, " ")
    .replace(/\biiit\b/g, " ")
    .replace(/\biit\b/g, " ")
    .replace(/\bnit\b/g, " ")
    .replace(/\buniversity\b/g, " ")
    .replace(/\binstitute\b/g, " ")
    .replace(/\bcollege\b/g, " ")
    .replace(/\bof\b/g, " ")
    .replace(/\band\b/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(name) {
  return new Set(
    compact(name)
      .split(" ")
      .filter(x => x.length >= 2)
  );
}

function tokenSimilarity(a, b) {
  const A = tokens(a);
  const B = tokens(b);

  if (!A.size || !B.size) {
    return 0;
  }

  let common = 0;

  for (const token of A) {
    if (B.has(token)) {
      common++;
    }
  }

  const union =
    new Set([...A, ...B]).size;

  return union
    ? common / union
    : 0;
}

function acronym(name) {
  return basicNormalize(name)
    .split(" ")
    .filter(
      x =>
        ![
          "of",
          "and",
          "the",
          "in",
          "at",
          "for"
        ].includes(x)
    )
    .map(x => x[0])
    .join("");
}

function scoreMatch(josaaName, dbName) {
  const a = basicNormalize(josaaName);
  const b = basicNormalize(dbName);

  const typeA = getType(josaaName);
  const typeB = getType(dbName);

  /*
    Critical:
    IIT / NIT / IIIT mismatch cannot be accepted.
  */
  if (
    typeA !== "OTHER" &&
    typeB !== "OTHER" &&
    typeA !== typeB
  ) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  let score =
    tokenSimilarity(
      josaaName,
      dbName
    );

  const ca = compact(josaaName);
  const cb = compact(dbName);

  if (
    ca &&
    cb &&
    ca === cb
  ) {
    score = Math.max(
      score,
      0.98
    );
  }

  if (
    ca.length >= 5 &&
    cb.length >= 5 &&
    (
      ca.includes(cb) ||
      cb.includes(ca)
    )
  ) {
    score = Math.max(
      score,
      0.90
    );
  }

  const aa = acronym(josaaName);
  const ab = acronym(dbName);

  if (
    aa.length >= 3 &&
    aa === ab
  ) {
    score = Math.max(
      score,
      0.92
    );
  }

  return score;
}

try {

  const josaa =
    JSON.parse(
      fs.readFileSync(
        JOSAA_FILE,
        "utf8"
      )
    );

  const dbResult =
    await pool.query(`
      SELECT
        id::text AS college_id,
        name AS college_name,
        website
      FROM colleges
      ORDER BY name
    `);

  const colleges =
    dbResult.rows;

  const mapping = [];
  const unmatched = [];
  const ambiguous = [];

  for (const institute of josaa) {

    const ranked =
      colleges
        .map(college => ({
          ...college,

          score:
            scoreMatch(
              institute.institute_name,
              college.college_name
            ),

          type:
            getType(
              college.college_name
            )
        }))
        .sort(
          (a, b) =>
            b.score - a.score
        );

    const best =
      ranked[0];

    const second =
      ranked[1];

    /*
      Safer threshold.
    */
    const accepted =
      best &&
      best.score >= 0.72;

    /*
      If top two are very close,
      don't auto-trust it.
    */
    const exactName =
      basicNormalize(institute.institute_name) ===
      basicNormalize(best?.college_name);

    const isAmbiguous =
      accepted &&
      !exactName &&
      second &&
      second.score >= 0.65 &&
      (
        best.score -
        second.score
      ) < 0.08;

    const alternatives =
      ranked
        .slice(0, 5)
        .filter(
          x =>
            x.score >= 0.45
        )
        .map(x => ({
          college_id:
            x.college_id,

          college_name:
            x.college_name,

          score:
            Number(
              x.score.toFixed(3)
            ),

          type:
            x.type
        }));

    const row = {
      josaa_code:
        institute.josaa_code,

      josaa_name:
        institute.institute_name,

      josaa_type:
        getType(
          institute.institute_name
        ),

      matched:
        accepted &&
        !isAmbiguous,

      ambiguous:
        isAmbiguous,

      college_id:
        accepted &&
        !isAmbiguous
          ? best.college_id
          : null,

      college_name:
        accepted &&
        !isAmbiguous
          ? best.college_name
          : null,

      website:
        accepted &&
        !isAmbiguous
          ? best.website
          : null,

      score:
        best
          ? Number(
              best.score.toFixed(3)
            )
          : 0,

      alternatives
    };

    mapping.push(row);

    if (!accepted) {
      unmatched.push(row);
    }

    if (isAmbiguous) {
      ambiguous.push({
        ...row,

        suggested_best: {
          college_id:
            best.college_id,

          college_name:
            best.college_name,

          score:
            Number(
              best.score.toFixed(3)
            )
        },

        suggested_second: {
          college_id:
            second.college_id,

          college_name:
            second.college_name,

          score:
            Number(
              second.score.toFixed(3)
            )
        }
      });
    }
  }

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      mapping,
      null,
      2
    ),
    "utf8"
  );

  fs.writeFileSync(
    UNMATCHED,
    JSON.stringify(
      unmatched,
      null,
      2
    ),
    "utf8"
  );

  fs.writeFileSync(
    REVIEW,
    JSON.stringify(
      ambiguous,
      null,
      2
    ),
    "utf8"
  );

  const matched =
    mapping.filter(
      x => x.matched
    );

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "STRICT JOSAA → DATABASE MATCHING"
  );
  console.log(
    "========================================"
  );

  console.log(
    "Official JoSAA:",
    mapping.length
  );

  console.log(
    "Safely matched:",
    matched.length
  );

  console.log(
    "Unmatched:",
    unmatched.length
  );

  console.log(
    "Ambiguous:",
    ambiguous.length
  );

  console.log("");

  console.log(
    "UNMATCHED:"
  );

  console.table(
    unmatched.map(
      x => ({
        code:
          x.josaa_code,

        josaa:
          x.josaa_name,

        bestScore:
          x.score,

        bestCandidate:
          x.alternatives[0]
            ?.college_name ||
          "NONE"
      })
    )
  );

  console.log("");

  console.log(
    "AMBIGUOUS:"
  );

  console.table(
    ambiguous.map(
      x => ({
        code:
          x.josaa_code,

        josaa:
          x.josaa_name,

        best:
          x.suggested_best
            ?.college_name,

        bestScore:
          x.suggested_best
            ?.score,

        second:
          x.suggested_second
            ?.college_name,

        secondScore:
          x.suggested_second
            ?.score
      })
    )
  );

  console.log("");
  console.log(
    "Mapping:",
    OUTPUT
  );

  console.log(
    "Unmatched:",
    UNMATCHED
  );

  console.log(
    "Review:",
    REVIEW
  );

} finally {
  await pool.end();
}

