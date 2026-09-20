import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';

const PDF_PATH = './iit-madras-nirf-2025.pdf';
const TEXT_PATH = './iit-madras-nirf-2025.txt';

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('NIRF PLACEMENT PDF EXTRACTOR');
  console.log('=======================================');
  console.log('');

  console.log('[PDF] Reading:', PDF_PATH);

  const buffer = await fs.readFile(PDF_PATH);

  console.log(
    '[PDF] File size:',
    buffer.length,
    'bytes'
  );

  const parser = new PDFParse({
    data: buffer,
  });

  const result =
    await parser.getText();

  await parser.destroy();

  const text =
    String(result.text || '');

  console.log(
    '[PDF] Extracted characters:',
    text.length
  );

  await fs.writeFile(
    TEXT_PATH,
    text,
    'utf8'
  );

  console.log(
    '[PDF] Full text saved:',
    TEXT_PATH
  );

  /*
  |--------------------------------------------------------------------------
  | FIND PLACEMENT-RELATED LINES
  |--------------------------------------------------------------------------
  */

  const lines =
    text
      .split(/\r?\n/)
      .map(
        (line) =>
          line
            .replace(/\s+/g, ' ')
            .trim()
      );

  const keywords = [
    'median',
    'salary',
    'placed',
    'placement',
    'higher studies',
    'graduating',
    'graduated',
    'students admitted',
    'students placed',
  ];

  const matchedIndexes =
    new Set();

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {
    const lower =
      lines[i].toLowerCase();

    if (
      keywords.some(
        (keyword) =>
          lower.includes(keyword)
      )
    ) {
      matchedIndexes.add(i);
    }
  }

  console.log('');
  console.log('=======================================');
  console.log('PLACEMENT-RELATED SECTIONS');
  console.log('=======================================');

  if (
    matchedIndexes.size === 0
  ) {
    console.log(
      'No placement keywords found.'
    );
  }

  for (
    const index of matchedIndexes
  ) {
    console.log('');
    console.log(
      '---------------------------------------'
    );

    const start =
      Math.max(
        0,
        index - 5
      );

    const end =
      Math.min(
        lines.length,
        index + 12
      );

    for (
      let i = start;
      i < end;
      i++
    ) {
      if (!lines[i]) {
        continue;
      }

      console.log(
        `${i + 1}: ${lines[i]}`
      );
    }
  }

  console.log('');
  console.log('=======================================');
  console.log('EXTRACTION COMPLETE');
  console.log('=======================================');

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );

  console.log(
    'Recommendation logic has NOT been modified.'
  );
}

main().catch(
  (error) => {
    console.error(
      '[PDF] FAILED:',
      error.message
    );

    console.error(error);

    process.exitCode = 1;
  }
);
