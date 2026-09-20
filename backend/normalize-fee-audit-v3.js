import fs from "node:fs";
import path from "node:path";

const inputFile =
  process.argv[2] ||
  path.resolve(process.cwd(), "fee-normalization-audit.txt");

const outputFile =
  process.argv[3] ||
  path.resolve(process.cwd(), "fee-normalized-output-v3.json");

if (!fs.existsSync(inputFile)) {
  console.error("Input not found:", inputFile);
  process.exit(1);
}

const text = fs.readFileSync(inputFile, "utf8");

function num(v) {
  if (v == null) return null;

  const s = String(v)
    .replace(/₹/g, "")
    .replace(/Rs\.?/gi, "")
    .replace(/INR/gi, "")
    .replace(/,/g, "")
    .replace(/\/-/g, "")
    .replace(/[^\d.]/g, "");

  if (!s) return null;

  const n = Number(s);

  if (!Number.isFinite(n) || n <= 0) return null;

  return Math.round(n);
}

function isYear(n) {
  return Number.isInteger(n) && n >= 1990 && n <= 2100;
}

function moneyValues(line, min = 100, max = 5000000) {
  const matches =
    String(line || "").match(
      /(?:₹\s*)?\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|(?:₹\s*)?\d{4,}(?:\.\d+)?/g
    ) || [];

  return matches
    .map(num)
    .filter(
      n =>
        Number.isFinite(n) &&
        !isYear(n) &&
        n >= min &&
        n <= max
    );
}

function metadata(block, key) {
  const m = block.match(
    new RegExp(`^${key}:\\s*(.+)$`, "mi")
  );

  return m ? m[1].trim() : null;
}

function section(block, start, end) {
  const startIndex = block.indexOf(start);

  if (startIndex < 0) return "";

  const contentStart = startIndex + start.length;

  if (!end) {
    return block.slice(contentStart);
  }

  const endIndex = block.indexOf(end, contentStart);

  if (endIndex < 0) {
    return block.slice(contentStart);
  }

  return block.slice(contentStart, endIndex);
}

function directSection(block) {
  return section(
    block,
    "--- DIRECT TABLES ---",
    "--- PDF FEE LINES ---"
  );
}

function pdfSection(block) {
  return section(
    block,
    "--- PDF FEE LINES ---",
    "--- RELEVANT BLOCKS ---"
  );
}

function lines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);
}

function pipeCells(line) {
  return line
    .split("|")
    .map(x => x.trim());
}

function valueSeriesFromPipe(line, min = 100, max = 1000000) {
  const cells = pipeCells(line);
  const result = [];

  for (const cell of cells.slice(1)) {
    const values = moneyValues(cell, min, max);

    if (values.length) {
      result.push(values[0]);
    }
  }

  return result;
}

function findDirectFirstSemesterFee(direct) {
  const ls = lines(direct);

  /*
   * Handles:
   *
   * Category | First Semester Institute Fee |
   * GEN      | 178621 | ...
   * SC       | 178621 | ...
   */
  for (let i = 0; i < ls.length; i++) {
    if (!/first semester institute fee/i.test(ls[i])) {
      continue;
    }

    const headers = pipeCells(ls[i]);

    const feeIndex = headers.findIndex(
      x => /first semester institute fee/i.test(x)
    );

    if (feeIndex < 0) continue;

    const candidates = [];

    for (let j = i + 1; j < ls.length; j++) {
      if (/^TABLE\s+\d+/i.test(ls[j])) break;
      if (!ls[j].includes("|")) continue;

      const cells = pipeCells(ls[j]);

      if (!cells[feeIndex]) continue;

      const values = moneyValues(
        cells[feeIndex],
        5000,
        1000000
      );

      if (values.length) {
        candidates.push(values[0]);
      }
    }

    if (candidates.length) {
      const freq = new Map();

      for (const n of candidates) {
        freq.set(n, (freq.get(n) || 0) + 1);
      }

      return [...freq.entries()]
        .sort((a, b) => {
          if (b[1] !== a[1]) return b[1] - a[1];
          return b[0] - a[0];
        })[0][0];
    }
  }

  return null;
}

function findDirectSeries(direct, patterns, min, max) {
  const ls = lines(direct);

  const candidates = [];

  for (const line of ls) {
    if (!patterns.some(r => r.test(line))) {
      continue;
    }

    const values =
      valueSeriesFromPipe(line, min, max);

    if (values.length) {
      candidates.push({
        line,
        values
      });
    }
  }

  if (!candidates.length) return [];

  candidates.sort((a, b) =>
    b.values.length - a.values.length
  );

  return candidates[0].values;
}

function findDirectTuition(direct) {
  const ls = lines(direct);
  const values = [];

  for (const line of ls) {
    if (!/\btuition fees?\b/i.test(line)) continue;

    const series =
      valueSeriesFromPipe(line, 5000, 500000);

    for (const n of series) {
      if (!isYear(n)) values.push(n);
    }
  }

  if (!values.length) return null;

  const freq = new Map();

  for (const n of values) {
    freq.set(n, (freq.get(n) || 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0] - a[0];
    })[0][0];
}

function findDirectDeposit(direct) {
  const ls = lines(direct);

  for (const line of ls) {
    if (
      !/caution deposit.*refundable/i.test(line) &&
      !/refundable.*deposit/i.test(line)
    ) {
      continue;
    }

    const values =
      valueSeriesFromPipe(line, 1000, 200000);

    if (values.length) return values[0];
  }

  return null;
}

function findPdfMess(pdf) {
  const ls = lines(pdf);

  /*
   * Example:
   * Extra fee: Mess food charges: Rs. 21000 per semester
   */
  for (const line of ls) {
    if (
      /mess.*(?:charges?|fee)/i.test(line) &&
      /per\s*sem/i.test(line)
    ) {
      const values = moneyValues(
        line,
        3000,
        100000
      );

      if (values.length) {
        return values[values.length - 1];
      }
    }
  }

  return null;
}

function findPdfFullFeeSemesterSeries(pdf) {
  const ls = lines(pdf);

  /*
   * Useful for PDFs such as NIT Sikkim:
   *
   * Sub Total (Full Fee Payers)
   * 71,814 71,814 ... x8
   */
  for (const line of ls) {
    if (!/sub total \(full fee payers\)/i.test(line)) {
      continue;
    }

    const values = moneyValues(
      line,
      5000,
      500000
    );

    if (values.length >= 2) {
      return values;
    }
  }

  return [];
}

function findPdfFirstSemesterTotal(pdf) {
  const fullSeries =
    findPdfFullFeeSemesterSeries(pdf);

  if (fullSeries.length) {
    return fullSeries[0];
  }

  /*
   * Don't infer from arbitrary TOTAL lines.
   * Too risky because category columns often exist.
   */
  return null;
}

function safeAnnual(n) {
  if (
    !Number.isFinite(n) ||
    n < 10000 ||
    n > 1500000
  ) {
    return null;
  }

  return n;
}

function safeCourse(n) {
  if (
    !Number.isFinite(n) ||
    n < 50000 ||
    n > 10000000
  ) {
    return null;
  }

  return n;
}

function sum(arr) {
  if (!arr?.length) return null;

  return arr.reduce(
    (total, value) => total + value,
    0
  );
}

function firstTwo(arr) {
  if (!arr || arr.length < 2) return null;

  return arr[0] + arr[1];
}

function confidence(record) {
  let score = 0;

  if (record.source_url) score += 10;

  if (
    record.extraction_status ===
    "DIRECT_HTML_EXTRACTED"
  ) {
    score += 20;
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

  if (
    record.academic_semester_fee_series?.length >= 2
  ) {
    score += 10;
  }

  if (record.estimated_annual_total) score += 5;
  if (record.estimated_course_total) score += 5;

  return Math.min(score, 100);
}

const blocks = text
  .split(/={20,}/)
  .map(x => x.trim())
  .filter(x => /^COLLEGE:/m.test(x));

const output = [];

for (const block of blocks) {
  const college =
    metadata(block, "COLLEGE");

  if (!college) continue;

  const direct =
    directSection(block);

  const pdf =
    pdfSection(block);

  const status =
    metadata(block, "STATUS");

  const directTuition =
    findDirectTuition(direct);

  const directFirst =
    findDirectFirstSemesterFee(direct);

  const academicSeries =
    findDirectSeries(
      direct,
      [
        /^a\s*\|\s*sub total a/i,
        /\|\s*sub total a\s*\|/i
      ],
      5000,
      1000000
    );

  const hostelSeries =
    findDirectSeries(
      direct,
      [
        /^\d+\s*\|\s*hostel fee\s*\|/i,
        /^hostel fee\s*\|/i
      ],
      3000,
      300000
    );

  const messSeries =
    findDirectSeries(
      direct,
      [
        /^\d+\s*\|\s*mess fees?\b/i,
        /^mess fees?\s*\|/i
      ],
      3000,
      200000
    );

  const combinedSeries =
    findDirectSeries(
      direct,
      [
        /total with transport fee \(inside campus\)/i,
        /total \(inside campus transport\)/i,
        /total with hostel fee \(inside campus\)/i
      ],
      10000,
      1000000
    );

  const pdfAcademicSeries =
    findPdfFullFeeSemesterSeries(pdf);

  let firstSemesterFee =
    directFirst ||
    academicSeries[0] ||
    findPdfFirstSemesterTotal(pdf) ||
    null;

  let tuition =
    directTuition || null;

  let hostel =
    hostelSeries[0] || null;

  let mess =
    messSeries[0] ||
    findPdfMess(pdf) ||
    null;

  /*
   * When PDF exposes full-fee semester total but not
   * a safely aligned tuition row, save it as academic
   * semester fee, NOT as tuition.
   */
  const finalAcademicSeries =
    academicSeries.length
      ? academicSeries
      : pdfAcademicSeries;

  const annualAcademic =
    safeAnnual(
      firstTwo(finalAcademicSeries)
    );

  const annualHostel =
    safeAnnual(
      firstTwo(hostelSeries)
    );

  const annualMess =
    mess
      ? safeAnnual(mess * 2)
      : safeAnnual(firstTwo(messSeries));

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

  let estimatedAnnualTotal =
    safeAnnual(
      firstTwo(combinedSeries)
    );

  /*
   * If no explicit combined total exists,
   * derive only when academic + hostel/mess
   * are independently available.
   */
  if (
    estimatedAnnualTotal == null &&
    annualAcademic != null &&
    annualHostelMess != null
  ) {
    estimatedAnnualTotal =
      safeAnnual(
        annualAcademic +
        annualHostelMess
      );
  }

  const estimatedCourseTotal =
    combinedSeries.length >= 4
      ? safeCourse(sum(combinedSeries))
      : null;

  /*
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

  const record = {
    college_name: college,

    source_type:
      metadata(block, "TYPE"),

    extraction_status:
      status,

    source_url:
      metadata(block, "SOURCE"),

    tuition_fee_per_semester:
      tuition,

    first_semester_fee:
      firstSemesterFee,

    /*
     * STRICT SEMANTICS:
     * Academic fee must represent academic/institute charges only.
     *
     * NEVER fall back to firstSemesterFee because first-semester
     * payable may contain hostel, mess, deposits or one-time charges.
     */
    academic_fee_per_semester:
      finalAcademicSeries[0] ??
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
      findDirectDeposit(direct),

    academic_semester_fee_series:
      finalAcademicSeries.length
        ? finalAcademicSeries
        : null,

    semester_fee_series:
      combinedSeries.length
        ? combinedSeries
        : null,

    josaa_csab_adjustment: null,

    balance_payable_after_adjustment: null,

    confidence_score: 0,

    verification_status:
      "needs_review",

    normalization_notes: []
  };

  if (pdfAcademicSeries.length) {
    record.normalization_notes.push(
      "Academic semester total extracted from PDF full-fee-payer subtotal; not assumed to be tuition fee."
    );
  }

  if (
    status === "INSUFFICIENT_TEXT_REVIEW"
  ) {
    record.normalization_notes.push(
      "Source text unavailable/incomplete. Automatic fee import disabled."
    );
  }

  if (
    status === "TEXT_EXTRACTED" &&
    !direct.trim()
  ) {
    record.normalization_notes.push(
      "PDF extraction used; category-specific values require caution."
    );
  }

  record.confidence_score =
    confidence(record);

  if (
    status === "INSUFFICIENT_TEXT_REVIEW"
  ) {
    record.verification_status =
      "needs_review";
  } else if (
    record.confidence_score >= 75
  ) {
    record.verification_status =
      "high_confidence";
  } else if (
    record.confidence_score >= 40
  ) {
    record.verification_status =
      "review_recommended";
  }

  output.push(record);
}

fs.writeFileSync(
  outputFile,
  JSON.stringify(output, null, 2),
  "utf8"
);

console.log("");
console.log("==========================================");
console.log(" FEE NORMALIZATION V3 COMPLETE");
console.log("==========================================");
console.log("Audit blocks       :", blocks.length);
console.log("Normalized records :", output.length);
console.log(
  "High confidence    :",
  output.filter(
    x => x.verification_status === "high_confidence"
  ).length
);
console.log(
  "Review recommended :",
  output.filter(
    x => x.verification_status === "review_recommended"
  ).length
);
console.log(
  "Needs review       :",
  output.filter(
    x => x.verification_status === "needs_review"
  ).length
);
console.log("");

for (const x of output) {
  console.log("----------------------------------------");
  console.log(x.college_name);
  console.log(
    "Tuition/Sem :",
    x.tuition_fee_per_semester ?? "N/A"
  );
  console.log(
    "Academic/Sem:",
    x.academic_fee_per_semester ?? "N/A"
  );
  console.log(
    "First Sem   :",
    x.first_semester_fee ?? "N/A"
  );
  console.log(
    "Hostel/Sem  :",
    x.hostel_fee_per_semester ?? "N/A"
  );
  console.log(
    "Mess/Sem    :",
    x.mess_fee_per_semester ?? "N/A"
  );
  console.log(
    "Annual Total:",
    x.estimated_annual_total ?? "N/A"
  );
  console.log(
    "Confidence  :",
    `${x.confidence_score}%`
  );
  console.log(
    "Status      :",
    x.verification_status
  );
}
