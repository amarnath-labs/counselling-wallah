import fs from "node:fs";
import path from "node:path";

const inputFile =
  process.argv[2] ||
  path.resolve(process.cwd(), "fee-normalization-audit.txt");

const outputFile =
  process.argv[3] ||
  path.resolve(process.cwd(), "fee-normalized-output-v2.json");

if (!fs.existsSync(inputFile)) {
  console.error("Input file not found:", inputFile);
  process.exit(1);
}

const text = fs.readFileSync(inputFile, "utf8");

function cleanNumber(value) {
  if (value == null) return null;

  const cleaned = String(value)
    .replace(/₹/g, "")
    .replace(/Rs\.?/gi, "")
    .replace(/INR/gi, "")
    .replace(/,/g, "")
    .replace(/\/-/g, "")
    .replace(/[^\d.]/g, "")
    .trim();

  if (!cleaned) return null;

  const n = Number(cleaned);

  if (!Number.isFinite(n) || n <= 0) return null;

  return Math.round(n);
}

function isYear(value) {
  return Number.isInteger(value) &&
    value >= 1990 &&
    value <= 2100;
}

function validMoney(value, {
  min = 100,
  max = 5000000,
  rejectYear = true
} = {}) {
  if (!Number.isFinite(value)) return false;

  if (rejectYear && isYear(value)) return false;

  return value >= min && value <= max;
}

function extractAmounts(line, options = {}) {
  if (!line) return [];

  const matches =
    line.match(
      /(?:₹\s*)?\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|(?:₹\s*)?\d{4,}(?:\.\d+)?/g
    ) || [];

  return matches
    .map(cleanNumber)
    .filter((n) => validMoney(n, options));
}

function metadata(block, key) {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, "mi");
  return block.match(regex)?.[1]?.trim() || null;
}

/*
 * CRITICAL:
 * Parse only extracted tables / PDF fee lines.
 * Do NOT parse RELEVANT BLOCKS because navigation,
 * copyright years and unrelated page text create false values.
 */
function getFeeArea(block) {
  const relevantIndex =
    block.search(/^--- RELEVANT BLOCKS ---/mi);

  if (relevantIndex >= 0) {
    return block.slice(0, relevantIndex);
  }

  return block;
}

function linesOf(block) {
  return getFeeArea(block)
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function candidates(lines, patterns) {
  return lines.filter((line) =>
    patterns.some((regex) => regex.test(line))
  );
}

function extractSeries(line, {
  min = 100,
  max = 5000000
} = {}) {
  return extractAmounts(line, {
    min,
    max,
    rejectYear: true
  });
}

function bestRow(lines, patterns, options = {}) {
  const rows = candidates(lines, patterns)
    .map((line) => ({
      line,
      values: extractSeries(line, options)
    }))
    .filter((x) => x.values.length)
    .sort((a, b) => {
      if (b.values.length !== a.values.length) {
        return b.values.length - a.values.length;
      }

      return a.line.length - b.line.length;
    });

  return rows[0] || null;
}

function plausibleTuition(value) {
  /*
   * ₹2,026 and similar values are nearly always
   * academic years caught by malformed PDF extraction.
   */
  return validMoney(value, {
    min: 5000,
    max: 500000
  }) && !isYear(value);
}

function findTuition(lines) {
  const rows = candidates(lines, [
    /^tuition fees?\s*\|/i,
    /\|\s*tuition fees?\s*\|/i,
    /^\d+\s*\|\s*tuition fees?\s*\|/i
  ]);

  const possibilities = [];

  for (const line of rows) {
    const values = extractSeries(line, {
      min: 5000,
      max: 500000
    }).filter(plausibleTuition);

    for (const value of values) {
      possibilities.push(value);
    }
  }

  if (!possibilities.length) return null;

  /*
   * Prefer the most frequently occurring amount.
   * This works well for semester tables where tuition
   * repeats across Sem-I ... Sem-VIII.
   */
  const frequency = new Map();

  for (const value of possibilities) {
    frequency.set(
      value,
      (frequency.get(value) || 0) + 1
    );
  }

  return [...frequency.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0] - a[0];
    })[0][0];
}

function findSeries(lines, patterns, options = {}) {
  const row = bestRow(lines, patterns, options);

  if (!row || row.values.length < 2) {
    return [];
  }

  return row.values;
}

function findFirstSemesterFee(lines) {
  /*
   * Explicit table:
   * Category | First Semester Institute Fee | ...
   */
  const rows = candidates(lines, [
    /first semester institute fee/i
  ]);

  const feeCandidates = [];

  for (const line of rows) {
    /*
     * Ignore header-only row.
     */
    if (!/\d/.test(line)) continue;

    const values = extractSeries(line, {
      min: 5000,
      max: 1000000
    });

    if (values.length) {
      /*
       * In:
       * GEN | 178621 | 70000 | 108621
       * first amount is actual first-semester fee.
       */
      feeCandidates.push(values[0]);
    }
  }

  if (feeCandidates.length) {
    /*
     * Same institute fee may occur for multiple categories.
     */
    const counts = new Map();

    for (const value of feeCandidates) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  /*
   * Academic subtotal tables.
   */
  const subtotal = bestRow(lines, [
    /^a\s*\|\s*sub total a/i,
    /^sub total a\s*\|/i,
    /\|\s*sub total a\s*\|/i
  ], {
    min: 5000,
    max: 1000000
  });

  if (subtotal?.values?.length) {
    return subtotal.values[0];
  }

  /*
   * Explicit Total (A), but only if it gives a sensible
   * institute-level number.
   */
  const totalRows = candidates(lines, [
    /^total\s*\(a\)\s*\|/i,
    /\|\s*total\s*\(a\)\s*\|/i
  ]);

  for (const line of totalRows) {
    const values = extractSeries(line, {
      min: 5000,
      max: 1000000
    });

    if (values.length) return values[0];
  }

  return null;
}

function findDeposit(lines) {
  const row = bestRow(lines, [
    /caution deposit.*refundable/i,
    /refundable.*deposit/i
  ], {
    min: 1000,
    max: 200000
  });

  if (!row?.values?.length) return null;

  return row.values[0];
}

function findHostelSeries(lines) {
  return findSeries(lines, [
    /^\d+\s*\|\s*hostel fee\s*\|/i,
    /^hostel fee\s*\|/i,
    /\|\s*hostel fee\s*\|/i
  ], {
    min: 3000,
    max: 300000
  });
}

function findMessSeries(lines) {
  return findSeries(lines, [
    /^\d+\s*\|\s*mess fees?\b/i,
    /^mess fees?\s*\|/i,
    /\|\s*mess fees?\s*\|/i
  ], {
    min: 3000,
    max: 200000
  });
}

function findAcademicSeries(lines) {
  return findSeries(lines, [
    /^a\s*\|\s*sub total a/i,
    /^sub total a\s*\|/i,
    /\|\s*sub total a\s*\|/i
  ], {
    min: 5000,
    max: 1000000
  });
}

function combinedSeries(lines) {
  const patterns = [
    /total with transport fee \(inside campus\)/i,
    /total \(inside campus transport\)/i,
    /total with transport fee \(outside campus\)/i,
    /total \(outside campus transport\)/i
  ];

  for (const regex of patterns) {
    const rows = lines
      .filter((line) => regex.test(line))
      .map((line) => ({
        line,
        values: extractSeries(line, {
          min: 10000,
          max: 1000000
        })
      }))
      .filter((x) => x.values.length >= 2)
      .sort(
        (a, b) =>
          b.values.length - a.values.length
      );

    if (rows.length) {
      return rows[0].values;
    }
  }

  return [];
}

function sum(values) {
  if (!Array.isArray(values) || !values.length) {
    return null;
  }

  const valid = values.filter(
    (x) => Number.isFinite(x)
  );

  if (!valid.length) return null;

  return valid.reduce((a, b) => a + b, 0);
}

function firstTwo(values) {
  if (!Array.isArray(values) || values.length < 2) {
    return null;
  }

  return sum(values.slice(0, 2));
}

function safeAnnual(value) {
  if (
    !Number.isFinite(value) ||
    value < 10000 ||
    value > 1500000
  ) {
    return null;
  }

  return value;
}

function safeCourse(value) {
  if (
    !Number.isFinite(value) ||
    value < 50000 ||
    value > 10000000
  ) {
    return null;
  }

  return value;
}

function confidence(record) {
  let score = 0;

  if (record.source_url) score += 10;

  if (
    record.extraction_status ===
    "DIRECT_HTML_EXTRACTED"
  ) {
    score += 15;
  } else if (
    record.extraction_status ===
    "TEXT_EXTRACTED"
  ) {
    score += 5;
  }

  if (record.tuition_fee_per_semester) score += 20;
  if (record.first_semester_fee) score += 20;
  if (record.hostel_fee_per_semester) score += 10;
  if (record.mess_fee_per_semester) score += 10;
  if (record.estimated_annual_total) score += 10;
  if (record.estimated_course_total) score += 5;

  return Math.min(100, score);
}

const blocks = text
  .split(/={20,}/)
  .map((x) => x.trim())
  .filter((x) => /^COLLEGE:/m.test(x));

const normalized = [];

for (const block of blocks) {
  const college = metadata(block, "COLLEGE");
  if (!college) continue;

  const lines = linesOf(block);

  const tuition = findTuition(lines);
  const firstSemesterFee =
    findFirstSemesterFee(lines);

  const hostelSeries =
    findHostelSeries(lines);

  const messSeries =
    findMessSeries(lines);

  const academicSeries =
    findAcademicSeries(lines);

  const totals =
    combinedSeries(lines);

  const hostel =
    hostelSeries[0] || null;

  const mess =
    messSeries[0] || null;

  const annualAcademic =
    safeAnnual(firstTwo(academicSeries));

  const annualHostel =
    safeAnnual(firstTwo(hostelSeries));

  const annualMess =
    safeAnnual(firstTwo(messSeries));

  let annualHostelMess = null;

  if (
    annualHostel != null ||
    annualMess != null
  ) {
    annualHostelMess = safeAnnual(
      (annualHostel || 0) +
      (annualMess || 0)
    );
  }

  const estimatedAnnualTotal =
    safeAnnual(firstTwo(totals));

  const estimatedCourseTotal =
    totals.length >= 4
      ? safeCourse(sum(totals))
      : null;

  const record = {
    college_name: college,

    source_type:
      metadata(block, "TYPE"),

    extraction_status:
      metadata(block, "STATUS"),

    source_url:
      metadata(block, "SOURCE"),

    tuition_fee_per_semester:
      tuition,

    first_semester_fee:
      firstSemesterFee,

    academic_fee_per_semester:
      academicSeries[0] ||
      firstSemesterFee ||
      null,

    hostel_fee_per_semester:
      hostel,

    mess_fee_per_semester:
      mess,

    annual_academic_fee:
      annualAcademic,

    annual_hostel_mess_fee:
      annualHostelMess,

    estimated_annual_total:
      estimatedAnnualTotal,

    estimated_course_total:
      estimatedCourseTotal,

    refundable_deposit:
      findDeposit(lines),

    /*
     * Intentionally null.
     *
     * JoSAA/CSAB deductions are often category dependent.
     * Do not collapse them into one college-wide number.
     */
    josaa_csab_adjustment: null,

    balance_payable_after_adjustment: null,

    semester_fee_series:
      totals.length ? totals : null,

    verification_status:
      "needs_review",

    confidence_score: 0,

    normalization_notes: []
  };

  if (tuition && tuition < 10000) {
    record.normalization_notes.push(
      "Low tuition value detected; manual review recommended."
    );
  }

  if (
    record.extraction_status ===
    "INSUFFICIENT_TEXT_REVIEW"
  ) {
    record.normalization_notes.push(
      "Source extraction itself is incomplete; do not import automatically."
    );
  }

  record.confidence_score =
    confidence(record);

  if (
    record.confidence_score >= 75 &&
    record.extraction_status !==
      "INSUFFICIENT_TEXT_REVIEW"
  ) {
    record.verification_status =
      "high_confidence";
  } else if (
    record.confidence_score >= 45
  ) {
    record.verification_status =
      "review_recommended";
  }

  normalized.push(record);
}

fs.writeFileSync(
  outputFile,
  JSON.stringify(normalized, null, 2),
  "utf8"
);

const high =
  normalized.filter(
    (x) =>
      x.verification_status ===
      "high_confidence"
  );

const review =
  normalized.filter(
    (x) =>
      x.verification_status ===
      "review_recommended"
  );

const low =
  normalized.filter(
    (x) =>
      x.verification_status ===
      "needs_review"
  );

console.log("");
console.log("==========================================");
console.log(" FEE NORMALIZATION V2 COMPLETE");
console.log("==========================================");
console.log(`Audit blocks       : ${blocks.length}`);
console.log(`Normalized colleges: ${normalized.length}`);
console.log(`High confidence    : ${high.length}`);
console.log(`Review recommended : ${review.length}`);
console.log(`Needs review       : ${low.length}`);
console.log(`Output              : ${outputFile}`);
console.log("");

for (const item of normalized) {
  console.log("------------------------------------------");
  console.log(item.college_name);
  console.log(
    `Tuition/Sem : ${item.tuition_fee_per_semester ?? "N/A"}`
  );
  console.log(
    `First Sem   : ${item.first_semester_fee ?? "N/A"}`
  );
  console.log(
    `Hostel/Sem  : ${item.hostel_fee_per_semester ?? "N/A"}`
  );
  console.log(
    `Mess/Sem    : ${item.mess_fee_per_semester ?? "N/A"}`
  );
  console.log(
    `Annual Total: ${item.estimated_annual_total ?? "N/A"}`
  );
  console.log(
    `Course Total: ${item.estimated_course_total ?? "N/A"}`
  );
  console.log(
    `Confidence  : ${item.confidence_score}%`
  );
  console.log(
    `Status      : ${item.verification_status}`
  );
}
