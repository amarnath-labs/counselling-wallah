import fs from 'node:fs/promises';

const INPUT =
  './fee-pilot-batch-01-remaining-targets.json';

const READY_OUTPUT =
  './fee-pilot-source-priority-ready.json';

const DISCOVERY_OUTPUT =
  './fee-pilot-source-priority-discovery.json';

async function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'PILOT SOURCE PRIORITY GROUPS'
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

  const priority =
    rows.filter(
      row =>
        [
          'OFFICIAL_SITE_FOUND',
          'OUTDATED_SOURCE',
          'SOURCE_FOUND_REVIEW_YEAR'
        ].includes(
          row.discovery_status
        )
    );

  const discovery =
    rows.filter(
      row =>
        row.discovery_status ===
        'DISCOVERY_PENDING'
    );

  await fs.writeFile(
    READY_OUTPUT,
    JSON.stringify(
      priority,
      null,
      2
    ),
    'utf8'
  );

  await fs.writeFile(
    DISCOVERY_OUTPUT,
    JSON.stringify(
      discovery,
      null,
      2
    ),
    'utf8'
  );

  console.log(
    'PRIORITY SOURCE GROUP'
  );

  console.table(
    priority.map(
      (row, index) => ({
        no:
          index + 1,

        college:
          row.college_name,

        year:
          row.academic_year,

        status:
          row.discovery_status,

        official_site:
          row.official_website
            ? 'yes'
            : 'no',

        fee_source:
          row.fee_source_url
            ? 'yes'
            : 'no'
      })
    )
  );

  console.log('');

  console.log(
    'FULL DISCOVERY GROUP'
  );

  console.table(
    discovery.map(
      (row, index) => ({
        no:
          index + 1,

        college:
          row.college_name,

        status:
          row.discovery_status
      })
    )
  );

  console.log('');

  console.log(
    'Priority source group:',
    priority.length
  );

  console.log(
    'Full discovery group:',
    discovery.length
  );

  console.log('');

  console.log(
    'Saved:',
    READY_OUTPUT
  );

  console.log(
    'Saved:',
    DISCOVERY_OUTPUT
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