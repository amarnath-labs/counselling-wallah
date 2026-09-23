import fs from 'fs';

const rows =
  JSON.parse(
    fs.readFileSync(
      './data/neet/mcc/2025/parsed/special-stray-rejected.json',
      'utf8'
    )
  );

console.log(
  `Rejected rows: ${rows.length}`
);

for (
  const row of rows
) {
  console.log(
    '\n========================================'
  );

  console.log(
    `SNo: ${row.sno}`
  );

  console.log(
    `Rank: ${row.rank}`
  );

  console.log(
    `Reason: ${row.reason}`
  );

  console.log(
    '\nBLOCK:'
  );

  (row.block || []).forEach(
    (
      value,
      index
    ) => {
      console.log(
        `${String(index).padStart(2, '0')}: ${value}`
      );
    }
  );

  console.log(
    '\nCATEGORY TOKENS:'
  );

  console.log(
    row.categoryTokens || null
  );
}
