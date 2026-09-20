import fs from 'node:fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';

const INPUT = './official-fee-extraction-ready.json';
const OUTPUT = './btech-fee-detailed-raw.json';
const FAILED = './btech-fee-detailed-failed.json';

function moneyValues(text) {
  const cleaned = String(text || '')
    .replace(/,/g, '')
    .replace(/\u00a0/g, ' ');

  const values = [];
  const regex =
    /(?:₹|rs\.?|inr)?\s*(\d{4,8}(?:\.\d{1,2})?)/gi;

  let match;

  while ((match = regex.exec(cleaned))) {
    const value = Number(match[1]);

    if (!Number.isFinite(value)) continue;

    if (value >= 1900 && value <= 2100) continue;

    if (value < 1000 || value > 10000000) continue;

    values.push(value);
  }

  return [...new Set(values)];
}

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(base, href) {
  try {
    if (!href) return null;

    if (
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return null;
    }

    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function feeLinkScore(text, url) {
  const haystack =
    `${text} ${url}`
      .toLowerCase()
      .replace(/%20/g, ' ');

  let score = 0;

  if (/fee[\s_-]*structure/.test(haystack)) {
    score += 50;
  }

  if (/b\.?\s*tech|btech/.test(haystack)) {
    score += 30;
  }

  if (/\bug\b|undergraduate/.test(haystack)) {
    score += 20;
  }

  if (/new entrants|new entrant|first year/.test(haystack)) {
    score += 15;
  }

  if (/2025[\s_-]*(?:-|–)[\s_-]*26/.test(haystack)) {
    score += 20;
  }

  if (/2026[\s_-]*(?:-|–)[\s_-]*27/.test(haystack)) {
    score += 15;
  }

  if (/\.pdf($|\?)/i.test(url)) {
    score += 10;
  }

  if (/pg|mtech|m\.tech|phd|mba/.test(haystack)) {
    score -= 30;
  }

  return score;
}

async function download(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxRedirects: 5,

    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
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

async function extractSource(url) {
  const {
    buffer,
    contentType
  } = await download(url);

  const signature =
    buffer.subarray(0, 5).toString('ascii');

  const isPdf =
    contentType.includes('application/pdf') ||
    signature === '%PDF-';

  if (isPdf) {
    const parser =
      new PDFParse({
        data: buffer
      });

    try {
      const result =
        await parser.getText();

      return {
        type: 'pdf',
        text: String(result.text || ''),
        links: []
      };
    } finally {
      await parser.destroy();
    }
  }

  const html =
    buffer.toString('utf8');

  const $ =
    cheerio.load(html);

  const links = [];

  $('a[href]').each((_, element) => {
    const text =
      cleanText(
        $(element).text()
      );

    const childUrl =
      normalizeUrl(
        url,
        $(element).attr('href')
      );

    if (!childUrl) return;

    const score =
      feeLinkScore(
        text,
        childUrl
      );

    if (score <= 0) return;

    links.push({
      text,
      url: childUrl,
      score
    });
  });

  links.sort(
    (a, b) =>
      b.score - a.score
  );

  $('script,style,noscript')
    .remove();

  const text =
    $('body')
      .text()
      .replace(/\t/g, ' ')
      .replace(/\r/g, '\n');

  return {
    type: 'html',
    text,
    links: links.slice(0, 15)
  };
}

function extractSignals(text) {
  const lines =
    String(text || '')
      .split(/\r?\n/)
      .map(cleanText)
      .filter(Boolean);

  const output = [];

  const keywords = [
    'tuition fee',
    'institute fee',
    'academic fee',
    'semester fee',
    'hostel fee',
    'mess fee',
    'admission fee',
    'registration fee',
    'total fee',
    'grand total',
    'total payable'
  ];

  for (let i = 0; i < lines.length; i++) {
    const lower =
      lines[i].toLowerCase();

    if (
      !keywords.some(
        keyword =>
          lower.includes(keyword)
      )
    ) {
      continue;
    }

    const context =
      lines
        .slice(
          Math.max(0, i - 3),
          Math.min(lines.length, i + 6)
        )
        .join(' | ');

    output.push({
      line: lines[i],
      context,
      amounts: moneyValues(context)
    });
  }

  return output;
}

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('DETAILED BTECH FEE EXTRACTOR');
  console.log('=======================================');

  const rows =
    JSON.parse(
      (
        await fs.readFile(
          INPUT,
          'utf8'
        )
      ).replace(/^\uFEFF/, '')
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

    try {
      const primary =
        await extractSource(
          row.source_url
        );

      let finalUrl =
        row.source_url;

      let finalSource =
        primary;

      if (
        primary.type === 'html' &&
        primary.links.length > 0
      ) {
        const best =
          primary.links[0];

        console.log(
          '[FOLLOW]',
          best.score,
          best.url
        );

        try {
          finalSource =
            await extractSource(
              best.url
            );

          finalUrl =
            best.url;

        } catch (error) {
          console.log(
            '[FOLLOW FAILED]',
            error.message
          );

          finalSource =
            primary;

          finalUrl =
            row.source_url;
        }
      }

      const signals =
        extractSignals(
          finalSource.text
        );

      const amounts =
        moneyValues(
          finalSource.text
        );

      const textLower =
        finalSource.text
          .toLowerCase();

      const btechRelevant =
        /b\.?\s*tech|btech|bachelor of technology/.test(
          textLower
        );

      const branchSpecific =
        /computer science.*fee|mechanical.*fee|civil.*fee|electronics.*fee|electrical.*fee/i
          .test(
            finalSource.text
          );

      const feeScope =
        branchSpecific
          ? 'branch_specific_review'
          : (
              btechRelevant
                ? 'all_btech_branches_candidate'
                : 'needs_review'
            );

      console.log({
        type:
          finalSource.type,

        btech:
          btechRelevant,

        scope:
          feeScope,

        signals:
          signals.length,

        amounts:
          amounts.length
      });

      output.push({
        college_id:
          row.college_id,

        name:
          row.name,

        original_source_url:
          row.source_url,

        resolved_source_url:
          finalUrl,

        source_type:
          finalSource.type,

        btech_relevant:
          btechRelevant,

        fee_scope_candidate:
          feeScope,

        fee_signals:
          signals.slice(0, 50),

        all_amounts:
          amounts.slice(0, 150),

        child_links:
          primary.links,

        verification_status:
          'pending_review'
      });

    } catch (error) {
      console.log(
        '[FAILED]',
        error.message
      );

      failed.push({
        college_id:
          row.college_id,

        name:
          row.name,

        source_url:
          row.source_url,

        reason:
          error.message
      });
    }

    await new Promise(
      resolve =>
        setTimeout(resolve, 300)
    );
  }

  await fs.writeFile(
    OUTPUT,
    JSON.stringify(
      output,
      null,
      2
    ),
    'utf8'
  );

  await fs.writeFile(
    FAILED,
    JSON.stringify(
      failed,
      null,
      2
    ),
    'utf8'
  );

  console.log('');
  console.log('=======================================');
  console.log('DETAILED FEE SUMMARY');
  console.log('=======================================');

  console.table([
    {
      status: 'Input',
      count: rows.length
    },
    {
      status: 'Processed',
      count: output.length
    },
    {
      status: 'Failed',
      count: failed.length
    },
    {
      status: 'BTech detected',
      count:
        output.filter(
          x => x.btech_relevant
        ).length
    }
  ]);

  console.log('');
  console.log(
    'Saved:',
    OUTPUT
  );

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  error => {
    console.error(
      'FATAL:',
      error.message
    );

    process.exitCode = 1;
  }
);