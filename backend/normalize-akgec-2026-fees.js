import fs from "node:fs/promises";

const INPUT =
  "./akgec-2026-pdf-extraction.json";

const OUTPUT =
  "./akgec-2026-normalized-preview.json";

const REVIEW_OUTPUT =
  "./akgec-2026-normalization-review.json";

const COLLEGE_ID =
  "uptac-ajay-kumar-garg-engg-college-ghaziabad";

const COLLEGE_NAME =
  "AJAY KUMAR GARG ENGG. COLLEGE,GHAZIABAD";


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function clean(value) {
  return String(
    value ?? ""
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}


function normalizeLine(value) {
  return clean(value)
    .replace(/[|[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function linesFromText(text) {
  return String(
    text ?? ""
  )
    .split(/\n/)
    .map(normalizeLine)
    .filter(Boolean);
}


function numericCandidates(value) {
  const matches =
    String(
      value ?? ""
    ).match(
      /\d[\d,.]*/g
    ) || [];

  const output = [];

  for (
    const match
    of matches
  ) {
    const cleaned =
      match
        .replace(/,/g, "")
        .replace(/\.$/, "");

    const number =
      Number(cleaned);

    if (
      !Number.isFinite(number)
    ) {
      continue;
    }

    output.push(number);
  }

  return output;
}


function plausibleFee(value) {
  return (
    Number.isFinite(value) &&
    value >= 500 &&
    value <= 500000
  );
}


function suspiciousFee(value) {
  if (
    !Number.isFinite(value)
  ) {
    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | Reject obvious years
  |--------------------------------------------------------------------------
  */

  if (
    value >= 2000 &&
    value <= 2100
  ) {
    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | Reject PIN/address/account-like large values
  |--------------------------------------------------------------------------
  */

  if (
    value > 500000
  ) {
    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | Fee tables should normally be whole rupees.
  |--------------------------------------------------------------------------
  */

  if (
    !Number.isInteger(value)
  ) {
    return true;
  }

  return false;
}


function findLine(
  lines,
  regex
) {
  return (
    lines.find(
      line =>
        regex.test(line)
    ) ||
    null
  );
}


function findLines(
  lines,
  regex
) {
  return lines.filter(
    line =>
      regex.test(line)
  );
}


function contextAround(
  lines,
  regex,
  before = 2,
  after = 4
) {
  const index =
    lines.findIndex(
      line =>
        regex.test(line)
    );

  if (
    index < 0
  ) {
    return [];
  }

  return lines.slice(
    Math.max(
      0,
      index - before
    ),

    Math.min(
      lines.length,
      index + after + 1
    )
  );
}


function uniqueNumbers(values) {
  return [
    ...new Set(
      values.filter(
        Number.isFinite
      )
    )
  ];
}


/*
|--------------------------------------------------------------------------
| SOURCE LOOKUP
|--------------------------------------------------------------------------
*/

function getSource(
  rows,
  key
) {
  return rows.find(
    row =>
      row.source_key ===
      key
  );
}


/*
|--------------------------------------------------------------------------
| EVIDENCE EXTRACTION
|--------------------------------------------------------------------------
*/

function buildEvidence(
  source
) {
  const lines =
    linesFromText(
      source.text
    );

  const feeLines =
    lines.filter(
      line =>
        /fee|charges|money|total|year|hostel|seater|placement|activity|convocation/i.test(
          line
        )
    );

  const values =
    uniqueNumbers(
      feeLines.flatMap(
        numericCandidates
      )
    );

  const plausible =
    values.filter(
      plausibleFee
    );

  const suspicious =
    values.filter(
      suspiciousFee
    );

  return {
    lines,
    fee_lines:
      feeLines,

    plausible_numbers:
      plausible,

    suspicious_numbers:
      suspicious
  };
}


/*
|--------------------------------------------------------------------------
| GENERAL BTECH
|--------------------------------------------------------------------------
*/

function normalizeGeneral(
  source
) {
  const evidence =
    buildEvidence(
      source
    );

  const lines =
    evidence.lines;

  const errors = [];
  const warnings = [];

  /*
  |--------------------------------------------------------------------------
  | Structural validation
  |--------------------------------------------------------------------------
  */

  if (
    !findLine(
      lines,
      /academic year 2026-27/i
    )
  ) {
    errors.push(
      "Academic year 2026-27 not clearly detected."
    );
  }

  if (
    !findLine(
      lines,
      /4 year b\.?tech course/i
    )
  ) {
    errors.push(
      "Four-year B.Tech fee structure heading not clearly detected."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Reliable explicitly-readable components
  |--------------------------------------------------------------------------
  */

  const placementContext =
    contextAround(
      lines,
      /career planning.*placement/i,
      1,
      2
    );

  const placementNumbers =
    placementContext
      .flatMap(
        numericCandidates
      )
      .filter(
        plausibleFee
      );

  const careerPlanningPlacementFee =
    placementNumbers.includes(
      10000
    )
      ? 10000
      : null;


  /*
  |--------------------------------------------------------------------------
  | Counselling adjustment is NOT a fee component.
  |--------------------------------------------------------------------------
  */

  const counsellingLine =
    findLine(
      lines,
      /counselling centre/i
    );

  const counsellingNumbers =
    counsellingLine
      ? numericCandidates(
          counsellingLine
        )
      : [];

  const counsellingAdjustment = {
    general_obc:
      counsellingNumbers.includes(
        20000
      )
        ? 20000
        : null,

    sc_st:
      counsellingNumbers.includes(
        12000
      )
        ? 12000
        : null
  };


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  |
  | OCR destroyed the main four-year table badly.
  | We intentionally DO NOT infer totals from malformed tokens.
  |--------------------------------------------------------------------------
  */

  const totalContext =
    contextAround(
      lines,
      /tst year|1st year/i,
      2,
      12
    );

  const rawTotalCandidates =
    uniqueNumbers(
      totalContext.flatMap(
        numericCandidates
      )
    );

  const safeTotalCandidates =
    rawTotalCandidates.filter(
      value =>
        plausibleFee(value) &&
        !suspiciousFee(value)
    );


  /*
  |--------------------------------------------------------------------------
  | Until exactly four year totals can be independently reconstructed,
  | do not mark academic schedule ready.
  |--------------------------------------------------------------------------
  */

  if (
    safeTotalCandidates.length < 4
  ) {
    warnings.push(
      "Four annual B.Tech totals could not be safely reconstructed from OCR."
    );
  }

  return {
    category:
      "GENERAL",

    source_key:
      source.source_key,

    source_url:
      source.source_url,

    academic_year:
      2026,

    program:
      "B.Tech",

    duration_years:
      4,

    known_components: {
      career_planning_placement_one_time:
        careerPlanningPlacementFee
    },

    counselling_adjustment:
      counsellingAdjustment,

    year_fee_variants:
      [],

    raw_table_context:
      totalContext,

    safe_total_candidates:
      safeTotalCandidates,

    suspicious_numbers:
      evidence.suspicious_numbers,

    normalization_status:
      errors.length > 0
        ? "REVIEW_REQUIRED"
        : "TABLE_RECONSTRUCTION_REQUIRED",

    errors,

    warnings
  };
}


/*
|--------------------------------------------------------------------------
| FEE WAIVER
|--------------------------------------------------------------------------
*/

function normalizeFeeWaiver(
  source
) {
  const evidence =
    buildEvidence(
      source
    );

  const lines =
    evidence.lines;

  const errors = [];
  const warnings = [];

  if (
    !findLine(
      lines,
      /fee waiver scheme/i
    )
  ) {
    errors.push(
      "Fee-waiver heading not clearly detected."
    );
  }

  if (
    !findLine(
      lines,
      /academic year 2026-27/i
    )
  ) {
    errors.push(
      "Academic year 2026-27 not clearly detected."
    );
  }


  const placementContext =
    contextAround(
      lines,
      /career planning.*placement/i,
      1,
      2
    );

  const placementNumbers =
    placementContext
      .flatMap(
        numericCandidates
      )
      .filter(
        plausibleFee
      );

  const careerPlanningPlacementFee =
    placementNumbers.includes(
      10000
    )
      ? 10000
      : null;


  const counsellingLine =
    findLine(
      lines,
      /counselling centre/i
    );

  const counsellingNumbers =
    counsellingLine
      ? numericCandidates(
          counsellingLine
        )
      : [];


  /*
  |--------------------------------------------------------------------------
  | OCR has values such as 17014.09.
  | Decimals and malformed totals are quarantined.
  |--------------------------------------------------------------------------
  */

  const suspiciousNumbers =
    uniqueNumbers(
      evidence.suspicious_numbers
    );

  if (
    suspiciousNumbers.length > 0
  ) {
    warnings.push(
      "Suspicious OCR numeric values detected in fee-waiver source."
    );
  }


  return {
    category:
      "FEE_WAIVER",

    source_key:
      source.source_key,

    source_url:
      source.source_url,

    academic_year:
      2026,

    program:
      "B.Tech",

    duration_years:
      4,

    known_components: {
      career_planning_placement_one_time:
        careerPlanningPlacementFee
    },

    counselling_adjustment: {
      general_obc:
        counsellingNumbers.includes(
          20000
        )
          ? 20000
          : null,

      sc_st:
        counsellingNumbers.includes(
          12000
        )
          ? 12000
          : null
    },

    year_fee_variants:
      [],

    suspicious_numbers:
      suspiciousNumbers,

    normalization_status:
      errors.length > 0
        ? "REVIEW_REQUIRED"
        : "TABLE_RECONSTRUCTION_REQUIRED",

    errors,

    warnings
  };
}


/*
|--------------------------------------------------------------------------
| HOSTEL
|--------------------------------------------------------------------------
*/

function normalizeHostel(
  source
) {
  const evidence =
    buildEvidence(
      source
    );

  const lines =
    evidence.lines;

  const errors = [];
  const warnings = [];

  if (
    !findLine(
      lines,
      /hostel fee.*2026-27/i
    )
  ) {
    errors.push(
      "Hostel 2026-27 heading not clearly detected."
    );
  }

  const roomLine =
    findLine(
      lines,
      /seater/i
    );

  /*
  |--------------------------------------------------------------------------
  | OCR detects room labels but not their corresponding amounts reliably.
  |--------------------------------------------------------------------------
  */

  const roomTypes = [];

  if (
    roomLine
  ) {
    if (
      /single/i.test(
        roomLine
      )
    ) {
      roomTypes.push(
        "single_seater"
      );
    }

    if (
      /double/i.test(
        roomLine
      )
    ) {
      roomTypes.push(
        "double_seater"
      );
    }

    if (
      /triple/i.test(
        roomLine
      )
    ) {
      roomTypes.push(
        "triple_seater"
      );
    }
  }

  warnings.push(
    "Room-wise hostel amounts were not reliably recovered by OCR."
  );

  return {
    source_key:
      source.source_key,

    source_url:
      source.source_url,

    academic_year:
      2026,

    available:
      true,

    room_types_detected:
      [
        ...new Set(
          roomTypes
        )
      ],

    hostel_variants:
      [],

    normalization_status:
      errors.length > 0
        ? "REVIEW_REQUIRED"
        : "TABLE_RECONSTRUCTION_REQUIRED",

    errors,

    warnings
  };
}


/*
|--------------------------------------------------------------------------
| MAIN VALIDATION
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "AKGEC 2026 STRICT FEE NORMALIZER"
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


  const general =
    getSource(
      rows,
      "btech_general"
    );

  const feeWaiver =
    getSource(
      rows,
      "btech_fee_waiver"
    );

  const hostel =
    getSource(
      rows,
      "hostel"
    );


  if (
    !general ||
    !feeWaiver ||
    !hostel
  ) {
    throw new Error(
      "Expected General, Fee Waiver and Hostel source records."
    );
  }


  for (
    const source
    of [
      general,
      feeWaiver,
      hostel
    ]
  ) {
    if (
      source.status !==
      "EXTRACTED"
    ) {
      throw new Error(
        `${source.source_key} is not EXTRACTED.`
      );
    }
  }


  const normalizedGeneral =
    normalizeGeneral(
      general
    );

  const normalizedFeeWaiver =
    normalizeFeeWaiver(
      feeWaiver
    );

  const normalizedHostel =
    normalizeHostel(
      hostel
    );


  const preview = {
    college_id:
      COLLEGE_ID,

    college_name:
      COLLEGE_NAME,

    academic_year:
      2026,

    session:
      "2026-27",

    official_sources: {
      general:
        general.source_url,

      fee_waiver:
        feeWaiver.source_url,

      hostel:
        hostel.source_url
    },

    academic: [
      normalizedGeneral,
      normalizedFeeWaiver
    ],

    hostel:
      normalizedHostel,

    final_status:
      "REVIEW_REQUIRED_BEFORE_IMPORT"
  };


  /*
  |--------------------------------------------------------------------------
  | REVIEW QUEUE
  |--------------------------------------------------------------------------
  */

  const review = [];


  for (
    const row
    of preview.academic
  ) {
    if (
      row.normalization_status !==
      "AUTO_READY"
    ) {
      review.push({
        section:
          row.category,

        status:
          row.normalization_status,

        errors:
          row.errors,

        warnings:
          row.warnings,

        suspicious_numbers:
          row.suspicious_numbers ||
          []
      });
    }
  }


  if (
    preview.hostel
      .normalization_status !==
    "AUTO_READY"
  ) {
    review.push({
      section:
        "HOSTEL",

      status:
        preview.hostel
          .normalization_status,

      errors:
        preview.hostel
          .errors,

      warnings:
        preview.hostel
          .warnings
    });
  }


  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      preview,
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
    "NORMALIZATION SUMMARY"
  );


  console.table([
    {
      section:
        "GENERAL",

      status:
        normalizedGeneral
          .normalization_status,

      variants:
        normalizedGeneral
          .year_fee_variants
          .length,

      warnings:
        normalizedGeneral
          .warnings
          .length
    },

    {
      section:
        "FEE_WAIVER",

      status:
        normalizedFeeWaiver
          .normalization_status,

      variants:
        normalizedFeeWaiver
          .year_fee_variants
          .length,

      warnings:
        normalizedFeeWaiver
          .warnings
          .length
    },

    {
      section:
        "HOSTEL",

      status:
        normalizedHostel
          .normalization_status,

      variants:
        normalizedHostel
          .hostel_variants
          .length,

      warnings:
        normalizedHostel
          .warnings
          .length
    }
  ]);


  console.log("");

  console.log(
    "GENERAL KNOWN VALUES"
  );

  console.dir(
    {
      known_components:
        normalizedGeneral
          .known_components,

      counselling_adjustment:
        normalizedGeneral
          .counselling_adjustment,

      safe_total_candidates:
        normalizedGeneral
          .safe_total_candidates
    },
    {
      depth:
        null
    }
  );


  console.log("");

  console.log(
    "FEE WAIVER KNOWN VALUES"
  );

  console.dir(
    {
      known_components:
        normalizedFeeWaiver
          .known_components,

      counselling_adjustment:
        normalizedFeeWaiver
          .counselling_adjustment,

      suspicious_numbers:
        normalizedFeeWaiver
          .suspicious_numbers
    },
    {
      depth:
        null
    }
  );


  console.log("");

  console.log(
    "HOSTEL"
  );

  console.dir(
    {
      room_types:
        normalizedHostel
          .room_types_detected,

      status:
        normalizedHostel
          .normalization_status
    },
    {
      depth:
        null
    }
  );


  console.log("");

  console.log(
    "FINAL STATUS:",
    preview.final_status
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