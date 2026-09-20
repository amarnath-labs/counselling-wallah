import fs from "node:fs";

const file = "./resolve-fee-profiles.js";

if (!fs.existsSync(file)) {
  console.error("resolve-fee-profiles.js not found");
  process.exit(1);
}

const backup =
  "./resolve-fee-profiles.before-total-fee.js";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(file, backup);
  console.log("Backup created:", backup);
}

let code =
  fs.readFileSync(file, "utf8");


/*
|--------------------------------------------------------------------------
| 1. ADD HOSTEL / ANNUAL TOTAL / COURSE TOTAL PICKING
|--------------------------------------------------------------------------
*/

const marker1 = `const annualAcademic =`;

if (!code.includes(marker1)) {
  console.error(
    "annualAcademic marker not found."
  );
  process.exit(1);
}

if (
  !code.includes(
    "const hostelPerSemester ="
  )
) {

  const insertBefore =
`const annualAcademic =`;

  const addition =
`const hostelPerSemester =
      pickFirst(
        rows,
        "hostel_fee_per_semester"
      );

    const annualTotal =
      pickFirst(
        rows,
        "annual_total_fee"
      );

    const totalCourse =
      pickFirst(
        rows,
        "total_course_fee"
      );

    const annualAcademic =`;

  code =
    code.replace(
      insertBefore,
      addition
    );

  console.log(
    "Added hostel/annual-total/course-total selection."
  );
}


/*
|--------------------------------------------------------------------------
| 2. ADD COLUMNS TO INSERT
|--------------------------------------------------------------------------
*/

const oldColumns =
`      annual_academic_fee,

      source_url,`;

const newColumns =
`      annual_academic_fee,
      hostel_fee_per_semester,
      annual_total_fee,
      total_course_fee,

      source_url,`;

if (
  code.includes(oldColumns)
) {
  code =
    code.replace(
      oldColumns,
      newColumns
    );

  console.log(
    "Added new canonical columns."
  );
}


/*
|--------------------------------------------------------------------------
| 3. ADD VALUES PLACEHOLDERS
|--------------------------------------------------------------------------
*/

const oldValues =
`      $9,
      $10,
      $11,`;

const newValues =
`      $9,
      $10,
      $11,
      $12,
      $13,
      $14,`;

if (
  code.includes(oldValues)
) {
  code =
    code.replace(
      oldValues,
      newValues
    );

  console.log(
    "Added SQL placeholders."
  );
}


/*
|--------------------------------------------------------------------------
| 4. ADD ON CONFLICT UPDATE FIELDS
|--------------------------------------------------------------------------
*/

const updateMarker =
`      annual_academic_fee =
        EXCLUDED.annual_academic_fee,`;

if (
  code.includes(updateMarker) &&
  !code.includes(
    "hostel_fee_per_semester ="
  )
) {

  const updateReplacement =
`      annual_academic_fee =
        EXCLUDED.annual_academic_fee,

      hostel_fee_per_semester =
        EXCLUDED.hostel_fee_per_semester,

      annual_total_fee =
        EXCLUDED.annual_total_fee,

      total_course_fee =
        EXCLUDED.total_course_fee,`;

  code =
    code.replace(
      updateMarker,
      updateReplacement
    );

  console.log(
    "Added conflict update fields."
  );
}


/*
|--------------------------------------------------------------------------
| 5. ADD PARAMETER VALUES
|--------------------------------------------------------------------------
*/

const paramMarker =
`      annualAcademic,

      sourceUrl,`;

const paramReplacement =
`      annualAcademic,
      hostelPerSemester,
      annualTotal,
      totalCourse,

      sourceUrl,`;

if (
  code.includes(paramMarker)
) {
  code =
    code.replace(
      paramMarker,
      paramReplacement
    );

  console.log(
    "Added parameter values."
  );
}


/*
|--------------------------------------------------------------------------
| 6. ADD RESOLVER OUTPUT LOG
|--------------------------------------------------------------------------
*/

const logMarker =
`console.log(
      "  Annual academic:",
      annualAcademic ?? "N/A"
    );`;

if (
  code.includes(logMarker) &&
  !code.includes(
    '"  Annual total:"'
  )
) {

  const logReplacement =
`console.log(
      "  Annual academic:",
      annualAcademic ?? "N/A"
    );

    console.log(
      "  Hostel / semester:",
      hostelPerSemester ?? "N/A"
    );

    console.log(
      "  Annual total:",
      annualTotal ?? "N/A"
    );

    console.log(
      "  Total course:",
      totalCourse ?? "N/A"
    );`;

  code =
    code.replace(
      logMarker,
      logReplacement
    );

  console.log(
    "Added resolver output fields."
  );
}


fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log("");
console.log(
  "RESOLVER TOTAL-FEE PATCH COMPLETE"
);
