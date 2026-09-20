import fs from "fs";
import path from "path";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const JSON_DIR = path.resolve(process.cwd(), "..", "json");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bnational institute of technology\b/g, "nit")
    .replace(/\bdr\.?\s*b\.?\s*r\.?\s*ambedkar\b/g, "ambedkar")
    .replace(/\bmaulana azad national institute of technology\b/g, "manit")
    .replace(/\bmotilal nehru national institute of technology\b/g, "mnnit")
    .replace(/\bmalaviya national institute of technology\b/g, "mnit")
    .replace(/\bvisvesvaraya national institute of technology\b/g, "vnit")
    .replace(/\bsardar vallabhbhai national institute of technology\b/g, "svnit")
    .replace(/\bnational institute of technology karnataka\b/g, "nit surathkal")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCollegeObjects(data) {
  if (Array.isArray(data?.colleges)) {
    return data.colleges;
  }

  return [data];
}

function extractNames(college, fileName) {
  const names = [
    college?.college_identity?.verified_name,
    college?.college_identity?.input_name,
    college?.college_identity?.short_name,
    college?.college_name,
    college?.identity_verification?.verified_entity,
    path.basename(fileName, ".json"),
  ];

  return [...new Set(names.filter(Boolean).map(String))];
}

function scoreCandidate(jsonNames, dbName) {
  const db = normalize(dbName);

  let best = 0;

  for (const rawName of jsonNames) {
    const json = normalize(rawName);

    if (!json || !db) continue;

    if (json === db) {
      best = Math.max(best, 100);
      continue;
    }

    if (db.includes(json) || json.includes(db)) {
      best = Math.max(best, 90);
    }

    const jsonWords = new Set(json.split(" "));
    const dbWords = new Set(db.split(" "));

    const common = [...jsonWords].filter((word) =>
      dbWords.has(word)
    );

    const denominator = Math.max(
      jsonWords.size,
      dbWords.size,
      1
    );

    const overlap =
      Math.round((common.length / denominator) * 100);

    best = Math.max(best, overlap);
  }

  return best;
}

async function main() {
  const client = await pool.connect();

  try {
    console.log("");
    console.log("========================================");
    console.log("NIT REVIEW COLLEGE MATCHING - DRY RUN");
    console.log("========================================");
    console.log("");

    const dbResult = await client.query(`
      SELECT id, name
      FROM colleges
      ORDER BY name
    `);

    const dbColleges = dbResult.rows;

    console.log(
      `Database colleges available: ${dbColleges.length}`
    );

    const files = fs
      .readdirSync(JSON_DIR)
      .filter((name) =>
        name.toLowerCase().endsWith(".json")
      )
      .sort();

    console.log(`JSON files: ${files.length}`);
    console.log("");

    let matched = 0;
    let reviewEmpty = 0;
    let needsReview = 0;

    for (const file of files) {
      const fullPath = path.join(JSON_DIR, file);

      const raw = fs.readFileSync(fullPath, "utf8");
      const data = JSON.parse(raw);

      const collegeObjects = getCollegeObjects(data);

      for (const college of collegeObjects) {
        const jsonNames = extractNames(
          college,
          file
        );

        const reviewItems =
          college?.review_items ??
          data?.review_items ??
          [];

        const aggregates =
          college?.platform_aggregate_observations ??
          college?.platform_aggregate_ratings ??
          data?.platform_aggregate_observations ??
          data?.platform_aggregate_ratings ??
          [];

        const usefulRecords =
          (Array.isArray(reviewItems)
            ? reviewItems.length
            : 0) +
          (Array.isArray(aggregates)
            ? aggregates.length
            : 0);

        const candidates = dbColleges
          .map((row) => ({
            ...row,
            score: scoreCandidate(
              jsonNames,
              row.name
            ),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        const best = candidates[0];

        console.log("----------------------------------------");
        console.log(`FILE: ${file}`);
        console.log(
          `JSON NAME: ${jsonNames[0] || "UNKNOWN"}`
        );
        console.log(
          `Reviews: ${
            Array.isArray(reviewItems)
              ? reviewItems.length
              : 0
          }`
        );
        console.log(
          `Aggregates: ${
            Array.isArray(aggregates)
              ? aggregates.length
              : 0
          }`
        );

        if (usefulRecords === 0) {
          console.log(
            "⚠️ EMPTY REVIEW DATA - WILL BE SKIPPED"
          );
          reviewEmpty++;
        }

        if (best && best.score >= 70) {
          console.log(`✅ BEST DB MATCH: ${best.name}`);
          console.log(`   DB ID: ${best.id}`);
          console.log(
            `   Match score: ${best.score}`
          );
          matched++;
        } else {
          console.log(
            "❌ NO SAFE AUTOMATIC MATCH"
          );

          for (const candidate of candidates) {
            console.log(
              `   Candidate: ${candidate.name} [${candidate.score}]`
            );
          }

          needsReview++;
        }
      }
    }

    console.log("");
    console.log("========================================");
    console.log("MATCHING SUMMARY");
    console.log("========================================");
    console.log(`Safe matches : ${matched}`);
    console.log(`Need review  : ${needsReview}`);
    console.log(`Empty data   : ${reviewEmpty}`);
    console.log("");
    console.log(
      "DRY RUN ONLY - DATABASE WAS NOT MODIFIED."
    );
  } catch (error) {
    console.error("");
    console.error("MATCHING FAILED:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
