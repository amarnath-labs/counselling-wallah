import fs from 'node:fs';

const INPUT =
  './fee-pilot-batch-01-current-source-extraction.json';

const OUTPUT =
  './fee-pilot-batch-01-normalized-preview.json';

const REVIEW_OUTPUT =
  './fee-pilot-batch-01-normalization-review.json';

function loadJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

function money(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const n =
    Number(
      String(value)
        .replace(/[₹,\s]/g, '')
    );

  return Number.isFinite(n)
    ? n
    : null;
}

function textOf(row) {
  const parts = [];

  for (
    const table
    of row.tables || []
  ) {
    for (
      const tr
      of table.rows || []
    ) {
      parts.push(
        tr.join(' | ')
      );
    }
  }

  for (
    const block
    of row.text_blocks || []
  ) {
    parts.push(
      block.text || ''
    );
  }

  return parts
    .join('\n')
    .replace(/\s+/g, ' ');
}

function extractAllAmounts(text) {
  const matches =
    String(text || '')
      .match(
        /(?:₹|Rs\.?|INR)?\s*\d[\d,]{3,}(?:\.\d+)?/gi
      ) || [];

  return [
    ...new Set(
      matches
        .map(money)
        .filter(
          n =>
            n !== null &&
            n >= 0
        )
    )
  ].sort(
    (a, b) =>
      a - b
  );
}

function findAmountNear(
  text,
  patterns,
  maxDistance = 120
) {
  const lower =
    String(text || '')
      .toLowerCase();

  for (
    const pattern
    of patterns
  ) {
    const regex =
      new RegExp(
        pattern,
        'i'
      );

    const match =
      regex.exec(
        lower
      );

    if (!match) {
      continue;
    }

    const start =
      Math.max(
        0,
        match.index -
        20
      );

    const end =
      Math.min(
        text.length,
        match.index +
        maxDistance
      );

    const chunk =
      text.slice(
        start,
        end
      );

    const amounts =
      extractAllAmounts(
        chunk
      );

    if (
      amounts.length > 0
    ) {
      return amounts[0];
    }
  }

  return null;
}

function detectPeriod(text) {
  const lower =
    text.toLowerCase();

  if (
    /per semester|semester fee|each semester/.test(
      lower
    )
  ) {
    return 'semester';
  }

  if (
    /per annum|annual fee|yearly|per year/.test(
      lower
    )
  ) {
    return 'annual';
  }

  return 'unknown';
}

function normalizeCollege(row) {
  const text =
    textOf(row);

  const lower =
    text.toLowerCase();

  const tuition =
    findAmountNear(
      text,
      [
        'tuition fee',
        'tuition'
      ]
    );

  const admission =
    findAmountNear(
      text,
      [
        'admission fee',
        'admission charge',
        'registration fee'
      ]
    );

  const hostel =
    findAmountNear(
      text,
      [
        'hostel fee',
        'hostel charges',
        'hostel'
      ]
    );

  const mess =
    findAmountNear(
      text,
      [
        'mess fee',
        'mess charges',
        'mess'
      ]
    );

  const caution =
    findAmountNear(
      text,
      [
        'caution deposit',
        'security deposit',
        'refundable'
      ]
    );

  const total =
    findAmountNear(
      text,
      [
        'grand total',
        'total fee',
        'total amount',
        'total'
      ],
      180
    );

  const feePeriod =
    detectPeriod(
      text
    );

  const allAmounts =
    extractAllAmounts(
      text
    );

  let score = 0;
  const reasons = [];

  if (row.btech_detected) {
    score += 15;
    reasons.push('btech_detected');
  }

  if (tuition !== null) {
    score += 25;
    reasons.push('tuition_found');
  }

  if (total !== null) {
    score += 20;
    reasons.push('total_found');
  }

  if (hostel !== null) {
    score += 10;
    reasons.push('hostel_found');
  }

  if (mess !== null) {
    score += 10;
    reasons.push('mess_found');
  }

  if (admission !== null) {
    score += 5;
    reasons.push('admission_found');
  }

  if (caution !== null) {
    score += 5;
    reasons.push('caution_found');
  }

  if (
    feePeriod !==
    'unknown'
  ) {
    score += 10;
    reasons.push(
      `period_${feePeriod}`
    );
  }

  score =
    Math.min(
      score,
      100
    );

  let status;

  if (
    score >= 80 &&
    tuition !== null &&
    total !== null
  ) {
    status =
      'AUTO_READY';

  } else if (
    score >= 50
  ) {
    status =
      'REVIEW';

  } else {
    status =
      'INSUFFICIENT';
  }

  return {
    college_id:
      row.college_id,

    college_name:
      row.college_name,

    academic_year:
      row.academic_year,

    source_url:
      row.source_url,

    source_type:
      row.source_type,

    fee_period:
      feePeriod,

    normalized: {
      tuition_fee:
        tuition,

      admission_fee:
        admission,

      hostel_fee:
        hostel,

      mess_fee:
        mess,

      caution_deposit:
        caution,

      total_fee:
        total
    },

    all_amounts:
      allAmounts,

    confidence_score:
      score,

    status,

    reasons
  };
}

function main() {
  const rows =
    loadJson(INPUT);

  const normalized =
    rows.map(
      normalizeCollege
    );

  const ready =
    normalized.filter(
      row =>
        row.status ===
        'AUTO_READY'
    );

  const review =
    normalized.filter(
      row =>
        row.status !==
        'AUTO_READY'
    );

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      ready,
      null,
      2
    ),
    'utf8'
  );

  fs.writeFileSync(
    REVIEW_OUTPUT,
    JSON.stringify(
      review,
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
    'GENERIC FEE NORMALIZER PILOT'
  );

  console.log(
    '======================================='
  );

  console.log('');

  console.table(
    normalized.map(
      row => ({
        college:
          row.college_name,

        year:
          row.academic_year,

        period:
          row.fee_period,

        tuition:
          row.normalized
            .tuition_fee,

        admission:
          row.normalized
            .admission_fee,

        hostel:
          row.normalized
            .hostel_fee,

        mess:
          row.normalized
            .mess_fee,

        caution:
          row.normalized
            .caution_deposit,

        total:
          row.normalized
            .total_fee,

        score:
          row.confidence_score,

        status:
          row.status
      })
    )
  );

  console.log('');

  console.log(
    'AUTO READY:',
    ready.length
  );

  console.log(
    'REVIEW / INSUFFICIENT:',
    review.length
  );

  console.log('');

  console.log(
    'Saved:',
    OUTPUT
  );

  console.log(
    'Saved:',
    REVIEW_OUTPUT
  );

  console.log('');

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main();
