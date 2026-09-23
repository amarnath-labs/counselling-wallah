import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require =
  createRequire(
    import.meta.url
  );

const pdfParse =
  require(
    'pdf-parse'
  );

const ROOT =
  path.resolve(
    './data/neet/mcc'
  );

const FILES = [
  {
    year: 2026,
    round: 'round-1',
  },
  {
    year: 2026,
    round: 'round-2',
  },
];


function ensureDir(
  dir
) {
  fs.mkdirSync(
    dir,
    {
      recursive: true,
    }
  );
}


function normalizeText(
  value
) {
  return String(
    value || ''
  )
    .replace(
      /\r\n/g,
      '\n'
    )
    .replace(
      /\r/g,
      '\n'
    )
    .replace(
      /[ \t]+\n/g,
      '\n'
    );
}


function nonEmptyLines(
  value
) {
  return normalizeText(
    value
  )
    .split(
      '\n'
    )
    .map(
      line =>
        line.trim()
    )
    .filter(
      Boolean
    );
}


async function extractOne(
  item
) {
  const pdfPath =
    path.join(
      ROOT,
      String(
        item.year
      ),
      'raw',
      `${item.round}.pdf`
    );


  if (
    !fs.existsSync(
      pdfPath
    )
  ) {
    throw new Error(
      `Missing PDF: ${pdfPath}`
    );
  }


  const outDir =
    path.join(
      ROOT,
      String(
        item.year
      ),
      'text'
    );


  ensureDir(
    outDir
  );


  console.log(
    '\n========================================'
  );

  console.log(
    `${item.year} ${item.round}`
  );


  const buffer =
    fs.readFileSync(
      pdfPath
    );


  console.log(
    `PDF bytes: ${buffer.length}`
  );


  const parsed =
    await pdfParse(
      buffer
    );


  const text =
    normalizeText(
      parsed.text
    );


  const txtPath =
    path.join(
      outDir,
      `${item.round}.txt`
    );


  fs.writeFileSync(
    txtPath,
    text,
    'utf8'
  );


  const lines =
    nonEmptyLines(
      text
    );


  console.log(
    `Pages: ${parsed.numpages}`
  );

  console.log(
    `Characters: ${text.length}`
  );

  console.log(
    `Non-empty lines: ${lines.length}`
  );

  console.log(
    `Saved: ${txtPath}`
  );


  console.log(
    '\n----- FIRST 80 NON-EMPTY LINES -----'
  );

  lines
    .slice(
      0,
      80
    )
    .forEach(
      (
        line,
        index
      ) => {
        console.log(
          `${String(
            index + 1
          ).padStart(
            4,
            ' '
          )}: ${line}`
        );
      }
    );


  console.log(
    '\n----- LAST 30 NON-EMPTY LINES -----'
  );

  lines
    .slice(
      -30
    )
    .forEach(
      (
        line,
        index
      ) => {
        console.log(
          `${String(
            lines.length -
            29 +
            index
          ).padStart(
            4,
            ' '
          )}: ${line}`
        );
      }
    );


  return {
    year:
      item.year,

    round:
      item.round,

    pdf:
      pdfPath,

    text:
      txtPath,

    pages:
      parsed.numpages,

    characters:
      text.length,

    nonEmptyLines:
      lines.length,
  };
}


async function run() {
  const results = [];


  for (
    const item of FILES
  ) {
    results.push(
      await extractOne(
        item
      )
    );
  }


  const reportPath =
    path.join(
      ROOT,
      'extraction-report.json'
    );


  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),

        results,
      },
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'TEXT EXTRACTION COMPLETE'
  );

  console.log(
    `Report: ${reportPath}`
  );

  console.log(
    '========================================'
  );
}


run().catch(
  error => {
    console.error(
      '\nEXTRACTION FAILED'
    );

    console.error(
      error
    );

    process.exit(
      1
    );
  }
);
