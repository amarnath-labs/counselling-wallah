import fs from 'fs';

const FILE =
  './data/neet/mcc/2024/parsed/round-3-rejected.json';

const rejected =
  JSON.parse(
    fs.readFileSync(
      FILE,
      'utf8'
    )
  );

const reasonCounts = {};

for (const row of rejected) {
  const reason =
    row.reason || 'UNKNOWN';

  reasonCounts[reason] =
    (reasonCounts[reason] || 0) + 1;
}

const patterns = [
  ['Puducher ry', /\bPuducher\s+ry\b/gi],
  ['PUDUCHERR Y', /\bPUDUCHERR\s+Y\b/g],
  ['Insuranc e', /\bInsuranc\s+e\b/gi],
  ['Scheme( ESI)', /Scheme\(\s+ESI\)/gi],
  ['Seat Cancelle d', /\bCancelle\s+d\b/gi],
  ['Seat Surrende red', /\bSurrende\s+red\b/gi],
  ['MEDICA L', /\bMEDICA\s+L\b/g],
  ['GOVERNMEN T', /\bGOVERNMEN\s+T\b/g],
  ['Personne l', /\bPersonne\s+l\b/gi],
  ['Universit y', /\bUniversit\s+y\b/gi],
  ['Wi dows', /\bWi\s+dows\b/gi],
  ['Wid ows', /\bWid\s+ows\b/gi],
  ['Employe es', /\bEmploye\s+es\b/gi],
  ['Deemed/ Paid', /\bDeemed\/\s+Paid\b/gi],
];

const patternCounts = {};

for (const [name, regex] of patterns) {
  let count = 0;

  for (const row of rejected) {
    const text =
      String(
        row.text ||
        row.prefix ||
        ''
      );

    regex.lastIndex = 0;

    if (regex.test(text)) {
      count += 1;
    }
  }

  patternCounts[name] =
    count;
}

console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-3 REJECT AUDIT'
);

console.log(
  '========================================\n'
);

console.log({
  totalRejected:
    rejected.length,

  reasonCounts,
});

console.log(
  '\nNORMALIZATION PATTERN COUNTS'
);

console.log(
  JSON.stringify(
    patternCounts,
    null,
    2
  )
);

for (
  const [
    reason,
    count
  ] of
  Object.entries(
    reasonCounts
  )
) {

  console.log(
    `\n========================================`
  );

  console.log(
    `${reason}: ${count}`
  );

  console.log(
    '========================================'
  );

  const sample =
    rejected
      .filter(
        row =>
          row.reason === reason
      )
      .slice(
        0,
        15
      );

  for (const row of sample) {

    console.log(
      `\nRank ${row.rankRaw}`
    );

    console.log(
      row.text ||
      row.prefix ||
      ''
    );
  }
}
