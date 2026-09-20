import fs from 'node:fs/promises';

const INPUT =
  './official-fee-page-candidates.json';

const OUTPUT =
  './official-fee-page-shortlist.json';

const raw =
  await fs.readFile(
    INPUT,
    'utf8'
  );

const rows =
  JSON.parse(
    raw.replace(/^\uFEFF/, '')
  );

function extraScore(candidate) {
  const text =
    `${candidate.text || ''} ${candidate.url || ''}`
      .toLowerCase();

  let score =
    Number(candidate.score || 0);

  if (
    text.includes('fee structure')
  ) {
    score += 10;
  }

  if (
    text.includes('academic fee')
  ) {
    score += 8;
  }

  if (
    text.includes('institute fee')
  ) {
    score += 7;
  }

  if (
    text.includes('tuition fee')
  ) {
    score += 7;
  }

  if (
    text.includes('b.tech') ||
    text.includes('btech')
  ) {
    score += 6;
  }

  if (
    text.includes('undergraduate') ||
    text.includes('ug fee')
  ) {
    score += 5;
  }

  if (
    text.includes('2025') ||
    text.includes('2025-26') ||
    text.includes('2025-2026')
  ) {
    score += 5;
  }

  if (
    text.includes('2024-25') ||
    text.includes('2024-2025')
  ) {
    score += 2;
  }

  if (
    candidate.is_pdf
  ) {
    score += 4;
  }

  /*
  |--------------------------------------------------------------------------
  | DOWN-RANK WEAKER LINKS
  |--------------------------------------------------------------------------
  */

  if (
    text.includes('payment gateway') ||
    text.includes('pay fee') ||
    text.includes('online payment')
  ) {
    score -= 10;
  }

  if (
    text.includes('application fee')
  ) {
    score -= 8;
  }

  if (
    text.includes('exam fee') ||
    text.includes('examination fee')
  ) {
    score -= 8;
  }

  if (
    text.includes('tender')
  ) {
    score -= 10;
  }

  return score;
}

const shortlist = [];

for (const row of rows) {
  const candidates =
    (row.candidates || [])
      .map(
        candidate => ({
          ...candidate,

          final_score:
            extraScore(candidate),
        })
      )

      .sort(
        (a, b) =>
          b.final_score -
          a.final_score
      )

      .slice(0, 5);

  shortlist.push({
    college_id:
      row.college_id,

    name:
      row.name,

    website:
      row.website,

    nirf_rank:
      row.nirf_rank,

    candidate_count:
      row.candidates?.length || 0,

    top_candidates:
      candidates,
  });
}

await fs.writeFile(
  OUTPUT,

  JSON.stringify(
    shortlist,
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
  'OFFICIAL FEE PAGE SHORTLIST'
);
console.log(
  '======================================='
);

console.table(
  shortlist.map(
    row => ({
      college:
        row.name,

      found:
        row.candidate_count,

      shortlisted:
        row.top_candidates.length,

      best_score:
        row.top_candidates[0]
          ?.final_score ?? null,

      best:
        row.top_candidates[0]
          ?.url ?? null,
    })
  )
);

console.log('');
console.log(
  'Saved:',
  OUTPUT
);

console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);
