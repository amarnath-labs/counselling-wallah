import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';


const OUT =
  path.resolve(
    './data/neet/mcc/2024/raw'
  );


fs.mkdirSync(
  OUT,
  {
    recursive:
      true,
  }
);


const files = [
  {
    round:
      'round-1',

    url:
      'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2024/08/2024082536.pdf',

    file:
      'round-1.pdf',
  },

  /*
   * Round 2 URL will be discovered from MCC archive
   * in the next step if direct download cannot be resolved
   * automatically.
   */

  {
    round:
      'round-3',

    url:
      'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2024/10/FinalAllotmentStatusUG_R3_111024_Com_compressed.pdf',

    file:
      'round-3.pdf',
  },
];


function download(
  url,
  destination
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const request =
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
                  `HTTP ${response.statusCode} for ${url}`
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
                  () =>
                    resolve()
                );
              }
            );


            stream.on(
              'error',
              reject
            );
          }
        );


      request.on(
        'error',
        reject
      );
    }
  );
}


function sha256(
  file
) {

  const hash =
    crypto.createHash(
      'sha256'
    );


  const data =
    fs.readFileSync(
      file
    );


  hash.update(
    data
  );


  return hash.digest(
    'hex'
  );
}


const manifest = [];


for (
  const item of
  files
) {

  const target =
    path.join(
      OUT,
      item.file
    );


  console.log(
    `\nDownloading ${item.round}...`
  );


  await download(
    item.url,
    target
  );


  const stat =
    fs.statSync(
      target
    );


  const entry = {
    year:
      2024,

    authority:
      'MCC',

    exam:
      'NEET UG',

    round:
      item.round,

    sourceUrl:
      item.url,

    file:
      target,

    bytes:
      stat.size,

    sha256:
      sha256(
        target
      ),

    fetchedAt:
      new Date()
        .toISOString(),
  };


  manifest.push(
    entry
  );


  console.log(
    JSON.stringify(
      entry,
      null,
      2
    )
  );
}


const manifestFile =
  path.resolve(
    './data/neet/mcc/2024/manifest-part1.json'
  );


fs.writeFileSync(
  manifestFile,
  JSON.stringify(
    manifest,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 OFFICIAL DOWNLOAD COMPLETE'
);

console.log(
  '========================================'
);

console.log(
  manifestFile
);
