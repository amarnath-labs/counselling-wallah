import fs from 'node:fs';

const INPUT =
  './fee-pilot-batch-01-true-missing.json';

const OUTPUT =
  './fee-pilot-batch-01-discovery-targets.json';

function loadJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

function cleanCollegeName(name) {
  return String(name || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function main() {
  const rows =
    loadJson(INPUT);

  const targets =
    rows.map(
      row => {
        const name =
          cleanCollegeName(
            row.college_name
          );

        return {
          batch_no:
            row.batch_no,

          batch_index:
            row.batch_index,

          college_id:
            row.college_id,

          college_name:
            name,

          required_program:
            'B.Tech',

          preferred_years: [
            2026,
            2025
          ],

          search_queries: [
            `${name} official B.Tech fee structure 2026 PDF`,

            `${name} official fee structure B.Tech 2025 2026`,

            `${name} B.Tech tuition fee hostel fee official`,

            `${name} undergraduate fee structure official PDF`
          ],

          source_requirements: {
            official_domain_only:
              true,

            prefer_pdf:
              true,

            allow_html:
              true,

            reject_third_party:
              true,

            reject_collegedunia:
              true,

            reject_shiksha:
              true,

            reject_careers360:
              true,

            reject_getmyuni:
              true
          },

          extraction_requirements: {
            academic_year:
              true,

            semester:
              true,

            tuition_fee:
              true,

            student_category:
              true,

            income_slab:
              true,

            admission_fee:
              true,

            institute_fee:
              true,

            hostel_fee:
              true,

            mess_fee:
              true,

            caution_deposit:
              true,

            other_fee:
              true,

            total_fee:
              true
          },

          discovery_status:
            'PENDING'
        };
      }
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
    'FEE PILOT BATCH 01 DISCOVERY TARGETS'
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

        queries:
          row.search_queries.length,

        status:
          row.discovery_status
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
}

main();
