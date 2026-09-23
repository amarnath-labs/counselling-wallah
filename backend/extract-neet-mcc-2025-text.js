import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';


const ROOT =
  path.resolve(
    './data/neet/mcc/2025'
  );


const RAW_DIR =
  path.join(
    ROOT,
    'raw'
  );


const TEXT_DIR =
  path.join(
    ROOT,
    'text'
  );


const FILES = [
  'round-1',
  'round-2',
  'round-3',
  'stray',
  'special-stray',
];


fs.mkdirSync(
  TEXT_DIR,
  {
    recursive: true,
  }
);


function countNonEmptyLines(
  text
) {
  return String(
    text || ''
  )
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(
      line =>
        line.trim()
    )
    .filter(
      Boolean
    )
    .length;
}


async function extractOne(
  key
) {

  const input =
    path.join(
      RAW_DIR,
      `${key}.pdf`
    );


  const output =
    path.join(
      TEXT_DIR,
      `${key}.txt`
    );


  console.log(
    '\n========================================'
  );

  console.log(
    `EXTRACTING ${key}`
  );

  console.log(
    '========================================'
  );


  if (
    !fs.existsSync(
      input
    )
  ) {
    throw new Error(
      `Missing PDF: ${input}`
    );
  }


  const buffer =
    fs.readFileSync(
      input
    );


  const result =
    await pdf(
      buffer
    );


  const text =
    String(
      result.text ||
      ''
    );


  fs.writeFileSync(
    output,
    text,
    'utf8'
  );


  const record = {
    key,

    pages:
      result.numpages ??
      null,

    characters:
      text.length,

    nonEmptyLines:
      countNonEmptyLines(
        text
      ),

    pdfBytes:
      buffer.length,

    output:
      path
        .relative(
          process.cwd(),
          output
        )
        .replace(
          /\\/g,
          '/'
        ),
  };


  console.log(
    `Pages: ${record.pages}`
  );

  console.log(
    `Characters: ${record.characters.toLocaleString()}`
  );

  console.log(
    `Non-empty lines: ${record.nonEmptyLines.toLocaleString()}`
  );

  console.log(
    `Saved: ${output}`
  );


  return record;
}


async function run() {

  const report = [];


  for (
    const key of FILES
  ) {

    try {

      const result =
        await extractOne(
          key
        );


      report.push({
        ...result,
        status:
          'success',
      });

    } catch (
      error
    ) {

      console.error(
        `${key} FAILED: ${error.message}`
      );


      report.push({
        key,

        status:
          'failed',

        error:
          error.message,
      });
    }
  }


  const reportFile =
    path.join(
      ROOT,
      'extraction-report.json'
    );


  fs.writeFileSync(
    reportFile,
    JSON.stringify(
      report,
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'NEET MCC 2025 TEXT EXTRACTION COMPLETE'
  );

  console.log(
    '========================================'
  );


  console.table(
    report.map(
      item => ({
        key:
          item.key,

        status:
          item.status,

        pages:
          item.pages ??
          null,

        characters:
          item.characters ??
          null,

        nonEmptyLines:
          item.nonEmptyLines ??
          null,
      })
    )
  );


  console.log(
    `\nReport: ${reportFile}`
  );


  const failed =
    report.filter(
      item =>
        item.status !==
        'success'
    );


  if (
    failed.length ===
    0
  ) {
    console.log(
      '\nALL 2025 MCC PDFs EXTRACTED SUCCESSFULLY'
    );
  } else {
    console.log(
      `\nFAILED EXTRACTIONS: ${failed.length}`
    );

    process.exitCode =
      1;
  }
}


run()
  .catch(
    error => {
      console.error(
        '\nFATAL ERROR'
      );

      console.error(
        error
      );

      process.exitCode =
        1;
    }
  );
