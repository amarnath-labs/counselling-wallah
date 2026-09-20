import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';

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

        opening: clean(cells[map.opening]),
        closing: clean(cells[map.closing]),
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

  const rows = parseRows(html);

  console.log(
    '\n========================================'
  );

  console.log(
    'UPTAC OFFICIAL HTML AUDIT'
  );

  console.log(
    '========================================'
  );

  console.log(
    'HTML characters:',
    html.length
  );

  console.log(
    'Parsed rows:',
    rows.length
  );

  const genderCounts = {};
  const quotaCounts = {};
  const roundCounts = {};
  const categoryCounts = {};

  for (const row of rows) {
    const gender =
      row.gender || 'EMPTY';

    genderCounts[gender] =
      (genderCounts[gender] ?? 0) + 1;

    const quota =
      row.quota || 'EMPTY';

    quotaCounts[quota] =
      (quotaCounts[quota] ?? 0) + 1;

    const round =
      row.round || 'EMPTY';

    roundCounts[round] =
      (roundCounts[round] ?? 0) + 1;

    const category =
      row.category || 'EMPTY';

    categoryCounts[category] =
      (categoryCounts[category] ?? 0) + 1;
  }

  console.log(
    '\n=== GENDER ==='
  );

  console.table(
    Object.entries(genderCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([gender, count]) => ({
        gender,
        count
      }))
  );

  console.log(
    '\n=== QUOTA ==='
  );

  console.table(
    Object.entries(quotaCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([quota, count]) => ({
        quota,
        count
      }))
  );

  console.log(
    '\n=== ROUND ==='
  );

  console.table(
    Object.entries(roundCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([round, count]) => ({
        round,
        count
      }))
  );

  console.log(
    '\n=== TOP CATEGORIES ==='
  );

  console.table(
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([category, count]) => ({
        category,
        count
      }))
  );

  console.log(
    '\n=== FIRST 20 ROWS ==='
  );

  console.table(
    rows
      .slice(0, 20)
      .map(row => ({
        round: row.round,
        college: row.institute,
        category: row.category,
        quota: row.quota,
        gender: row.gender,
        opening: row.opening,
        closing: row.closing,
      }))
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
