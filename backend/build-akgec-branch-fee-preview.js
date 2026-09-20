import fs from "node:fs/promises";

const INPUT =
  "./akgec-2026-validated-fees.json";

const OUTPUT =
  "./akgec-2026-branch-fee-preview.json";

const COLLEGE_ID =
  "uptac-ajay-kumar-garg-engg-college-ghaziabad";

const COLLEGE_NAME =
  "AJAY KUMAR GARG ENGG. COLLEGE,GHAZIABAD";


const NORMAL_BRANCHES = [
  ["1352", "Artificial Intelligence And Machine Learning"],
  ["1479", "Civil Engineering"],
  ["1200", "Computer Science"],
  ["1493", "Computer Science (Hindi)"],
  ["1354", "Computer Science and Engineering"],
  ["1568", "Computer Science And Engineering(Artificial Intelligence & Machine Learning)"],
  ["1192", "Computer Science And Engineering(Data Science)"],
  ["1795", "Computer Science Information Technology"],
  ["1709", "Electrical & Electronics Engineering"],
  ["1870", "Electronics and Communication Engineering"],
  ["1199", "Information Technology"],
  ["1290", "Mechanical Engineering"]
];


const FW_BRANCHES = [
  ["1371", "Artificial Intelligence And Machine Learning (FW)"],
  ["1342", "Civil Engineering (FW)"],
  ["1383", "Computer Science (FW)"],
  ["1335", "Computer Science (Hindi) (FW)"],
  ["1583", "Computer Science and Engineering (FW)"],
  ["1877", "Computer Science And Engineering(Artificial Intelligence & Machine Learning) (FW)"],
  ["1631", "Computer Science And Engineering(Data Science) (FW)"],
  ["1758", "Computer Science Information Technology (FW)"],
  ["1656", "Electrical & Electronics Engineering (FW)"],
  ["1803", "Electronics and Communication Engineering (FW)"],
  ["1912", "Information Technology (FW)"],
  ["1952", "Mechanical Engineering (FW)"]
];


function buildMaster(
  branchId,
  branchName,
  sourceUrl
) {
  return {
    college_id:
      COLLEGE_ID,

    branch_id:
      branchId,

    branch_name:
      branchName,

    program:
      "B.Tech",

    fee_scope:
      "branch_specific",

    academic_year:
      2026,

    source_label:
      "AKGEC Official Fee Structure 2026-27",

    source_url:
      sourceUrl,

    verification_status:
      "verified"
  };
}


function mapGeneralVariant(
  row
) {
  return {
    semester:
      null,

    year_of_study:
      row.year_of_study,

    fee_period:
      "annual",

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
      row.recurring_academic_fee ??
      null,

    admission_fee:
      row.registration_fee ??
      null,

    institute_fee:
      (
        (row.medical_fee || 0) +
        (row.book_bank_fee || 0) +
        (row.activity_fee || 0) +
        (row.pdp_fee || 0) +
        (row.placement_fee || 0) +
        (row.convocation_fee || 0)
      ) || null,

    hostel_fee:
      null,

    mess_fee:
      null,

    caution_deposit:
      row.caution_deposit ??
      null,

    other_fee:
      null,

    total_fee:
      row.total_fee,

    is_one_time_included:
      Boolean(
        row.activity_fee ||
        row.placement_fee ||
        row.caution_deposit
      ),

    verification_status:
      "verified"
  };
}


function mapFwVariant(
  row
) {
  return {
    semester:
      null,

    year_of_study:
      row.year_of_study,

    fee_period:
      "annual",

    student_category:
      "FEE_WAIVER",

    income_min:
      null,

    income_max:
      null,

    residence_type:
      "day_scholar",

    room_type:
      null,

    tuition_fee:
      null,

    admission_fee:
      null,

    institute_fee:
      null,

    hostel_fee:
      null,

    mess_fee:
      null,

    caution_deposit:
      null,

    other_fee:
      null,

    total_fee:
      row.total_fee,

    is_one_time_included:
      true,

    verification_status:
      "verified"
  };
}


async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "AKGEC BRANCH FEE PREVIEW GENERATOR"
  );

  console.log(
    "======================================="
  );

  console.log("");


  const raw =
    await fs.readFile(
      INPUT,
      "utf8"
    );


  const data =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ""
      )
    );


  if (
    data.academic_import_allowed !==
    true
  ) {
    throw new Error(
      "AKGEC academic fees are not approved for import."
    );
  }


  if (
    data.general?.status !==
    "AUTO_READY"
  ) {
    throw new Error(
      "General fee schedule is not AUTO_READY."
    );
  }


  if (
    data.fee_waiver?.status !==
    "AUTO_READY"
  ) {
    throw new Error(
      "Fee-waiver schedule is not AUTO_READY."
    );
  }


  const generalSourceUrl =
    "https://www.akgec.ac.in/wp-content/uploads/2026/06/B-Tech-Ist-Year-2026-27_0001.pdf";


  const fwSourceUrl =
    "https://www.akgec.ac.in/wp-content/uploads/2026/06/B-Tech-Ist-Year-FW-2026-27_0001.pdf";


  const previews = [];


  for (
    const [
      branchId,
      branchName
    ]
    of NORMAL_BRANCHES
  ) {
    previews.push({
      college_id:
        COLLEGE_ID,

      college_name:
        COLLEGE_NAME,

      fee_category:
        "GENERAL",

      branch_fee:
        buildMaster(
          branchId,
          branchName,
          generalSourceUrl
        ),

      fee_variants:
        data.general.variants.map(
          mapGeneralVariant
        ),

      preview_status:
        "FINAL_READY_FOR_IMPORT"
    });
  }


  for (
    const [
      branchId,
      branchName
    ]
    of FW_BRANCHES
  ) {
    previews.push({
      college_id:
        COLLEGE_ID,

      college_name:
        COLLEGE_NAME,

      fee_category:
        "FEE_WAIVER",

      branch_fee:
        buildMaster(
          branchId,
          branchName,
          fwSourceUrl
        ),

      fee_variants:
        data.fee_waiver.variants.map(
          mapFwVariant
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
      row => ({
        branch_id:
          row.branch_fee.branch_id,

        branch:
          row.branch_fee.branch_name,

        category:
          row.fee_category,

        scope:
          row.branch_fee.fee_scope,

        variants:
          row.fee_variants.length,

        status:
          row.preview_status
      })
    )
  );


  console.log("");

  console.log(
    "Normal branches:",
    NORMAL_BRANCHES.length
  );


  console.log(
    "FW branches:",
    FW_BRANCHES.length
  );


  console.log(
    "Total branches:",
    previews.length
  );


  console.log(
    "Total variants:",
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
    "Hostel fees intentionally excluded."
  );


  console.log(
    "Saved:",
    OUTPUT
  );


  console.log("");

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

    process.exitCode =
      1;
  }
);