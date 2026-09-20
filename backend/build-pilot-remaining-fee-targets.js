import fs from 'node:fs/promises';

const INPUT =
  './fee-pilot-batch-01-source-map.json';

const OUTPUT =
  './fee-pilot-batch-01-remaining-targets.json';

const COMPLETED_IDS =
  new Set([
    'uptac-abes-engg-college-ghaziabad',
    'uptac-abes-institute-of-technology-ghaziabad'
  ]);

async function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'PILOT REMAINING FEE TARGETS'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const raw =
    await fs.readFile(
      INPUT,
      'utf8'
    );

  const rows =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ''
      )
    );

  const remaining =
    rows
      .filter(
        row =>
          !COMPLETED_IDS.has(
            row.college_id
          )
      )
      .map(
        (
          row,
          index
        ) => ({
          ...row,

          remaining_index:
            index + 1,

          pipeline_status:
            'PENDING_NEXT_STAGE'
        })
      );

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      remaining,
      null,
      2
    ),

    'utf8'
  );

  const statusCounts = {};

  for (const row of remaining) {
    const status =
      row.discovery_status ||
      'UNKNOWN';

    statusCounts[status] =
      (
        statusCounts[status] ||
        0
      ) + 1;
  }

  console.log(
    'STATUS SUMMARY'
  );

  console.table(
    Object
      .entries(
        statusCounts
      )
      .map(
        (
          [
            status,
            count
          ]
        ) => ({
          status,
          count
        })
      )
  );

  console.log('');

  console.log(
    'REMAINING COLLEGES'
  );

  console.table(
    remaining.map(
      row => ({
        no:
          row.remaining_index,

        college:
          row.college_name,

        year:
          row.academic_year,

        status:
          row.discovery_status,

        source:
          row.fee_source_url
            ? 'yes'
            : 'no'
      })
    )
  );

  console.log('');

  console.log(
    'Remaining:',
    remaining.length
  );

  console.log(
    'Completed:',
    rows.length -
      remaining.length
  );

  console.log('');

  console.log(
    'Saved:',
    OUTPUT
  );

  console.log('');

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  error => {
    console.error(
      'FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);