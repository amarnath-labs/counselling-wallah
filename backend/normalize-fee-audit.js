import fs from "node:fs";
import path from "node:path";

const inputFile =
  process.argv[2] ||
  path.resolve(process.cwd(), "fee-normalization-audit.txt");

const outputFile =
  process.argv[3] ||
  path.resolve(process.cwd(), "fee-normalized-output.json");

if (!fs.existsSync(inputFile)) {
  console.error(`Input file not found: ${inputFile}`);
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

  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }

  return Math.round(n);
}

function extractAmounts(line) {
  if (!line) return [];

  const matches =
    line.match(
      /(?:₹\s*)?\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|(?:₹\s*)?\d{4,}(?:\.\d+)?/g
    ) || [];

  return matches
    .map(cleanNumber)
    .filter((n) => Number.isFinite(n) && n > 0);
}

function getMetadata(block, key) {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, "mi");
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

function getLines(block) {
  return block
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findCandidateLines(lines, patterns) {
  return lines.filter((line) =>
    patterns.some((pattern) => pattern.test(line))
  );
}

function findBestSemesterRow(lines, patterns) {
  const candidates = findCandidateLines(lines, patterns)
    .map((line) => ({
      line,
      values: extractAmounts(line),
    }))
    .filter((item) => item.values.length > 0)
    .sort((a, b) => {
      // Prefer full semester rows.
      if (b.values.length !== a.values.length) {
        return b.values.length - a.values.length;
      }

      return a.line.length - b.line.length;
    });

  return candidates[0] || null;
}

function findFirstSemesterInstituteFee(lines) {
  const preferred = lines.filter(
    (line) =>
      /first semester institute fee/i.test(line) &&
      !/balance payable/i.test(line)
  );

  for (const line of preferred) {
    const values = extractAmounts(line);

    if (values.length) {
      return values[0];
    }
  }

  /*
   * Rows such as:
   * Total (A) | 1,69,720
   *
   * are usable as first semester academic/institute total only
   * when there isn't a clearer "First Semester Institute Fee".
   */
  const totalA = lines
    .filter(
      (line) =>
        /^total\s*\(a\)/i.test(line) ||
        /\|\s*total\s*\(a\)\s*\|/i.test(line)
    )
    .map((line) => ({
      line,
      values: extractAmounts(line),
    }))
    .find((item) => item.values.length === 1);

  return totalA?.values?.[0] ?? null;
}

function findTuitionFee(lines) {
  const result = findBestSemesterRow(lines, [
    /^\d*\s*\|?\s*tuition fees?\b/i,
    /\|\s*tuition fees?\s*\|/i,
    /^tuition fees?\s*\|/i,
  ]);

  return result?.values?.[0] ?? null;
}

function findSemesterSeries(lines, patterns) {
  const result = findBestSemesterRow(lines, patterns);

  if (!result || result.values.length < 2) {
    return [];
  }

  return result.values;
}

function safeSum(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  const valid = values.filter(
    (value) => Number.isFinite(value) && value >= 0
  );

  if (!valid.length) return null;

  return valid.reduce((sum, value) => sum + value, 0);
}

function firstTwo(values) {
  if (!Array.isArray(values) || values.length < 2) {
    return null;
  }

  return safeSum(values.slice(0, 2));
}

function findJosaaAdjustment(lines) {
  for (const line of lines) {
    if (
      /josaa.*adjustment/i.test(line) ||
      /seat acceptance.*fee/i.test(line)
    ) {
      const values = extractAmounts(line);

      /*
       * Don't treat this as college fee.
       * We keep it separately only for auditing.
       */
      if (values.length) {
        return values[0];
      }
    }
  }

  return null;
}

function findBalancePayable(lines) {
  const candidates = lines.filter((line) =>
    /balance (?:fees?|payable)/i.test(line)
  );

  for (const line of candidates) {
    const values = extractAmounts(line);

    if (values.length) {
      return values[values.length - 1];
    }
  }

  return null;
}

function findRefundableDeposit(lines) {
  const result = findBestSemesterRow(lines, [
    /caution deposit.*refundable/i,
    /refundable.*deposit/i,
  ]);

  return result?.values?.[0] ?? null;
}

function findCombinedSemesterTotals(lines) {
  const priorityPatterns = [
    /total with transport fee \(inside campus\)/i,
    /total \(inside campus transport\)/i,
    /total with transport fee \(outside campus\)/i,
    /total \(outside campus transport\)/i,
  ];

  for (const pattern of priorityPatterns) {
    const matches = lines
      .filter((line) => pattern.test(line))
      .map((line) => ({
        line,
        values: extractAmounts(line),
      }))
      .filter((item) => item.values.length >= 2)
      .sort((a, b) => b.values.length - a.values.length);

    if (matches.length) {
      return {
        label: matches[0].line,
        values: matches[0].values,
      };
    }
  }

  return {
    label: null,
    values: [],
  };
}

function confidenceFor(record) {
  let score = 0;

  if (record.source_url) score += 10;
  if (record.extraction_status === "DIRECT_HTML_EXTRACTED") score += 15;

  if (record.tuition_fee_per_semester) score += 20;
  if (record.first_semester_fee) score += 20;
  if (record.hostel_fee_per_semester) score += 10;
  if (record.mess_fee_per_semester) score += 10;
  if (record.estimated_annual_total) score += 10;
  if (record.estimated_course_total) score += 5;

  return Math.min(score, 100);
}

const rawBlocks = text
  .split(/={20,}/)
  .map((block) => block.trim())
  .filter((block) => /^COLLEGE:/m.test(block));

const normalized = [];

for (const block of rawBlocks) {
  const college = getMetadata(block, "COLLEGE");

  if (!college) continue;

  const lines = getLines(block);

  const tuitionSeries = findSemesterSeries(lines, [
    /^\d*\s*\|?\s*tuition fees?\b/i,
    /\|\s*tuition fees?\s*\|/i,
    /^tuition fees?\s*\|/i,
  ]);

  const hostelSeries = findSemesterSeries(lines, [
    /^\d*\s*\|?\s*hostel fee\b/i,
    /\|\s*hostel fee\s*\|/i,
    /^hostel fee\s*\|/i,
  ]);

  const messSeries = findSemesterSeries(lines, [
    /mess fees?.*semester/i,
    /^\d*\s*\|?\s*mess fees?\b/i,
    /\|\s*mess fees?\s*\|/i,
    /^mess fees?\s*\|/i,
  ]);

  const academicSubtotalSeries = findSemesterSeries(lines, [
    /\|\s*sub total a\s*\|/i,
    /^a\s*\|\s*sub total a/i,
    /^sub total a\s*\|/i,
  ]);

  const combined = findCombinedSemesterTotals(lines);

  const firstSemesterFee =
    findFirstSemesterInstituteFee(lines) ||
    academicSubtotalSeries[0] ||
    null;

  const tuitionFee =
    tuitionSeries[0] ||
    findTuitionFee(lines) ||
    null;

  const hostelFee =
    hostelSeries[0] ||
    null;

  const messFee =
    messSeries[0] ||
    null;

  const estimatedAnnualAcademic =
    firstTwo(academicSubtotalSeries);

  const annualHostel =
    firstTwo(hostelSeries);

  const annualMess =
    firstTwo(messSeries);

  const annualHostelMess =
    annualHostel != null || annualMess != null
      ? (annualHostel || 0) + (annualMess || 0)
      : null;

  const estimatedAnnualTotal =
    firstTwo(combined.values);

  const estimatedCourseTotal =
    combined.values.length >= 4
      ? safeSum(combined.values)
      : null;

  const record = {
    college_name: college,

    source_type:
      getMetadata(block, "TYPE"),

    extraction_status:
      getMetadata(block, "STATUS"),

    source_url:
      getMetadata(block, "SOURCE"),

    tuition_fee_per_semester:
      tuitionFee,

    first_semester_fee:
      firstSemesterFee,

    academic_fee_per_semester:
      academicSubtotalSeries[0] || firstSemesterFee,

    hostel_fee_per_semester:
      hostelFee,

    mess_fee_per_semester:
      messFee,

    annual_academic_fee:
      estimatedAnnualAcademic,

    annual_hostel_mess_fee:
      annualHostelMess,

    estimated_annual_total:
      estimatedAnnualTotal,

    estimated_course_total:
      estimatedCourseTotal,

    refundable_deposit:
      findRefundableDeposit(lines),

    josaa_csab_adjustment:
      findJosaaAdjustment(lines),

    balance_payable_after_adjustment:
      findBalancePayable(lines),

    semester_fee_series:
      combined.values.length
        ? combined.values
        : null,

    normalization_notes: [],

    verification_status:
      "needs_review",
  };

  if (
    record.first_semester_fee &&
    record.balance_payable_after_adjustment &&
    record.first_semester_fee !==
      record.balance_payable_after_adjustment
  ) {
    record.normalization_notes.push(
      "Balance payable kept separate from actual first-semester fee."
    );
  }

  if (record.josaa_csab_adjustment) {
    record.normalization_notes.push(
      "JoSAA/CSAB payment detected and excluded from normalized college fee."
    );
  }

  if (record.estimated_course_total) {
    record.normalization_notes.push(
      "Course total calculated from semester-wise combined totals."
    );
  }

  record.confidence_score =
    confidenceFor(record);

  if (record.confidence_score >= 75) {
    record.verification_status =
      "high_confidence";
  } else if (record.confidence_score >= 50) {
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

console.log("");
console.log("========================================");
console.log(" FEE NORMALIZATION COMPLETE");
console.log("========================================");
console.log(`Audit blocks      : ${rawBlocks.length}`);
console.log(`Normalized colleges: ${normalized.length}`);
console.log(`Output            : ${outputFile}`);
console.log("");

const high =
  normalized.filter(
    (x) => x.verification_status === "high_confidence"
  ).length;

const review =
  normalized.filter(
    (x) =>
      x.verification_status === "review_recommended"
  ).length;

const low =
  normalized.filter(
    (x) => x.verification_status === "needs_review"
  ).length;

console.log(`High confidence   : ${high}`);
console.log(`Review recommended: ${review}`);
console.log(`Needs review      : ${low}`);
console.log("");

for (const item of normalized.slice(0, 10)) {
  console.log("----------------------------------------");
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
}
