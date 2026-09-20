import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import axios from 'axios';
import * as cheerio from 'cheerio';

import { pool } from './src/db/pool.js';

const OUTPUT_FILE =
  path.resolve(
    process.cwd(),
    'official-fee-page-candidates.json'
  );

const FAILED_FILE =
  path.resolve(
    process.cwd(),
    'official-fee-page-failed.json'
  );

const KEYWORDS = [
  'fee',
  'fees',
  'tuition',
  'hostel',
  'mess',
  'semester fee',
  'academic fee',
  'academic fees',
  'institute fee',
  'institute fees',
  'btech fee',
  'b.tech fee',
  'ug fee',
  'undergraduate fee',
  'admission fee',
  'fee structure',
  'fee circular',
  'hostel charges',
  'hostel fee',
];

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(base, href) {
  try {
    if (!href) {
      return null;
    }

    if (
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return null;
    }

    return new URL(
      href,
      base
    ).href;
  } catch {
    return null;
  }
}

function isSameDomain(baseUrl, candidateUrl) {
  try {
    const base =
      new URL(baseUrl);

    const candidate =
      new URL(candidateUrl);

    const baseHost =
      base.hostname
        .replace(/^www\./, '')
        .toLowerCase();

    const candidateHost =
      candidate.hostname
        .replace(/^www\./, '')
        .toLowerCase();

    return (
      candidateHost === baseHost ||
      candidateHost.endsWith(
        `.${baseHost}`
      )
    );
  } catch {
    return false;
  }
}

function scoreCandidate(
  text,
  url
) {
  const haystack =
    `${text} ${url}`
      .toLowerCase();

  let score = 0;

  for (const keyword of KEYWORDS) {
    if (
      haystack.includes(
        keyword.toLowerCase()
      )
    ) {
      score += 1;
    }
  }

  if (
    /\.pdf($|\?)/i.test(url)
  ) {
    score += 2;
  }

  if (
    /fee.?structure/i.test(haystack)
  ) {
    score += 3;
  }

  if (
    /hostel/i.test(haystack)
  ) {
    score += 1;
  }

  if (
    /b\.?tech|undergraduate|\bug\b/i.test(
      haystack
    )
  ) {
    score += 1;
  }

  return score;
}

async function fetchHtml(url) {
  const response =
    await axios.get(
      url,
      {
        timeout: 20000,
        maxRedirects: 5,

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',

          Accept:
            'text/html,application/xhtml+xml',
        },

        validateStatus:
          status =>
            status >= 200 &&
            status < 400,
      }
    );

  const contentType =
    String(
      response.headers[
        'content-type'
      ] || ''
    ).toLowerCase();

  if (
    !contentType.includes(
      'text/html'
    )
  ) {
    return null;
  }

  return String(
    response.data || ''
  );
}

async function discoverForCollege(
  row
) {
  const website =
    row.website;

  const homepageHtml =
    await fetchHtml(
      website
    );

  if (!homepageHtml) {
    return {
      homepage:
        website,

      candidates: [],
    };
  }

  const $ =
    cheerio.load(
      homepageHtml
    );

  const seen =
    new Set();

  const candidates = [];

  $('a[href]').each(
    (_, element) => {
      const href =
        $(element)
          .attr('href');

      const url =
        normalizeUrl(
          website,
          href
        );

      if (
        !url ||
        !isSameDomain(
          website,
          url
        ) ||
        seen.has(url)
      ) {
        return;
      }

      seen.add(url);

      const text =
        cleanText(
          $(element)
            .text()
        );

      const score =
        scoreCandidate(
          text,
          url
        );

      if (score <= 0) {
        return;
      }

      candidates.push({
        text,
        url,
        score,
        is_pdf:
          /\.pdf($|\?)/i.test(
            url
          ),
      });
    }
  );

  candidates.sort(
    (a, b) =>
      b.score - a.score
  );

  return {
    homepage:
      website,

    candidates:
      candidates.slice(
        0,
        20
      ),
  };
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );
  console.log(
    'OFFICIAL FEE PAGE DISCOVERY'
  );
  console.log(
    '======================================='
  );
  console.log('');

  const result =
    await pool.query(`
      SELECT DISTINCT
        q.college_id,
        c.name,
        c.city,
        c.state,
        c.website,
        q.nirf_rank
      FROM college_quality_metrics q
      JOIN colleges c
        ON c.id = q.college_id
      WHERE q.academic_year = 2025
        AND c.website IS NOT NULL
        AND TRIM(c.website) <> ''
      ORDER BY
        q.nirf_rank NULLS LAST,
        c.name
    `);

  const rows =
    result.rows;

  console.log(
    '[DISCOVERY] Colleges:',
    rows.length
  );

  const output = [];
  const failed = [];

  let index = 0;

  for (const row of rows) {
    index++;

    console.log('');
    console.log(
      `[${index}/${rows.length}]`,
      row.name
    );

    try {
      const discovery =
        await discoverForCollege(
          row
        );

      console.log(
        '[FOUND]',
        discovery.candidates.length,
        'candidate links'
      );

      output.push({
        college_id:
          row.college_id,

        name:
          row.name,

        city:
          row.city,

        state:
          row.state,

        nirf_rank:
          row.nirf_rank,

        website:
          row.website,

        candidates:
          discovery.candidates,

        verification_status:
          'pending_review',
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

        website:
          row.website,

        reason:
          error.message,
      });
    }

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          300
        )
    );
  }

  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(
      output,
      null,
      2
    ),
    'utf8'
  );

  await fs.writeFile(
    FAILED_FILE,
    JSON.stringify(
      failed,
      null,
      2
    ),
    'utf8'
  );

  const collegesWithCandidates =
    output.filter(
      row =>
        row.candidates.length > 0
    ).length;

  const totalCandidates =
    output.reduce(
      (sum, row) =>
        sum +
        row.candidates.length,
      0
    );

  console.log('');
  console.log(
    '---------------------------------------'
  );
  console.log(
    'OFFICIAL FEE DISCOVERY SUMMARY'
  );
  console.log(
    '---------------------------------------'
  );

  console.table([
    {
      status:
        'Colleges scanned',
      count:
        rows.length,
    },
    {
      status:
        'With fee candidates',
      count:
        collegesWithCandidates,
    },
    {
      status:
        'Total candidate links',
      count:
        totalCandidates,
    },
    {
      status:
        'Failed websites',
      count:
        failed.length,
    },
  ]);

  console.log('');
  console.log(
    '[DISCOVERY] Output:',
    OUTPUT_FILE
  );

  console.log(
    '[DISCOVERY] Failed:',
    FAILED_FILE
  );

  console.log('');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );

  console.log(
    'Existing NIRF data has NOT been modified.'
  );

  console.log(
    'Placement data has NOT been modified.'
  );

  console.log(
    'Recommendation logic has NOT been modified.'
  );
}

main()
  .catch(
    error => {
      console.error(
        '[DISCOVERY] FATAL:',
        error.message
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );
