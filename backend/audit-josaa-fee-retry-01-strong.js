import fs from "node:fs";

const INPUT = "./josaa-fee-retry-01-strong-ready.json";
const SAFE = "./josaa-fee-retry-01-strong-safe.json";
const REVIEW = "./josaa-fee-retry-01-strong-needs-review.json";
const AUDIT = "./josaa-fee-retry-01-strong-audit.json";

const rows = JSON.parse(
  fs.readFileSync(INPUT, "utf8").replace(/^\uFEFF/, "")
);

const FIELDS = [
  "tuition_fee_per_semester",
  "academic_fee_per_semester",
  "hostel_fee_per_semester",
  "mess_fee_per_semester",
  "first_semester_fee",
  "annual_academic_fee",
  "annual_total_fee",
  "total_course_fee"
];

function presentFields(row) {
  return FIELDS.filter(
    f => typeof row[f] === "number"
  );
}

function isGoodSecondaryPage(url = "") {
  const u = url.toLowerCase();

  const bad = [
    "/cutoff",
    "/placement",
    "/question",
    "/reviews",
    "/admission",
    "blogid",
    "/articles/"
  ];

  if (bad.some(x => u.includes(x))) {
    return false;
  }

  const good = [
    "/fees",
    "/courses",
    "/course-",
    "/btech-",
    "/be-btech"
  ];

  return good.some(
    x => u.includes(x)
  );
}

function audit(row) {
  const issues = [];
  const present = presentFields(row);

  const collegeName =
    String(row.college_name || "")
      .toLowerCase();

  const sourceUrl =
    String(row.source_url || "")
      .toLowerCase();

  /*
    Prevent IIIT <-> IIT identity contamination.

    Example:
    IIIT Dharwad must NOT use an IIT Dharwad page.
  */

  const collegeIsIIIT =
    collegeName.includes(
      "indian institute of information technology"
    ) ||
    collegeName.includes("iiit");

  const collegeIsIIT =
    !collegeIsIIIT &&
    (
      collegeName.includes(
        "indian institute of technology"
      ) ||
      /\biit\b/.test(collegeName)
    );

  if (
    collegeIsIIIT &&
    (
      sourceUrl.includes("/iit-") ||
      sourceUrl.includes("iit-dharwad")
    ) &&
    !sourceUrl.includes("iiit")
  ) {
    issues.push(
      "COLLEGE_IDENTITY_MISMATCH_IIIT_VS_IIT"
    );
  }

  if (
    collegeIsIIT &&
    sourceUrl.includes("iiit-")
  ) {
    issues.push(
      "COLLEGE_IDENTITY_MISMATCH_IIT_VS_IIIT"
    );
  }

  if (
    !row.source_url ||
    !/^https?:\/\//i.test(row.source_url)
  ) {
    issues.push("INVALID_SOURCE_URL");
  }

  if (present.length === 0) {
    issues.push("NO_NUMERIC_DATA");
  }

  const majorFeeFields = [
    "tuition_fee_per_semester",
    "academic_fee_per_semester",
    "first_semester_fee",
    "annual_academic_fee",
    "annual_total_fee",
    "total_course_fee"
  ];

  for (const field of majorFeeFields) {
    const value = row[field];

    if (
      typeof value === "number" &&
      value < 10000
    ) {
      issues.push(
        `SUSPICIOUSLY_LOW_${field}`
      );
    }
  }

  for (const field of present) {
    const value = row[field];

    if (
      value < 1000 ||
      value > 10000000
    ) {
      issues.push(
        `IMPLAUSIBLE_${field}`
      );
    }
  }

  if (
    row.tuition_fee_per_semester != null &&
    row.academic_fee_per_semester != null &&
    row.academic_fee_per_semester <
      row.tuition_fee_per_semester
  ) {
    issues.push(
      "ACADEMIC_BELOW_TUITION"
    );
  }

  if (
    row.annual_total_fee != null &&
    row.annual_academic_fee != null &&
    row.annual_total_fee <
      row.annual_academic_fee
  ) {
    issues.push(
      "ANNUAL_TOTAL_BELOW_ACADEMIC"
    );
  }

  if (
    row.total_course_fee != null &&
    row.annual_total_fee != null &&
    row.total_course_fee <
      row.annual_total_fee
  ) {
    issues.push(
      "COURSE_TOTAL_BELOW_ANNUAL"
    );
  }

  const sourceSafe =
    row.source_kind === "official" ||
    isGoodSecondaryPage(row.source_url);

  const safe =
    issues.length === 0 &&
    present.length >= 1 &&
    sourceSafe;

  return {
    ...row,

    numeric_fields:
      present,

    numeric_count:
      present.length,

    audit_safe:
      safe,

    audit_issues:
      issues
  };
}

const audited =
  rows.map(audit);

const safe =
  audited
    .filter(x => x.audit_safe)
    .map(
      ({
        numeric_fields,
        numeric_count,
        audit_safe,
        audit_issues,
        ...row
      }) => ({
        ...row,

        verification_status:
          row.source_kind === "official"
            ? "high_confidence"
            : "review_recommended"
      })
    );

const review =
  audited.filter(
    x => !x.audit_safe
  );

fs.writeFileSync(
  SAFE,
  JSON.stringify(
    safe,
    null,
    2
  )
);

fs.writeFileSync(
  REVIEW,
  JSON.stringify(
    review,
    null,
    2
  )
);

fs.writeFileSync(
  AUDIT,
  JSON.stringify(
    audited,
    null,
    2
  )
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "JOSAA RETRY 01 STRONG PRACTICAL AUDIT"
);
console.log(
  "========================================"
);

console.log(
  "Original:",
  rows.length
);

console.log(
  "Safe:",
  safe.length
);

console.log(
  "Review:",
  review.length
);

console.log("");

console.table(
  audited.map(x => ({
    college:
      x.college_name,

    source:
      x.source_kind,

    numeric:
      x.numeric_count,

    safe:
      x.audit_safe,

    url:
      x.source_url,

    issue:
      x.audit_issues.join(", ")
  }))
);

console.log("");
console.log(
  "Safe file:",
  SAFE
);

console.log(
  "Review file:",
  REVIEW
);







