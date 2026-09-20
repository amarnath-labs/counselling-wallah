import fs from 'node:fs';

const INPUT =
  './btech-fee-detailed-raw.json';

const OUTPUT =
  './nit-rourkela-fee-signals.txt';

const rows =
  JSON.parse(
    fs.readFileSync(
      INPUT,
      'utf8'
    ).replace(
      /^\uFEFF/,
      ''
    )
  );

const row =
  rows.find(
    r =>
      r.college_id ===
      'national-institute-of-technology-rourkela'
  );

if (!row) {
  throw new Error(
    'NIT Rourkela not found'
  );
}

const out = [];

out.push(
  '======================================='
);

out.push(
  'NIT ROURKELA FEE SIGNALS'
);

out.push(
  '======================================='
);

out.push('');

out.push(
  `COLLEGE: ${row.name}`
);

out.push(
  `SOURCE: ${
    row.resolved_source_url ||
    row.original_source_url ||
    ''
  }`
);

out.push(
  `SCOPE: ${
    row.fee_scope_candidate ||
    ''
  }`
);

out.push(
  `SIGNALS: ${
    (row.fee_signals || []).length
  }`
);

out.push('');

for (
  let i = 0;
  i < (row.fee_signals || []).length;
  i++
) {
  const s =
    row.fee_signals[i];

  out.push(
    `===== SIGNAL ${i + 1} =====`
  );

  out.push(
    `LINE: ${s.line || ''}`
  );

  out.push(
    `CONTEXT: ${s.context || ''}`
  );

  if (
    Array.isArray(
      s.amounts
    ) &&
    s.amounts.length
  ) {
    out.push(
      `AMOUNTS: ${s.amounts.join(', ')}`
    );
  }

  out.push('');
}

fs.writeFileSync(
  OUTPUT,
  out.join('\r\n'),
  'utf8'
);

console.log('');
console.log(
  'NIT ROURKELA SIGNAL EXPORT'
);

console.log(
  '==========================='
);

console.log(
  'Signals:',
  (row.fee_signals || []).length
);

console.log(
  'Saved:',
  OUTPUT
);

console.log('');
console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);
