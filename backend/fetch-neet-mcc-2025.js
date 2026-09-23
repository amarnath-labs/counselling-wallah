import fs from 'fs';
import path from 'path';
import crypto from 'crypto';


const DOCUMENTS = [
  {
    key:
      'round-1',

    title:
      'Final Result for Round-I of NEET UG Counselling 2025',

    url:
      'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/08/20250813289226788.pdf',
  },

  {
    key:
      'round-2',

    title:
      'Final Result for Round 2 of UG Counselling 2025',

    url:
      'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/09/202509182057444522.pdf',
  },

  {
    key:
      'round-3',

    title:
      'Final Allotment Result for Round 3 of UG Counselling 2025',

    url:
      'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/10/202510231856675154.pdf',
  },

  {
    key:
      'stray',

    title:
      'Final Allotment Result for Stray Vacacy Round UG 2025',

    url:
      'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/11/2025111596488171.pdf',
  },

  {
    key:
      'special-stray',

    title:
      'Final Result for Special Stray Round of UG counselling 2025',

    url:
      'https://cdnbbsr.s3waas.gov.in/s3e0f7a4d0ef9b84b83b693bbf3feb8e6e/uploads/2025/12/202512231822103663.pdf',
  },
];


const ROOT =
  path.resolve(
    './data/neet/mcc/2025'
  );


const RAW_DIR =
  path.join(
    ROOT,
    'raw'
  );


const MANIFEST_FILE =
  path.join(
    ROOT,
    'manifest.json'
  );


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


function sha256(
  buffer
) {
  return crypto
    .createHash(
      'sha256'
    )
    .update(
      buffer
    )
    .digest(
      'hex'
    );
}


function isPdf(
  buffer
) {
  if (
    !buffer ||
    buffer.length <
      5
  ) {
    return false;
  }


  return (
    buffer
      .subarray(
        0,
        5
      )
      .toString(
        'ascii'
      ) ===
    '%PDF-'
  );
}


async function download(
  document
) {

  console.log(
    `\n========================================`
  );

  console.log(
    `Downloading ${document.key}`
  );

  console.log(
    document.title
  );

  console.log(
    document.url
  );


  const response =
    await fetch(
      document.url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

          'Accept':
            'application/pdf,*/*;q=0.8',
        },
      }
    );


  if (
    !response.ok
  ) {
    throw new Error(
      `${document.key}: HTTP ${response.status}`
    );
  }


  const arrayBuffer =
    await response.arrayBuffer();


  const buffer =
    Buffer.from(
      arrayBuffer
    );


  if (
    !isPdf(
      buffer
    )
  ) {
    throw new Error(
      `${document.key}: downloaded content is not a valid PDF`
    );
  }


  const filePath =
    path.join(
      RAW_DIR,
      `${document.key}.pdf`
    );


  fs.writeFileSync(
    filePath,
    buffer
  );


  const result = {
    year:
      2025,

    authority:
      'MCC',

    exam:
      'NEET UG',

    key:
      document.key,

    title:
      document.title,

    sourceUrl:
      document.url,

    localFile:
      path
        .relative(
          process.cwd(),
          filePath
        )
        .replace(
          /\\/g,
          '/'
        ),

    bytes:
      buffer.length,

    sha256:
      sha256(
        buffer
      ),

    verifiedPdf:
      true,

    fetchedAt:
      new Date()
        .toISOString(),
  };


  console.log(
    `Saved: ${filePath}`
  );

  console.log(
    `Bytes: ${result.bytes.toLocaleString()}`
  );

  console.log(
    `SHA256: ${result.sha256}`
  );


  return result;
}


async function run() {

  ensureDir(
    RAW_DIR
  );


  const manifest = [];


  for (
    const document of
    DOCUMENTS
  ) {

    try {

      const result =
        await download(
          document
        );


      manifest.push({
        ...result,

        status:
          'downloaded',
      });

    } catch (
      error
    ) {

      console.error(
        `\nFAILED ${document.key}`
      );

      console.error(
        error.message
      );


      manifest.push({
        year:
          2025,

        authority:
          'MCC',

        exam:
          'NEET UG',

        key:
          document.key,

        title:
          document.title,

        sourceUrl:
          document.url,

        status:
          'failed',

        error:
          error.message,

        fetchedAt:
          new Date()
            .toISOString(),
      });
    }
  }


  fs.writeFileSync(
    MANIFEST_FILE,
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
    'NEET MCC 2025 DOWNLOAD COMPLETE'
  );

  console.log(
    '========================================'
  );


  console.table(
    manifest.map(
      item => ({
        key:
          item.key,

        status:
          item.status,

        bytes:
          item.bytes ||
          null,

        verifiedPdf:
          item.verifiedPdf ||
          false,
      })
    )
  );


  console.log(
    `\nManifest: ${MANIFEST_FILE}`
  );


  const failed =
    manifest.filter(
      item =>
        item.status !==
        'downloaded'
    );


  if (
    failed.length >
    0
  ) {
    console.log(
      `\nFAILED DOWNLOADS: ${failed.length}`
    );

    process.exitCode =
      1;
  } else {
    console.log(
      '\nALL 2025 MCC PDFs DOWNLOADED AND VERIFIED'
    );
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
