import "dotenv/config";
import { pool } from "./src/db/pool.js";

const COLLEGE_ID =
  "uptac-ashoka-institute-of-technology-management-varanasi";

const GROUP_1 = new Set([
  "1428", // CSE
  "1238", // CSE AI & ML
  "1516"  // CSE Data Science
]);

const GROUP_2 = new Set([
  "2598", // Biotechnology
  "1972", // Civil Engineering
  "1957", // Electrical Engineering
  "1953", // Electronics & Communication Engineering
  "2596"  // Mechanical Engineering
]);

const FEE_WAIVER = new Set([
  "2608", // Biotechnology (FW)
  "2539", // Civil Engineering (FW)
  "2237", // CSE (FW)
  "1341", // CSE AI & ML (FW)
  "2174", // CSE Data Science (FW)
  "2420"  // Electrical Engineering (FW)
]);

async function main() {
  console.log("");
  console.log("=======================================");
  console.log("ASHOKA BRANCH FEE MAPPING PREVIEW");
  console.log("=======================================");
  console.log("");

  const result = await pool.query(
    `
    SELECT
      id,
      name
    FROM branches
    WHERE college_id = $1
    ORDER BY name
    `,
    [COLLEGE_ID]
  );

  const mapped = result.rows.map((branch) => {
    const id = String(branch.id);

    let fee_group = null;
    let student_category = "GENERAL";
    let import_ready = false;

    if (GROUP_1.has(id)) {
      fee_group =
        "B.Tech - CSE / AI&ML / Data Science";

      import_ready = true;
    }

    if (GROUP_2.has(id)) {
      fee_group =
        "B.Tech - CE / EE / ECE / ME / Biotechnology";

      import_ready = true;
    }

    if (FEE_WAIVER.has(id)) {
      /*
       * FW branches are intentionally NOT assigned
       * normal tuition fee yet.
       *
       * They need separate fee-waiver handling so that
       * we do not accidentally charge the normal
       * tuition fee to an FW seat.
       */
      fee_group =
        "FEE_WAIVER_BRANCH";

      student_category =
        "FEE_WAIVER";

      import_ready = false;
    }

    return {
      branch_id: id,
      branch_name: branch.name,
      fee_group,
      student_category,
      import_ready
    };
  });

  console.table(mapped);

  const normalBranches =
    mapped.filter(
      (row) =>
        row.import_ready === true
    );

  const feeWaiverBranches =
    mapped.filter(
      (row) =>
        row.student_category ===
        "FEE_WAIVER"
    );

  const unmapped =
    mapped.filter(
      (row) =>
        !row.fee_group
    );

  console.log("");
  console.log("---------------------------------------");
  console.log("MAPPING SUMMARY");
  console.log("---------------------------------------");

  console.table([
    {
      type: "Normal fee branches",
      count: normalBranches.length
    },
    {
      type: "Fee-waiver branches",
      count: feeWaiverBranches.length
    },
    {
      type: "Unmapped branches",
      count: unmapped.length
    },
    {
      type: "Total DB branches",
      count: mapped.length
    }
  ]);

  console.log("");

  if (unmapped.length > 0) {
    console.log("WARNING: UNMAPPED BRANCHES FOUND");

    console.table(unmapped);

    process.exitCode = 1;
  } else {
    console.log("BRANCH MAPPING CHECK: PASS");
  }

  console.log("");
  console.log(
    "Normal branches are ready for branch-specific fee preview."
  );

  console.log(
    "FW branches intentionally held for separate fee-waiver handling."
  );

  console.log("");
  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );

  await pool.end();
}

main().catch(async (error) => {
  console.error(
    "FAILED:",
    error.message
  );

  try {
    await pool.end();
  } catch {}

  process.exitCode = 1;
});
