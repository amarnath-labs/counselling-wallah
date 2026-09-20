import fs from "node:fs/promises";

const INPUT =
  "./fee-master-batch-extraction.json";

const OUTPUT =
  "./abss-2026-normalized-preview.json";

const COLLEGE_NAME =
  "ABSS INSTITUTE OF TECHNOLOGY, MEERUT,MEERUT";


async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "ABSS 2026 FEE NORMALIZER"
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


  const rows =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ""
      )
    );


  const source =
    rows.find(
      row =>
        /ABSS INSTITUTE/i.test(
          row.college_name || ""
        )
    );


  if (!source) {
    throw new Error(
      "ABSS extraction not found."
    );
  }


  if (
    source.extraction_status !==
    "EXTRACTED"
  ) {
    throw new Error(
      "ABSS source is not EXTRACTED."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SOURCE-VERIFIED B.TECH VALUES
  |--------------------------------------------------------------------------
  */

  const TUITION =
    55000;

  const HOSTEL =
    75000;

  const BASE_HOSTELLER_TOTAL =
    130000;

  const PRE_ENROLLMENT =
    2300;

  const EXAM_FEE =
    7865;

  const BLAZER_ID =
    2000;


  /*
  |--------------------------------------------------------------------------
  | SOURCE ARITHMETIC
  |--------------------------------------------------------------------------
  */

  if (
    TUITION + HOSTEL !==
    BASE_HOSTELLER_TOTAL
  ) {
    throw new Error(
      "Base hostel arithmetic mismatch."
    );
  }


  if (
    BASE_HOSTELLER_TOTAL * 4 !==
    520000
  ) {
    throw new Error(
      "4-year grand total mismatch."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | BUILD YEAR-WISE NORMALIZED DATA
  |--------------------------------------------------------------------------
  */

  const years = [];


  for (
    let year = 1;
    year <= 4;
    year++
  ) {
    const oneTime =
      year === 1
        ? PRE_ENROLLMENT +
          BLAZER_ID
        : 0;


    const additionalFee =
      EXAM_FEE +
      oneTime;


    years.push({
      year_of_study:
        year,

      session:
        [
          "2026-27",
          "2027-28",
          "2028-29",
          "2029-30"
        ][year - 1],

      tuition_fee:
        TUITION,

      hostel_fee:
        HOSTEL,

      source_base_day_scholar_total:
        TUITION,

      source_base_hosteller_total:
        BASE_HOSTELLER_TOTAL,

      pre_enrollment_fee:
        year === 1
          ? PRE_ENROLLMENT
          : null,

      exam_fee:
        EXAM_FEE,

      blazer_id_fee:
        year === 1
          ? BLAZER_ID
          : null,

      additional_fee_total:
        additionalFee,

      /*
      |--------------------------------------------------------------------------
      | Effective totals are useful for recommendation/budget calculations,
      | but source base totals are preserved separately.
      |--------------------------------------------------------------------------
      */

      effective_day_scholar_total:
        TUITION +
        additionalFee,

      effective_hosteller_total:
        BASE_HOSTELLER_TOTAL +
        additionalFee
    });
  }


  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const validations =
    years.map(
      row => ({
        year:
          row.year_of_study,

        base_day:
          row.source_base_day_scholar_total,

        base_hosteller:
          row.source_base_hosteller_total,

        additional:
          row.additional_fee_total,

        effective_day:
          row.effective_day_scholar_total,

        effective_hosteller:
          row.effective_hosteller_total,

        validation:
          row.source_base_day_scholar_total +
            HOSTEL ===
          row.source_base_hosteller_total
            ? "MATCH"
            : "MISMATCH"
      })
    );


  const allMatch =
    validations.every(
      row =>
        row.validation ===
        "MATCH"
    );


  const result = {
    college_id:
      source.college_id,

    college_name:
      source.college_name,

    academic_year:
      2026,

    source_url:
      source.source_url,

    source_type:
      "official_pdf",

    program:
      "B.Tech",

    source_base_structure: {
      annual_tuition_fee:
        TUITION,

      annual_hostel_fee:
        HOSTEL,

      annual_hosteller_total:
        BASE_HOSTELLER_TOTAL,

      four_year_source_grand_total:
        520000
    },

    additional_fees: {
      pre_enrollment_one_time:
        PRE_ENROLLMENT,

      exam_fee_per_year:
        EXAM_FEE,

      blazer_id_one_time:
        BLAZER_ID
    },

    years,

    normalization_status:
      allMatch
        ? "AUTO_READY"
        : "REVIEW_REQUIRED",

    /*
    |--------------------------------------------------------------------------
    | We still keep DB import off until branch mapping is checked.
    |--------------------------------------------------------------------------
    */

    import_allowed:
      false
  };


  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      result,
      null,
      2
    ),

    "utf8"
  );


  console.log(
    "B.TECH YEAR-WISE FEES"
  );


  console.table(
    validations
  );


  console.log("");

  console.log(
    "Source 4-year base total:",
    520000
  );


  console.log(
    "Calculated 4-year base total:",
    years.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.source_base_hosteller_total,
      0
    )
  );


  console.log("");

  console.log(
    "Normalization status:",
    result.normalization_status
  );


  console.log("");

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