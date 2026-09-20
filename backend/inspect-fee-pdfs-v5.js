import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

const DOCUMENTS = [
  {
    college: 'ABSS INSTITUTE OF TECHNOLOGY, MEERUT',
    url:
      'https://www.abss.edu.in/pdfs/Indian-fee-structure-2026-27.pdf',
    file:
      './tmp-fees/abss-2026-27.pdf'
  },

  {
    college: 'COEP Technological University, Pune',
    url:
      'https://www.coeptech.ac.in/wp-content/uploads/2026/09/Revised-Fee-Structure_First-Year_UG-_2026-27.pdf',
    file:
      './tmp-fees/coep-2026-27.pdf'
  }
];

function cleanText(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractInterestingLines(text) {
  const lines =
    cleanText(text)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

  return lines.filter(line =>
    /b\.?\s*tech|fee|tuition|development|academic|institute|admission|caution|security|student|exam|library|total|open|obc|ews|sc|st|general|₹|rs\.?|inr|\d{4,7}/i
      .test(line)
  );
}

async function downloadPdf(item) {
  console.log('');
  console.log('========================================');
  console.log(item.college);
  console.log('========================================');

  console.log(`URL: ${item.url}`);

  const response =
    await axios.get(
      item.url,
      {
        responseType:
          'arraybuffer',

        timeout:
          30000,

        maxRedirects:
          5,

        headers: {
          'User-Agent':
            'Mozilla/5.0 CounsellingWallah Fee Verification',

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
    `Downloaded bytes: ${buffer.length}`
  );

  await fs.mkdir(
    path.dirname(item.file),
    {
      recursive: true
    }
  );

  await fs.writeFile(
    item.file,
    buffer
  );

  return buffer;
}

async function inspectPdf(item) {
  try {
    const buffer =
      await downloadPdf(
        item
      );

    const parsed =
      await pdf(buffer);

    console.log(
      `PDF pages: ${parsed.numpages}`
    );

    const text =
      cleanText(
        parsed.text
      );

    console.log(
      `Extracted characters: ${text.length}`
    );

    /*
     * Save complete extracted text too.
     */
    const txtPath =
      item.file.replace(
        /\.pdf$/i,
        '.txt'
      );

    await fs.writeFile(
      txtPath,
      text,
      'utf8'
    );

    console.log(
      `Saved text: ${txtPath}`
    );

    const interesting =
      extractInterestingLines(
        text
      );

    console.log('');
    console.log(
      '=== FEE-RELATED EXTRACT ==='
    );

    for (
      const line of
      interesting.slice(0, 150)
    ) {
      console.log(line);
    }

    console.log('');
    console.log(
      `Interesting lines: ${interesting.length}`
    );
  } catch (error) {
    console.error(
      `FAILED: ${error.message}`
    );
  }
}

async function main() {
  console.log('');
  console.log(
    '========================================'
  );
  console.log(
    'CW-REC PDF FEE INSPECTOR V5'
  );
  console.log(
    '========================================'
  );

  for (
    const item of DOCUMENTS
  ) {
    await inspectPdf(
      item
    );
  }

  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    '✅ PDF FEE INSPECTION COMPLETE'
  );

  console.log(
    '========================================'
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
