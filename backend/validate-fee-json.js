import fs from "node:fs";

const inputFile =
  process.argv[2];

if (!inputFile) {
  console.error(
    "Usage: node validate-fee-json.js <file.json>"
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

const rawInput =
  fs.readFileSync(
    inputFile,
    "utf8"
  )
  .replace(/^\uFEFF/, "")
  .trim();

const records =
  JSON.parse(rawInput);

if (!Array.isArray(records)) {
  throw new Error(
    "Fee input must be a JSON array."
  );
}

const feeFields = [
  "tuition_fee_per_semester",
  "academic_fee_per_semester",
  "hostel_fee_per_semester",
  "mess_fee_per_semester",
  "first_semester_fee",
  "first_year_fee",
  "annual_academic_fee",
  "annual_total_fee",
  "total_course_fee",
  "one_time_fee",
  "security_deposit"
];

let errors = 0;
let warnings = 0;

function money(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

for (
  let i = 0;
  i < records.length;
  i++
) {

  const r = records[i];

  const name =
    r.college_name ||
    `Record ${i + 1}`;

  /*
  |--------------------------------------------------------------------------
  | Numeric validation
  |--------------------------------------------------------------------------
  */

  for (const field of feeFields) {

    if (
      r[field] !== null &&
      r[field] !== undefined
    ) {

      const n =
        money(r[field]);

      if (
        n === null ||
        n < 0
      ) {
        console.error(
          `[ERROR] ${name}: invalid ${field}`
        );

        errors++;
      }
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Source URL
  |--------------------------------------------------------------------------
  */

  if (
    typeof r.source_url !== "string" ||
    !/^https?:\/\//i.test(
      r.source_url.trim()
    )
  ) {

    console.error(
      `[ERROR] ${name}: invalid source_url`
    );

    errors++;
  }


  /*
  |--------------------------------------------------------------------------
  | STRICT SEMANTIC WARNINGS
  |--------------------------------------------------------------------------
  */

  const tuition =
    money(
      r.tuition_fee_per_semester
    );

  const academic =
    money(
      r.academic_fee_per_semester
    );

  const hostel =
    money(
      r.hostel_fee_per_semester
    );

  const mess =
    money(
      r.mess_fee_per_semester
    );

  const firstSemester =
    money(
      r.first_semester_fee
    );

  const annualAcademic =
    money(
      r.annual_academic_fee
    );

  const totalCourse =
    money(
      r.total_course_fee
    );


  /*
   * Academic subtotal normally should not
   * be lower than explicit tuition.
   */

  if (
    tuition !== null &&
    academic !== null &&
    academic < tuition
  ) {

    console.warn(
      `[WARNING] ${name}: academic fee is lower than tuition. Review semantics.`
    );

    warnings++;
  }


  /*
   * Annual academic can be derived from an
   * explicit per-semester tuition/academic amount,
   * but NOT from total_course_fee.
   */

  if (
    annualAcademic !== null &&
    tuition === null &&
    academic === null
  ) {

    console.warn(
      `[WARNING] ${name}: annual academic exists without semester academic/tuition evidence. Verify source definition.`
    );

    warnings++;
  }


  /*
   * Detect suspicious generic-total division.
   */

  if (
    totalCourse !== null &&
    tuition !== null &&
    Math.abs(
      totalCourse -
      tuition * 8
    ) < 1
  ) {

    const notes =
      String(
        r.notes || ""
      ).toLowerCase();

    if (
      !notes.includes("tuition") &&
      !notes.includes("eight semester") &&
      !notes.includes("8 semester")
    ) {

      console.warn(
        `[WARNING] ${name}: tuition appears derived from total_course_fee. Confirm source explicitly says the course total is tuition.`
      );

      warnings++;
    }
  }


  /*
   * First semester should never automatically
   * become academic fee.
   */

  if (
    firstSemester !== null &&
    academic !== null &&
    firstSemester === academic
  ) {

    console.warn(
      `[WARNING] ${name}: first_semester_fee equals academic_fee_per_semester. Confirm source explicitly defines both identically.`
    );

    warnings++;
  }


  /*
   * Hostel/mess must stay separate.
   */

  if (
    annualAcademic !== null &&
    hostel !== null &&
    mess !== null
  ) {

    const combined =
      annualAcademic +
      hostel * 2 +
      mess * 2;

    if (
      totalCourse !== null &&
      Math.abs(
        totalCourse - combined
      ) < 1
    ) {

      console.warn(
        `[INFO] ${name}: total_course_fee resembles one-year academic+hostel+mess total. Verify that it really means full-course total.`
      );

      warnings++;
    }
  }
}


console.log("");
console.log(
  "========================================"
);

console.log(
  "STRICT FEE VALIDATION"
);

console.log(
  "========================================"
);

console.log(
  "Records :", records.length
);

console.log(
  "Errors  :", errors
);

console.log(
  "Warnings:", warnings
);


if (errors > 0) {
  console.error("");
  console.error(
    "IMPORT BLOCKED."
  );

  process.exit(1);
}

console.log("");
console.log(
  "Validation passed."
);
