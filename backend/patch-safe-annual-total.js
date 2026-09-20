import fs from "node:fs";

const file = "./resolve-fee-profiles.js";

let code =
  fs.readFileSync(file, "utf8");

const backup =
  "./resolve-fee-profiles.before-annual-total.js";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(file, backup);
  console.log("Backup:", backup);
}

const oldBlock = `  const annualTotal =
    pickFirst(
      rows,
      'annual_total_fee'
    );


  const totalCourse =
    pickFirst(
      rows,
      'total_course_fee'
    );`;

const newBlock = `  let annualTotal =
    pickFirst(
      rows,
      'annual_total_fee'
    );


  /*
  |--------------------------------------------------------------------------
  | SAFE ANNUAL TOTAL
  |--------------------------------------------------------------------------
  |
  | Priority:
  |
  | 1. Source-reported annual_total_fee
  |
  | 2. If first-semester payable + complete recurring
  |    second-semester components are known:
  |
  |    first semester
  |    + academic semester
  |    + hostel semester
  |    + mess semester
  |
  | No missing component is silently treated as zero.
  |
  */

  if (
    annualTotal === null &&
    firstSemester !== null &&
    academicPerSemester !== null &&
    hostel !== null &&
    mess !== null
  ) {
    annualTotal =
      firstSemester +
      academicPerSemester +
      hostel +
      mess;
  }


  /*
  | Alternative safe recurring-year calculation.
  |
  | Use only when complete annual academic +
  | hostel + mess components are available.
  */

  if (
    annualTotal === null &&
    annualAcademic !== null &&
    hostel !== null &&
    mess !== null
  ) {
    annualTotal =
      annualAcademic +
      hostel * 2 +
      mess * 2;
  }


  const totalCourse =
    pickFirst(
      rows,
      'total_course_fee'
    );`;

if (!code.includes(oldBlock)) {
  throw new Error(
    "annualTotal selector block not found"
  );
}

code =
  code.replace(
    oldBlock,
    newBlock
  );

fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log(
  "SAFE ANNUAL TOTAL PATCH APPLIED"
);
