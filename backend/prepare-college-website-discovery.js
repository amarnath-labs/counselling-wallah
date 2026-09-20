import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';

import { pool } from './src/db/pool.js';

const OUTPUT_FILE =
  path.resolve(
    process.cwd(),
    'college-website-candidates.json'
  );

function normalizeDomain(url) {
  try {
    const parsed =
      new URL(url);

    return parsed.hostname
      .replace(/^www\./, '')
      .toLowerCase();
  } catch {
    return null;
  }
}

function looksOfficial(domain, collegeName) {
  if (!domain) {
    return false;
  }

  const name =
    String(collegeName || '')
      .toLowerCase();

  const tokens =
    name
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(
        token =>
          token.length >= 3 &&
          ![
            'institute',
            'technology',
            'university',
            'national',
            'indian',
            'college',
            'engineering',
            'science',
            'management',
            'information',
          ].includes(token)
      );

  return tokens.some(
    token =>
      domain.includes(token)
  );
}

async function searchOfficialWebsite(
  name,
  city,
  state
) {
  /*
  |--------------------------------------------------------------------------
  | NOTE
  |--------------------------------------------------------------------------
  |
  | This script does NOT scrape search engines.
  |
  | It only prepares search queries for manual/controlled discovery.
  |
  | Reason:
  | We should not blindly attach unofficial fee portals to verified colleges.
  |
  */

  const query =
    `${name} ${city || ''} ${state || ''} official website`
      .replace(/\s+/g, ' ')
      .trim();

  return {
    query,
    candidate_url: null,
    candidate_domain: null,
    confidence: 'needs_review',
  };
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );
  console.log(
    'COLLEGE WEBSITE DISCOVERY PREP'
  );
  console.log(
    '======================================='
  );
  console.log('');

  const result =
    await pool.query(`
      SELECT
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
      ORDER BY
        q.nirf_rank NULLS LAST,
        c.name
    `);

  const rows =
    result.rows;

  const missing =
    rows.filter(
      row =>
        !row.website
    );

  console.log(
    '[DISCOVERY] Missing websites:',
    missing.length
  );

  const output = [];

  let index = 0;

  for (const row of missing) {
    index++;

    const candidate =
      await searchOfficialWebsite(
        row.name,
        row.city,
        row.state
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

      search_query:
        candidate.query,

      candidate_url:
        candidate.candidate_url,

      candidate_domain:
        candidate.candidate_domain,

      confidence:
        candidate.confidence,

      verification_status:
        'pending',
    });

    console.log(
      `[${index}/${missing.length}]`,
      row.name
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

  console.log('');
  console.log(
    '---------------------------------------'
  );
  console.log(
    'WEBSITE DISCOVERY PREP SUMMARY'
  );
  console.log(
    '---------------------------------------'
  );

  console.table([
    {
      status:
        'Total quality colleges',
      count:
        rows.length,
    },
    {
      status:
        'Website missing',
      count:
        missing.length,
    },
    {
      status:
        'Prepared for review',
      count:
        output.length,
    },
  ]);

  console.log('');
  console.log(
    '[DISCOVERY] Saved:',
    OUTPUT_FILE
  );

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main()
  .catch(
    (error) => {
      console.error(
        '[DISCOVERY] FAILED:',
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
