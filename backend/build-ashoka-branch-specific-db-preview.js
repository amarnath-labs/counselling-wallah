import fs from "node:fs/promises";

const NORMALIZED_INPUT =
  "./fee-priority-normalized-preview.json";

const OUTPUT =
  "./ashoka-branch-specific-db-preview.json";

const COLLEGE_ID =
  "uptac-ashoka-institute-of-technology-management-varanasi";

const GROUP_1_BRANCHES = [
  {
    id: "1428",
    name: "Computer Science and Engineering"
  },
  {
    id: "1238",
    name: "Computer Science And Engineering(Artificial Intelligence & Machine Learning)"
  },
  {
    id: "1516",
    name: "Computer Science And Engineering(Data Science)"
  }
];

const GROUP_2_BRANCHES = [
  {
    id: "2598",
    name: "Biotechnology"
  },
  {
    id: "1972",
    name: "Civil Engineering"
  },
  {
    id: "1957",
    name: "Electrical Engineering"
  },
  {
    id: "1953",
    name: "Electronics and Communication Engineering"
  },
  {
    id: "2596",
    name: "Mechanical Engineering"
  }
];

function buildBranchFee({
  branch,
  normalized
}) {
  return {
    college_id:
      COLLEGE_ID,

    branch_id:
      branch.id,

    branch_name:
      branch.name,

    program:
      "B.Tech",

    fee_scope:
      "branch_specific",

    academic_year:
      normalized.academic_year,

    source_label:
      "Official Institute Fee Structure 2026-2027",

    source_url:
      normalized.source_url,

    verification_status:
      "verified"
  };
}

function buildVariant(
  source
) {
  return {
    semester:
      null,

    year_of_study:
      source.year_of_study,

    fee_period:
      source.fee_period,

    student_category:
      "GENERAL",

    income_min:
      null,

    income_max:
      null,

    residence_type:
      "day_scholar",

    room_type:
      null,

    tuition_fee:
      source.tuition_fee,

    admission_fee:
      source.registration_fee,

    institute_fee:
      source.institute_fee,

    hostel_fee:
      null,

    mess_fee:
      null,

    caution_deposit:
      source.caution_deposit,

    other_fee:
      source.training_placement_fee,

    total_fee:
      source.total_fee,

    is_one_time_included:
      source.is_one_time_included,

    verification_status:
      source.verification_status
  };
}

function getGroupVariants(
  normalized,
  groupLabel
) {
  return normalized.fee_variants
    .filter(
      row =>
        row.branch_group_label ===
        groupLabel
    )
    .map(
      buildVariant
    );
}

async function main() {
  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "ASHOKA BRANCH-SPECIFIC DB PREVIEW"
  );
  console.log(
    "======================================="
  );
  console.log("");

  const raw =
    await fs.readFile(
      NORMALIZED_INPUT,
      "utf8"
    );

  const rows =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ""
      )
    );

  const normalized =
    rows.find(
      row =>
        row.college_id ===
        COLLEGE_ID
    );

  if (!normalized) {
    throw new Error(
      "Ashoka normalized record not found."
    );
  }

  if (
    normalized.normalization_status !==
    "AUTO_READY"
  ) {
    throw new Error(
      "Ashoka normalized record is not AUTO_READY."
    );
  }

  const group1Label =
    "B.Tech - CSE / AI&ML / Data Science";

  const group2Label =
    "B.Tech - CE / EE / ECE / ME / Biotechnology";

  const group1Variants =
    getGroupVariants(
      normalized,
      group1Label
    );

  const group2Variants =
    getGroupVariants(
      normalized,
      group2Label
    );

  if (
    group1Variants.length !== 4
  ) {
    throw new Error(
      `Expected 4 Group-1 variants, found ${group1Variants.length}`
    );
  }

  if (
    group2Variants.length !== 4
  ) {
    throw new Error(
      `Expected 4 Group-2 variants, found ${group2Variants.length}`
    );
  }

  const previews = [];

  for (
    const branch
    of GROUP_1_BRANCHES
  ) {
    previews.push({
      college_id:
        COLLEGE_ID,

      college_name:
        normalized.college_name,

      branch_fee:
        buildBranchFee({
          branch,
          normalized
        }),

      fee_variants:
        structuredClone(
          group1Variants
        ),

      preview_status:
        "FINAL_READY_FOR_IMPORT"
    });
  }

  for (
    const branch
    of GROUP_2_BRANCHES
  ) {
    previews.push({
      college_id:
        COLLEGE_ID,

      college_name:
        normalized.college_name,

      branch_fee:
        buildBranchFee({
          branch,
          normalized
        }),

      fee_variants:
        structuredClone(
          group2Variants
        ),

      preview_status:
        "FINAL_READY_FOR_IMPORT"
    });
  }

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      previews,
      null,
      2
    ),

    "utf8"
  );

  console.table(
    previews.map(
      preview => ({
        branch_id:
          preview.branch_fee.branch_id,

        branch:
          preview.branch_fee.branch_name,

        scope:
          preview.branch_fee.fee_scope,

        year:
          preview.branch_fee.academic_year,

        variants:
          preview.fee_variants.length,

        status:
          preview.preview_status
      })
    )
  );

  console.log("");
  console.log(
    "Total branches:",
    previews.length
  );

  console.log(
    "Total fee variants:",
    previews.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.fee_variants.length,
      0
    )
  );

  console.log("");
  console.log(
    "Fee-waiver branches are intentionally excluded."
  );

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );
}

main().catch(
  error => {
    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode = 1;
  }
);
