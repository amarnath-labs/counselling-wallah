import fs from 'node:fs';

const INPUT =
  './btech-fee-detailed-raw.json';

const DONE = new Set([
  'national-institute-of-technology-delhi',
  'indian-institute-of-technology-mandi',
  'atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior',
  'indian-institute-of-information-technology-allahabad',
  'indian-institute-of-information-technology-design-manufacturing-kancheepuram',
  'national-institute-of-technology-mizoram',
  'national-institute-of-technology-sikkim',
  'national-institute-of-technology-rourkela'
]);

function loadJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

function textOf(row) {
  const parts = [];

  for (
    const signal
    of row.fee_signals || []
  ) {
    parts.push(
      signal.line || ''
    );

    parts.push(
      signal.context || ''
    );
  }

  return parts
    .join(' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getAmounts(row) {
  const values = [];

  for (
    const value
    of row.all_amounts || []
  ) {
    const n =
      Number(
        String(value)
          .replace(/[₹,\s]/g, '')
      );

    if (
      Number.isFinite(n) &&
      n >= 0
    ) {
      values.push(n);
    }
  }

  return [
    ...new Set(values)
  ].sort(
    (a, b) => a - b
  );
}

function detect(row) {
  const text =
    textOf(row);

  const amounts =
    getAmounts(row);

  const signals =
    (row.fee_signals || [])
      .length;

  const hasBtech =
    /\bb\.?\s*tech\b|\bbtech\b|bachelor of technology/.test(
      text
    ) ||
    row.btech_relevant === true;

  const hasTuition =
    /tuition\s*fee|tuition/.test(
      text
    );

  const hasSemester =
    /semester|sem\s*[1-8]|1st\s*sem|first\s*semester/.test(
      text
    );

  const hasHostel =
    /hostel|hosteller|hosteller|seat\s*rent|room\s*rent/.test(
      text
    );

  const hasMess =
    /mess|dining|food\s*charge/.test(
      text
    );

  const hasIncome =
    /income|family\s*income|parental\s*income|1\s*lakh|5\s*lakh|100000|500000/.test(
      text
    );

  const hasCategory =
    /sc\/st|sc\s*\/\s*st|obc|ews|pwd|ph\b|category/.test(
      text
    );

  const hasTotal =
    /grand\s*total|total\s*fee|total\s*\(|total\b/.test(
      text
    );

  const hasAdmission =
    /admission\s*fee|admission\s*charge/.test(
      text
    );

  const hasCaution =
    /caution|refundable|security\s*deposit/.test(
      text
    );

  const foreignSignals =
    /dasa|ciwg|foreign|international|non[\s-]*saarc|saarc|study in india/.test(
      text
    );

  let score = 0;

  if (hasBtech) score += 20;
  if (hasTuition) score += 20;
  if (hasSemester) score += 10;
  if (hasHostel) score += 10;
  if (hasMess) score += 5;
  if (hasIncome) score += 10;
  if (hasCategory) score += 5;
  if (hasTotal) score += 10;
  if (hasAdmission) score += 5;
  if (hasCaution) score += 5;

  if (signals >= 5) {
    score += 5;
  }

  if (amounts.length >= 5) {
    score += 5;
  }

  score =
    Math.min(
      score,
      100
    );

  let status;

  if (
    hasBtech &&
    hasTuition &&
    signals >= 3 &&
    amounts.length >= 3 &&
    score >= 60
  ) {
    status =
      'AUTO_READY';
  } else if (
    signals > 0 ||
    amounts.length > 0
  ) {
    status =
      'REVIEW';
  } else {
    status =
      'SOURCE_REQUIRED';
  }

  return {
    college_id:
      row.college_id,

    name:
      row.name,

    status,

    score,

    signals,

    amounts:
      amounts.length,

    btech:
      hasBtech,

    tuition:
      hasTuition,

    semester:
      hasSemester,

    hostel:
      hasHostel,

    mess:
      hasMess,

    income:
      hasIncome,

    category:
      hasCategory,

    total:
      hasTotal,

    admission:
      hasAdmission,

    caution:
      hasCaution,

    foreign_mixed:
      foreignSignals,

    source_url:
      row.resolved_source_url ||
      row.original_source_url ||
      null
  };
}

function main() {
  const raw =
    loadJson(INPUT);

  const remaining =
    raw.filter(
      row =>
        !DONE.has(
          row.college_id
        )
    );

  const results =
    remaining
      .map(detect)
      .sort(
        (a, b) =>
          b.score -
          a.score
      );

  const auto =
    results.filter(
      r =>
        r.status ===
        'AUTO_READY'
    );

  const review =
    results.filter(
      r =>
        r.status ===
        'REVIEW'
    );

  const sourceRequired =
    results.filter(
      r =>
        r.status ===
        'SOURCE_REQUIRED'
    );

  fs.writeFileSync(
    './btech-fees-batch-classification.json',
    JSON.stringify(
      results,
      null,
      2
    ),
    'utf8'
  );

  fs.writeFileSync(
    './btech-fees-auto-ready-v2.json',
    JSON.stringify(
      auto,
      null,
      2
    ),
    'utf8'
  );

  fs.writeFileSync(
    './btech-fees-review-v2.json',
    JSON.stringify(
      review,
      null,
      2
    ),
    'utf8'
  );

  fs.writeFileSync(
    './btech-fees-source-required.json',
    JSON.stringify(
      sourceRequired,
      null,
      2
    ),
    'utf8'
  );

  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'BTECH FEE BATCH CLASSIFIER V2'
  );

  console.log(
    '======================================='
  );

  console.log('');

  console.table([
    {
      status:
        'Raw colleges',
      count:
        raw.length
    },
    {
      status:
        'Already completed',
      count:
        raw.length -
        remaining.length
    },
    {
      status:
        'Remaining',
      count:
        remaining.length
    },
    {
      status:
        'AUTO_READY',
      count:
        auto.length
    },
    {
      status:
        'REVIEW',
      count:
        review.length
    },
    {
      status:
        'SOURCE_REQUIRED',
      count:
        sourceRequired.length
    }
  ]);

  console.log('');
  console.log(
    'AUTO READY'
  );

  console.table(
    auto.map(
      r => ({
        college:
          r.name,

        score:
          r.score,

        signals:
          r.signals,

        amounts:
          r.amounts,

        tuition:
          r.tuition,

        semester:
          r.semester,

        hostel:
          r.hostel,

        mess:
          r.mess,

        foreign:
          r.foreign_mixed
      })
    )
  );

  console.log('');
  console.log(
    'REVIEW'
  );

  console.table(
    review.map(
      r => ({
        college:
          r.name,

        score:
          r.score,

        signals:
          r.signals,

        amounts:
          r.amounts
      })
    )
  );

  console.log('');
  console.log(
    'SOURCE REQUIRED'
  );

  console.table(
    sourceRequired.map(
      r => ({
        college:
          r.name,

        score:
          r.score
      })
    )
  );

  console.log('');

  console.log(
    'Saved: ./btech-fees-batch-classification.json'
  );

  console.log(
    'Saved: ./btech-fees-auto-ready-v2.json'
  );

  console.log(
    'Saved: ./btech-fees-review-v2.json'
  );

  console.log(
    'Saved: ./btech-fees-source-required.json'
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main();
