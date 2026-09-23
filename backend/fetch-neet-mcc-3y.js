import fs from 'fs';
import path from 'path';

const ROOT =
  path.resolve(
    './data/neet/mcc'
  );


const DOCUMENTS = [

  // =========================================================
  // 2026
  // =========================================================

  {
    year: 2026,
    round: 'round-1',
    title:
      'Final Allotment Result for Round 1 of UG Counselling 2026',

    documentUrl:
      'https://mcc.nic.in/document/final-allotment-result-for-round-1-of-ug-counselling-2026/',
  },

  {
    year: 2026,
    round: 'round-2',
    title:
      'Final Result UG Round 2 Counselling 2026 dated 12.09.2026',

    documentUrl:
      'https://mcc.nic.in/document/final-result-ug-round-2-counselling-2026-dated-12-09-2026/',
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


function decodeHtml(
  value
) {
  return String(
    value || ''
  )
    .replace(
      /&amp;/g,
      '&'
    )
    .replace(
      /&quot;/g,
      '"'
    )
    .replace(
      /&#39;/g,
      "'"
    )
    .replace(
      /&nbsp;/g,
      ' '
    )
    .replace(
      /<[^>]+>/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function absoluteUrl(
  value,
  base
) {
  try {
    return new URL(
      value,
      base
    ).href;
  }
  catch {
    return null;
  }
}


async function fetchPage(
  url
) {
  const response =
    await fetch(
      url,
      {
        redirect:
          'follow',

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

          'Accept':
            'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',

          'Accept-Language':
            'en-US,en;q=0.9',

          'Referer':
            'https://mcc.nic.in/',
        },
      }
    );


  if (
    !response.ok
  ) {
    throw new Error(
      `HTTP ${response.status} ${url}`
    );
  }


  return response;
}


function getPdfLinks(
  html,
  baseUrl
) {
  const results = [];

  const regex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;


  while (
    (
      match =
        regex.exec(
          html
        )
    )
  ) {
    const url =
      absoluteUrl(
        match[1],
        baseUrl
      );


    if (
      !url
    ) {
      continue;
    }


    if (
      !/\.pdf(?:$|\?)/i.test(
        url
      )
    ) {
      continue;
    }


    results.push({
      url,

      text:
        decodeHtml(
          match[2]
        ),
    });
  }


  return results;
}


async function resolvePdf(
  documentUrl
) {
  const response =
    await fetchPage(
      documentUrl
    );


  const contentType =
    String(
      response.headers.get(
        'content-type'
      ) || ''
    ).toLowerCase();


  if (
    contentType.includes(
      'application/pdf'
    )
  ) {
    return documentUrl;
  }


  const html =
    await response.text();


  const links =
    getPdfLinks(
      html,
      documentUrl
    );


  if (
    links.length === 0
  ) {
    return null;
  }


  /*
   * Usually MCC document page contains one main PDF.
   * Prefer links containing uploads / pdf.
   */

  const preferred =
    links.find(
      item =>
        item.url.includes(
          '/wp-content/'
        ) ||
        item.url.includes(
          '/uploads/'
        )
    );


  return (
    preferred?.url ||
    links[0].url
  );
}


async function downloadPdf(
  url,
  destination
) {
  const response =
    await fetchPage(
      url
    );


  const buffer =
    Buffer.from(
      await response.arrayBuffer()
    );


  if (
    buffer.length <
    1000
  ) {
    throw new Error(
      `Downloaded file too small: ${buffer.length}`
    );
  }


  /*
   * PDF magic bytes = %PDF
   */

  const signature =
    buffer
      .subarray(
        0,
        4
      )
      .toString(
        'ascii'
      );


  if (
    signature !==
    '%PDF'
  ) {
    throw new Error(
      `Downloaded file is not a PDF. Signature: ${JSON.stringify(
        signature
      )}`
    );
  }


  fs.writeFileSync(
    destination,
    buffer
  );


  return buffer.length;
}


async function run() {

  ensureDir(
    ROOT
  );


  const manifest = {
    exam:
      'NEET UG',

    source:
      'Medical Counselling Committee (MCC)',

    fetchedAt:
      new Date()
        .toISOString(),

    years: {
      2024: {
        status:
          'pending-manifest',
        documents:
          [],
      },

      2025: {
        status:
          'pending-manifest',
        documents:
          [],
      },

      2026: {
        status:
          'partial',
        documents:
          [],
      },
    },
  };


  for (
    const item of DOCUMENTS
  ) {

    console.log(
      '\n========================================'
    );

    console.log(
      `${item.year} ${item.round}`
    );

    console.log(
      item.title
    );


    const yearDir =
      path.join(
        ROOT,
        String(
          item.year
        )
      );


    const rawDir =
      path.join(
        yearDir,
        'raw'
      );


    ensureDir(
      rawDir
    );


    const record = {
      ...item,

      pdfUrl:
        null,

      status:
        'pending',

      localFile:
        null,

      bytes:
        null,

      error:
        null,
    };


    try {

      const pdfUrl =
        await resolvePdf(
          item.documentUrl
        );


      if (
        !pdfUrl
      ) {
        throw new Error(
          'No PDF link found on MCC document page'
        );
      }


      console.log(
        `PDF: ${pdfUrl}`
      );


      const filename =
        `${item.round}.pdf`;


      const destination =
        path.join(
          rawDir,
          filename
        );


      const bytes =
        await downloadPdf(
          pdfUrl,
          destination
        );


      record.pdfUrl =
        pdfUrl;

      record.status =
        'downloaded';

      record.localFile =
        destination;

      record.bytes =
        bytes;


      console.log(
        `Saved: ${destination}`
      );

      console.log(
        `Bytes: ${bytes}`
      );

    }
    catch (
      error
    ) {

      record.status =
        'failed';

      record.error =
        error.message;


      console.error(
        `FAILED: ${error.message}`
      );

    }


    manifest
      .years[
        item.year
      ]
      .documents
      .push(
        record
      );
  }


  fs.writeFileSync(
    path.join(
      ROOT,
      'manifest.json'
    ),

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
    'DONE'
  );

  console.log(
    `Manifest: ${path.join(
      ROOT,
      'manifest.json'
    )}`
  );

  console.log(
    '========================================'
  );
}


run().catch(
  error => {

    console.error(
      '\nFATAL ERROR'
    );

    console.error(
      error
    );

    process.exit(
      1
    );

  }
);
