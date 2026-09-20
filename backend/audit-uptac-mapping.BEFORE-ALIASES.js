import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { pool } from './src/db/pool.js';

const FILE = new URL(
  './uptac-2025.html',
  import.meta.url
);

function clean(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function norm(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRank(value) {
  const text = clean(value).replace(/,/g, '');

  if (!text) return null;

  const match = text.match(/\d+(?:\.\d+)?/);

  if (!match) return null;

  const number = Number(match[0]);

  return Number.isFinite(number)
    ? Math.round(number)
    : null;
}

function getHeaderMap(headers) {
  const map = {};

  headers.forEach((header, index) => {
    const h = clean(header).toLowerCase();

    if (h.includes('round')) {
      map.round = index;
    } else if (h.includes('institute')) {
      map.institute = index;
    } else if (h.includes('program')) {
      map.program = index;
    } else if (h.includes('quota')) {
      map.quota = index;
    } else if (h.includes('category')) {
      map.category = index;
    } else if (
      h.includes('seat gender') ||
      h.includes('gender')
    ) {
      map.gender = index;
    } else if (h.includes('opening rank')) {
      map.opening = index;
    } else if (h.includes('closing rank')) {
      map.closing = index;
    }
  });

  return map;
}

function parseRows(html) {
  const $ = cheerio.load(html);
  const rows = [];

  $('table').each((_, table) => {
    const trs = $(table).find('tr');

    if (!trs.length) return;

    const headers = trs
      .first()
      .find('th,td')
      .map((_, cell) => clean($(cell).text()))
      .get();

    const map = getHeaderMap(headers);

    if (
      map.round === undefined ||
      map.institute === undefined ||
      map.program === undefined ||
      map.category === undefined ||
      map.opening === undefined ||
      map.closing === undefined
    ) {
      return;
    }

    trs.slice(1).each((_, tr) => {
      const cells = $(tr)
        .find('td')
        .map((_, cell) => clean($(cell).text()))
        .get();

      if (!cells.length) return;

      const row = {
        round: clean(cells[map.round]),
        institute: clean(cells[map.institute]),
        program: clean(cells[map.program]),
        category: clean(cells[map.category]),

        quota:
          map.quota === undefined
            ? ''
            : clean(cells[map.quota]),

        gender:
          map.gender === undefined
            ? ''
            : clean(cells[map.gender]),

        opening:
          parseRank(cells[map.opening]),

        closing:
          parseRank(cells[map.closing]),
      };

      if (
        !row.institute ||
        !row.program ||
        !row.round ||
        !row.closing
      ) {
        return;
      }

      rows.push(row);
    });
  });

  return rows;
}

async function main() {
  const html = await fs.readFile(
    FILE,
    'utf8'
  );

  const sourceRows = parseRows(html);

  console.log(
    '\n========================================'
  );

  console.log(
    'CW-REC UPTAC MAPPING DRY RUN'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Official source rows:',
    sourceRows.length
  );

  const collegeResult = await pool.query(`
    SELECT
      id,
      name,
      type,
      city,
      state
    FROM colleges
  `);

  const branchResult = await pool.query(`
    SELECT
      b.id,
      b.college_id,
      b.name,
      c.name AS college_name
    FROM branches b
    INNER JOIN colleges c
      ON c.id = b.college_id
  `);

  console.log(
    'DB colleges:',
    collegeResult.rows.length
  );

  console.log(
    'DB branches:',
    branchResult.rows.length
  );

  const collegeMap = new Map();
  const ambiguousCollegeKeys = new Set();

  for (const college of collegeResult.rows) {
    const key = norm(college.name);

    if (!key) continue;

    if (collegeMap.has(key)) {
      ambiguousCollegeKeys.add(key);
    } else {
      collegeMap.set(
        key,
        college
      );
    }
  }

  const branchMap = new Map();
  const ambiguousBranchKeys = new Set();

  for (const branch of branchResult.rows) {
    const key =
      `${String(branch.college_id)}::${norm(branch.name)}`;

    if (branchMap.has(key)) {
      ambiguousBranchKeys.add(key);
    } else {
      branchMap.set(
        key,
        branch
      );
    }
  }

  let mapped = 0;
  let collegeMissing = 0;
  let branchMissing = 0;
  let collegeAmbiguous = 0;
  let branchAmbiguous = 0;

  const missingColleges = new Map();
  const missingBranches = new Map();

  const mappedSamples = [];

  for (const row of sourceRows) {
    const collegeKey =
      norm(row.institute);

    if (ambiguousCollegeKeys.has(collegeKey)) {
      collegeAmbiguous++;
      continue;
    }

    const college =
      collegeMap.get(collegeKey);

    if (!college) {
      collegeMissing++;

      missingColleges.set(
        row.institute,
        (missingColleges.get(row.institute) ?? 0) + 1
      );

      continue;
    }

    const branchKey =
      `${String(college.id)}::${norm(row.program)}`;

    if (ambiguousBranchKeys.has(branchKey)) {
      branchAmbiguous++;
      continue;
    }

    const branch =
      branchMap.get(branchKey);

    if (!branch) {
      branchMissing++;

      const label =
        `${row.institute} || ${row.program}`;

      missingBranches.set(
        label,
        (missingBranches.get(label) ?? 0) + 1
      );

      continue;
    }

    mapped++;

    if (mappedSamples.length < 20) {
      mappedSamples.push({
        collegeId:
          college.id,

        branchId:
          branch.id,

        college:
          row.institute,

        branch:
          row.program,

        round:
          row.round,

        category:
          row.category,

        quota:
          row.quota,

        gender:
          row.gender,

        closing:
          row.closing,
      });
    }
  }

  console.log(
    '\n=== MAPPING SUMMARY ==='
  );

  console.table([
    {
      metric: 'Official rows',
      count: sourceRows.length,
    },
    {
      metric: 'Mapped',
      count: mapped,
    },
    {
      metric: 'College missing',
      count: collegeMissing,
    },
    {
      metric: 'Branch missing',
      count: branchMissing,
    },
    {
      metric: 'College ambiguous',
      count: collegeAmbiguous,
    },
    {
      metric: 'Branch ambiguous',
      count: branchAmbiguous,
    },
  ]);

  console.log(
    '\nMapping %:',
    (
      mapped /
      sourceRows.length *
      100
    ).toFixed(2)
  );

  console.log(
    '\n=== TOP MISSING COLLEGES ==='
  );

  console.table(
    [...missingColleges.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([college, count]) => ({
        college,
        count,
      }))
  );

  console.log(
    '\n=== TOP MISSING BRANCHES ==='
  );

  console.table(
    [...missingBranches.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([item, count]) => ({
        item,
        count,
      }))
  );

  console.log(
    '\n=== MAPPED SAMPLE ==='
  );

  console.table(
    mappedSamples
  );

  console.log(
    '\n========================================'
  );

  if (
    mapped === sourceRows.length &&
    collegeMissing === 0 &&
    branchMissing === 0 &&
    collegeAmbiguous === 0 &&
    branchAmbiguous === 0
  ) {
    console.log(
      '✅ PERFECT MAPPING: SAFE FOR SHADOW IMPORT'
    );
  } else {
    console.log(
      '⚠️ MAPPING NOT PERFECT: DO NOT IMPORT YET'
    );
  }

  console.log(
    '========================================'
  );
}

main()
  .catch(error => {
    console.error(
      '\nMAPPING AUDIT ERROR:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
