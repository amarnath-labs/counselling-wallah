import fs from 'node:fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';

const INPUT = './official-fee-extraction-ready.json';
const OUTPUT = './official-fee-values-raw.json';
const FAILED = './official-fee-values-failed.json';

function moneyValues(text) {
  const cleaned = String(text || '')
    .replace(/,/g, '')
    .replace(/\u00a0/g, ' ');

  const values = [];
  const regex =
    /(?:₹|rs\.?|inr)?\s*(\d{4,8})/gi;

  let match;

  while ((match = regex.exec(cleaned))) {
    const value = Number(match[1]);

    if (
      Number.isFinite(value) &&
      value >= 1000 &&
      value <= 10000000
    ) {
      values.push(value);
    }
  }

  return [...new Set(values)];
}

function extractFeeSignals(text) {
  const normalized = String(text || '')
    .replace(/\r/g, '\n');

  const lines = normalized
    .split(/\n/)
    .map(line =>
      line.replace(/\s+/g, ' ').trim()
    )
    .filter(Boolean);

  const signals = [];

  const keywords = [
    'tuition',
    'hostel',
    'institute fee',
    'academic fee',
    'semester fee',
    'total fee',
    'mess fee',
    'admission fee',
    'registration fee'
  ];

  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();

    if (
      keywords.some(keyword =>
        lower.includes(keyword)
      )
    ) {
      const context = lines
        .slice(
          Math.max(0, i - 2),
          Math.min(lines.length, i + 4)
        )
        .join(' | ');

      signals.push({
        line: lines[i],
        context,
        amounts: moneyValues(context)
      });
    }
  }

  return signals;
}

async function download(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxRedirects: 5,

    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36'
    },

    validateStatus(status) {
      return status >= 200 && status < 400;
    }
  });

  return {
    buffer: Buffer.from(response.data),

    contentType: String(
      response.headers['content-type'] || ''
    ).toLowerCase()
  };
}

async function getText(url) {
  const {
    buffer,
    contentType
  } = await download(url);

  const signature = buffer
    .subarray(0, 5)
    .toString('ascii');

  const isPdf =
    contentType.includes('application/pdf') ||
    signature === '%PDF-';

  if (isPdf) {
    const parser = new PDFParse({
      data: buffer
    });

    try {
      const result = await parser.getText();

      return {
        type: 'pdf',
        text: String(result.text || '')
      };
    } finally {
      await parser.destroy();
    }
  }

  const html = buffer.toString('utf8');
  const $ = cheerio.load(html);

  $('script, style, noscript').remove();

  return {
    type: 'html',

    text: $('body')
      .text()
      .replace(/\t/g, ' ')
      .replace(/\r/g, '\n')
  };
}

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('OFFICIAL FEE VALUE EXTRACTOR');
  console.log('=======================================');

  const raw = await fs.readFile(
    INPUT,
    'utf8'
  );

  const rows = JSON.parse(
    raw.replace(/^\uFEFF/, '')
  );

  console.log('');
  console.log(
    `[FEE] Input sources: ${rows.length}`
  );

  const output = [];
  const failed = [];

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const row = rows[i];

    console.log('');
    console.log(
      `[${i + 1}/${rows.length}] ${row.name}`
    );

    if (!row.source_url) {
      console.log('[SKIP] No source URL');

      failed.push({
        college_id: row.college_id,
        name: row.name,
        source_url: null,
        reason: 'No source URL'
      });

      continue;
    }

    try {
      const result = await getText(
        row.source_url
      );

      const signals =
        extractFeeSignals(result.text);

      const amounts =
        moneyValues(result.text);

      console.log(
        `[OK] ${result.type} | signals=${signals.length} | amounts=${amounts.length}`
      );

      output.push({
        college_id: row.college_id,
        name: row.name,

        source_url:
          row.source_url,

        source_type:
          result.type,

        fee_signals:
          signals.slice(0, 40),

        all_amounts:
          amounts.slice(0, 150),

        verification_status:
          'pending_review'
      });

    } catch (error) {
      console.log(
        `[FAILED] ${error.message}`
      );

      failed.push({
        college_id: row.college_id,
        name: row.name,
        source_url: row.source_url,
        reason: error.message
      });
    }

    await new Promise(resolve =>
      setTimeout(resolve, 300)
    );
  }

  await fs.writeFile(
    OUTPUT,
    JSON.stringify(output, null, 2),
    'utf8'
  );

  await fs.writeFile(
    FAILED,
    JSON.stringify(failed, null, 2),
    'utf8'
  );

  console.log('');
  console.log('=======================================');
  console.log('FEE EXTRACTION SUMMARY');
  console.log('=======================================');

  console.table([
    {
      status: 'Input sources',
      count: rows.length
    },
    {
      status: 'Extracted',
      count: output.length
    },
    {
      status: 'Failed',
      count: failed.length
    }
  ]);

  console.log('');
  console.log(
    'Saved: ./official-fee-values-raw.json'
  );

  console.log(
    'Saved: ./official-fee-values-failed.json'
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(error => {
  console.error(
    '[FATAL]',
    error.message
  );

  process.exitCode = 1;
});