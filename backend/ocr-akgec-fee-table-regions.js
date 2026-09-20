import axios from "axios";
import fs from "node:fs";
import path from "node:path";

import {
  pdf
} from "pdf-to-img";

import {
  createWorker,
  PSM
} from "tesseract.js";

import {
  createCanvas,
  loadImage
} from "@napi-rs/canvas";


const OUTPUT =
  "./akgec-2026-targeted-table-ocr.json";

const TEMP_DIR =
  path.resolve(
    "./tmp-akgec-table-ocr"
  );


const SOURCES = [
  {
    key:
      "btech_general",

    url:
      "https://www.akgec.ac.in/wp-content/uploads/2026/06/B-Tech-Ist-Year-2026-27_0001.pdf",

    crop: {
      x:
        0.05,

      y:
        0.23,

      width:
        0.90,

      height:
        0.42
    }
  },

  {
    key:
      "btech_fee_waiver",

    url:
      "https://www.akgec.ac.in/wp-content/uploads/2026/06/B-Tech-Ist-Year-FW-2026-27_0001.pdf",

    crop: {
      x:
        0.05,

      y:
        0.23,

      width:
        0.90,

      height:
        0.42
    }
  },

  {
    key:
      "hostel",

    url:
      "https://www.akgec.ac.in/wp-content/uploads/2026/06/HOSTEL-FEE-2026-27_0001-1.pdf",

    crop: {
      x:
        0.05,

      y:
        0.30,

      width:
        0.90,

      height:
        0.28
    }
  }
];


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
  file
) {
  if (!file) {
    return;
  }

  try {
    if (
      fs.existsSync(
        file
      )
    ) {
      fs.unlinkSync(
        file
      );
    }
  } catch {
    // Ignore cleanup errors.
  }
}


function clearTempDir() {
  ensureTempDir();

  const files =
    fs.readdirSync(
      TEMP_DIR
    );

  for (
    const file
    of files
  ) {
    safeDelete(
      path.join(
        TEMP_DIR,
        file
      )
    );
  }
}


async function downloadPdf(
  source
) {
  const response =
    await axios.get(
      source.url,
      {
        responseType:
          "arraybuffer",

        timeout:
          60000,

        maxRedirects:
          8,

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
      `Downloaded PDF too small: ${buffer.length} bytes`
    );
  }


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
      `Invalid PDF signature: ${JSON.stringify(signature)}`
    );
  }


  const file =
    path.join(
      TEMP_DIR,
      `${source.key}-${Date.now()}.pdf`
    );


  fs.writeFileSync(
    file,
    buffer
  );


  return {
    path:
      file,

    bytes:
      buffer.length
  };
}


async function renderFirstPage(
  pdfPath,
  key
) {
  const document =
    await pdf(
      pdfPath,
      {
        scale:
          5
      }
    );


  let pageImage =
    null;


  for await (
    const image
    of document
  ) {
    pageImage =
      Buffer.isBuffer(
        image
      )
        ? image
        : Buffer.from(
            image
          );

    break;
  }


  if (
    !pageImage
  ) {
    throw new Error(
      "Could not render first PDF page."
    );
  }


  const output =
    path.join(
      TEMP_DIR,
      `${key}-full.png`
    );


  fs.writeFileSync(
    output,
    pageImage
  );


  return output;
}


async function cropImage(
  inputPath,
  key,
  crop
) {
  const image =
    await loadImage(
      inputPath
    );


  const x =
    Math.round(
      image.width *
      crop.x
    );

  const y =
    Math.round(
      image.height *
      crop.y
    );

  const width =
    Math.round(
      image.width *
      crop.width
    );

  const height =
    Math.round(
      image.height *
      crop.height
    );


  const canvas =
    createCanvas(
      width,
      height
    );


  const context =
    canvas.getContext(
      "2d"
    );


  context.fillStyle =
    "#ffffff";

  context.fillRect(
    0,
    0,
    width,
    height
  );


  context.drawImage(
    image,
    x,
    y,
    width,
    height,
    0,
    0,
    width,
    height
  );


  const output =
    path.join(
      TEMP_DIR,
      `${key}-crop.png`
    );


  fs.writeFileSync(
    output,
    canvas.toBuffer(
      "image/png"
    )
  );


  return output;
}


async function upscaleCrop(
  inputPath,
  key
) {
  const image =
    await loadImage(
      inputPath
    );


  const SCALE =
    2;


  const width =
    image.width *
    SCALE;

  const height =
    image.height *
    SCALE;


  const canvas =
    createCanvas(
      width,
      height
    );


  const context =
    canvas.getContext(
      "2d"
    );


  context.fillStyle =
    "#ffffff";

  context.fillRect(
    0,
    0,
    width,
    height
  );


  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );


  const output =
    path.join(
      TEMP_DIR,
      `${key}-crop-upscaled.png`
    );


  fs.writeFileSync(
    output,
    canvas.toBuffer(
      "image/png"
    )
  );


  return output;
}


async function runOcrPass(
  worker,
  imagePath,
  psm
) {
  await worker.setParameters({
    tessedit_pageseg_mode:
      psm,

    preserve_interword_spaces:
      "1"
  });


  const result =
    await worker.recognize(
      imagePath
    );


  return cleanText(
    result?.data?.text ||
    ""
  );
}


function extractNumbers(
  text
) {
  const matches =
    String(
      text ?? ""
    ).match(
      /\d[\d,.]*/g
    ) || [];


  const rows = [];


  for (
    const raw
    of matches
  ) {
    const value =
      Number(
        raw
          .replace(
            /,/g,
            ""
          )
          .replace(
            /\.$/,
            ""
          )
      );


    if (
      !Number.isFinite(
        value
      )
    ) {
      continue;
    }


    rows.push({
      raw,
      value
    });
  }


  return rows;
}


function summarizeNumbers(
  rows
) {
  const values =
    rows
      .map(
        row =>
          row.value
      )
      .filter(
        Number.isFinite
      );


  const unique =
    [
      ...new Set(
        values
      )
    ];


  return unique.sort(
    (
      a,
      b
    ) =>
      a - b
  );
}


async function processSource(
  source,
  worker
) {
  let pdfPath =
    null;

  let fullImage =
    null;

  let cropped =
    null;

  let upscaled =
    null;


  try {
    console.log("");

    console.log(
      "---------------------------------------"
    );

    console.log(
      "Processing:",
      source.key
    );

    console.log(
      "---------------------------------------"
    );


    const downloaded =
      await downloadPdf(
        source
      );


    pdfPath =
      downloaded.path;


    console.log(
      "PDF downloaded"
    );

    console.log(
      "Downloaded bytes:",
      downloaded.bytes
    );


    fullImage =
      await renderFirstPage(
        pdfPath,
        source.key
      );


    console.log(
      "Rendered:",
      fullImage
    );


    cropped =
      await cropImage(
        fullImage,
        source.key,
        source.crop
      );


    console.log(
      "Cropped:",
      cropped
    );


    upscaled =
      await upscaleCrop(
        cropped,
        source.key
      );


    console.log(
      "Upscaled:",
      upscaled
    );


    /*
    |--------------------------------------------------------------------------
    | OCR PASS 1: Sparse text
    |--------------------------------------------------------------------------
    */

    const sparse =
      await runOcrPass(
        worker,
        upscaled,
        PSM.SPARSE_TEXT
      );


    /*
    |--------------------------------------------------------------------------
    | OCR PASS 2: Single block
    |--------------------------------------------------------------------------
    */

    const block =
      await runOcrPass(
        worker,
        upscaled,
        PSM.SINGLE_BLOCK
      );


    /*
    |--------------------------------------------------------------------------
    | OCR PASS 3: Automatic
    |--------------------------------------------------------------------------
    */

    const auto =
      await runOcrPass(
        worker,
        upscaled,
        PSM.AUTO
      );


    console.log("");

    console.log(
      "========== SPARSE OCR =========="
    );

    console.log(
      sparse
    );


    console.log("");

    console.log(
      "========== BLOCK OCR =========="
    );

    console.log(
      block
    );


    console.log("");

    console.log(
      "========== AUTO OCR =========="
    );

    console.log(
      auto
    );


    const combined =
      [
        sparse,
        block,
        auto
      ].join(
        "\n\n"
      );


    const numbers =
      extractNumbers(
        combined
      );


    const uniqueNumbers =
      summarizeNumbers(
        numbers
      );


    return {
      source_key:
        source.key,

      source_url:
        source.url,

      academic_year:
        2026,

      session:
        "2026-27",

      crop:
        source.crop,

      ocr: {
        sparse,
        block,
        auto
      },

      numbers,

      unique_numbers:
        uniqueNumbers,

      status:
        combined.length > 100
          ? "OCR_COMPLETE"
          : "REVIEW_REQUIRED"
    };

  } finally {
    safeDelete(
      pdfPath
    );

    safeDelete(
      fullImage
    );

    safeDelete(
      cropped
    );

    safeDelete(
      upscaled
    );
  }
}


async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "AKGEC TARGETED TABLE OCR V2"
  );

  console.log(
    "======================================="
  );

  console.log("");


  ensureTempDir();

  clearTempDir();


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

      } catch (error) {
        console.error("");

        console.error(
          `[FAILED] ${source.key}`
        );

        console.error(
          error
        );


        results.push({
          source_key:
            source.key,

          source_url:
            source.url,

          academic_year:
            2026,

          session:
            "2026-27",

          status:
            "FAILED",

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
      // Ignore OCR shutdown error.
    }


    clearTempDir();
  }


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT FIX
  |--------------------------------------------------------------------------
  |
  | node:fs callback version caused:
  |
  | ERR_INVALID_ARG_TYPE:
  | The "cb" argument must be of type function
  |
  | So we use writeFileSync here.
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

        numbers:
          row.numbers?.length ||
          0,

        unique_numbers:
          row.unique_numbers?.length ||
          0
      })
    )
  );


  console.log("");

  console.log(
    "UNIQUE NUMBER CANDIDATES"
  );


  for (
    const row
    of results
  ) {
    console.log("");

    console.log(
      row.source_key
    );

    console.log(
      row.unique_numbers ||
      []
    );
  }


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


main().catch(
  error => {
    console.error("");

    console.error(
      "FAILED:"
    );

    console.error(
      error
    );


    process.exitCode =
      1;
  }
);