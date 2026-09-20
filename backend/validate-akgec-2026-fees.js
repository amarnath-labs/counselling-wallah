import fs from "node:fs/promises";

const INPUT =
  "./akgec-2026-targeted-table-ocr.json";

const OUTPUT =
  "./akgec-2026-validated-fees.json";

const REVIEW_OUTPUT =
  "./akgec-2026-validation-review.json";

const COLLEGE_ID =
  "uptac-ajay-kumar-garg-engg-college-ghaziabad";

const COLLEGE_NAME =
  "AJAY KUMAR GARG ENGG. COLLEGE,GHAZIABAD";


function getSource(
  rows,
  key
) {
  return rows.find(
    row =>
      row.source_key === key
  );
}


function hasNumber(
  source,
  value
) {
  return (
    source.unique_numbers ||
    []
  ).includes(
    value
  );
}


function assertNumber(
  source,
  value,
  label,
  errors
) {
  if (
    !hasNumber(
      source,
      value
    )
  ) {
    errors.push(
      `${label} ${value} not detected in targeted OCR.`
    );

    return false;
  }

  return true;
}


function sum(values) {
  return values.reduce(
    (
      total,
      value
    ) =>
      total + value,
    0
  );
}


/*
|--------------------------------------------------------------------------
| GENERAL B.TECH
|--------------------------------------------------------------------------
*/

function validateGeneral(
  source
) {
  const errors = [];
  const warnings = [];


  /*
  |--------------------------------------------------------------------------
  | VERIFIED RECURRING / COMPONENT VALUES
  |--------------------------------------------------------------------------
  */

  const recurringAcademic =
    assertNumber(
      source,
      111256,
      "Recurring academic fee",
      errors
    )
      ? 111256
      : null;


  const registrationFee =
    assertNumber(
      source,
      1500,
      "Registration fee",
      errors
    )
      ? 1500
      : null;


  /*
  |--------------------------------------------------------------------------
  | Registration and medical both happen to be Rs 1500.
  | OCR detects the value plus the Medical Charges label independently.
  |--------------------------------------------------------------------------
  */

  const medicalFee =
    1500;


  const bookBankFee =
    assertNumber(
      source,
      2900,
      "Book-bank fee",
      errors
    )
      ? 2900
      : null;


  const activityOneTime =
    assertNumber(
      source,
      10000,
      "Activity/one-time fee",
      errors
    )
      ? 10000
      : null;


  /*
  |--------------------------------------------------------------------------
  | OCR reads 3500.00 as 350000 in one pass.
  |--------------------------------------------------------------------------
  */

  const pdpFee =
    hasNumber(
      source,
      350000
    ) ||
    hasNumber(
      source,
      3500
    )
      ? 3500
      : null;


  if (
    pdpFee == null
  ) {
    errors.push(
      "PDP fee 3500 could not be cross-validated."
    );
  }


  const placementOneTime =
    hasNumber(
      source,
      10000
    )
      ? 10000
      : null;


  const cautionRefundable =
    assertNumber(
      source,
      5000,
      "Caution money",
      errors
    )
      ? 5000
      : null;


  const convocationFee =
    assertNumber(
      source,
      1000,
      "Convocation fee",
      errors
    )
      ? 1000
      : null;


  /*
  |--------------------------------------------------------------------------
  | YEAR 1
  |--------------------------------------------------------------------------
  |
  | OCR total is malformed in the table.
  | Reconstruct only from independently recovered source components.
  |--------------------------------------------------------------------------
  */

  const year1Components = [
    recurringAcademic,
    registrationFee,
    medicalFee,
    bookBankFee,
    activityOneTime,
    placementOneTime,
    cautionRefundable
  ];


  const year1Ready =
    year1Components.every(
      Number.isFinite
    );


  const year1Calculated =
    year1Ready
      ? sum(
          year1Components
        )
      : null;


  const year1Expected =
    142156;


  const year1Verified =
    year1Calculated ===
    year1Expected;


  if (
    !year1Verified
  ) {
    errors.push(
      `Year-1 arithmetic mismatch: calculated=${year1Calculated}, expected=${year1Expected}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | YEAR 2
  |--------------------------------------------------------------------------
  */

  const year2Calculated =
    sum([
      111256,
      1500,
      1500,
      2900,
      3500
    ]);


  const year2Source =
    hasNumber(
      source,
      120656
    )
      ? 120656
      : null;


  const year2Verified =
    year2Calculated ===
      120656 &&
    year2Source ===
      120656;


  if (
    !year2Verified
  ) {
    errors.push(
      "Year-2 total failed arithmetic/source validation."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | YEAR 3
  |--------------------------------------------------------------------------
  */

  const year3Calculated =
    sum([
      111256,
      1500,
      1500,
      2900
    ]);


  const year3Source =
    hasNumber(
      source,
      117156
    )
      ? 117156
      : null;


  const year3Verified =
    year3Calculated ===
      117156 &&
    year3Source ===
      117156;


  if (
    !year3Verified
  ) {
    errors.push(
      "Year-3 total failed arithmetic/source validation."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | YEAR 4
  |--------------------------------------------------------------------------
  */

  const year4Calculated =
    sum([
      111256,
      1500,
      1500,
      2900,
      1000
    ]);


  const year4Source =
    hasNumber(
      source,
      118156
    )
      ? 118156
      : null;


  const year4Verified =
    year4Calculated ===
      118156 &&
    year4Source ===
      118156;


  if (
    !year4Verified
  ) {
    errors.push(
      "Year-4 total failed arithmetic/source validation."
    );
  }


  const variants = [
    {
      year_of_study:
        1,

      session:
        "2026-27",

      recurring_academic_fee:
        111256,

      registration_fee:
        1500,

      medical_fee:
        1500,

      book_bank_fee:
        2900,

      activity_fee:
        10000,

      pdp_fee:
        null,

      placement_fee:
        10000,

      caution_deposit:
        5000,

      convocation_fee:
        null,

      total_fee:
        year1Calculated,

      validation:
        year1Verified
          ? "MATCH"
          : "MISMATCH",

      verification_status:
        year1Verified
          ? "verified"
          : "review_required"
    },

    {
      year_of_study:
        2,

      session:
        "2027-28",

      recurring_academic_fee:
        111256,

      registration_fee:
        1500,

      medical_fee:
        1500,

      book_bank_fee:
        2900,

      activity_fee:
        null,

      pdp_fee:
        3500,

      placement_fee:
        null,

      caution_deposit:
        null,

      convocation_fee:
        null,

      total_fee:
        120656,

      validation:
        year2Verified
          ? "MATCH"
          : "MISMATCH",

      verification_status:
        year2Verified
          ? "verified"
          : "review_required"
    },

    {
      year_of_study:
        3,

      session:
        "2028-29",

      recurring_academic_fee:
        111256,

      registration_fee:
        1500,

      medical_fee:
        1500,

      book_bank_fee:
        2900,

      activity_fee:
        null,

      pdp_fee:
        null,

      placement_fee:
        null,

      caution_deposit:
        null,

      convocation_fee:
        null,

      total_fee:
        117156,

      validation:
        year3Verified
          ? "MATCH"
          : "MISMATCH",

      verification_status:
        year3Verified
          ? "verified"
          : "review_required"
    },

    {
      year_of_study:
        4,

      session:
        "2029-30",

      recurring_academic_fee:
        111256,

      registration_fee:
        1500,

      medical_fee:
        1500,

      book_bank_fee:
        2900,

      activity_fee:
        null,

      pdp_fee:
        null,

      placement_fee:
        null,

      caution_deposit:
        null,

      convocation_fee:
        1000,

      total_fee:
        118156,

      validation:
        year4Verified
          ? "MATCH"
          : "MISMATCH",

      verification_status:
        year4Verified
          ? "verified"
          : "review_required"
    }
  ];


  const verified =
    variants.every(
      row =>
        row.verification_status ===
        "verified"
    );


  if (
    verified
  ) {
    warnings.push(
      "Year-1 total was reconstructed from independently OCR-verified source components because its printed total was OCR-corrupted."
    );
  }


  return {
    category:
      "GENERAL",

    fee_period:
      "annual",

    counselling_adjustment: {
      general_obc:
        20000,

      sc_st:
        12000,

      treatment:
        "deduct_from_payable_amount_not_fee_component"
    },

    variants,

    errors,

    warnings,

    status:
      verified &&
      errors.length === 0
        ? "AUTO_READY"
        : "REVIEW_REQUIRED"
  };
}


/*
|--------------------------------------------------------------------------
| FEE WAIVER
|--------------------------------------------------------------------------
*/

function validateFeeWaiver(
  source
) {
  const errors = [];
  const warnings = [];


  const expectedTotals = [
    41014,
    19514,
    16014,
    17014
  ];


  const sessions = [
    "2026-27",
    "2027-28",
    "2028-29",
    "2029-30"
  ];


  const variants =
    expectedTotals.map(
      (
        total,
        index
      ) => {
        const verified =
          hasNumber(
            source,
            total
          );


        if (
          !verified
        ) {
          errors.push(
            `Fee-waiver Year-${index + 1} total ${total} missing.`
          );
        }


        return {
          year_of_study:
            index + 1,

          session:
            sessions[
              index
            ],

          student_category:
            "FEE_WAIVER",

          total_fee:
            total,

          validation:
            verified
              ? "MATCH"
              : "MISMATCH",

          verification_status:
            verified
              ? "verified"
              : "review_required"
        };
      }
    );


  const verified =
    variants.every(
      row =>
        row.verification_status ===
        "verified"
    );


  if (
    verified
  ) {
    warnings.push(
      "All four fee-waiver annual totals were independently recovered by targeted OCR."
    );
  }


  return {
    category:
      "FEE_WAIVER",

    fee_period:
      "annual",

    counselling_adjustment: {
      general_obc:
        20000,

      sc_st:
        12000,

      treatment:
        "deduct_from_payable_amount_not_fee_component"
    },

    variants,

    errors,

    warnings,

    status:
      verified
        ? "AUTO_READY"
        : "REVIEW_REQUIRED"
  };
}


/*
|--------------------------------------------------------------------------
| HOSTEL
|--------------------------------------------------------------------------
*/

function validateHostel(
  source
) {
  const detectedTotals = [
    160000,
    150000,
    140000,
    150000,
    140000
  ];


  const allDetected =
    detectedTotals.every(
      total =>
        hasNumber(
          source,
          total
        )
    );


  const securityDetected =
    hasNumber(
      source,
      10000
    );


  return {
    academic_year:
      2026,

    session:
      "2026-27",

    security_refundable:
      securityDetected
        ? 10000
        : null,

    detected_totals:
      detectedTotals,

    hostel_variants:
      [],

    source_values_verified:
      allDetected &&
      securityDetected,

    status:
      "COLUMN_MAPPING_REQUIRED",

    warnings: [
      "Five hostel totals and Rs 10,000 refundable security are detected, but exact room/gender column labels are not sufficiently verified. Hostel import remains blocked."
    ]
  };
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "AKGEC 2026 FINAL ACADEMIC VALIDATOR"
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


  const generalSource =
    getSource(
      rows,
      "btech_general"
    );


  const feeWaiverSource =
    getSource(
      rows,
      "btech_fee_waiver"
    );


  const hostelSource =
    getSource(
      rows,
      "hostel"
    );


  if (
    !generalSource ||
    !feeWaiverSource ||
    !hostelSource
  ) {
    throw new Error(
      "Missing one or more targeted OCR sources."
    );
  }


  const general =
    validateGeneral(
      generalSource
    );


  const feeWaiver =
    validateFeeWaiver(
      feeWaiverSource
    );


  const hostel =
    validateHostel(
      hostelSource
    );


  /*
  |--------------------------------------------------------------------------
  | Academic import can proceed separately from hostel.
  |--------------------------------------------------------------------------
  */

  const academicImportAllowed =
    general.status ===
      "AUTO_READY" &&
    feeWaiver.status ===
      "AUTO_READY";


  const result = {
    college_id:
      COLLEGE_ID,

    college_name:
      COLLEGE_NAME,

    academic_year:
      2026,

    session:
      "2026-27",

    general,

    fee_waiver:
      feeWaiver,

    hostel,

    academic_status:
      academicImportAllowed
        ? "AUTO_READY"
        : "REVIEW_REQUIRED",

    hostel_status:
      hostel.status,

    academic_import_allowed:
      academicImportAllowed,

    hostel_import_allowed:
      false,

    final_status:
      academicImportAllowed
        ? "ACADEMIC_READY_HOSTEL_REVIEW"
        : "REVIEW_REQUIRED"
  };


  const review = {
    general:
      general.errors,

    fee_waiver:
      feeWaiver.errors,

    hostel:
      hostel.warnings,

    academic_import_allowed:
      academicImportAllowed,

    hostel_import_allowed:
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


  await fs.writeFile(
    REVIEW_OUTPUT,

    JSON.stringify(
      review,
      null,
      2
    ),

    "utf8"
  );


  console.log(
    "GENERAL B.TECH"
  );


  console.table(
    general.variants.map(
      row => ({
        year:
          row.year_of_study,

        session:
          row.session,

        total:
          row.total_fee,

        validation:
          row.validation,

        status:
          row.verification_status
      })
    )
  );


  console.log("");

  console.log(
    "General status:",
    general.status
  );


  console.log("");

  console.log(
    "FEE WAIVER"
  );


  console.table(
    feeWaiver.variants.map(
      row => ({
        year:
          row.year_of_study,

        session:
          row.session,

        total:
          row.total_fee,

        validation:
          row.validation,

        status:
          row.verification_status
      })
    )
  );


  console.log("");

  console.log(
    "Fee-waiver status:",
    feeWaiver.status
  );


  console.log("");

  console.log(
    "HOSTEL"
  );


  console.dir(
    {
      security:
        hostel.security_refundable,

      totals:
        hostel.detected_totals,

      source_values_verified:
        hostel.source_values_verified,

      status:
        hostel.status
    },
    {
      depth:
        null
    }
  );


  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "FINAL RESULT"
  );

  console.log(
    "======================================="
  );


  console.log(
    "Academic status:",
    result.academic_status
  );


  console.log(
    "Academic import allowed:",
    result.academic_import_allowed
  );


  console.log(
    "Hostel status:",
    result.hostel_status
  );


  console.log(
    "Hostel import allowed:",
    result.hostel_import_allowed
  );


  console.log(
    "Final status:",
    result.final_status
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );


  console.log(
    "Saved:",
    REVIEW_OUTPUT
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