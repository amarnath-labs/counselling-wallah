import fs from "node:fs";
import { spawnSync } from "node:child_process";

const inputFile = process.argv[2];

if (!inputFile) {
  console.error(
    "Usage: node import-fee-strict.js <fee-file.json>"
  );
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(
    "Input file not found:",
    inputFile
  );
  process.exit(1);
}


/*
|--------------------------------------------------------------------------
| STRICT FEE CONTRACT
|--------------------------------------------------------------------------
|
| tuition_fee_per_semester
|   ONLY tuition.
|
| academic_fee_per_semester
|   Academic/institute semester subtotal.
|   Can include tuition ONLY when source explicitly defines that subtotal.
|
| hostel_fee_per_semester
|   ONLY hostel/accommodation.
|
| mess_fee_per_semester
|   ONLY mess/food.
|
| first_semester_fee
|   Complete first-semester payable amount.
|
| annual_academic_fee
|   Academic-side annual amount.
|   NEVER hostel/mess.
|
| total_course_fee
|   Complete-course amount exactly as reported by source.
|
| Unknown / ambiguous
|   NULL.
|--------------------------------------------------------------------------
*/


const raw =
  fs
    .readFileSync(
      inputFile,
      "utf8"
    )
    .replace(/^\uFEFF/, "")
    .trim();

let records;

try {
  records =
    JSON.parse(raw);
} catch (error) {
  console.error(
    "Invalid JSON:",
    error.message
  );
  process.exit(1);
}

if (!Array.isArray(records)) {
  console.error(
    "Input JSON must contain an array."
  );
  process.exit(1);
}


const STRICT_FIELDS = [
  "tuition_fee_per_semester",
  "academic_fee_per_semester",
  "hostel_fee_per_semester",
  "mess_fee_per_semester",
  "first_semester_fee",
  "annual_academic_fee",
  "total_course_fee"
];


const OPTIONAL_MONEY_FIELDS = [
  "first_year_fee",
  "annual_total_fee",
  "one_time_fee",
  "security_deposit"
];


const ALLOWED_SOURCE_KINDS =
  new Set([
    "official",
    "counselling_portal",
    "collegedunia",
    "shiksha",
    "careers360",
    "other_secondary"
  ]);


const ALLOWED_STATUSES =
  new Set([
    "pending_review",
    "review_recommended",
    "high_confidence",
    "verified",
    "rejected",
    "stale"
  ]);


function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  return text || null;
}


function money(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const n =
    Number(value);

  if (
    !Number.isFinite(n) ||
    n < 0
  ) {
    return NaN;
  }

  return n;
}


function hasMoney(record) {
  return [
    ...STRICT_FIELDS,
    ...OPTIONAL_MONEY_FIELDS
  ].some(
    field =>
      money(record[field]) !== null &&
      Number.isFinite(
        money(record[field])
      )
  );
}


function validateRecord(
  record,
  index
) {

  const errors = [];
  const warnings = [];

  const name =
    cleanText(
      record.college_name
    ) ||
    `Record ${index + 1}`;


  /*
  |--------------------------------------------------------------------------
  | REQUIRED IDENTITY
  |--------------------------------------------------------------------------
  */

  if (
    !cleanText(
      record.college_name
    )
  ) {
    errors.push(
      "college_name is required"
    );
  }

  if (
    !cleanText(
      record.program
    )
  ) {
    errors.push(
      "program is required"
    );
  }

  const year =
    Number(
      record.academic_year
    );

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    errors.push(
      "academic_year is invalid"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SOURCE
  |--------------------------------------------------------------------------
  */

  const sourceKind =
    cleanText(
      record.source_kind
    );

  if (
    !ALLOWED_SOURCE_KINDS.has(
      sourceKind
    )
  ) {
    errors.push(
      `invalid source_kind: ${sourceKind}`
    );
  }

  const sourceUrl =
    cleanText(
      record.source_url
    );

  if (
    !sourceUrl ||
    !/^https?:\/\//i.test(
      sourceUrl
    )
  ) {
    errors.push(
      "source_url must be a real http/https URL"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | MONEY TYPES
  |--------------------------------------------------------------------------
  */

  for (
    const field of [
      ...STRICT_FIELDS,
      ...OPTIONAL_MONEY_FIELDS
    ]
  ) {

    if (
      record[field] !== null &&
      record[field] !== undefined
    ) {

      const value =
        money(
          record[field]
        );

      if (
        !Number.isFinite(value)
      ) {
        errors.push(
          `${field} must be a valid non-negative number or null`
        );
      }
    }
  }


  const tuition =
    money(
      record
        .tuition_fee_per_semester
    );

  const academic =
    money(
      record
        .academic_fee_per_semester
    );

  const hostel =
    money(
      record
        .hostel_fee_per_semester
    );

  const mess =
    money(
      record
        .mess_fee_per_semester
    );

  const firstSemester =
    money(
      record
        .first_semester_fee
    );

  const annualAcademic =
    money(
      record
        .annual_academic_fee
    );

  const courseTotal =
    money(
      record
        .total_course_fee
    );


  /*
  |--------------------------------------------------------------------------
  | SEMANTIC RULE 1
  | Academic subtotal should normally be >= tuition.
  |--------------------------------------------------------------------------
  */

  if (
    tuition !== null &&
    academic !== null &&
    academic < tuition
  ) {
    errors.push(
      "academic_fee_per_semester cannot be lower than tuition_fee_per_semester without explicit semantic review"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SEMANTIC RULE 2
  | Annual academic cannot contain hostel/mess.
  |
  | We cannot mathematically prove contamination,
  | so suspicious equality is blocked/warned.
  |--------------------------------------------------------------------------
  */

  if (
    annualAcademic !== null &&
    tuition === null &&
    academic === null
  ) {
    warnings.push(
      "annual_academic_fee exists without semester tuition/academic evidence"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SEMANTIC RULE 3
  | Do not confuse first semester total with academic subtotal.
  |--------------------------------------------------------------------------
  */

  if (
    firstSemester !== null &&
    academic !== null &&
    firstSemester === academic
  ) {
    warnings.push(
      "first_semester_fee equals academic_fee_per_semester; confirm source explicitly defines both identically"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SEMANTIC RULE 4
  | Course total cannot silently become tuition.
  |--------------------------------------------------------------------------
  */

  if (
    courseTotal !== null &&
    tuition !== null &&
    Math.abs(
      courseTotal -
      tuition * 8
    ) < 1
  ) {

    const notes =
      String(
        record.notes || ""
      ).toLowerCase();

    const explicitTuitionEvidence =
      notes.includes(
        "tuition"
      ) &&
      (
        notes.includes(
          "8 semester"
        ) ||
        notes.includes(
          "eight semester"
        ) ||
        notes.includes(
          "four year"
        ) ||
        notes.includes(
          "4 year"
        )
      );

    if (
      !explicitTuitionEvidence
    ) {
      warnings.push(
        "total_course_fee equals tuition x 8. Confirm source explicitly reports course total as tuition."
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | SEMANTIC RULE 5
  | Hostel & mess remain independent.
  |--------------------------------------------------------------------------
  */

  if (
    annualAcademic !== null &&
    hostel !== null &&
    mess !== null
  ) {

    const livingAnnual =
      hostel * 2 +
      mess * 2;

    if (
      annualAcademic ===
      livingAnnual
    ) {
      warnings.push(
        "annual_academic_fee suspiciously equals annual hostel+mess amount"
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | STATUS RULES
  |--------------------------------------------------------------------------
  */

  const status =
    cleanText(
      record.verification_status
    ) ||
    "pending_review";

  if (
    !ALLOWED_STATUSES.has(
      status
    )
  ) {
    errors.push(
      `invalid verification_status: ${status}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NO NUMERIC FEE IS ALLOWED
  | Source-only record may exist, but not high_confidence.
  |--------------------------------------------------------------------------
  */

  if (
    !hasMoney(record) &&
    (
      status ===
        "high_confidence" ||
      status ===
        "verified"
    )
  ) {
    errors.push(
      "record has no numeric fee values but is marked high_confidence/verified"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SECONDARY SOURCE CANNOT BE VERIFIED AUTOMATICALLY
  |--------------------------------------------------------------------------
  */

  if (
    sourceKind !==
      "official" &&
    sourceKind !==
      "counselling_portal" &&
    status ===
      "verified"
  ) {
    errors.push(
      "secondary source cannot be marked verified automatically"
    );
  }


  return {
    name,
    errors,
    warnings
  };
}


/*
|--------------------------------------------------------------------------
| VALIDATE ALL
|--------------------------------------------------------------------------
*/

let errorCount = 0;
let warningCount = 0;

console.log("");
console.log(
  "========================================"
);
console.log(
  "STRICT SOURCE FEE VALIDATION"
);
console.log(
  "========================================"
);

records.forEach(
  (record, index) => {

    const result =
      validateRecord(
        record,
        index
      );

    for (
      const error of
      result.errors
    ) {
      console.error(
        `[ERROR] ${result.name}: ${error}`
      );

      errorCount++;
    }

    for (
      const warning of
      result.warnings
    ) {
      console.warn(
        `[WARNING] ${result.name}: ${warning}`
      );

      warningCount++;
    }
  }
);


console.log("");
console.log(
  "Records :",
  records.length
);

console.log(
  "Errors  :",
  errorCount
);

console.log(
  "Warnings:",
  warningCount
);


if (errorCount > 0) {
  console.error("");
  console.error(
    "IMPORT BLOCKED BY STRICT FEE CONTRACT."
  );

  process.exit(1);
}


/*
|--------------------------------------------------------------------------
| BUILD CLEAN IMPORT FILE
|--------------------------------------------------------------------------
|
| Every strict field exists.
| Unknown values become null.
|--------------------------------------------------------------------------
*/

const cleaned =
  records.map(
    record => ({
      ...record,

      tuition_fee_per_semester:
        money(
          record
            .tuition_fee_per_semester
        ),

      academic_fee_per_semester:
        money(
          record
            .academic_fee_per_semester
        ),

      hostel_fee_per_semester:
        money(
          record
            .hostel_fee_per_semester
        ),

      mess_fee_per_semester:
        money(
          record
            .mess_fee_per_semester
        ),

      first_semester_fee:
        money(
          record
            .first_semester_fee
        ),

      annual_academic_fee:
        money(
          record
            .annual_academic_fee
        ),

      total_course_fee:
        money(
          record
            .total_course_fee
        )
    })
  );


const strictFile =
  "./fee-strict-import-ready.json";

fs.writeFileSync(
  strictFile,
  JSON.stringify(
    cleaned,
    null,
    2
  ),
  "utf8"
);


console.log("");
console.log(
  "Strict normalized file:",
  strictFile
);

console.log(
  "Validation PASSED."
);


/*
|--------------------------------------------------------------------------
| IMPORT USING EXISTING IMPORTER
|--------------------------------------------------------------------------
*/

console.log("");
console.log(
  "Starting fee source import..."
);

const importResult =
  spawnSync(
    process.execPath,
    [
      "./import-fee-sources.js",
      strictFile
    ],
    {
      stdio: "inherit"
    }
  );


if (
  importResult.status !== 0
) {
  console.error(
    "Fee source import failed."
  );

  process.exit(
    importResult.status || 1
  );
}


/*
|--------------------------------------------------------------------------
| RESOLVE CANONICAL PROFILE
|--------------------------------------------------------------------------
*/

console.log("");
console.log(
  "Starting fee profile resolver..."
);

const resolveResult =
  spawnSync(
    process.execPath,
    [
      "./resolve-fee-profiles.js"
    ],
    {
      stdio: "inherit"
    }
  );


if (
  resolveResult.status !== 0
) {
  console.error(
    "Fee resolver failed."
  );

  process.exit(
    resolveResult.status || 1
  );
}


console.log("");
console.log(
  "========================================"
);
console.log(
  "STRICT FEE PIPELINE COMPLETE"
);
console.log(
  "========================================"
);
