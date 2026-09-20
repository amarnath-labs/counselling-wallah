import fs from 'node:fs';

const INPUT =
  './all-colleges-missing-fees.json';

const OUTPUT =
  './fee-pilot-batch-01.json';

const BATCH_SIZE =
  25;

function loadJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

function main() {
  const rows =
    loadJson(INPUT);

  const batch =
    rows.slice(
      0,
      BATCH_SIZE
    );

  const targets =
    batch.map(
      (
        row,
        index
      ) => ({
        batch_no:
          1,

        batch_index:
          index + 1,

        college_id:
          row.college_id,

        college_name:
          row.college_name,

        current_fee_status:
          row.status,

        discovery_status:
          'PENDING',

        source_url:
          null,

        source_type:
          null,

        source_year:
          null,

        confidence_score:
          0,

        required_program:
          'B.Tech',

        required_fields: [
          'academic_year',
          'semester',
          'student_category',
          'income_min',
          'income_max',
          'residence_type',
          'room_type',
          'tuition_fee',
          'admission_fee',
          'institute_fee',
          'hostel_fee',
          'mess_fee',
          'caution_deposit',
          'other_fee',
          'total_fee'
        ],

        source_policy: {
          official_only:
            true,

          prefer_current_year:
            true,

          preferred_years: [
            2026,
            2025
          ],

          allow_pdf:
            true,

          allow_html:
            true,

          reject_third_party:
            true,

          reject_foreign_only_fee:
            true
        }
      })
    );

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      targets,
      null,
      2
    ),
    'utf8'
  );

  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'FEE PILOT BATCH 01'
  );

  console.log(
    '======================================='
  );

  console.log('');

  console.table(
    targets.map(
      row => ({
        no:
          row.batch_index,

        college:
          row.college_name,

        status:
          row.discovery_status
      })
    )
  );

  console.log('');

  console.log(
    'Pilot colleges:',
    targets.length
  );

  console.log(
    'Saved:',
    OUTPUT
  );

  console.log('');

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main();
