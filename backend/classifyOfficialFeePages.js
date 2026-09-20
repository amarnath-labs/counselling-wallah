import fs from 'node:fs/promises';

const INPUT =
  './official-fee-page-shortlist.json';

const OUTPUT =
  './official-fee-page-final-candidates.json';

const raw =
  await fs.readFile(INPUT, 'utf8');

const rows =
  JSON.parse(
    raw.replace(/^\uFEFF/, '')
  );

function classify(candidate) {

  const text =
    `${candidate.text || ''} ${candidate.url || ''}`
      .toLowerCase()
      .replace(/%20/g, ' ');

  let score = 0;

  const reasons = [];

  /*
  =======================================
  STRONG POSITIVE SIGNALS
  =======================================
  */

  if (
    /fee[\s_-]*structure/.test(text)
  ) {
    score += 50;
    reasons.push('fee structure');
  }

  if (
    /institute[\s_-]*fee/.test(text)
  ) {
    score += 35;
    reasons.push('institute fee');
  }

  if (
    /tuition[\s_-]*fee/.test(text)
  ) {
    score += 35;
    reasons.push('tuition fee');
  }

  if (
    /academic[\s_-]*fee/.test(text)
  ) {
    score += 30;
    reasons.push('academic fee');
  }

  if (
    /fee[\s_-]*notice/.test(text)
  ) {
    score += 30;
    reasons.push('fee notice');
  }

  if (
    /\bfees\b/.test(text)
  ) {
    score += 20;
    reasons.push('fees');
  }

  if (
    /\bfee\b/.test(text)
  ) {
    score += 15;
    reasons.push('fee');
  }

  /*
  =======================================
  UG / BTECH SIGNALS
  =======================================
  */

  if (
    /\bb\.?\s?tech\b/.test(text) ||
    /\bbtech\b/.test(text)
  ) {
    score += 15;
    reasons.push('BTech');
  }

  if (
    /\bug\b/.test(text) ||
    /undergraduate/.test(text)
  ) {
    score += 10;
    reasons.push('UG');
  }

  if (
    /josaa|csab/.test(text)
  ) {
    score += 15;
    reasons.push('JoSAA/CSAB');
  }

  /*
  =======================================
  YEAR SIGNALS
  =======================================
  */

  if (
    /2025[\s_-]*(?:-|–|to)[\s_-]*26/.test(text) ||
    /2025[\s_-]*2026/.test(text)
  ) {
    score += 15;
    reasons.push('AY 2025-26');
  }

  if (
    /2026[\s_-]*(?:-|–|to)[\s_-]*27/.test(text) ||
    /2026[\s_-]*2027/.test(text)
  ) {
    score += 10;
    reasons.push('AY 2026-27');
  }

  if (
    /2024[\s_-]*(?:-|–|to)[\s_-]*25/.test(text)
  ) {
    score += 5;
    reasons.push('AY 2024-25');
  }

  /*
  =======================================
  USEFUL HOSTEL SIGNAL
  =======================================
  */

  if (
    /hostel[\s_-]*fee/.test(text)
  ) {
    score += 20;
    reasons.push('hostel fee');
  }

  /*
  =======================================
  PDF BONUS
  =======================================
  */

  if (candidate.is_pdf) {
    score += 3;
  }

  /*
  =======================================
  STRONG NEGATIVE SIGNALS
  =======================================
  */

  const negatives = [
    ['apprentice', -50],
    ['apprenticeship', -50],
    ['anti-ragging', -40],
    ['anti ragging', -40],
    ['award', -40],
    ['holiday', -40],
    ['newsletter', -40],
    ['internship', -40],
    ['tender', -50],
    ['recruitment', -50],
    ['career', -30],
    ['convocation', -35],
    ['conference', -35],
    ['workshop', -35],
    ['statute', -30],
    ['timetable', -35],
    ['time table', -35],
    ['calendar', -30],
    ['cyber security', -30],
    ['it policy', -40],
    ['scholarship', -20],
    ['remission', -15],
    ['visiting student', -45],
    ['visiting students', -45],
    ['application fee', -35],
    ['examination fee', -35],
    ['exam fee', -35],
    ['payment gateway', -30],
    ['online payment', -25]
  ];

  for (
    const [word, penalty]
    of negatives
  ) {
    if (text.includes(word)) {
      score += penalty;

      reasons.push(
        `negative:${word}`
      );
    }
  }

  /*
  =======================================
  CLASSIFICATION
  =======================================
  */

  let classification;

  if (score >= 50) {
    classification =
      'strong_fee_source';
  } else if (score >= 25) {
    classification =
      'possible_fee_source';
  } else {
    classification =
      'reject_or_manual_review';
  }

  return {
    ...candidate,
    classifier_score: score,
    classification,
    classifier_reasons:
      reasons
  };
}

const output = [];

for (const row of rows) {

  const candidates =
    (row.top_candidates || [])
      .map(classify)
      .sort(
        (a, b) =>
          b.classifier_score -
          a.classifier_score
      );

  const usable =
    candidates.filter(
      x =>
        x.classification !==
        'reject_or_manual_review'
    );

  output.push({
    college_id:
      row.college_id,

    name:
      row.name,

    website:
      row.website,

    nirf_rank:
      row.nirf_rank,

    candidates,

    selected_candidate:
      usable[0] || null,

    selection_status:
      usable.length > 0
        ? 'candidate_selected'
        : 'manual_review_required'
  });
}

await fs.writeFile(
  OUTPUT,
  JSON.stringify(
    output,
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
  'FINAL FEE SOURCE CLASSIFICATION'
);

console.log(
  '======================================='
);

console.table(
  output.map(
    row => ({
      college:
        row.name,

      status:
        row.selection_status,

      score:
        row.selected_candidate
          ?.classifier_score ??
        null,

      selected:
        row.selected_candidate
          ?.url ??
        null
    })
  )
);

const selected =
  output.filter(
    x =>
      x.selection_status ===
      'candidate_selected'
  ).length;

const manual =
  output.length - selected;

console.log('');
console.log(
  '---------------------------------------'
);

console.log(
  'SUMMARY'
);

console.log(
  '---------------------------------------'
);

console.table([
  {
    status:
      'Colleges processed',
    count:
      output.length
  },
  {
    status:
      'Candidate selected',
    count:
      selected
  },
  {
    status:
      'Manual review required',
    count:
      manual
  }
]);

console.log('');
console.log(
  'Saved:',
  OUTPUT
);

console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);

console.log(
  'Recommendation logic has NOT been modified.'
);
