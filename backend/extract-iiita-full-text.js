import fs from 'node:fs/promises';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';

const URL =
  'https://www.iiita.ac.in/sites/default/files/Fee%20Structure%20B.Tech_.%20%28New%20Batch%202026%29.pdf';

const OUTPUT =
  './iiita-btech-2026-full-text.txt';

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('IIIT ALLAHABAD FULL PDF TEXT');
  console.log('=======================================');
  console.log('');

  console.log('[DOWNLOAD]', URL);

  const response = await axios.get(
    URL,
    {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }
  );

  console.log(
    '[HTTP]',
    response.status
  );

  const buffer =
    Buffer.from(response.data);

  console.log(
    '[BYTES]',
    buffer.length
  );

  const signature =
    buffer
      .subarray(0, 5)
      .toString('ascii');

  console.log(
    '[SIGNATURE]',
    signature
  );

  if (signature !== '%PDF-') {
    throw new Error(
      'Downloaded response is not a valid PDF'
    );
  }

  console.log(
    '[PDF] Extracting text...'
  );

  const parser =
    new PDFParse({
      data: buffer
    });

  try {
    const result =
      await parser.getText();

    const text =
      String(
        result.text || ''
      );

    if (!text.trim()) {
      throw new Error(
        'PDF text extraction returned empty text'
      );
    }

    await fs.writeFile(
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

    console.log('');
    console.log(
      'DATABASE HAS NOT BEEN MODIFIED.'
    );

  } finally {
    await parser.destroy();
  }
}

main().catch(
  error => {
    console.error(
      '[FAILED]',
      error.message
    );

    process.exitCode = 1;
  }
);
