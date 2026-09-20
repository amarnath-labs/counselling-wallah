import { pool } from './src/db/pool.js';

const SEARCHES = [
  {
    label: 'KIET',
    terms: [
      '%KIET%',
      '%KRISHNA%',
      '%KRISHNA INST%',
    ],
  },

  {
    label: 'NIET',
    terms: [
      '%NOIDA INSTITUTE OF ENGG%',
      '%NOIDA INSTITUTE OF ENGINEERING%',
      '%NIET%',
    ],
  },

  {
    label: 'GNIOT',
    terms: [
      '%GREATER NOIDA INSTITUTE OF TECHNOLOGY%',
      '%GNIOT%',
    ],
  },

  {
    label: 'MANGALMAY ENGINEERING',
    terms: [
      '%MANGALMAY%',
    ],
  },

  {
    label: 'KUNWAR SATYA VEERA',
    terms: [
      '%KUNWAR%',
      '%SATYAVIRA%',
      '%SATYA VEERA%',
    ],
  },
];

async function inspectSearch(search) {
  console.log('');
  console.log(
    '============================================================'
  );

  console.log(
    search.label
  );

  console.log(
    '============================================================'
  );

  const conditions =
    search.terms
      .map(
        (_, index) =>
          `c.name ILIKE $${index + 1}`
      )
      .join(' OR ');

  const colleges =
    await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.type,
        c.city,
        c.state,

        COUNT(
          DISTINCT b.id
        )::int
          AS branch_count,

        COUNT(
          DISTINCT co.id
        )::int
          AS cutoff_count

      FROM colleges c

      LEFT JOIN branches b
        ON b.college_id = c.id

      LEFT JOIN cutoffs co
        ON co.branch_id = b.id
        AND co.counselling_type = 'UPTAC'
        AND co.year = 2025

      WHERE
        ${conditions}

      GROUP BY
        c.id,
        c.name,
        c.type,
        c.city,
        c.state

      ORDER BY
        branch_count DESC,
        cutoff_count DESC,
        c.name
      `,
      search.terms
    );

  console.log(
    '\n=== MATCHING COLLEGES ==='
  );

  console.table(
    colleges.rows
  );

  for (
    const college
    of colleges.rows
  ) {
    console.log('');
    console.log(
      'COLLEGE:',
      college.name
    );

    console.log(
      'ID:',
      college.id
    );

    const branches =
      await pool.query(
        `
        SELECT
          b.id AS branch_id,
          b.name AS branch_name,

          COUNT(
            co.id
          )::int
            AS cutoff_rows

        FROM branches b

        LEFT JOIN cutoffs co
          ON co.branch_id = b.id
          AND co.counselling_type = 'UPTAC'
          AND co.year = 2025

        WHERE
          b.college_id = $1

        GROUP BY
          b.id,
          b.name

        ORDER BY
          cutoff_rows DESC,
          b.name

        LIMIT 40
        `,
        [
          college.id,
        ]
      );

    console.table(
      branches.rows
    );
  }
}

async function main() {
  console.log(
    '\n========================================'
  );

  console.log(
    'CW-REC QUESTIONABLE COLLEGE IDENTITY AUDIT'
  );

  console.log(
    '========================================'
  );

  for (
    const search
    of SEARCHES
  ) {
    await inspectSearch(
      search
    );
  }
}

main()
  .catch(error => {
    console.error(
      '\nIDENTITY AUDIT ERROR:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
