import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE =
  'https://www.nirfindia.org/Rankings/2025';

const SOURCES = [
  {
    type: 'ranked',
    band: null,
    url: `${BASE}/EngineeringRanking.html`,
  },
  {
    type: 'band',
    band: '101-150',
    url: `${BASE}/EngineeringRanking150.html`,
  },
  {
    type: 'band',
    band: '151-200',
    url: `${BASE}/EngineeringRanking200.html`,
  },
  {
    type: 'band',
    band: '201-300',
    url: `${BASE}/EngineeringRanking300.html`,
  },
];

function cleanText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCollegeName(value) {
  return cleanText(value)
    .replace(
      /More Details.*$/i,
      ''
    )
    .trim();
}

function toNumber(value) {
  const number =
    Number(
      cleanText(value)
    );

  return Number.isFinite(number)
    ? number
    : null;
}

async function download(url) {
  console.log(
    '[NIRF FULL] Downloading:',
    url
  );

  const response =
    await axios.get(
      url,
      {
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0',
        },
      }
    );

  console.log(
    '[NIRF FULL] HTTP:',
    response.status
  );

  return response.data;
}

function parseExactRanking(
  html,
  sourceUrl
) {
  const $ =
    cheerio.load(html);

  const rows = [];

  $('table tbody tr').each(
    (_, element) => {
      const cells =
        $(element)
          .find('td')
          .map(
            (_, cell) =>
              cleanText(
                $(cell).text()
              )
          )
          .get();

      if (cells.length < 11) {
        return;
      }

      const instituteId =
        cells[0];

      const collegeName =
        cleanCollegeName(
          cells[1]
        );

      const city =
        cells[7];

      const state =
        cells[8];

      const score =
        toNumber(
          cells[9]
        );

      const rank =
        toNumber(
          cells[10]
        );

      if (
        !collegeName ||
        !rank
      ) {
        return;
      }

      rows.push({
        institute_id:
          instituteId || null,

        college_name:
          collegeName,

        city:
          city || null,

        state:
          state || null,

        nirf_rank:
          rank,

        nirf_score:
          score,

        rank_band:
          null,

        ranking_type:
          'exact',

        academic_year:
          2025,

        category:
          'Engineering',

        source_label:
          'NIRF 2025 Engineering',

        source_url:
          sourceUrl,

        verification_status:
          'verified',
      });
    }
  );

  return rows;
}

function parseBandRanking(
  html,
  band,
  sourceUrl
) {
  const $ =
    cheerio.load(html);

  const rows = [];

  $('table tbody tr').each(
    (_, element) => {
      const cells =
        $(element)
          .find('td')
          .map(
            (_, cell) =>
              cleanText(
                $(cell).text()
              )
          )
          .get();

      if (cells.length < 3) {
        return;
      }

      let collegeName;
      let city;
      let state;

      /*
       * Band pages normally contain:
       *
       * Name | City | State
       *
       * Some NIRF pages can contain
       * an institute ID as first column,
       * so handle both structures.
       */

      if (
        cells.length >= 4 &&
        /^IR-/i.test(cells[0])
      ) {
        collegeName =
          cleanCollegeName(
            cells[1]
          );

        city =
          cells[2];

        state =
          cells[3];
      } else {
        collegeName =
          cleanCollegeName(
            cells[0]
          );

        city =
          cells[1];

        state =
          cells[2];
      }

      if (!collegeName) {
        return;
      }

      rows.push({
        institute_id:
          /^IR-/i.test(cells[0])
            ? cells[0]
            : null,

        college_name:
          collegeName,

        city:
          city || null,

        state:
          state || null,

        nirf_rank:
          null,

        nirf_score:
          null,

        rank_band:
          band,

        ranking_type:
          'band',

        academic_year:
          2025,

        category:
          'Engineering',

        source_label:
          `NIRF 2025 Engineering ${band}`,

        source_url:
          sourceUrl,

        verification_status:
          'verified',
      });
    }
  );

  return rows;
}

function deduplicate(rows) {
  const seen =
    new Set();

  const result = [];

  for (const row of rows) {
    const key =
      [
        row.college_name
          ?.toLowerCase(),

        row.city
          ?.toLowerCase(),

        row.state
          ?.toLowerCase(),

        row.nirf_rank,

        row.rank_band,
      ].join('|');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(row);
  }

  return result;
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'NIRF 2025 FULL ENGINEERING COLLECTOR'
  );

  console.log(
    '======================================='
  );

  console.log('');

  let allRows = [];

  for (const source of SOURCES) {
    const html =
      await download(
        source.url
      );

    let rows;

    if (
      source.type ===
      'ranked'
    ) {
      rows =
        parseExactRanking(
          html,
          source.url
        );
    } else {
      rows =
        parseBandRanking(
          html,
          source.band,
          source.url
        );
    }

    console.log(
      `[NIRF FULL] ${source.band || '1-100'} rows:`,
      rows.length
    );

    allRows.push(
      ...rows
    );
  }

  allRows =
    deduplicate(
      allRows
    );

  const exact =
    allRows.filter(
      (row) =>
        row.ranking_type ===
        'exact'
    );

  const band101 =
    allRows.filter(
      (row) =>
        row.rank_band ===
        '101-150'
    );

  const band151 =
    allRows.filter(
      (row) =>
        row.rank_band ===
        '151-200'
    );

  const band201 =
    allRows.filter(
      (row) =>
        row.rank_band ===
        '201-300'
    );

  console.log('');
  console.log(
    '---------------------------------------'
  );

  console.log(
    'FULL NIRF SUMMARY'
  );

  console.log(
    '---------------------------------------'
  );

  console.table([
    {
      group: '1-100',
      rows: exact.length,
    },
    {
      group: '101-150',
      rows: band101.length,
    },
    {
      group: '151-200',
      rows: band151.length,
    },
    {
      group: '201-300',
      rows: band201.length,
    },
    {
      group: 'TOTAL',
      rows: allRows.length,
    },
  ]);

  console.log('');

  console.log(
    'First exact-ranked colleges:'
  );

  console.table(
    exact
      .slice(0, 10)
      .map(
        (row) => ({
          rank:
            row.nirf_rank,

          college:
            row.college_name,

          city:
            row.city,

          state:
            row.state,

          score:
            row.nirf_score,
        })
      )
  );

  console.log('');

  console.log(
    'First 101-150 band colleges:'
  );

  console.table(
    band101
      .slice(0, 10)
      .map(
        (row) => ({
          band:
            row.rank_band,

          college:
            row.college_name,

          city:
            row.city,

          state:
            row.state,
        })
      )
  );

  const outputDirectory =
    path.resolve(
      process.cwd(),
      'data'
    );

  await fs.mkdir(
    outputDirectory,
    {
      recursive: true,
    }
  );

  const outputFile =
    path.join(
      outputDirectory,
      'nirf-2025-engineering-full.json'
    );

  await fs.writeFile(
    outputFile,
    JSON.stringify(
      allRows,
      null,
      2
    ),
    'utf8'
  );

  console.log('');
  console.log(
    '[NIRF FULL] JSON saved:'
  );

  console.log(
    outputFile
  );

  console.log('');
  console.log(
    'IMPORTANT: Database has NOT been modified.'
  );

  console.log(
    'Existing recommendation logic has NOT been modified.'
  );

  console.log('');
}

main().catch(
  (error) => {
    console.error(
      '[NIRF FULL] FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);