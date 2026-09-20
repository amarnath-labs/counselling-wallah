import fs from 'node:fs';

const INPUT =
  './fee-pilot-batch-01-true-missing.json';

const OUTPUT =
  './fee-pilot-batch-01-source-map.json';

function loadJson(file) {
  return JSON.parse(
    fs
      .readFileSync(
        file,
        'utf8'
      )
      .replace(
        /^\uFEFF/,
        ''
      )
  );
}

/*
|--------------------------------------------------------------------------
| OFFICIAL SOURCE DISCOVERY MAP
|--------------------------------------------------------------------------
|
| Only official institute domains are stored here.
| No database changes are performed by this script.
|
*/

const DISCOVERED = {
  'uptac-abes-engg-college-ghaziabad': {
    official_website:
      'https://www.abes.ac.in/',

    fee_source_url:
      'https://www.abes.ac.in/courses-offered.html',

    academic_year:
      2026,

    source_type:
      'official_html',

    discovery_status:
      'SOURCE_FOUND_CURRENT',

    confidence_score:
      98
  },

  'uptac-abes-institute-of-technology-ghaziabad': {
    official_website:
      'https://www.abesit.in/',

    fee_source_url:
      'https://www.abesit.in/admission/',

    academic_year:
      2026,

    source_type:
      'official_html',

    discovery_status:
      'SOURCE_FOUND_CURRENT',

    confidence_score:
      98
  },

  'assam-university-silchar': {
    official_website:
      'https://www.aus.ac.in/',

    fee_source_url:
      'https://www.aus.ac.in/wp-content/uploads/2023/07/corrigendum-tssot-fees.pdf',

    academic_year:
      null,

    source_type:
      'official_pdf',

    discovery_status:
      'SOURCE_FOUND_REVIEW_YEAR',

    confidence_score:
      88
  },

  'uptac-ashoka-institute-of-technology-management-varanasi': {
    official_website:
      'https://ashokainstitute.com/',

    fee_source_url:
      'https://ashokainstitute.com/assets/pdf/fee-structure/FEE%20STRUCTURE%202024-25.pdf',

    academic_year:
      2024,

    source_type:
      'official_pdf',

    discovery_status:
      'OUTDATED_SOURCE',

    confidence_score:
      95
  },

  'uptac-babu-banarasi-das-northern-india-institute-of-technology-lucknow': {
    official_website:
      'https://bbdniit.ac.in/',

    fee_source_url:
      'https://bbdniit.ac.in/wp-content/uploads/2022/05/bbdniit-fee-structure-23-24-.pdf',

    academic_year:
      2023,

    source_type:
      'official_pdf',

    discovery_status:
      'OUTDATED_SOURCE',

    confidence_score:
      95
  },

  'uptac-accurate-institute-of-management-technology-gautam-buddh-nagar': {
    official_website:
      'https://www.accurate.in/',

    fee_source_url:
      null,

    academic_year:
      null,

    source_type:
      'official_html',

    discovery_status:
      'OFFICIAL_SITE_FOUND',

    confidence_score:
      75
  },

  'uptac-allenhouse-institute-of-technology-kanpur': {
    official_website:
      'https://allenhouse.ac.in/',

    fee_source_url:
      null,

    academic_year:
      null,

    source_type:
      'official_html',

    discovery_status:
      'OFFICIAL_SITE_FOUND',

    confidence_score:
      75
  },

  'uptac-b-n-college-of-engineering-technology-lucknow': {
    official_website:
      'https://bncet.ac.in/',

    fee_source_url:
      null,

    academic_year:
      null,

    source_type:
      'official_html',

    discovery_status:
      'OFFICIAL_SITE_FOUND',

    confidence_score:
      70
  }
};

function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'FEE PILOT BATCH 01 SOURCE MAP'
  );

  console.log(
    '======================================='
  );

  console.log('');

  if (
    !fs.existsSync(INPUT)
  ) {
    throw new Error(
      `Input file not found: ${INPUT}`
    );
  }

  const pilot =
    loadJson(INPUT);

  if (
    !Array.isArray(pilot)
  ) {
    throw new Error(
      'Pilot input JSON must contain an array.'
    );
  }

  const results =
    pilot.map(
      (row, index) => {
        const collegeId =
          row.college_id ||
          row.id;

        const collegeName =
          row.college_name ||
          row.name ||
          collegeId;

        const found =
          DISCOVERED[
            collegeId
          ];

        const base = {
          batch_no:
            row.batch_no ?? 1,

          batch_index:
            row.batch_index ??
            index + 1,

          college_id:
            collegeId,

          college_name:
            collegeName
        };

        if (!found) {
          return {
            ...base,

            official_website:
              null,

            fee_source_url:
              null,

            academic_year:
              null,

            source_type:
              null,

            discovery_status:
              'DISCOVERY_PENDING',

            confidence_score:
              0
          };
        }

        return {
          ...base,
          ...found
        };
      }
    );

  fs.writeFileSync(
    OUTPUT,

    JSON.stringify(
      results,
      null,
      2
    ),

    'utf8'
  );

  const counts = {};

  for (
    const row
    of results
  ) {
    const status =
      row.discovery_status;

    counts[status] =
      (
        counts[status] ||
        0
      ) + 1;
  }

  console.log(
    'SOURCE STATUS SUMMARY'
  );

  console.table(
    Object
      .entries(counts)
      .map(
        ([status, count]) => ({
          status,
          count
        })
      )
  );

  console.log('');

  console.log(
    'COLLEGE SOURCE MAP'
  );

  console.table(
    results.map(
      row => ({
        no:
          row.batch_index,

        college:
          row.college_name,

        year:
          row.academic_year,

        type:
          row.source_type,

        status:
          row.discovery_status,

        confidence:
          row.confidence_score
      })
    )
  );

  const current =
    results.filter(
      row =>
        row.discovery_status ===
        'SOURCE_FOUND_CURRENT'
    );

  const review =
    results.filter(
      row =>
        row.discovery_status ===
          'SOURCE_FOUND_REVIEW_YEAR' ||
        row.discovery_status ===
          'OUTDATED_SOURCE' ||
        row.discovery_status ===
          'OFFICIAL_SITE_FOUND'
    );

  const pending =
    results.filter(
      row =>
        row.discovery_status ===
        'DISCOVERY_PENDING'
    );

  console.log('');

  console.log(
    '---------------------------------------'
  );

  console.log(
    'PIPELINE SUMMARY'
  );

  console.log(
    '---------------------------------------'
  );

  console.table([
    {
      status:
        'Current source ready',

      count:
        current.length
    },

    {
      status:
        'Needs source/year review',

      count:
        review.length
    },

    {
      status:
        'Discovery pending',

      count:
        pending.length
    },

    {
      status:
        'Total pilot colleges',

      count:
        results.length
    }
  ]);

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

try {
  main();
} catch (error) {
  console.error('');

  console.error(
    'FAILED:',
    error.message
  );

  process.exitCode = 1;
}