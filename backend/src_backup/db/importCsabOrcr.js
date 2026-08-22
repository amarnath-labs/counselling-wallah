import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   CONFIG
   ========================================================= */

const BASE_URL =
  'https://admissions.nic.in/csabspl/Applicant/SeatAllotmentResult/CurrentORCR.aspx';

const DATA_DIR = path.resolve(
  __dirname,
  '../../data/official'
);

const OUT_FILE = path.resolve(
  DATA_DIR,
  'csab-orcr-2026.json'
);

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36';

const DELAY_MS = 400;

/* =========================================================
   HELPERS
   ========================================================= */

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function cleanText(value = '') {
  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function saveDebug(filename, html) {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const file = path.join(DATA_DIR, filename);

  fs.writeFileSync(file, html, 'utf8');

  return file;
}

/* =========================================================
   PAGE PARSER
   ========================================================= */

function parsePage(html) {
  const $ = cheerio.load(html);

  const fields = {};

  $('input[type="hidden"]').each((_, el) => {
    const name = $(el).attr('name');

    if (!name) return;

    fields[name] = $(el).attr('value') || '';
  });

  return {
    $,
    fields
  };
}

/* =========================================================
   DROPDOWN PARSER
   ========================================================= */

function getOptions($, selector, options = {}) {
  const {
    skipAll = false
  } = options;

  const result = [];

  $(`${selector} option`).each((_, el) => {
    const value = cleanText(
      $(el).attr('value') || ''
    );

    const text = cleanText(
      $(el).text()
    );

    if (!value) return;

    if (value === '0') return;

    if (!text) return;

    if (text === '--Select--') return;

    if (
      skipAll &&
      (
        text.toUpperCase() === 'ALL' ||
        value.toUpperCase() === 'ALL'
      )
    ) {
      return;
    }

    result.push({
      value,
      text
    });
  });

  return result;
}

/* =========================================================
   COOKIE HANDLING
   ========================================================= */

function getSetCookies(response) {
  if (
    typeof response.headers.getSetCookie === 'function'
  ) {
    return response.headers.getSetCookie();
  }

  return [];
}

function extractCookies(response) {
  return getSetCookies(response)
    .map((cookie) => cookie.split(';')[0])
    .join('; ');
}

function mergeCookies(oldCookies, response) {
  const cookieMap = new Map();

  if (oldCookies) {
    oldCookies
      .split(';')
      .forEach((part) => {
        const value = part.trim();

        if (!value) return;

        const index = value.indexOf('=');

        if (index <= 0) return;

        cookieMap.set(
          value.substring(0, index),
          value.substring(index + 1)
        );
      });
  }

  const freshCookies = extractCookies(response);

  if (freshCookies) {
    freshCookies
      .split(';')
      .forEach((part) => {
        const value = part.trim();

        if (!value) return;

        const index = value.indexOf('=');

        if (index <= 0) return;

        cookieMap.set(
          value.substring(0, index),
          value.substring(index + 1)
        );
      });
  }

  return [...cookieMap.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

/* =========================================================
   INITIAL REQUEST
   ========================================================= */

async function initialRequest() {
  const response = await fetch(BASE_URL, {
    method: 'GET',

    headers: {
      'User-Agent': USER_AGENT,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });

  if (!response.ok) {
    throw new Error(
      `Initial GET failed: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();

  return {
    html,
    cookies: extractCookies(response)
  };
}

/* =========================================================
   ASP.NET POSTBACK
   ========================================================= */

async function postBack(
  page,
  cookies,
  eventTarget,
  extraFields = {}
) {
  const {
    $,
    fields
  } = parsePage(page);

  const form =
    $('form#aspnetForm').first();

  if (!form.length) {
    throw new Error(
      'ASP.NET form #aspnetForm not found'
    );
  }

  const action =
    form.attr('action') ||
    './CurrentORCR.aspx';

  /*
   * IMPORTANT:
   * Do not use URL directly because BASE_URL
   * is also used as a string constant.
   */
  const targetUrl =
    new globalThis.URL(
      action,
      BASE_URL
    );

  const body =
    new URLSearchParams();

  /*
   * Preserve ASP.NET hidden state.
   */
  for (
    const [key, value]
    of Object.entries(fields)
  ) {
    body.set(key, value);
  }

  body.set(
    '__EVENTTARGET',
    eventTarget
  );

  body.set(
    '__EVENTARGUMENT',
    ''
  );

  for (
    const [key, value]
    of Object.entries(extraFields)
  ) {
    body.set(key, value);
  }

  console.log(
    `POST ${eventTarget}`
  );

  const response =
    await fetch(
      targetUrl,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',

          'User-Agent':
            USER_AGENT,

          Referer:
            BASE_URL,

          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

          ...(cookies
            ? {
                Cookie: cookies
              }
            : {})
        },

        body:
          body.toString()
      }
    );

  if (!response.ok) {
    throw new Error(
      `POST failed: ${response.status} ${response.statusText}`
    );
  }

  const html =
    await response.text();

  return {
    html,

    cookies:
      mergeCookies(
        cookies,
        response
      )
  };
}

/* =========================================================
   RANK PARSER
   ========================================================= */

function parseRank(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value)
      .replace(/,/g, '')
      .replace(/[^\d]/g, '');

  if (!text) {
    return null;
  }

  const number =
    Number(text);

  return Number.isFinite(number)
    ? number
    : null;
}

/* =========================================================
   RESULT TABLE DETECTION
   ========================================================= */

function findResultTables($) {
  const tables = [];

  $('table').each(
    (index, table) => {
      const text =
        cleanText(
          $(table).text()
        );

      const lower =
        text.toLowerCase();

      const looksLikeResult =
        (
          lower.includes('opening rank') &&
          lower.includes('closing rank')
        ) ||
        (
          lower.includes('opening') &&
          lower.includes('closing')
        );

      if (looksLikeResult) {
        tables.push({
          index,
          table
        });
      }
    }
  );

  return tables;
}

/* =========================================================
   RESULT PARSER
   ========================================================= */

function parseResults($, metadata) {
  let grid =
    $('#GridView1');

  const sourceRows = [];

  /*
   * First attempt:
   * GridView1
   */
  if (grid.length) {
    console.log(
      'GridView1 FOUND.'
    );

    grid.find('tr').each(
      (_, tr) => {
        const cells =
          $(tr)
            .find('th,td')
            .map(
              (_, td) =>
                cleanText(
                  $(td).text()
                )
            )
            .get();

        if (cells.length) {
          sourceRows.push(cells);
        }
      }
    );
  }

  /*
   * Fallback:
   * Search all result-like tables.
   */
  if (!sourceRows.length) {
    const tables =
      findResultTables($);

    console.log(
      `Result-like tables found: ${tables.length}`
    );

    for (
      const item
      of tables
    ) {
      $(item.table)
        .find('tr')
        .each(
          (_, tr) => {
            const cells =
              $(tr)
                .find('th,td')
                .map(
                  (_, td) =>
                    cleanText(
                      $(td).text()
                    )
                )
                .get();

            if (cells.length) {
              sourceRows.push(cells);
            }
          }
        );
    }
  }

  if (!sourceRows.length) {
    console.log(
      'No result rows found.'
    );

    return [];
  }

  console.log(
    `Result rows detected: ${sourceRows.length}`
  );

  /*
   * Locate Opening Rank / Closing Rank
   */
  let openingIndex = -1;
  let closingIndex = -1;

  for (
    const cells
    of sourceRows
  ) {
    cells.forEach(
      (cell, index) => {
        const lower =
          cell.toLowerCase();

        if (
          lower.includes(
            'opening rank'
          )
        ) {
          openingIndex = index;
        }

        if (
          lower.includes(
            'closing rank'
          )
        ) {
          closingIndex = index;
        }
      }
    );

    if (
      openingIndex >= 0 &&
      closingIndex >= 0
    ) {
      break;
    }
  }

  const results = [];

  for (
    const cells
    of sourceRows
  ) {
    const joined =
      cells.join(' ');

    const lower =
      joined.toLowerCase();

    /*
     * Skip headers.
     */
    if (
      lower.includes(
        'opening rank'
      ) ||
      lower.includes(
        'closing rank'
      )
    ) {
      continue;
    }

    /*
     * Ignore empty rows.
     */
    if (
      cells.length < 2
    ) {
      continue;
    }

    let openingRank = null;
    let closingRank = null;

    /*
     * Best case:
     * header columns identified.
     */
    if (
      openingIndex >= 0 &&
      closingIndex >= 0
    ) {
      openingRank =
        parseRank(
          cells[openingIndex]
        );

      closingRank =
        parseRank(
          cells[closingIndex]
        );
    }

    /*
     * Fallback:
     * Find numeric rank-like values.
     */
    if (
      openingRank === null ||
      closingRank === null
    ) {
      const numbers =
        cells
          .map(parseRank)
          .filter(
            (n) =>
              n !== null &&
              n >= 1
          );

      if (
        numbers.length >= 2
      ) {
        openingRank =
          numbers[0];

        closingRank =
          numbers[1];
      }
    }

    if (
      openingRank === null ||
      closingRank === null
    ) {
      continue;
    }

    /*
     * Opening/closing should normally
     * represent a valid range.
     */
    if (
      openingRank <= 0 ||
      closingRank <= 0
    ) {
      continue;
    }

    results.push({
      year: 2026,

      round:
        metadata.round,

      instituteType:
        metadata.instituteType,

      instituteTypeCode:
        metadata.instituteTypeCode,

      instituteCode:
        metadata.instituteCode,

      instituteName:
        metadata.instituteName,

      branchCode:
        metadata.branchCode,

      branchName:
        metadata.branchName,

      openingRank,

      closingRank,

      cells,

      sourceUrl:
        BASE_URL,

      source:
        'CSAB Special 2026 official OR/CR',

      isVerified:
        true,

      verificationStatus:
        'OFFICIAL'
    });
  }

  return results;
}

/* =========================================================
   DEDUPLICATION
   ========================================================= */

function deduplicate(rows) {
  const map =
    new Map();

  for (
    const row
    of rows
  ) {
    const key =
      [
        row.year,
        row.round,
        row.instituteCode,
        row.branchCode,
        row.openingRank,
        row.closingRank,
        row.cells?.join('|')
      ].join('|');

    if (!map.has(key)) {
      map.set(
        key,
        row
      );
    }
  }

  return [
    ...map.values()
  ];
}

/* =========================================================
   SAVE JSON
   ========================================================= */

function saveJson(rows) {
  fs.mkdirSync(
    DATA_DIR,
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      rows,
      null,
      2
    ),
    'utf8'
  );

  console.log(
    `\nSaved JSON: ${OUT_FILE}`
  );

  console.log(
    `Total records: ${rows.length}`
  );
}

/* =========================================================
   MAIN
   ========================================================= */

async function main() {
  console.log(
    '========================================'
  );

  console.log(
    'CSAB SPECIAL 2026 FULL IMPORTER'
  );

  console.log(
    '========================================'
  );

  console.log(
    `URL: ${BASE_URL}`
  );

  console.log(
    '\nStarting initial GET...'
  );

  let {
    html: page,
    cookies
  } =
    await initialRequest();

  console.log(
    `Session cookies: ${
      cookies
        ? 'received'
        : 'none'
    }`
  );

  saveDebug(
    'csab-orcr-initial.html',
    page
  );

  let { $ } =
    parsePage(page);

  /* =======================================================
     SELECTORS
     ======================================================= */

  const roundSelect =
    '#ctl00_ContentPlaceHolder1_ddlroundno';

  const instituteTypeSelect =
    '#ctl00_ContentPlaceHolder1_ddlInstype';

  const instituteSelect =
    '#ctl00_ContentPlaceHolder1_ddlInstitute';

  const branchSelect =
    '#ctl00_ContentPlaceHolder1_ddlBranch';

  /* =======================================================
     GET ROUNDS
     ======================================================= */

  const rounds =
    getOptions(
      $,
      roundSelect,
      {
        skipAll: true
      }
    );

  console.log(
    `\nRounds found: ${rounds.length}`
  );

  console.log(
    rounds
  );

  if (
    !rounds.length
  ) {
    throw new Error(
      'No CSAB rounds found.'
    );
  }

  /*
   * IMPORTANT:
   * Process EVERY round.
   */
  const roundsToProcess =
    rounds;

  const allResults = [];

  /* =======================================================
     ROUND LOOP
     ======================================================= */

  for (
    const round
    of roundsToProcess
  ) {
    console.log(
      '\n========================================'
    );

    console.log(
      `PROCESSING ROUND ${round.text}`
    );

    console.log(
      '========================================'
    );

    /*
     * Always start this round from
     * the current page state.
     */
    const roundResponse =
      await postBack(
        page,
        cookies,
        'ctl00$ContentPlaceHolder1$ddlroundno',
        {
          'ctl00$ContentPlaceHolder1$ddlroundno':
            round.value
        }
      );

    page =
      roundResponse.html;

    cookies =
      roundResponse.cookies;

    ({ $ } =
      parsePage(page));

    saveDebug(
      `csab-round-${round.value}.html`,
      page
    );

    /* =====================================================
       INSTITUTE TYPES
       ===================================================== */

    const instituteTypes =
      getOptions(
        $,
        instituteTypeSelect,
        {
          skipAll: false
        }
      );

    console.log(
      `Institute types found: ${instituteTypes.length}`
    );

    console.log(
      instituteTypes
    );

    if (
      !instituteTypes.length
    ) {
      console.log(
        'No institute types found for this round.'
      );

      continue;
    }

    /*
     * IMPORTANT:
     *
     * "ALL" already contains all institutes.
     *
     * Processing ALL + CFI + 3IT + NIT would
     * cause unnecessary duplicate scraping.
     *
     * Therefore:
     *   Prefer ALL.
     *
     * If ALL does not exist, process every
     * available institute type.
     */

    const allType =
      instituteTypes.find(
        (item) =>
          item.value.toUpperCase() ===
            'ALL' ||
          item.text.toUpperCase() ===
            'ALL'
      );

    const typesToProcess =
      allType
        ? [allType]
        : instituteTypes;

    console.log(
      `Institute types selected: ${typesToProcess.length}`
    );

    /* =====================================================
       INSTITUTE TYPE LOOP
       ===================================================== */

    for (
      const instituteType
      of typesToProcess
    ) {
      console.log(
        '\n----------------------------------------'
      );

      console.log(
        `Institute Type: ${instituteType.text}`
      );

      console.log(
        '----------------------------------------'
      );

      const typeResponse =
        await postBack(
          page,
          cookies,
          'ctl00$ContentPlaceHolder1$ddlInstype',
          {
            'ctl00$ContentPlaceHolder1$ddlroundno':
              round.value,

            'ctl00$ContentPlaceHolder1$ddlInstype':
              instituteType.value
          }
        );

      page =
        typeResponse.html;

      cookies =
        typeResponse.cookies;

      ({ $ } =
        parsePage(page));

      saveDebug(
        `csab-round-${round.value}-instype-${instituteType.value}.html`,
        page
      );

      /* ===================================================
         INSTITUTES
         =================================================== */

      const institutes =
        getOptions(
          $,
          instituteSelect,
          {
            skipAll: true
          }
        );

      console.log(
        `Institutes found: ${institutes.length}`
      );

      if (
        !institutes.length
      ) {
        console.log(
          'No institutes found.'
        );

        continue;
      }

      /*
       * FULL MODE:
       * Process every institute.
       */
      for (
        let instituteIndex = 0;
        instituteIndex < institutes.length;
        instituteIndex++
      ) {
        const institute =
          institutes[instituteIndex];

        console.log(
          `\n[${instituteIndex + 1}/${institutes.length}] ` +
          `${institute.text}`
        );

        /* ===============================================
           INSTITUTE POSTBACK
           =============================================== */

        const instituteResponse =
          await postBack(
            page,
            cookies,
            'ctl00$ContentPlaceHolder1$ddlInstitute',
            {
              'ctl00$ContentPlaceHolder1$ddlroundno':
                round.value,

              'ctl00$ContentPlaceHolder1$ddlInstype':
                instituteType.value,

              'ctl00$ContentPlaceHolder1$ddlInstitute':
                institute.value
            }
          );

        page =
          instituteResponse.html;

        cookies =
          instituteResponse.cookies;

        ({ $ } =
          parsePage(page));

        /* ===============================================
           BRANCHES
           =============================================== */

        const branches =
          getOptions(
            $,
            branchSelect,
            {
              skipAll: true
            }
          );

        console.log(
          `  Branches found: ${branches.length}`
        );

        if (
          !branches.length
        ) {
          console.log(
            '  No branches found.'
          );

          continue;
        }

        /*
         * FULL MODE:
         * Process EVERY branch.
         */
        for (
          let branchIndex = 0;
          branchIndex < branches.length;
          branchIndex++
        ) {
          const branch =
            branches[branchIndex];

          console.log(
            `    [${branchIndex + 1}/${branches.length}] ` +
            `${branch.text}`
          );

          try {
            /* =========================================
               BRANCH POSTBACK
               ========================================= */

            const branchResponse =
              await postBack(
                page,
                cookies,
                'ctl00$ContentPlaceHolder1$ddlBranch',
                {
                  'ctl00$ContentPlaceHolder1$ddlroundno':
                    round.value,

                  'ctl00$ContentPlaceHolder1$ddlInstype':
                    instituteType.value,

                  'ctl00$ContentPlaceHolder1$ddlInstitute':
                    institute.value,

                  'ctl00$ContentPlaceHolder1$ddlBranch':
                    branch.value
                }
              );

            page =
              branchResponse.html;

            cookies =
              branchResponse.cookies;

            ({ $ } =
              parsePage(page));

            /* =========================================
               SUBMIT
               ========================================= */

            const submitResponse =
              await postBack(
                page,
                cookies,
                'ctl00$ContentPlaceHolder1$btnSubmit',
                {
                  'ctl00$ContentPlaceHolder1$ddlroundno':
                    round.value,

                  'ctl00$ContentPlaceHolder1$ddlInstype':
                    instituteType.value,

                  'ctl00$ContentPlaceHolder1$ddlInstitute':
                    institute.value,

                  'ctl00$ContentPlaceHolder1$ddlBranch':
                    branch.value,

                  'ctl00$ContentPlaceHolder1$btnSubmit':
                    'Submit'
                }
              );

            page =
              submitResponse.html;

            cookies =
              submitResponse.cookies;

            ({ $ } =
              parsePage(page));

            /* =========================================
               RESULT CHECK
               ========================================= */

            const bodyText =
              cleanText(
                $('body').text()
              ).toLowerCase();

            const noRecord =
              bodyText.includes(
                'sorry no record exists'
              );

            const resultTables =
              findResultTables($);

            const hasGrid =
              $('#GridView1').length > 0;

            console.log(
              `      GridView1: ${hasGrid}`
            );

            console.log(
              `      Result tables: ${resultTables.length}`
            );

            if (
              noRecord &&
              !resultTables.length &&
              !hasGrid
            ) {
              console.log(
                '      No record.'
              );

              await sleep(
                DELAY_MS
              );

              continue;
            }

            /* =========================================
               PARSE
               ========================================= */

            const results =
              parseResults(
                $,
                {
                  round:
                    round.text,

                  instituteType:
                    instituteType.text,

                  instituteTypeCode:
                    instituteType.value,

                  instituteCode:
                    institute.value,

                  instituteName:
                    institute.text,

                  branchCode:
                    branch.value,

                  branchName:
                    branch.text
                }
              );

            console.log(
              `      Parsed: ${results.length}`
            );

            if (
              results.length
            ) {
              allResults.push(
                ...results
              );

              console.log(
                `      TOTAL COLLECTED: ${allResults.length}`
              );
            }

            /*
             * Save progress periodically.
             */
            if (
              allResults.length > 0 &&
              allResults.length % 100 === 0
            ) {
              const unique =
                deduplicate(
                  allResults
                );

              saveJson(
                unique
              );
            }

            await sleep(
              DELAY_MS
            );
          } catch (error) {
            /*
             * One failed branch should NOT
             * destroy the entire import.
             */
            console.error(
              `      Branch failed: ${error.message}`
            );

            /*
             * Continue with next branch.
             */
            await sleep(
              1000
            );

            /*
             * Rebuild institute state if
             * necessary.
             */
            try {
              const recovery =
                await postBack(
                  page,
                  cookies,
                  'ctl00$ContentPlaceHolder1$ddlInstitute',
                  {
                    'ctl00$ContentPlaceHolder1$ddlroundno':
                      round.value,

                    'ctl00$ContentPlaceHolder1$ddlInstype':
                      instituteType.value,

                    'ctl00$ContentPlaceHolder1$ddlInstitute':
                      institute.value
                  }
                );

              page =
                recovery.html;

              cookies =
                recovery.cookies;

              ({ $ } =
                parsePage(page));
            } catch (
              recoveryError
            ) {
              console.error(
                `      Recovery failed: ${recoveryError.message}`
              );
            }
          }
        }
      }
    }

    console.log(
      `\nFinished Round ${round.text}`
    );

    console.log(
      `Records collected so far: ${allResults.length}`
    );
  }

  /* =======================================================
     FINAL DEDUPLICATION
     ======================================================= */

  console.log(
    '\n========================================'
  );

  console.log(
    'FINALIZING DATA'
  );

  console.log(
    '========================================'
  );

  const finalRows =
    deduplicate(
      allResults
    );

  /* =======================================================
     SAVE
     ======================================================= */

  saveJson(
    finalRows
  );

  /* =======================================================
     STATISTICS
     ======================================================= */

  const roundSet =
    new Set(
      finalRows.map(
        (row) => row.round
      )
    );

  const instituteSet =
    new Set(
      finalRows.map(
        (row) =>
          row.instituteCode
      )
    );

  const branchSet =
    new Set(
      finalRows.map(
        (row) =>
          row.branchCode
      )
    );

  console.log(
    '\n========================================'
  );

  console.log(
    'IMPORT SUMMARY'
  );

  console.log(
    '========================================'
  );

  console.log(
    `Total records : ${finalRows.length}`
  );

  console.log(
    `Rounds        : ${[
      ...roundSet
    ].join(', ')}`
  );

  console.log(
    `Institutes    : ${instituteSet.size}`
  );

  console.log(
    `Branches      : ${branchSet.size}`
  );

  console.log(
    `Output        : ${OUT_FILE}`
  );

  console.log(
    '\nCSAB FULL IMPORT COMPLETED.'
  );

  await pool.end();
}

/* =========================================================
   ERROR HANDLER
   ========================================================= */

main().catch(
  async (error) => {
    console.error(
      '\n========================================'
    );

    console.error(
      'CSAB IMPORT FAILED'
    );

    console.error(
      '========================================'
    );

    console.error(
      error
    );

    try {
      await pool.end();
    } catch {}

    process.exit(1);
  }
);