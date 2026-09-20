import fs from 'node:fs';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';

const INPUT =
  './btech-fee-candidate-quality.json';

const OUTPUT =
  './iit-goa-btech-2026-full-text.txt';

const PDF_OUTPUT =
  './iit-goa-btech-2026.pdf';

function loadJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'IIT GOA BTECH 2026 FEE EXTRACTOR'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const rows =
    loadJson(INPUT);

  const row =
    rows.find(
      item =>
        item.college_id ===
        'indian-institute-of-technology-goa'
    );

  if (!row) {
    throw new Error(
      'IIT Goa candidate not found.'
    );
  }

  if (
    row.final_status !==
    'READY_FOR_DOWNLOAD'
  ) {
    throw new Error(
      `IIT Goa is not READY_FOR_DOWNLOAD. Current status: ${row.final_status}`
    );
  }

  const url =
    row.best_candidate_url;

  if (!url) {
    throw new Error(
      'IIT Goa candidate URL missing.'
    );
  }

  console.log(
    '[DOWNLOAD]',
    url
  );

  const response =
    await axios.get(
      url,
      {
        responseType:
          'arraybuffer',

        timeout:
          60000,

        maxRedirects:
          8,

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

          Accept:
            'application/pdf,*/*'
        }
      }
    );

  const buffer =
    Buffer.from(
      response.data
    );

  console.log(
    '[HTTP]',
    response.status
  );

  console.log(
    '[BYTES]',
    buffer.length
  );

  console.log(
    '[SIGNATURE]',
    buffer
      .subarray(0, 5)
      .toString('ascii')
  );

  if (
    buffer
      .subarray(0, 5)
      .toString('ascii') !==
    '%PDF-'
  ) {
    throw new Error(
      'Downloaded IIT Goa candidate is not a valid PDF.'
    );
  }

  fs.writeFileSync(
    PDF_OUTPUT,
    buffer
  );

  console.log(
    '[PDF] Saved:',
    PDF_OUTPUT
  );

  console.log('');
  console.log(
    '[PDF] Extracting full text...'
  );

  const parser =
    new PDFParse({
      data: buffer
    });

  let result;

  try {
    result =
      await parser.getText();
  } finally {
    await parser.destroy();
  }

  const text =
    String(
      result?.text || ''
    )
      .replace(/\r/g, '')
      .trim();

  fs.writeFileSync(
    OUTPUT,
    text,
    'utf8'
  );

  console.log('');
  console.log(
    '[OK] Characters:',
    text.length
  );

  console.log(
    '[OK] Saved:',
    OUTPUT
  );

  const lower =
    text.toLowerCase();

  const signals = {
    btech:
      /\bb\.?\s*tech\b|\bbtech\b|bachelor of technology/.test(
        lower
      ),

    tuition:
      /tuition\s*fee|tuition/.test(
        lower
      ),

    semester:
      /semester|sem\s*[1-8]/.test(
        lower
      ),

    hostel:
      /hostel|hosteller|seat rent|room rent/.test(
        lower
      ),

    mess:
      /mess|dining|food charge/.test(
        lower
      ),

    income:
      /income|family income|parental income/.test(
        lower
      ),

    scst:
      /sc\s*\/?\s*st|scheduled caste|scheduled tribe/.test(
        lower
      ),

    total:
      /grand total|total fee|total amount|\btotal\b/.test(
        lower
      )
  };

  console.log('');
  console.log(
    'FEE SIGNALS'
  );

  console.table(
    signals
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  error => {
    console.error(
      '[IIT GOA] FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);
