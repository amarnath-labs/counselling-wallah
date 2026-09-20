import axios from "axios";
import fs from "node:fs";
import path from "node:path";

import {
  pdf
} from "pdf-to-img";

import {
  createWorker
} from "tesseract.js";


/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const OUTPUT =
  "./akgec-2026-pdf-extraction.json";

const TEMP_DIR =
  path.resolve(
    "./tmp-akgec-ocr"
  );

const COLLEGE_ID =
  "uptac-ajay-kumar-garg-engg-college-ghaziabad";

const COLLEGE_NAME =
  "AJAY KUMAR GARG ENGG. COLLEGE,GHAZIABAD";


/*
|--------------------------------------------------------------------------
| OFFICIAL 2026-27 SOURCES
|--------------------------------------------------------------------------
*/

const SOURCES = [
  {
    key:
      "btech_general",

    url:
      "https://www.akgec.ac.in/wp-content/uploads/2026/06/B-Tech-Ist-Year-2026-27_0001.pdf"
  },

  {
    key:
      "btech_fee_waiver",

    url:
      "https://www.akgec.ac.in/wp-content/uploads/2026/06/B-Tech-Ist-Year-FW-2026-27_0001.pdf"
  },

  {
    key:
      "hostel",

    url:
      "https://www.akgec.ac.in/wp-content/uploads/2026/06/HOSTEL-FEE-2026-27_0001-1.pdf"
  }
];


/*
|--------------------------------------------------------------------------
| TEXT HELPERS
|--------------------------------------------------------------------------
*/

function cleanText(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /\r/g,
      ""
    )
    .replace(
      /[ \t]+/g,
      " "
    )
    .replace(
      /\n[ \t]+/g,
      "\n"
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}


function normalizeOcrMoneyText(
  value
) {
  /*
  |--------------------------------------------------------------------------
  | Only light OCR cleanup.
  |
  | IMPORTANT:
  | We DO NOT aggressively change O/I/S/B into digits globally because that
  | could corrupt normal words.
  |--------------------------------------------------------------------------
  */

  return String(
    value ?? ""
  )
    .replace(
      /₹/g,
      "Rs "
    )
    .replace(
      /([0-9]),\s+([0-9])/g,
      "$1,$2"
    );
}


/*
|--------------------------------------------------------------------------
| AMOUNT EXTRACTOR
|--------------------------------------------------------------------------
*/

function extractAmounts(
  text
) {
  const normalized =
    normalizeOcrMoneyText(
      text
    );


  const matches =
    normalized.match(
      /(?:₹|Rs\.?|INR)?\s*(?:\d{1,3}(?:,\d{2,3})+|\d{3,7})(?:\.\d+)?(?:\/-)?/gi
    ) || [];


  const values = [];


  for (
    const match
    of matches
  ) {
    const number =
      Number(
        match
          .replace(
            /₹|Rs\.?|INR/gi,
            ""
          )
          .replace(
            /\/-/g,
            ""
          )
          .replace(
            /,/g,
            ""
          )
          .trim()
      );


    if (
      !Number.isFinite(
        number
      )
    ) {
      continue;
    }


    /*
    |--------------------------------------------------------------------------
    | Ignore obvious year values
    |--------------------------------------------------------------------------
    */

    if (
      number >= 2000 &&
      number <= 2100
    ) {
      continue;
    }


    /*
    |--------------------------------------------------------------------------
    | Reasonable fee range
    |--------------------------------------------------------------------------
    */

    if (
      number < 100 ||
      number > 2000000
    ) {
      continue;
    }


    values.push(
      number
    );
  }


  return [
    ...new Set(
      values
    )
  ].sort(
    (
      a,
      b
    ) =>
      a - b
  );
}


/*
|--------------------------------------------------------------------------
| SIGNAL DETECTION
|--------------------------------------------------------------------------
*/

function detectSignals(
  text
) {
  const lower =
    String(
      text ?? ""
    )
      .toLowerCase();


  return {
    btech:
      /b\.?\s*tech|btech/.test(
        lower
      ),

    tuition:
      /tuition/.test(
        lower
      ),

    development:
      /development/.test(
        lower
      ),

    registration:
      /registration/.test(
        lower
      ),

    admission:
      /admission/.test(
        lower
      ),

    total:
      /\btotal\b/.test(
        lower
      ),

    hostel:
      /hostel/.test(
        lower
      ),

    mess:
      /mess/.test(
        lower
      ),

    caution:
      /caution|security/.test(
        lower
      ),

    examination:
      /exam|examination/.test(
        lower
      ),

    digital_library:
      /digital\s+library/.test(
        lower
      ),

    fee_waiver:
      /fee\s*waiver|tfw|t\.?f\.?w\.?|fw\b/.test(
        lower
      )
  };
}


/*
|--------------------------------------------------------------------------
| TEMP FILE HELPERS
|--------------------------------------------------------------------------
*/

function ensureTempDir() {
  if (
    !fs.existsSync(
      TEMP_DIR
    )
  ) {
    fs.mkdirSync(
      TEMP_DIR,
      {
        recursive:
          true
      }
    );
  }
}


function safeDelete(
  filePath
) {
  try {
    if (
      fs.existsSync(
        filePath
      )
    ) {
      fs.unlinkSync(
        filePath
      );
    }
  } catch {
    /*
    |--------------------------------------------------------------------------
    | Cleanup errors must not fail extraction.
    |--------------------------------------------------------------------------
    */
  }
}


function cleanTempDirectory() {
  ensureTempDir();


  const names =
    fs.readdirSync(
      TEMP_DIR
    );


  for (
    const name
    of names
  ) {
    const file =
      path.join(
        TEMP_DIR,
        name
      );


    try {
      const stat =
        fs.statSync(
          file
        );


      if (
        stat.isFile()
      ) {
        safeDelete(
          file
        );
      }

    } catch {
      // ignore
    }
  }
}


/*
|--------------------------------------------------------------------------
| DOWNLOAD OFFICIAL PDF
|--------------------------------------------------------------------------
*/

async function downloadPdf(
  source
) {
  const response =
    await axios.get(
      source.url,
      {
        timeout:
          60000,

        maxRedirects:
          8,

        responseType:
          "arraybuffer",

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36",

          Accept:
            "application/pdf,*/*"
        }
      }
    );


  const buffer =
    Buffer.from(
      response.data
    );


  if (
    buffer.length < 1000
  ) {
    throw new Error(
      `Downloaded PDF is unexpectedly small: ${buffer.length} bytes`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Check PDF signature.
  |--------------------------------------------------------------------------
  */

  const signature =
    buffer
      .subarray(
        0,
        5
      )
      .toString(
        "ascii"
      );


  if (
    signature !==
    "%PDF-"
  ) {
    throw new Error(
      `Response is not a valid PDF. Signature=${JSON.stringify(signature)}`
    );
  }


  const pdfPath =
    path.join(
      TEMP_DIR,
      `${source.key}-${Date.now()}.pdf`
    );


  fs.writeFileSync(
    pdfPath,
    buffer
  );


  return {
    pdfPath,

    bytes:
      buffer.length,

    contentType:
      String(
        response.headers[
          "content-type"
        ] || ""
      )
  };
}


/*
|--------------------------------------------------------------------------
| PDF -> PNG PAGES
|--------------------------------------------------------------------------
|
| This avoids our previous pdfjs + @napi-rs/canvas page.render() failure.
|--------------------------------------------------------------------------
*/

async function renderPdfPages({
  pdfPath,
  sourceKey
}) {
  /*
  |--------------------------------------------------------------------------
  | scale 3 improves OCR accuracy.
  |--------------------------------------------------------------------------
  */

  const document =
    await pdf(
      pdfPath,
      {
        scale:
          3
      }
    );


  const pages = [];

  let pageNo =
    0;


  for await (
    const image
    of document
  ) {
    pageNo++;


    const imageBuffer =
      Buffer.isBuffer(
        image
      )
        ? image
        : Buffer.from(
            image
          );


    if (
      imageBuffer.length < 100
    ) {
      throw new Error(
        `Rendered page ${pageNo} produced an invalid image.`
      );
    }


    const imagePath =
      path.join(
        TEMP_DIR,
        `${sourceKey}-page-${pageNo}-${Date.now()}.png`
      );


    fs.writeFileSync(
      imagePath,
      imageBuffer
    );


    pages.push({
      page:
        pageNo,

      image_path:
        imagePath,

      image_bytes:
        imageBuffer.length
    });
  }


  if (
    pages.length === 0
  ) {
    throw new Error(
      "PDF renderer returned zero pages."
    );
  }


  return pages;
}


/*
|--------------------------------------------------------------------------
| OCR ONE IMAGE
|--------------------------------------------------------------------------
*/

async function ocrImage(
  worker,
  page
) {
  console.log(
    `   OCR page ${page.page}...`
  );


  console.log(
    "   image:",
    page.image_path
  );


  const result =
    await worker.recognize(
      page.image_path
    );


  const text =
    cleanText(
      result?.data?.text ||
      ""
    );


  return {
    page:
      page.page,

    extraction_method:
      "ocr",

    chars:
      text.length,

    text
  };
}


/*
|--------------------------------------------------------------------------
| PROCESS ONE PDF SOURCE
|--------------------------------------------------------------------------
*/

async function processSource(
  source,
  worker
) {
  console.log("");

  console.log(
    "---------------------------------------"
  );

  console.log(
    "Extracting:",
    source.key
  );

  console.log(
    "---------------------------------------"
  );


  let pdfPath =
    null;

  const renderedImages =
    [];


  try {
    /*
    |--------------------------------------------------------------------------
    | DOWNLOAD
    |--------------------------------------------------------------------------
    */

    const downloaded =
      await downloadPdf(
        source
      );


    pdfPath =
      downloaded.pdfPath;


    console.log(
      "Downloaded bytes:",
      downloaded.bytes
    );


    console.log(
      "Temporary PDF:",
      pdfPath
    );


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    console.log(
      "Rendering PDF pages..."
    );


    const pages =
      await renderPdfPages({
        pdfPath,
        sourceKey:
          source.key
      });


    renderedImages.push(
      ...pages.map(
        row =>
          row.image_path
      )
    );


    console.log(
      "Rendered pages:",
      pages.length
    );


    /*
    |--------------------------------------------------------------------------
    | OCR
    |--------------------------------------------------------------------------
    */

    const pageData = [];


    for (
      const page
      of pages
    ) {
      const pageResult =
        await ocrImage(
          worker,
          page
        );


      pageData.push(
        pageResult
      );
    }


    const text =
      cleanText(
        pageData
          .map(
            row =>
              row.text
          )
          .join(
            "\n\n"
          )
      );


    const amounts =
      extractAmounts(
        text
      );


    const signals =
      detectSignals(
        text
      );


    const status =
      text.length >= 100
        ? "EXTRACTED"
        : "REVIEW_REQUIRED";


    return {
      college_id:
        COLLEGE_ID,

      college_name:
        COLLEGE_NAME,

      academic_year:
        2026,

      session:
        "2026-27",

      source_key:
        source.key,

      source_type:
        "official_pdf",

      source_url:
        source.url,

      pages:
        pageData.length,

      chars:
        text.length,

      used_ocr:
        true,

      amounts_count:
        amounts.length,

      amounts,

      signals,

      text,

      page_data:
        pageData,

      status
    };

  } finally {
    /*
    |--------------------------------------------------------------------------
    | ALWAYS CLEAN TEMP FILES
    |--------------------------------------------------------------------------
    */

    for (
      const imagePath
      of renderedImages
    ) {
      safeDelete(
        imagePath
      );
    }


    if (
      pdfPath
    ) {
      safeDelete(
        pdfPath
      );
    }
  }
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "AKGEC 2026 PDF EXTRACTION V4"
  );

  console.log(
    "PDF-TO-IMG + OCR"
  );

  console.log(
    "======================================="
  );

  console.log("");


  ensureTempDir();

  cleanTempDirectory();


  console.log(
    "Starting OCR engine..."
  );


  const worker =
    await createWorker(
      "eng"
    );


  const results = [];


  try {
    for (
      const source
      of SOURCES
    ) {
      try {
        const result =
          await processSource(
            source,
            worker
          );


        results.push(
          result
        );


        console.log("");

        console.log(
          "[OK]",
          "pages:",
          result.pages,
          "chars:",
          result.chars,
          "amounts:",
          result.amounts_count
        );


        console.log("");

        console.log(
          "Signals:"
        );


        console.table([
          result.signals
        ]);


        console.log("");

        console.log(
          "Extracted amounts:"
        );


        console.log(
          result.amounts
        );


        console.log("");

        console.log(
          "---------- OCR TEXT ----------"
        );


        console.log(
          result.text
        );


        console.log(
          "------------------------------"
        );

      } catch (error) {
        console.log("");

        console.error(
          `[FAILED] ${source.key}`
        );


        /*
        |--------------------------------------------------------------------------
        | FULL ERROR for debugging
        |--------------------------------------------------------------------------
        */

        console.error(
          error
        );


        results.push({
          college_id:
            COLLEGE_ID,

          college_name:
            COLLEGE_NAME,

          academic_year:
            2026,

          session:
            "2026-27",

          source_key:
            source.key,

          source_type:
            "official_pdf",

          source_url:
            source.url,

          pages:
            0,

          chars:
            0,

          used_ocr:
            false,

          amounts_count:
            0,

          amounts:
            [],

          signals:
            null,

          text:
            "",

          page_data:
            [],

          status:
            "EXTRACTION_FAILED",

          error:
            error?.message ||
            String(
              error
            ),

          stack:
            error?.stack ||
            null
        });
      }
    }

  } finally {
    console.log("");

    console.log(
      "Stopping OCR engine..."
    );


    try {
      await worker.terminate();
    } catch {
      // ignore
    }


    cleanTempDirectory();
  }


  /*
  |--------------------------------------------------------------------------
  | SAVE OUTPUT
  |--------------------------------------------------------------------------
  */

  fs.writeFileSync(
    OUTPUT,

    JSON.stringify(
      results,
      null,
      2
    ),

    "utf8"
  );


  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "SUMMARY"
  );

  console.log(
    "======================================="
  );

  console.log("");


  console.table(
    results.map(
      row => ({
        source:
          row.source_key,

        status:
          row.status,

        pages:
          row.pages || 0,

        chars:
          row.chars || 0,

        ocr:
          row.used_ocr ??
          false,

        amounts:
          row.amounts_count ||
          0,

        btech:
          row.signals?.btech ??
          null,

        tuition:
          row.signals?.tuition ??
          null,

        development:
          row.signals
            ?.development ??
          null,

        total:
          row.signals?.total ??
          null,

        hostel:
          row.signals?.hostel ??
          null,

        mess:
          row.signals?.mess ??
          null,

        fee_waiver:
          row.signals
            ?.fee_waiver ??
          null
      })
    )
  );


  const extracted =
    results.filter(
      row =>
        row.status ===
        "EXTRACTED"
    );


  const failed =
    results.filter(
      row =>
        row.status ===
        "EXTRACTION_FAILED"
    );


  console.log("");

  console.log(
    "Successfully extracted:",
    extracted.length
  );


  console.log(
    "Failed:",
    failed.length
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );


  console.log("");

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );
}


/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/

main().catch(
  error => {
    console.error("");

    console.error(
      "FATAL ERROR:"
    );

    console.error(
      error
    );


    process.exitCode =
      1;
  }
);