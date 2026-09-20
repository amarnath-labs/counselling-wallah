import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import axios from 'axios';
import { PDFParse } from 'pdf-parse';

const MATCHED_FILE =
  path.resolve(
    process.cwd(),
    'nirf-full-matched.json'
  );

const OUTPUT_FILE =
  path.resolve(
    process.cwd(),
    'nirf-placement-raw.json'
  );

const FAILED_FILE =
  path.resolve(
    process.cwd(),
    'nirf-placement-failed.json'
  );

function extractLatestUg4Placement(text) {
  const compact =
    String(text || '')
      .replace(/\r/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const marker =
    'UG [4 Years Program(s)]: Placement & higher studies for previous 3 years';

  const start =
    compact.indexOf(marker);

  if (start < 0) {
    return null;
  }

  const after =
    compact.slice(start);

  const nextSections = [
    'UG [5 Years Program(s)]',
    'PG [2 Years Program(s)]',
    'PG [3 Years Program(s)]',
    'Ph.D Student Details',
  ];

  let end =
    after.length;

  for (const section of nextSections) {
    const index =
      after.indexOf(section);

    if (
      index > 0 &&
      index < end
    ) {
      end = index;
    }
  }

  const section =
    after.slice(0, end);

  /*
    Expected row pattern roughly:

    intakeYear intake admittedYear lateral
    graduatingYear graduating placed medianSalary(...) higherStudies

    Example:
    2020-21 877 929 2021-22 0 2023-24 714 549 1750000(...) 153
  */

  const regex =
    /(\d{4}-\d{2})\s+(\d+)\s+(\d+)\s+(\d{4}-\d{2})\s+(\d+)\s+(\d{4}-\d{2})\s+(\d+)\s+(\d+)\s+(\d{6,9})\s*\([^)]*\)\s+(\d+)/g;

  const rows = [];

  let match;

  while (
    (match =
      regex.exec(section))
  ) {
    rows.push({
      intake_year:
        match[1],

      first_year_intake:
        Number(match[2]),

      first_year_admitted:
        Number(match[3]),

      lateral_year:
        match[4],

      lateral_entry:
        Number(match[5]),

      graduating_year:
        match[6],

      graduating_students:
        Number(match[7]),

      placed_students:
        Number(match[8]),

      median_salary:
        Number(match[9]),

      higher_studies:
        Number(match[10]),
    });
  }

  if (
    rows.length === 0
  ) {
    return null;
  }

  rows.sort(
    (a, b) =>
      b.graduating_year.localeCompare(
        a.graduating_year
      )
  );

  return {
    latest:
      rows[0],

    all_rows:
      rows,
  };
}

async function fetchPdf(
  instituteId
) {
  const url =
    `https://www.nirfindia.org/nirfpdfcdn/2025/pdf/Engineering/${instituteId}.pdf`;

  const response =
    await axios.get(
      url,
      {
        responseType:
          'arraybuffer',

        timeout:
          30000,

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      }
    );

  return {
    url,
    buffer:
      Buffer.from(
        response.data
      ),
  };
}

async function extractPdfText(
  buffer
) {
  const parser =
    new PDFParse({
      data: buffer,
    });

  try {
    const result =
      await parser.getText();

    return String(
      result.text || ''
    );
  } finally {
    await parser.destroy();
  }
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );
  console.log(
    'NIRF PLACEMENT BULK COLLECTOR'
  );
  console.log(
    '======================================='
  );
  console.log('');

  const raw =
    await fs.readFile(
      MATCHED_FILE,
      'utf8'
    );

  const matched =
    JSON.parse(
      raw.replace(/^\uFEFF/, '')
    );

  if (!Array.isArray(matched)) {
    throw new Error(
      'nirf-full-matched.json must be an array'
    );
  }

  console.log(
    '[PLACEMENT] Matched colleges:',
    matched.length
  );

  const results = [];
  const failed = [];

  let processed = 0;

  for (const row of matched) {
    processed++;

    const instituteId =
      row.institute_id;

    console.log('');
    console.log(
      `[${processed}/${matched.length}]`,
      row.database_name
    );

    if (!instituteId) {
      console.log(
        '[SKIP] Missing institute_id'
      );

      failed.push({
        college_id:
          row.college_id,

        college_name:
          row.database_name,

        reason:
          'missing_institute_id',
      });

      continue;
    }

    try {
      const {
        url,
        buffer,
      } =
        await fetchPdf(
          instituteId
        );

      /*
      |--------------------------------------------------------------------------
      | CONFIRM REAL PDF
      |--------------------------------------------------------------------------
      */

      const signature =
        buffer
          .subarray(0, 5)
          .toString('ascii');

      if (
        signature !== '%PDF-'
      ) {
        throw new Error(
          `Invalid PDF signature: ${signature}`
        );
      }

      console.log(
        '[PDF] bytes:',
        buffer.length
      );

      const text =
        await extractPdfText(
          buffer
        );

      const placement =
        extractLatestUg4Placement(
          text
        );

      if (!placement) {
        console.log(
          '[WARN] UG 4-year placement row not parsed'
        );

        failed.push({
          college_id:
            row.college_id,

          college_name:
            row.database_name,

          institute_id:
            instituteId,

          pdf_url:
            url,

          reason:
            'ug4_placement_not_parsed',
        });

        continue;
      }

      const latest =
        placement.latest;

      console.log({
        graduating_year:
          latest.graduating_year,

        graduating:
          latest.graduating_students,

        placed:
          latest.placed_students,

        median_salary:
          latest.median_salary,

        higher_studies:
          latest.higher_studies,
      });

      results.push({
        college_id:
          row.college_id,

        database_name:
          row.database_name,

        institute_id:
          instituteId,

        nirf_rank:
          row.nirf_rank,

        rank_band:
          row.rank_band,

        academic_year:
          row.academic_year,

        placement_program:
          'UG 4 Years',

        graduating_year:
          latest.graduating_year,

        graduating_students:
          latest.graduating_students,

        placed_students:
          latest.placed_students,

        higher_studies:
          latest.higher_studies,

        median_salary:
          latest.median_salary,

        placement_rate_raw:
          latest.graduating_students > 0
            ? Number(
                (
                  (
                    latest.placed_students /
                    latest.graduating_students
                  ) *
                  100
                ).toFixed(2)
              )
            : null,

        positive_outcome_rate:
          latest.graduating_students > 0
            ? Number(
                (
                  (
                    (
                      latest.placed_students +
                      latest.higher_studies
                    ) /
                    latest.graduating_students
                  ) *
                  100
                ).toFixed(2)
              )
            : null,

        source_label:
          'NIRF 2025 Engineering Institution PDF',

        source_url:
          url,

        verification_status:
          'verified',

        all_ug4_rows:
          placement.all_rows,
      });

    } catch (error) {
      console.log(
        '[FAILED]',
        error.message
      );

      failed.push({
        college_id:
          row.college_id,

        college_name:
          row.database_name,

        institute_id:
          instituteId,

        reason:
          error.message,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | SMALL DELAY
    |--------------------------------------------------------------------------
    */

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          250
        )
    );
  }

  await fs.writeFile(
    OUTPUT_FILE,

    JSON.stringify(
      results,
      null,
      2
    ),

    'utf8'
  );

  await fs.writeFile(
    FAILED_FILE,

    JSON.stringify(
      failed,
      null,
      2
    ),

    'utf8'
  );

  console.log('');
  console.log(
    '---------------------------------------'
  );
  console.log(
    'PLACEMENT COLLECTION SUMMARY'
  );
  console.log(
    '---------------------------------------'
  );

  console.table([
    {
      status:
        'Matched colleges',
      count:
        matched.length,
    },
    {
      status:
        'Placement parsed',
      count:
        results.length,
    },
    {
      status:
        'Failed / review',
      count:
        failed.length,
    },
  ]);

  console.log('');
  console.log(
    '[PLACEMENT] Output:',
    OUTPUT_FILE
  );

  console.log(
    '[PLACEMENT] Failed:',
    FAILED_FILE
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );

  console.log(
    'Existing recommendation logic has NOT been modified.'
  );
}

main().catch(
  (error) => {
    console.error(
      '[PLACEMENT] FATAL:',
      error.message
    );

    process.exitCode = 1;
  }
);
