import fs from "node:fs";

const file = "./normalize-fee-audit-v3.js";

if (!fs.existsSync(file)) {
  console.error("normalize-fee-audit-v3.js not found");
  process.exit(1);
}

const backup =
  "./normalize-fee-audit-v3.before-strict-semantics.js";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(file, backup);
  console.log("Backup created:", backup);
}

let code =
  fs.readFileSync(file, "utf8");


/*
|--------------------------------------------------------------------------
| 1. NEVER USE firstSemesterFee AS academic_fee_per_semester
|--------------------------------------------------------------------------
*/

const oldAcademic = `    academic_fee_per_semester:
      finalAcademicSeries[0] ||
      firstSemesterFee ||
      null,`;

const newAcademic = `    /*
     * STRICT SEMANTICS:
     * Academic fee must represent academic/institute charges only.
     *
     * NEVER fall back to firstSemesterFee because first-semester
     * payable may contain hostel, mess, deposits or one-time charges.
     */
    academic_fee_per_semester:
      finalAcademicSeries[0] ??
      null,`;

if (code.includes(oldAcademic)) {
  code =
    code.replace(
      oldAcademic,
      newAcademic
    );

  console.log(
    "Fixed academic_fee_per_semester semantics."
  );
} else {
  console.log(
    "Academic fallback already changed or marker not found."
  );
}


/*
|--------------------------------------------------------------------------
| 2. STRICT FIELD DOCUMENTATION
|--------------------------------------------------------------------------
*/

const recordMarker = `  const record = {`;

const strictDocs = `  /*
  |--------------------------------------------------------------------------
  | STRICT FEE FIELD CONTRACT
  |--------------------------------------------------------------------------
  |
  | tuition_fee_per_semester
  |   -> ONLY tuition explicitly identified by source.
  |
  | academic_fee_per_semester
  |   -> Academic/institute semester amount only.
  |      May include tuition when source explicitly defines subtotal that way.
  |
  | hostel_fee_per_semester
  |   -> ONLY hostel/accommodation charge.
  |
  | mess_fee_per_semester
  |   -> ONLY mess/food charge.
  |
  | first_semester_fee
  |   -> Complete first-semester payable amount ONLY when source explicitly
  |      identifies it as such.
  |
  | annual_academic_fee
  |   -> Academic-side annual amount only.
  |      Hostel/mess MUST NOT be included.
  |
  | estimated_course_total / total_course_fee
  |   -> Full-course amount only when source semantics support it.
  |
  | Missing/ambiguous values remain null.
  | Never derive tuition from a generic total-course number.
  |--------------------------------------------------------------------------
  */

${recordMarker}`;

if (
  code.includes(recordMarker) &&
  !code.includes("STRICT FEE FIELD CONTRACT")
) {
  code =
    code.replace(
      recordMarker,
      strictDocs
    );

  console.log(
    "Added strict fee field contract."
  );
}


fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log("");
console.log(
  "STRICT FEE SEMANTICS PATCH COMPLETE"
);
