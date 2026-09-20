import fs from "node:fs";

const file = "./resolve-fee-profiles.js";
const backup = "./resolve-fee-profiles.before-canonical-breakdown.js";

let code = fs.readFileSync(file, "utf8");

if (!fs.existsSync(backup)) {
  fs.copyFileSync(file, backup);
  console.log("Backup:", backup);
}

/* -------------------------------------------------------
   1. Pick annual_total_fee + total_course_fee
------------------------------------------------------- */

if (!code.includes("const annualTotal =")) {
  const marker = `  /*
  |--------------------------------------------------------------------------
  | FALLBACK ANNUAL ACADEMIC FEE`;

  const addition = `  const annualTotal =
    pickFirst(
      rows,
      'annual_total_fee'
    );


  const totalCourse =
    pickFirst(
      rows,
      'total_course_fee'
    );


`;

  if (!code.includes(marker)) {
    throw new Error("Fallback marker not found");
  }

  code = code.replace(
    marker,
    addition + marker
  );

  console.log("Added annualTotal + totalCourse selectors");
}


/* -------------------------------------------------------
   2. Replace INSERT column block
------------------------------------------------------- */

const oldColumns = `      tuition_fee_per_semester,

      academic_fee_per_semester,

      first_semester_fee,

      mess_fee_per_semester,

      annual_academic_fee,

      source_url,`;

const newColumns = `      tuition_fee_per_semester,

      academic_fee_per_semester,

      hostel_fee_per_semester,

      mess_fee_per_semester,

      first_semester_fee,

      annual_academic_fee,

      annual_total_fee,

      total_course_fee,

      source_url,`;

if (!code.includes(oldColumns)) {
  throw new Error("INSERT column block not found");
}

code = code.replace(
  oldColumns,
  newColumns
);


/* -------------------------------------------------------
   3. Replace VALUES placeholders
------------------------------------------------------- */

const oldValues = `      $5,
      $6,
      $7,
      $8,
      $9,

      $10,

      $11,

      $12,

      $13,

      $14,

      NOW()`;

const newValues = `      $5,
      $6,
      $7,
      $8,
      $9,
      $10,
      $11,
      $12,

      $13,

      $14,

      $15,

      $16,

      $17,

      NOW()`;

if (!code.includes(oldValues)) {
  throw new Error("VALUES block not found");
}

code = code.replace(
  oldValues,
  newValues
);


/* -------------------------------------------------------
   4. Replace UPDATE fee block
------------------------------------------------------- */

const oldUpdate = `      first_semester_fee =
        COALESCE(
          EXCLUDED.first_semester_fee,
          college_fee_profiles
            .first_semester_fee
        ),

      mess_fee_per_semester =
        COALESCE(
          EXCLUDED.mess_fee_per_semester,
          college_fee_profiles
            .mess_fee_per_semester
        ),

      annual_academic_fee =
        COALESCE(
          EXCLUDED.annual_academic_fee,
          college_fee_profiles
            .annual_academic_fee
        ),

      source_url =`;

const newUpdate = `      hostel_fee_per_semester =
        COALESCE(
          EXCLUDED.hostel_fee_per_semester,
          college_fee_profiles
            .hostel_fee_per_semester
        ),

      mess_fee_per_semester =
        COALESCE(
          EXCLUDED.mess_fee_per_semester,
          college_fee_profiles
            .mess_fee_per_semester
        ),

      first_semester_fee =
        COALESCE(
          EXCLUDED.first_semester_fee,
          college_fee_profiles
            .first_semester_fee
        ),

      annual_academic_fee =
        COALESCE(
          EXCLUDED.annual_academic_fee,
          college_fee_profiles
            .annual_academic_fee
        ),

      annual_total_fee =
        COALESCE(
          EXCLUDED.annual_total_fee,
          college_fee_profiles
            .annual_total_fee
        ),

      total_course_fee =
        COALESCE(
          EXCLUDED.total_course_fee,
          college_fee_profiles
            .total_course_fee
        ),

      source_url =`;

if (!code.includes(oldUpdate)) {
  throw new Error("UPDATE fee block not found");
}

code = code.replace(
  oldUpdate,
  newUpdate
);


/* -------------------------------------------------------
   5. Replace parameter block
------------------------------------------------------- */

const oldParams = `      tuition,

      academicPerSemester,

      firstSemester,

      mess,

      annualAcademic,

      top.source_url,`;

const newParams = `      tuition,

      academicPerSemester,

      hostel,

      mess,

      firstSemester,

      annualAcademic,

      annualTotal,

      totalCourse,

      top.source_url,`;

if (!code.includes(oldParams)) {
  throw new Error("Parameter block not found");
}

code = code.replace(
  oldParams,
  newParams
);


/* -------------------------------------------------------
   6. Return new fields
------------------------------------------------------- */

const oldReturn = `    firstYear,

    annualAcademic,

    confidence,`;

const newReturn = `    firstYear,

    annualAcademic,

    annualTotal,

    totalCourse,

    confidence,`;

if (!code.includes(oldReturn)) {
  throw new Error("Return block not found");
}

code = code.replace(
  oldReturn,
  newReturn
);

fs.writeFileSync(file, code, "utf8");

console.log("");
console.log("CANONICAL FEE BREAKDOWN PATCH APPLIED");
