import { pool } from './src/db/pool.js';

const ids = [
  'indian-institute-of-information-technology-raichur-karnataka',
  'institute-of-chemical-technology-mumbai-indian-oil-odisha-campus-bhubaneswar',
  'national-institute-of-electronics-and-information-technology-ajmer',
  'national-institute-of-electronics-and-information-technology-gorakhpur',
  'national-institute-of-electronics-and-information-technology-imphal',
  'national-institute-of-electronics-and-information-technology-kohima',
  'national-institute-of-electronics-and-information-technology-ropar',
  'national-institute-of-electronics-and-information-technology-srinagar',
  'pt-dwarka-prasad-mishra-indian-institute-of-information-technology-design-manufacture-jabalpur'
];

async function main() {
  const result = await pool.query(`
    SELECT
      c.id,
      c.name,

      COUNT(DISTINCT b.id)::int
        AS branches,

      COUNT(DISTINCT co.id)::int
        AS cutoff_rows,

      ARRAY_REMOVE(
        ARRAY_AGG(
          DISTINCT NULLIF(co.source_url, '')
        ),
        NULL
      ) AS cutoff_source_urls,

      ARRAY_REMOVE(
        ARRAY_AGG(
          DISTINCT NULLIF(co.source_label, '')
        ),
        NULL
      ) AS cutoff_source_labels

    FROM colleges c

    LEFT JOIN branches b
      ON b.college_id = c.id

    LEFT JOIN cutoffs co
      ON co.branch_id = b.id
      AND co.year = 2026

    WHERE c.id = ANY($1::text[])

    GROUP BY
      c.id,
      c.name

    ORDER BY
      c.name
  `, [ids]);

  console.log('');
  console.log('========================================');
  console.log('CW-REC REMAINING 9 SOURCE AUDIT V18');
  console.log('========================================');

  for (const row of result.rows) {
    console.log('');
    console.log('COLLEGE:', row.name);
    console.log('ID:', row.id);
    console.log('Branches:', row.branches);
    console.log('Cutoff rows:', row.cutoff_rows);
    console.log(
      'Source labels:',
      row.cutoff_source_labels
    );
    console.log(
      'Source URLs:',
      row.cutoff_source_urls
    );
  }

  console.log('');
  console.log(
    '✅ REMAINING 9 SOURCE AUDIT COMPLETE'
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
