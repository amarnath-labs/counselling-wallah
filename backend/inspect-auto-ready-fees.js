import fs from 'node:fs';

const INPUT = './btech-fee-detailed-raw.json';
const OUTPUT = './auto-ready-fee-signals.txt';

const rows = JSON.parse(
  fs.readFileSync(INPUT, 'utf8')
    .replace(/^\uFEFF/, '')
);

const targets = new Set([
  'national-institute-of-technology-rourkela',
  'national-institute-of-technology-sikkim',
  'national-institute-of-technology-mizoram'
]);

const output = [];

for (const r of rows) {

  if (!targets.has(r.college_id)) {
    continue;
  }

  output.push('');
  output.push(
    '============================================================'
  );

  output.push(`COLLEGE: ${r.name}`);
  output.push(`ID: ${r.college_id}`);

  output.push(
    `SOURCE: ${
      r.resolved_source_url ||
      r.original_source_url ||
      ''
    }`
  );

  output.push(
    `SCOPE: ${r.fee_scope_candidate || ''}`
  );

  output.push(
    `SIGNALS: ${(r.fee_signals || []).length}`
  );

  output.push(
    '============================================================'
  );

  for (
    let i = 0;
    i < (r.fee_signals || []).length;
    i++
  ) {

    const s = r.fee_signals[i];

    output.push('');
    output.push(
      `===== SIGNAL ${i + 1} =====`
    );

    output.push(
      `LINE: ${s.line || ''}`
    );

    output.push(
      `CONTEXT: ${s.context || ''}`
    );

    if (
      Array.isArray(s.amounts) &&
      s.amounts.length
    ) {
      output.push(
        `AMOUNTS: ${s.amounts.join(', ')}`
      );
    }
  }
}

fs.writeFileSync(
  OUTPUT,
  output.join('\r\n'),
  'utf8'
);

console.log('');
console.log('AUTO READY SIGNAL EXPORT');
console.log('========================');

console.log(
  'Target colleges:',
  targets.size
);

console.log(
  'Matched colleges:',
  rows.filter(
    r => targets.has(r.college_id)
  ).length
);

console.log(
  'Output lines:',
  output.length
);

console.log(
  'Saved:',
  OUTPUT
);

console.log('');
console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);