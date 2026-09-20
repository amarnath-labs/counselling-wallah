import 'dotenv/config';

import fs from 'node:fs/promises';

const raw = await fs.readFile(
  './nirf-alias-suggestions.json',
  'utf8'
);

const rows = JSON.parse(
  raw.replace(/^\uFEFF/, '')
);

const manual = rows.filter(
  (row) =>
    row.recommended_action ===
    'manual_review'
);

console.log('');
console.log('=======================================');
console.log('NIRF MANUAL REVIEW');
console.log('=======================================');
console.log('');

console.log(
  'Manual review rows:',
  manual.length
);

console.log('');

for (const row of manual) {
  console.log('---------------------------------------');
  console.log(
    `NIRF #${row.nirf_rank}: ${row.nirf_name}`
  );

  console.log(
    `NIRF location: ${row.nirf_city}, ${row.nirf_state}`
  );

  console.log('');

  console.table(
    row.top_candidates
  );
}

await fs.writeFile(
  './nirf-manual-review.json',
  JSON.stringify(
    manual,
    null,
    2
  ),
  'utf8'
);

console.log('');
console.log(
  'Saved: ./nirf-manual-review.json'
);
