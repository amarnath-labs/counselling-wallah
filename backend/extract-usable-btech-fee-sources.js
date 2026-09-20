import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';

const INPUT =
  './btech-fee-source-validation.json';

const OUTPUT_DIR =
  './btech-fee-source-text';

const SUMMARY =
  './btech-fee-source-text-summary.json';

function loadJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    ).replace(/^\uFEFF/, '')
  );
}

function safeName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanHtml(html) {
  return String(html || '')
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      ' '
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      ' '
    )
    .replace(
      /<noscript[\s\S]*?<\/noscript>/gi,
      ' '
    )
    .replace(
      /<[^>]+>/g,
      ' '
    )
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function download(url) {
  return axios.get(
    url,
    {
      responseType:
        'arraybuffer',

      timeout:
        45000,

      maxRedirects:
        8,

      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

        'Accept':
          'text/html,application/pdf,application/xhtml+xml,*/*'
      }
    }
  );
}

async function extractPdf(buffer) {
  const parser =
    new PDFParse({
      data: buffer
    });

  try {
    const result =
      await parser.getText();

    return String(
      result.text || ''
    );

  } finally {
    await parser.destroy();
  }
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );
  console.log(
    'BTECH FEE SOURCE FULL-TEXT EXTRACTOR'
  );
  console.log(
    '======================================='
  );
  console.log('');

  await fsp.mkdir(
    OUTPUT_DIR,
    {
      recursive: true
    }
  );

  const rows =
    loadJson(INPUT);

  const usable =
    rows.filter(
      row =>
        row.status ===
          'USABLE_PDF' ||
        row.status ===
          'USABLE_HTML'
    );

  const summary = [];

  let index = 0;

  for (const row of usable) {
    index++;

    console.log(
      `[${index}/${usable.length}] ${row.college_name}`
    );

    try {
      const url =
        row.final_url ||
        row.original_url;

      const response =
        await download(url);

      const buffer =
        Buffer.from(
          response.data
        );

      let text = '';

      if (
        row.source_kind ===
        'pdf'
      ) {
        console.log(
          '[PDF] extracting...'
        );

        text =
          await extractPdf(
            buffer
          );

      } else {
        console.log(
          '[HTML] cleaning...'
        );

        text =
          cleanHtml(
            buffer.toString(
              'utf8'
            )
          );
      }

      const filename =
        `${safeName(row.college_id)}.txt`;

      const outputPath =
        path.join(
          OUTPUT_DIR,
          filename
        );

      await fsp.writeFile(
        outputPath,
        text,
        'utf8'
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
          /semester|1st sem|2nd sem|3rd sem|4th sem|5th sem|6th sem|7th sem|8th sem/.test(
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
          /income|1 lakh|5 lakh|100000|500000/.test(
            lower
          ),

        category:
          /sc\/st|obc|ews|pwd|ph\b/.test(
            lower
          ),

        total:
          /grand total|total fee|total amount/.test(
            lower
          ),

        foreign:
          /dasa|ciwg|foreign|international|non[\s-]*saarc|saarc/.test(
            lower
          )
      };

      summary.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        source_kind:
          row.source_kind,

        source_url:
          url,

        file:
          outputPath,

        characters:
          text.length,

        status:
          text.trim()
            ? 'EXTRACTED'
            : 'EMPTY',

        signals
      });

      console.log(
        '[OK]',
        text.length,
        'characters'
      );

    } catch (error) {
      summary.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        status:
          'FAILED',

        error:
          error.message
      });

      console.log(
        '[FAILED]',
        error.message
      );
    }

    console.log('');
  }

  await fsp.writeFile(
    SUMMARY,
    JSON.stringify(
      summary,
      null,
      2
    ),
    'utf8'
  );

  console.log(
    '---------------------------------------'
  );

  console.log(
    'EXTRACTION SUMMARY'
  );

  console.log(
    '---------------------------------------'
  );

  console.table(
    summary.map(
      row => ({
        college:
          row.college_name,

        status:
          row.status,

        chars:
          row.characters || 0,

        btech:
          row.signals?.btech ??
          null,

        tuition:
          row.signals?.tuition ??
          null,

        semester:
          row.signals?.semester ??
          null,

        hostel:
          row.signals?.hostel ??
          null,

        mess:
          row.signals?.mess ??
          null,

        foreign:
          row.signals?.foreign ??
          null
      })
    )
  );

  console.log('');
  console.log(
    'Saved:',
    SUMMARY
  );

  console.log(
    'Text directory:',
    OUTPUT_DIR
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  error => {
    console.error(
      '[EXTRACTOR] FATAL:',
      error.message
    );

    process.exitCode = 1;
  }
);
