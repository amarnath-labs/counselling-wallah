import fs from "fs";
import path from "path";

const JSON_DIR = path.resolve(process.cwd(), "..", "json");

console.log("JSON folder:");
console.log(JSON_DIR);
console.log("");

if (!fs.existsSync(JSON_DIR)) {
  console.error("❌ JSON folder not found.");
  process.exit(1);
}

const files = fs
  .readdirSync(JSON_DIR)
  .filter((name) => name.toLowerCase().endsWith(".json"))
  .sort();

if (files.length === 0) {
  console.error("❌ No .json files found.");
  process.exit(1);
}

console.log(`Found ${files.length} JSON file(s).`);
console.log("========================================");

let valid = 0;
let invalid = 0;

for (const file of files) {
  const fullPath = path.join(JSON_DIR, file);

  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    const data = JSON.parse(raw);

    let collegeCount = 0;
    let reviewCount = 0;
    let aggregateCount = 0;
    let aspectRatingCount = 0;

    // Batch/frozen schema
    if (Array.isArray(data.colleges)) {
      collegeCount = data.colleges.length;

      for (const college of data.colleges) {
        reviewCount += Array.isArray(college.review_items)
          ? college.review_items.length
          : 0;

        aggregateCount += Array.isArray(
          college.platform_aggregate_observations
        )
          ? college.platform_aggregate_observations.length
          : 0;

        aspectRatingCount += Array.isArray(
          college.platform_aspect_ratings
        )
          ? college.platform_aspect_ratings.length
          : 0;
      }
    }

    // Single-college schema
    else if (
      data.college_name ||
      data.college_identity ||
      data.identity_verification
    ) {
      collegeCount = 1;

      reviewCount = Array.isArray(data.review_items)
        ? data.review_items.length
        : 0;

      aggregateCount = Array.isArray(
        data.platform_aggregate_observations
      )
        ? data.platform_aggregate_observations.length
        : Array.isArray(data.platform_aggregate_ratings)
        ? data.platform_aggregate_ratings.length
        : 0;

      aspectRatingCount = Array.isArray(
        data.platform_aspect_ratings
      )
        ? data.platform_aspect_ratings.length
        : 0;
    }

    console.log(`✅ ${file}`);
    console.log(`   Colleges: ${collegeCount}`);
    console.log(`   Review items: ${reviewCount}`);
    console.log(`   Aggregate records: ${aggregateCount}`);
    console.log(`   Platform aspect ratings: ${aspectRatingCount}`);
    console.log("");

    valid++;
  } catch (error) {
    console.log(`❌ ${file}`);
    console.log(`   ${error.message}`);
    console.log("");

    invalid++;
  }
}

console.log("========================================");
console.log("VALIDATION COMPLETE");
console.log("========================================");
console.log(`Valid JSON files  : ${valid}`);
console.log(`Invalid JSON files: ${invalid}`);
console.log(`Total files       : ${files.length}`);

if (invalid > 0) {
  console.log("");
  console.log(
    "⚠️ Fix invalid JSON files before database import."
  );
}
