import fs from 'node:fs';

const file =
  './backend/src/routes/cwRecV1-dev.js';

const backup =
  './backend/src/routes/cwRecV1-dev.js.before-female-seat-preference';

let source =
  fs.readFileSync(file, 'utf8');

fs.copyFileSync(
  file,
  backup
);

const recommendationsMarker =
  'REAL RECOMMENDATIONS';

const routeStart =
  source.indexOf(
    recommendationsMarker
  );

if (routeStart === -1) {
  console.error(
    '❌ REAL RECOMMENDATIONS block not found'
  );
  process.exit(1);
}

const beforeRoute =
  source.slice(0, routeStart);

let routeSource =
  source.slice(routeStart);

const pattern =
  /const scored\s*=\s*realData\.rows\.map\s*\(/;

if (!pattern.test(routeSource)) {
  console.error(
    '❌ Recommendation scoring anchor not found'
  );
  process.exit(1);
}

const replacement = `const recommendationRows =
        (() => {
          const rows =
            Array.isArray(
              realData?.rows
            )
              ? realData.rows
              : [];

          const normalizedExam =
            String(
              examId || ''
            )
              .trim()
              .toLowerCase();

          const normalizedGender =
            String(
              gender || ''
            )
              .trim()
              .toLowerCase();

          const femaleApplicant =
            normalizedGender
              .includes(
                'female'
              );

          const supportsFemaleSeatPreference =
            [
              'jee-main',
              'jee-advanced',
              'csab',
            ].includes(
              normalizedExam
            );

          if (
            !femaleApplicant ||
            !supportsFemaleSeatPreference
          ) {
            return rows;
          }

          const selected =
            new Map();

          const order = [];

          for (
            const row of rows
          ) {
            const key =
              [
                row?.college_id,
                row?.branch_id,
                row?.quota,
                row?.category,
                row?.year,
                row?.round,
              ]
                .map(
                  (value) =>
                    String(
                      value ?? ''
                    )
                      .trim()
                      .toLowerCase()
                )
                .join('::');

            if (
              !selected.has(
                key
              )
            ) {
              selected.set(
                key,
                row
              );

              order.push(
                key
              );

              continue;
            }

            const current =
              selected.get(
                key
              );

            const currentGender =
              String(
                current?.gender ||
                ''
              )
                .trim()
                .toLowerCase();

            const rowGender =
              String(
                row?.gender ||
                ''
              )
                .trim()
                .toLowerCase();

            const currentIsFemaleOnly =
              currentGender
                .includes(
                  'female-only'
                );

            const rowIsFemaleOnly =
              rowGender
                .includes(
                  'female-only'
                );

            /*
             * Female applicant:
             *
             * same college
             * + same branch
             * + same quota
             * + same category/year/round
             *
             * Female-only wins over
             * Gender-Neutral.
             */
            if (
              rowIsFemaleOnly &&
              !currentIsFemaleOnly
            ) {
              selected.set(
                key,
                row
              );
            }
          }

          return order.map(
            (key) =>
              selected.get(
                key
              )
          );
        })();


      const scored =
        recommendationRows.map(`;

routeSource =
  routeSource.replace(
    pattern,
    replacement
  );

source =
  beforeRoute +
  routeSource;

fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ Female-seat preference applied'
);

console.log(
  '✅ Same college + branch + quota now prefers Female-only for female applicants'
);

console.log(
  '✅ Male logic unchanged'
);

console.log(
  '✅ Scoring formula untouched'
);

console.log(
  '✅ Backup created: ' +
  backup
);
