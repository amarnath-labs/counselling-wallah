import fs from 'node:fs/promises';

const rows =
  JSON.parse(
    (
      await fs.readFile(
        './btech-fee-detailed-raw.json',
        'utf8'
      )
    ).replace(/^\uFEFF/, '')
  );

const report =
  rows.map(row => {

    const signals =
      row.fee_signals || [];

    const text =
      signals
        .map(x =>
          `${x.line || ''} ${x.context || ''}`
        )
        .join(' ')
        .toLowerCase();

    return {
      college:
        row.name,

      btech:
        row.btech_relevant,

      scope:
        row.fee_scope_candidate,

      signals:
        signals.length,

      amounts:
        (row.all_amounts || []).length,

      tuition:
        /tuition/.test(text),

      hostel:
        /hostel/.test(text),

      admission:
        /admission fee/.test(text),

      institute:
        /institute fee/.test(text),

      mess:
        /mess/.test(text),

      total:
        /total fee|grand total|total payable/.test(text)
    };
  });

console.table(report);

await fs.writeFile(
  './btech-fee-component-coverage.json',
  JSON.stringify(report, null, 2),
  'utf8'
);

console.log('');
console.log(
  'Saved: ./btech-fee-component-coverage.json'
);

console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);
