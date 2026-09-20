import fs from 'node:fs/promises';

const SOURCE =
  './tmp/csab/combined/csab-2024-2026-all.json';

const TARGETS = [
  'Birla Institute of Technology, Mesra, Ranchi',
  'Birla Institute of Technology, Patna Off-Campus',
];


function isRelevant(program = '') {

  const value =
    String(program)
      .toLowerCase();

  return (
    value.includes(
      'artificial intelligence'
    ) ||
    value.includes(
      'machine learning'
    )
  );
}


async function main() {

  const rows =
    JSON.parse(
      await fs.readFile(
        SOURCE,
        'utf8'
      )
    );


  const output =
    [];


  for (
    const institute
    of TARGETS
  ) {

    const relevant =
      rows.filter(
        row =>
          row.institute_name ===
            institute &&
          isRelevant(
            row.program_name
          )
      );


    const grouped =
      new Map();


    for (
      const row
      of relevant
    ) {

      const key = [
        row.year,
        row.program_name,
      ].join(
        '|||'
      );


      if (
        !grouped.has(
          key
        )
      ) {

        grouped.set(
          key,
          {
            year:
              row.year,

            program_name:
              row.program_name,

            rows:
              0,

            rounds:
              new Set(),

            quotas:
              new Set(),

            categories:
              new Set(),

            genders:
              new Set(),

            min_opening:
              null,

            max_closing:
              null,
          }
        );
      }


      const item =
        grouped.get(
          key
        );


      item.rows++;

      item.rounds.add(
        row.round
      );

      item.quotas.add(
        row.quota
      );

      item.categories.add(
        row.category
      );

      item.genders.add(
        row.gender
      );


      if (
        Number.isFinite(
          row.opening_rank
        )
      ) {

        item.min_opening =
          item.min_opening === null
            ? row.opening_rank
            : Math.min(
                item.min_opening,
                row.opening_rank
              );
      }


      if (
        Number.isFinite(
          row.closing_rank
        )
      ) {

        item.max_closing =
          item.max_closing === null
            ? row.closing_rank
            : Math.max(
                item.max_closing,
                row.closing_rank
              );
      }
    }


    const history =
      [...grouped.values()]
        .map(
          item => ({
            year:
              item.year,

            program_name:
              item.program_name,

            rows:
              item.rows,

            rounds:
              [...item.rounds]
                .sort()
                .join(', '),

            quotas:
              [...item.quotas]
                .sort()
                .join(', '),

            categories:
              [...item.categories]
                .sort()
                .join(', '),

            genders:
              [...item.genders]
                .sort()
                .join(', '),

            min_opening:
              item.min_opening,

            max_closing:
              item.max_closing,
          })
        )
        .sort(
          (a, b) =>
            a.year - b.year ||
            a.program_name.localeCompare(
              b.program_name
            )
        );


    output.push({
      institute,
      history,
    });


    console.log(
      '\n========================================'
    );

    console.log(
      institute
    );

    console.log(
      '========================================'
    );

    console.table(
      history
    );
  }


  await fs.writeFile(
    './tmp/csab/mapping-audit/bit-aiml-history.json',

    JSON.stringify(
      output,
      null,
      2
    ),

    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'BIT AI/ML HISTORY AUDIT COMPLETE'
  );

  console.log(
    'NO DATABASE CHANGES MADE'
  );

  console.log(
    '========================================'
  );

  console.log(
    '\nSaved:'
  );

  console.log(
    './tmp/csab/mapping-audit/bit-aiml-history.json'
  );
}


main().catch(
  error => {

    console.error(
      '\nAUDIT FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
