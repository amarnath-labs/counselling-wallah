import fs from 'node:fs/promises';

const INPUT =
  './btech-fee-detailed-raw.json';

const AUTO_OUTPUT =
  './btech-fees-auto-ready.json';

const REVIEW_OUTPUT =
  './btech-fees-review.json';

const FAILED_OUTPUT =
  './btech-fees-failed.json';

const SUMMARY_OUTPUT =
  './btech-fees-normalization-summary.json';

/*
|--------------------------------------------------------------------------
| ALREADY IMPORTED
|--------------------------------------------------------------------------
*/

const DONE = new Set([
  'national-institute-of-technology-delhi',

  'indian-institute-of-technology-mandi',

  'atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior',

  'indian-institute-of-information-technology-allahabad',

  'indian-institute-of-information-technology-design-manufacturing-kancheepuram'
]);

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeText(value) {
  return String(
    value || ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function buildText(row) {
  return (
    row.fee_signals || []
  )
    .map(
      signal =>
        `${signal.line || ''} ${signal.context || ''}`
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function moneyValues(row) {
  return [
    ...new Set(
      (row.all_amounts || [])
        .filter(
          value =>
            Number.isFinite(value) &&
            value >= 0
        )
    )
  ].sort(
    (a, b) =>
      a - b
  );
}

function detectSemesters(text) {
  const found =
    new Set();

  const regex =
    /(?:^|\D)(1st|2nd|3rd|[4-9]th|10th)\s*semester|(?:^|\D)([1-9]|10)(?:st|nd|rd|th)?\s*sem(?:ester)?/gi;

  let match;

  while (
    (
      match =
        regex.exec(text)
    ) !== null
  ) {
    const raw =
      match[1] ||
      match[2];

    if (!raw) {
      continue;
    }

    const number =
      Number(
        raw.replace(
          /\D/g,
          ''
        )
      );

    if (
      Number.isFinite(number)
    ) {
      found.add(number);
    }
  }

  return [
    ...found
  ].sort(
    (a, b) =>
      a - b
  );
}

function hasPattern(
  text,
  pattern
) {
  return pattern.test(text);
}

function extractTuitionCandidates(
  row
) {
  const candidates =
    [];

  for (
    const signal
    of row.fee_signals || []
  ) {
    const text =
      normalizeText(
        `${signal.line || ''} ${signal.context || ''}`
      );

    const regex =
      /tuition\s*fee[^0-9$₹]{0,30}(?:rs\.?|inr|₹|\$)?\s*([\d,]+)/gi;

    let match;

    while (
      (
        match =
          regex.exec(text)
      ) !== null
    ) {
      const value =
        Number(
          match[1]
            .replace(
              /,/g,
              ''
            )
        );

      if (
        Number.isFinite(value)
      ) {
        candidates.push(
          value
        );
      }
    }
  }

  return [
    ...new Set(
      candidates
    )
  ].sort(
    (a, b) =>
      a - b
  );
}

function extractExactAmount(
  text,
  pattern
) {
  const match =
    text.match(pattern);

  if (!match) {
    return null;
  }

  const value =
    Number(
      String(
        match[1]
      ).replace(
        /,/g,
        ''
      )
    );

  return Number.isFinite(value)
    ? value
    : null;
}

/*
|--------------------------------------------------------------------------
| FEATURE DETECTION
|--------------------------------------------------------------------------
*/

function analyze(row) {
  const text =
    buildText(row);

  const lower =
    text.toLowerCase();

  const semesters =
    detectSemesters(text);

  const tuitionCandidates =
    extractTuitionCandidates(row);

  const features = {
    btech:
      row.btech_relevant === true ||
      /\bb\.?\s*tech\b/i.test(text),

    scope:
      row.fee_scope_candidate ||
      'needs_review',

    tuition:
      /\btuition\s*fee\b/i.test(text),

    admission:
      /\badmission\s*fee\b/i.test(text),

    hostel:
      /\bhostel\b/i.test(text),

    mess:
      /\bmess\b|\bdining\b/i.test(text),

    total:
      /\btotal\s*:|\btotal\s+fee\b|\bgrand\s+total\b/i.test(text),

    caution:
      /\bcaution\b/i.test(text),

    annual:
      /\bannual\b/i.test(text),

    semester:
      /\bsemester\b|\bsem\b/i.test(text),

    category:
      /\bsc\b|\bst\b|\bobc\b|\bews\b|\bpwd\b|\bph\b/i.test(text),

    incomeRule:
      /\bincome\b|\b1\s*lakh\b|\b5\s*lakh\b/i.test(text),

    exemption:
      /\bexempt|\bremission|\bwaiver/i.test(text),

    foreign:
      /\bdasa\b|\bsaarc\b|\bnon[- ]?saarc\b|\bciwg\b|\bstudy in india\b|\busd\b/i.test(text),

    amounts:
      moneyValues(row).length,

    signals:
      (
        row.fee_signals ||
        []
      ).length,

    semesters,

    tuitionCandidates
  };

  /*
  |--------------------------------------------------------------------------
  | SPECIAL SAFE EXTRACTIONS
  |--------------------------------------------------------------------------
  */

  const extracted = {
    admission_fee:
      extractExactAmount(
        text,
        /admission\s*fee(?:\s*\([^)]*\))?[^0-9]{0,20}([\d,]+)/i
      ),

    hostel_fee_candidate:
      extractExactAmount(
        text,
        /hostel\s+(?:seat\s+)?rent[^0-9]{0,20}([\d,]+)/i
      ),

    mess_fee_candidate:
      extractExactAmount(
        text,
        /mess\s+(?:advance|fee|charges)?[^0-9]{0,20}([\d,]+)/i
      ),

    caution_deposit:
      extractExactAmount(
        text,
        /caution\s+money[^0-9]{0,30}([\d,]+)/i
      )
  };

  /*
  |--------------------------------------------------------------------------
  | CONFIDENCE SCORE
  |--------------------------------------------------------------------------
  */

  let score = 0;

  if (features.btech) {
    score += 15;
  }

  if (features.tuition) {
    score += 15;
  }

  if (features.hostel) {
    score += 10;
  }

  if (features.mess) {
    score += 10;
  }

  if (features.total) {
    score += 10;
  }

  if (features.admission) {
    score += 5;
  }

  if (features.caution) {
    score += 5;
  }

  if (features.semester) {
    score += 10;
  }

  if (
    features.semesters.length >= 2
  ) {
    score += 10;
  }

  if (
    features.tuitionCandidates.length >= 1
  ) {
    score += 5;
  }

  if (
    features.signals >= 5
  ) {
    score += 5;
  }

  /*
  | Foreign fee structures mixed into the
  | same source make automatic domestic
  | normalization less safe.
  */

  if (features.foreign) {
    score -= 10;
  }

  score =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    );

  let status;

  if (
    !features.btech ||
    features.signals === 0
  ) {
    status =
      'failed';
  } else if (
    score >= 65 &&
    features.tuition &&
    (
      features.total ||
      features.hostel
    )
  ) {
    status =
      'auto_ready';
  } else {
    status =
      'review';
  }

  /*
  |--------------------------------------------------------------------------
  | REASONS
  |--------------------------------------------------------------------------
  */

  const reasons = [];

  if (features.tuition) {
    reasons.push(
      'tuition_detected'
    );
  }

  if (features.hostel) {
    reasons.push(
      'hostel_detected'
    );
  }

  if (features.mess) {
    reasons.push(
      'mess_detected'
    );
  }

  if (features.total) {
    reasons.push(
      'total_detected'
    );
  }

  if (
    features.semesters.length > 0
  ) {
    reasons.push(
      `semesters:${features.semesters.join(',')}`
    );
  }

  if (features.incomeRule) {
    reasons.push(
      'income_rule_detected'
    );
  }

  if (features.exemption) {
    reasons.push(
      'waiver_or_exemption_detected'
    );
  }

  if (features.foreign) {
    reasons.push(
      'foreign_fee_structure_also_present'
    );
  }

  return {
    college_id:
      row.college_id,

    name:
      row.name,

    source_url:
      row.resolved_source_url ||
      row.original_source_url ||
      null,

    source_type:
      row.source_type ||
      null,

    fee_scope_candidate:
      row.fee_scope_candidate ||
      null,

    confidence_score:
      score,

    status,

    features,

    extracted,

    reasons,

    verification_status:
      'pending_review'
  };
}

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'BATCH BTECH FEE NORMALIZER'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const raw =
    await fs.readFile(
      INPUT,
      'utf8'
    );

  const rows =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ''
      )
    );

  const pending =
    rows.filter(
      row =>
        !DONE.has(
          row.college_id
        )
    );

  const analyzed =
    pending.map(
      analyze
    );

  const autoReady =
    analyzed.filter(
      row =>
        row.status ===
        'auto_ready'
    );

  const review =
    analyzed.filter(
      row =>
        row.status ===
        'review'
    );

  const failed =
    analyzed.filter(
      row =>
        row.status ===
        'failed'
    );

  await fs.writeFile(
    AUTO_OUTPUT,
    JSON.stringify(
      autoReady,
      null,
      2
    ),
    'utf8'
  );

  await fs.writeFile(
    REVIEW_OUTPUT,
    JSON.stringify(
      review,
      null,
      2
    ),
    'utf8'
  );

  await fs.writeFile(
    FAILED_OUTPUT,
    JSON.stringify(
      failed,
      null,
      2
    ),
    'utf8'
  );

  const summary = {
    total_raw_sources:
      rows.length,

    already_done:
      rows.length -
      pending.length,

    processed:
      pending.length,

    auto_ready:
      autoReady.length,

    review:
      review.length,

    failed:
      failed.length
  };

  await fs.writeFile(
    SUMMARY_OUTPUT,
    JSON.stringify(
      summary,
      null,
      2
    ),
    'utf8'
  );

  console.log(
    'NORMALIZATION SUMMARY'
  );

  console.table([
    {
      status:
        'Raw sources',
      count:
        summary.total_raw_sources
    },

    {
      status:
        'Already done',
      count:
        summary.already_done
    },

    {
      status:
        'Remaining processed',
      count:
        summary.processed
    },

    {
      status:
        'Auto ready',
      count:
        summary.auto_ready
    },

    {
      status:
        'Needs review',
      count:
        summary.review
    },

    {
      status:
        'Failed / insufficient',
      count:
        summary.failed
    }
  ]);

  console.log('');
  console.log(
    'AUTO READY'
  );

  console.table(
    autoReady.map(
      row => ({
        college:
          row.name,

        score:
          row.confidence_score,

        tuition:
          row.features
            .tuitionCandidates
            .join('/'),

        semesters:
          row.features
            .semesters
            .join(','),

        hostel:
          row.features.hostel,

        mess:
          row.features.mess,

        total:
          row.features.total
      })
    )
  );

  console.log('');
  console.log(
    'NEEDS REVIEW'
  );

  console.table(
    review.map(
      row => ({
        college:
          row.name,

        score:
          row.confidence_score,

        signals:
          row.features.signals,

        amounts:
          row.features.amounts,

        reason:
          row.reasons.join(',')
      })
    )
  );

  console.log('');
  console.log(
    'FAILED / INSUFFICIENT'
  );

  console.table(
    failed.map(
      row => ({
        college:
          row.name,

        score:
          row.confidence_score,

        signals:
          row.features.signals
      })
    )
  );

  console.log('');
  console.log(
    'Saved:',
    AUTO_OUTPUT
  );

  console.log(
    'Saved:',
    REVIEW_OUTPUT
  );

  console.log(
    'Saved:',
    FAILED_OUTPUT
  );

  console.log(
    'Saved:',
    SUMMARY_OUTPUT
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  error => {
    console.error(
      '[NORMALIZER] FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);
