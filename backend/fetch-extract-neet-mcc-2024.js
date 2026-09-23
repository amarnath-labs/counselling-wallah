import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';
import { execFileSync } from 'child_process';


const BASE =
  path.resolve(
    './data/neet/mcc/2024'
  );


const RAW =
  path.join(
    BASE,
    'raw'
  );


const TEXT =
  path.join(
    BASE,
    'text'
  );


fs.mkdirSync(
  RAW,
  {
    recursive:
      true,
  }
);


fs.mkdirSync(
  TEXT,
  {
    recursive:
      true,
  }
);


const round2Url =
  'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2024/09/2024092017.pdf';


const round2File =
  path.join(
    RAW,
    'round-2.pdf'
  );


function download(
  url,
  destination
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      https.get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0',
          },
        },
        response => {

          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {

            response.resume();

            download(
              new URL(
                response.headers.location,
                url
              ).toString(),
              destination
            )
              .then(
                resolve
              )
              .catch(
                reject
              );

            return;
          }


          if (
            response.statusCode !==
            200
          ) {

            response.resume();

            reject(
              new Error(
                `HTTP ${response.statusCode}`
              )
            );

            return;
          }


          const stream =
            fs.createWriteStream(
              destination
            );


          response.pipe(
            stream
          );


          stream.on(
            'finish',
            () => {

              stream.close(
                resolve
              );
            }
          );


          stream.on(
            'error',
            reject
          );
        }
      )
        .on(
          'error',
          reject
        );
    }
  );
}


function sha256(
  file
) {

  return crypto
    .createHash(
      'sha256'
    )
    .update(
      fs.readFileSync(
        file
      )
    )
    .digest(
      'hex'
    );
}


/*
|--------------------------------------------------------------------------
| Download Round 2
|--------------------------------------------------------------------------
*/

console.log(
  '\nDownloading official MCC 2024 Round 2...'
);


await download(
  round2Url,
  round2File
);


console.log({
  file:
    round2File,

  bytes:
    fs.statSync(
      round2File
    ).size,

  sha256:
    sha256(
      round2File
    ),

  sourceUrl:
    round2Url,
});


/*
|--------------------------------------------------------------------------
| Extract all 3 PDFs
|--------------------------------------------------------------------------
|
| Requires pdftotext on PATH.
|
*/

const rounds = [
  'round-1',
  'round-2',
  'round-3',
];


const report = [];


for (
  const round of
  rounds
) {

  const pdf =
    path.join(
      RAW,
      `${round}.pdf`
    );


  const txt =
    path.join(
      TEXT,
      `${round}.txt`
    );


  console.log(
    `\nExtracting ${round}...`
  );


  execFileSync(
    'pdftotext',
    [
      '-layout',
      pdf,
      txt,
    ],
    {
      stdio:
        'inherit',
    }
  );


  const text =
    fs.readFileSync(
      txt,
      'utf8'
    );


  const lines =
    text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(
        line =>
          line
            .replace(/\s+/g, ' ')
            .trim()
      )
      .filter(Boolean);


  report.push({
    round,

    pdfBytes:
      fs.statSync(
        pdf
      ).size,

    pdfSha256:
      sha256(
        pdf
      ),

    textChars:
      text.length,

    nonEmptyLines:
      lines.length,

    first40Lines:
      lines.slice(
        0,
        40
      ),
  });


  console.log(
    `${round}: ${lines.length} non-empty lines`
  );
}


/*
|--------------------------------------------------------------------------
| Save extraction report
|--------------------------------------------------------------------------
*/

const reportFile =
  path.join(
    BASE,
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
  'NEET 2024 EXTRACTION COMPLETE'
);

console.log(
  '========================================'
);


console.log(
  reportFile
);


for (
  const item of
  report
) {

  console.log(
    `\n===== ${item.round.toUpperCase()} FIRST 40 LINES =====`
  );


  item.first40Lines
    .forEach(
      (
        line,
        index
      ) => {

        console.log(
          `${String(index).padStart(2, '0')}: ${line}`
        );
      }
    );
}
