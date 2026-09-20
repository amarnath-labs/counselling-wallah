import fs from 'node:fs';

const INPUT_REVIEW =
  './btech-fees-review-v2.json';

const INPUT_SOURCE =
  './btech-fees-source-required.json';

const OUTPUT =
  './btech-fee-source-discovery-targets.json';

function load(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

const review =
  load(INPUT_REVIEW);

const sourceRequired =
  load(INPUT_SOURCE);

const rows = [
  ...review,
  ...sourceRequired
];

const targets =
  rows.map(
    row => ({
      college_id:
        row.college_id,

      college_name:
        row.name,

      current_status:
        row.status,

      current_source_url:
        row.source_url ||
        null,

      preferred_queries: [
        `${row.name} official B.Tech fee structure 2025 2026`,
        `${row.name} official UG fee structure B.Tech PDF`,
        `${row.name} institute fee hostel fee B.Tech official`
      ],

      required_fields: [
        'academic_year',
        'program',
        'semester',
        'student_category',
        'income_slab',
        'tuition_fee',
        'admission_fee',
        'institute_fee',
        'hostel_fee',
        'mess_fee',
        'caution_deposit',
        'other_fee',
        'total_fee'
      ],

      source_rules: {
        official_domain_only:
          true,

        prefer_pdf:
          true,

        allow_html:
          true,

        exclude_third_party:
          true,

        exclude_collegedunia:
          true,

        exclude_shiksha:
          true,

        exclude_getmyuni:
          true,

        exclude_careers360:
          true
      },

      verification_status:
        'source_discovery_required'
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
  'BTECH FEE SOURCE DISCOVERY TARGETS'
);

console.log(
  '======================================='
);

console.log('');

console.table(
  targets.map(
    row => ({
      college:
        row.college_name,

      status:
        row.current_status,

      existing_source:
        row.current_source_url
          ? 'yes'
          : 'no'
    })
  )
);

console.log('');
console.log(
  'Total targets:',
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
