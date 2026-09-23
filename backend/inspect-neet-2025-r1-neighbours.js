import fs from 'fs';

const file =
  './data/neet/mcc/2025/parsed/round-1-rows.json';

const rows =
  JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    )
  );

const wanted =
  rows.filter(
    row =>
      [
        7264,
        7266,
      ].includes(
        Number(
          row?.sno
        )
      )
  );

console.log(
  JSON.stringify(
    wanted,
    null,
    2
  )
);
