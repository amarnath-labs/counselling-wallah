import fs from 'node:fs/promises';

const INPUT =
  './official-fee-page-final-candidates.json';

const OUTPUT =
  './official-fee-extraction-ready.json';

const REVIEW =
  './official-fee-extraction-review.json';

const raw =
  await fs.readFile(INPUT, 'utf8');

const rows =
  JSON.parse(
    raw.replace(/^\uFEFF/, '')
  );

function validate(candidate) {

  if (!candidate) {
    return {
      accepted: false,
      reason: 'no_candidate'
    };
  }

  const text =
    `${candidate.text || ''} ${candidate.url || ''}`
      .toLowerCase()
      .replace(/%20/g, ' ');

  /*
  ---------------------------------------
  HARD REJECT
  ---------------------------------------
  */

  const rejectPatterns = [
    'minor-program',
    'minor program',
    'scholarship',
    'remission',
    'visiting student',
    'visiting students',
    'application fee',
    'examination fee',
    'exam fee',
    'anti-ragging',
    'anti ragging',
    'holiday',
    'award',
    'tender',
    'recruitment',
    'internship',
    'workshop',
    'conference',
    'convocation',
    'apprentice',
    'apprenticeship'
  ];

  for (const pattern of rejectPatterns) {

    if (text.includes(pattern)) {

      return {
        accepted: false,
        reason:
          `hard_reject:${pattern}`
      };
    }
  }

  /*
  ---------------------------------------
  FEE SOURCE SIGNALS
  ---------------------------------------
  */

  const strongFee =
    /fee[\s_-]*structure/.test(text) ||
    /institute[\s_-]*fee/.test(text) ||
    /tuition[\s_-]*fee/.test(text) ||
    /academic[\s_-]*fee/.test(text) ||
    /fee[\s_-]*notice/.test(text) ||
    /fees/.test(text);

  /*
  ---------------------------------------
  BTECH / UG SIGNALS
  ---------------------------------------
  */

  const ugSignal =
    /\bb\.?\s?tech\b/.test(text) ||
    /\bbtech\b/.test(text) ||
    /\bug\b/.test(text) ||
    /undergraduate/.test(text) ||
    /josaa/.test(text) ||
    /csab/.test(text);

  /*
  ---------------------------------------
  GENERIC PAGE DETECTION
  ---------------------------------------
  */

  const generic =
    /\/admissions?\/?$/.test(text) ||
    /\/academics?\/?$/.test(text) ||
    /\/minor-programs?\/?$/.test(text) ||
    /scholarships?\.php/.test(text);

  if (generic) {
    return {
      accepted: false,
      reason:
        'generic_page'
    };
  }

  /*
  ---------------------------------------
  HOSTEL-ONLY
  ---------------------------------------
  */

  const hostelOnly =
    /hostel/.test(text) &&
    !/tuition/.test(text) &&
    !/institute[\s_-]*fee/.test(text) &&
    !/academic[\s_-]*fee/.test(text) &&
    !/btech[\s_-]*fee/.test(text);

  if (hostelOnly) {
    return {
      accepted: false,
      reason:
        'hostel_only_source'
    };
  }

  /*
  ---------------------------------------
  FINAL DECISION
  ---------------------------------------
  */

  if (strongFee) {

    return {
      accepted: true,
      reason:
        ugSignal
          ? 'strong_fee_and_ug'
          : 'strong_fee_source'
    };
  }

  return {
    accepted: false,
    reason:
      'insufficient_fee_evidence'
  };
}

const ready = [];
const review = [];

for (const row of rows) {

  const candidate =
    row.selected_candidate;

  const result =
    validate(candidate);

  const record = {
    college_id:
      row.college_id,

    name:
      row.name,

    nirf_rank:
      row.nirf_rank,

    website:
      row.website,

    source_url:
      candidate?.url || null,

    source_text:
      candidate?.text || null,

    classifier_score:
      candidate?.classifier_score ??
      null,

    validation_reason:
      result.reason
  };

  if (result.accepted) {
    ready.push(record);
  } else {
    review.push(record);
  }
}

await fs.writeFile(
  OUTPUT,
  JSON.stringify(
    ready,
    null,
    2
  ),
  'utf8'
);

await fs.writeFile(
  REVIEW,
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
  'STRICT FEE SOURCE VALIDATION'
);

console.log(
  '======================================='
);

console.table([
  {
    status:
      'Input colleges',
    count:
      rows.length
  },
  {
    status:
      'Extraction ready',
    count:
      ready.length
  },
  {
    status:
      'Review / rejected',
    count:
      review.length
  }
]);

console.log('');
console.log(
  'EXTRACTION READY SOURCES'
);

console.table(
  ready.map(
    row => ({
      college:
        row.name,

      score:
        row.classifier_score,

      reason:
        row.validation_reason,

      source:
        row.source_url
    })
  )
);

console.log('');
console.log(
  'REVIEW / REJECTED'
);

console.table(
  review.map(
    row => ({
      college:
        row.name,

      reason:
        row.validation_reason,

      source:
        row.source_url
    })
  )
);

console.log('');
console.log(
  'Saved:',
  OUTPUT
);

console.log(
  'Saved:',
  REVIEW
);

console.log('');
console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);

console.log(
  'Recommendation logic has NOT been modified.'
);
