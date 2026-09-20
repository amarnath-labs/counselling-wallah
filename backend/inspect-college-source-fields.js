import 'dotenv/config';

import { pool } from './src/db/pool.js';

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'COLLEGES TABLE SOURCE FIELD AUDIT'
  );

  console.log(
    '======================================='
  );

  const client =
    await pool.connect();

  try {
    const columns =
      await client.query(
        `
        SELECT
          column_name,
          data_type
        FROM information_schema.columns
        WHERE table_name = 'colleges'
        ORDER BY ordinal_position
        `
      );

    console.log('');
    console.log(
      'COLLEGES TABLE COLUMNS'
    );

    console.table(
      columns.rows
    );

    const possibleUrlColumns =
      columns.rows
        .map(
          row =>
            row.column_name
        )
        .filter(
          name =>
            /url|website|web|domain|source|link|homepage/i.test(
              name
            )
        );

    console.log('');

    console.log(
      'POSSIBLE WEBSITE / SOURCE COLUMNS'
    );

    console.table(
      possibleUrlColumns.map(
        column => ({
          column
        })
      )
    );

    /*
    |--------------------------------------------------------------------------
    | SHOW FIRST 25 PILOT COLLEGES
    |--------------------------------------------------------------------------
    */

    const ids = [
      'uptac-a-n-a-college-of-engineering-management-bareilly',
      'uptac-abes-engg-college-ghaziabad',
      'uptac-abes-institute-of-technology-ghaziabad',
      'uptac-abss-institute-of-technology-meerut-meerut',
      'uptac-accurate-institute-of-management-technology-gautam-buddh-nagar',
      'uptac-acharya-narendra-deva-university-of-agriculture-technology-kumarganj-ayodhya',
      'uptac-adhunik-college-of-engg-ghaziabad',
      'uptac-ajay-kumar-garg-engg-college-ghaziabad',
      'uptac-aligarh-college-of-engg-tech-aligarh',
      'uptac-allenhouse-institute-of-technology-kanpur',
      'uptac-amani-group-of-institutions-amroha',
      'uptac-ambalika-institute-of-management-technology-lucknow',
      'uptac-apex-institute-of-technology-rampur',
      'uptac-apollo-institute-of-technology-kanpur',
      'uptac-ashoka-institute-of-technology-management-varanasi',
      'assam-university-silchar',
      'uptac-axis-institute-of-technology-management-kanpur',
      'uptac-azad-institute-of-engineering-technology-lucknow',
      'uptac-b-b-s-college-of-engineering-and-technology-allahabad',
      'uptac-b-n-college-of-engineering-technology-lucknow',
      'uptac-b-s-a-college-of-engineering-technology-mathura',
      'uptac-babu-banarasi-das-institute-of-technology-and-management-lucknow',
      'uptac-babu-banarasi-das-northern-india-institute-of-technology-lucknow',
      'uptac-babu-banarsi-das-institute-of-tech-ghaziabad',
      'uptac-babu-sunder-singh-institute-of-technology-management-lucknow'
    ];

    const sample =
      await client.query(
        `
        SELECT *
        FROM colleges
        WHERE id = ANY($1::text[])
        ORDER BY name
        `,
        [
          ids
        ]
      );

    console.log('');

    console.log(
      'FIRST 25 PILOT COLLEGE RECORDS'
    );

    console.table(
      sample.rows
    );

    console.log('');

    console.log(
      'Pilot records found:',
      sample.rows.length
    );

    console.log('');

    console.log(
      'DATABASE HAS NOT BEEN MODIFIED.'
    );

  } finally {
    client.release();

    await pool.end();
  }
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
