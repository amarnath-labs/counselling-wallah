import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool } from './src/db/pool.js';

const TARGET_IDS = [
  'uptac-abss-institute-of-technology-meerut-meerut',
  'uptac-ajay-kumar-garg-engg-college-ghaziabad',
  'uptac-bundelkhand-institute-of-engineering-technology-jhansi',
  'coep-pune',
  'national-institute-of-technology-goa'
];

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function looksFeeRelated(text) {
  return /fee|fees|b\.?tech|first year|1st year|2026|2026-27|academic|tuition/i.test(
    text || ''
  );
}

async function inspectPage(row) {
  console.log('');
  console.log(`=== ${row.college} ===`);
  console.log(`PAGE: ${row.source_url}`);

  try {
    const response = await axios.get(row.source_url, {
      timeout: 25000,
      maxRedirects: 5,
      headers: {
        'User-Agent':
          'Mozilla/5.0 CounsellingWallah Fee Document Inspector',
        Accept:
          'text/html,application/xhtml+xml'
      }
    });

    if (typeof response.data !== 'string') {
      console.log('NON_HTML_RESPONSE');
      return [];
    }

    const $ = cheerio.load(response.data);
    const links = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const label = $(el).text().replace(/\s+/g, ' ').trim();

      if (!href) return;

      const url = absoluteUrl(row.source_url, href);

      if (!url) return;

      const combined = `${label} ${url}`;

      const isDocument =
        /\.pdf(?:$|\?)/i.test(url) ||
        /\.docx?(?:$|\?)/i.test(url) ||
        /\.xlsx?(?:$|\?)/i.test(url);

      if (
        looksFeeRelated(combined) ||
        isDocument
      ) {
        links.push({
          label: label || '(no text)',
          url,
          document: isDocument
        });
      }
    });

    const unique = [
      ...new Map(
        links.map(item => [item.url, item])
      ).values()
    ];

    console.table(unique.slice(0, 40));

    console.log(
      `Relevant links found: ${unique.length}`
    );

    return unique;
  } catch (error) {
    console.log(
      `FETCH_FAILED: ${error.message}`
    );

    return [];
  }
}

async function main() {
  console.log('');
  console.log(
    '========================================'
  );
  console.log(
    'CW-REC FEE DOCUMENT DISCOVERY V3'
  );
  console.log(
    '========================================'
  );

  const result = await pool.query(`
    SELECT
      fp.college_id,
      fp.source_url,
      fp.source_kind,
      c.name AS college
    FROM college_fee_profiles fp
    INNER JOIN colleges c
      ON c.id = fp.college_id
    WHERE fp.college_id = ANY($1::text[])
      AND fp.fee_year = 2026
    ORDER BY c.name
  `, [TARGET_IDS]);

  console.log(
    `Target profiles found: ${result.rows.length}`
  );

  const summary = [];

  for (const row of result.rows) {
    const links = await inspectPage(row);

    summary.push({
      college: row.college,
      links_found: links.length,
      documents_found:
        links.filter(item => item.document).length
    });
  }

  console.log('');
  console.log('=== DISCOVERY SUMMARY ===');
  console.table(summary);

  console.log('');
  console.log(
    '✅ DOCUMENT DISCOVERY V3 COMPLETE'
  );
}

main()
  .catch(error => {
    console.error(
      '\nDOCUMENT DISCOVERY ERROR:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
