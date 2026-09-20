import fs from 'node:fs/promises';

const URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/openingclosingrankarchieve.aspx';

const YEARS =
  [2025, 2024];

const FIELDS = {
  year:
    'ctl00$ContentPlaceHolder1$ddlYear',

  round:
    'ctl00$ContentPlaceHolder1$ddlroundno',

  instituteType:
    'ctl00$ContentPlaceHolder1$ddlInstype',

  institute:
    'ctl00$ContentPlaceHolder1$ddlInstitute',

  branch:
    'ctl00$ContentPlaceHolder1$ddlBranch',

  submit:
    'ctl00$ContentPlaceHolder1$btnSubmit',
};


const sleep =
  ms =>
    new Promise(
      resolve =>
        setTimeout(resolve, ms)
    );


function decodeHtml(value = '') {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ');
}


function stripHtml(value = '') {
  return decodeHtml(
    String(value)
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        ' '
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        ' '
      )
      .replace(
        /<[^>]+>/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim()
  );
}


function getAttr(tag, name) {
  return (
    tag.match(
      new RegExp(
        `${name}\\s*=\\s*["']([^"']*)["']`,
        'i'
      )
    )?.[1] ||
    ''
  );
}


function extractHidden(html) {
  const result = {};

  const tags =
    html.match(
      /<input\b[^>]*>/gi
    ) || [];

  for (const tag of tags) {
    if (
      !/type\s*=\s*["']hidden["']/i
        .test(tag)
    ) {
      continue;
    }

    const name =
      getAttr(
        tag,
        'name'
      );

    if (!name) {
      continue;
    }

    result[name] =
      decodeHtml(
        getAttr(
          tag,
          'value'
        )
      );
  }

  return result;
}


function extractSelects(html) {
  const result = [];

  const selectRegex =
    /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;

  let selectMatch;

  while (
    (
      selectMatch =
        selectRegex.exec(html)
    ) !== null
  ) {
    const selectTag =
      `<select${selectMatch[1]}>`;

    const body =
      selectMatch[2];

    const options = [];

    const optionRegex =
      /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;

    let optionMatch;

    while (
      (
        optionMatch =
          optionRegex.exec(body)
      ) !== null
    ) {
      const optionTag =
        `<option${optionMatch[1]}>`;

      options.push({
        value:
          decodeHtml(
            getAttr(
              optionTag,
              'value'
            )
          ),

        text:
          stripHtml(
            optionMatch[2]
          ),

        selected:
          /\bselected\b/i
            .test(optionTag),
      });
    }

    result.push({
      name:
        getAttr(
          selectTag,
          'name'
        ),

      options,
    });
  }

  return result;
}


function getSelect(
  html,
  name
) {
  return (
    extractSelects(
      html
    ).find(
      item =>
        item.name === name
    ) ||
    null
  );
}


function validOptions(
  html,
  name
) {
  const select =
    getSelect(
      html,
      name
    );

  if (!select) {
    return [];
  }

  return select.options.filter(
    option =>
      option.value !== '' &&
      option.value !== '0' &&
      !/^--select--$/i.test(
        option.text
      )
  );
}


function selectedValue(
  html,
  name
) {
  const select =
    getSelect(
      html,
      name
    );

  if (!select) {
    return '';
  }

  return (
    select.options.find(
      option =>
        option.selected
    )?.value ||
    select.options[0]?.value ||
    ''
  );
}


function findOption(
  html,
  field,
  wanted
) {
  return validOptions(
    html,
    field
  ).find(
    option =>
      option.value.trim() ===
        wanted.trim() ||
      option.text
        .trim()
        .toUpperCase() ===
        wanted
          .trim()
          .toUpperCase()
  );
}


/*
|--------------------------------------------------------------------------
| COOKIE HANDLING
|--------------------------------------------------------------------------
*/

function parseSetCookies(response) {
  let values = [];

  if (
    typeof response.headers
      .getSetCookie === 'function'
  ) {
    values =
      response.headers
        .getSetCookie();
  } else {
    const raw =
      response.headers.get(
        'set-cookie'
      );

    if (raw) {
      values = [raw];
    }
  }

  return values
    .map(
      value =>
        value
          .split(';')[0]
          .trim()
    )
    .filter(Boolean);
}


function mergeCookies(
  oldCookie,
  response
) {
  const jar =
    new Map();

  for (
    const part
    of String(
      oldCookie || ''
    )
      .split(';')
      .map(x => x.trim())
      .filter(Boolean)
  ) {
    const index =
      part.indexOf('=');

    if (index <= 0) {
      continue;
    }

    jar.set(
      part.slice(0, index),
      part.slice(index + 1)
    );
  }

  for (
    const cookie
    of parseSetCookies(
      response
    )
  ) {
    const index =
      cookie.indexOf('=');

    if (index <= 0) {
      continue;
    }

    jar.set(
      cookie.slice(0, index),
      cookie.slice(index + 1)
    );
  }

  return [...jar.entries()]
    .map(
      ([key, value]) =>
        `${key}=${value}`
    )
    .join('; ');
}


function headers(cookie = '') {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 Chrome/142 Safari/537.36',

    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

    'Accept-Language':
      'en-US,en;q=0.9',

    ...(cookie
      ? {
          Cookie:
            cookie,
        }
      : {}),
  };
}


/*
|--------------------------------------------------------------------------
| RETRY
|--------------------------------------------------------------------------
*/

async function fetchWithRetry(
  url,
  options,
  label
) {
  const attempts = 4;

  let lastError;

  for (
    let attempt = 1;
    attempt <= attempts;
    attempt++
  ) {
    try {
      return await fetch(
        url,
        {
          ...options,

          signal:
            AbortSignal.timeout(
              45000
            ),
        }
      );

    } catch (error) {
      lastError =
        error;

      console.log(
        `${label}: attempt ${attempt}/${attempts} failed`
      );

      if (
        attempt <
        attempts
      ) {
        await sleep(
          attempt * 2500
        );
      }
    }
  }

  throw lastError;
}


async function getInitial() {
  const response =
    await fetchWithRetry(
      URL,
      {
        headers:
          headers(),
      },
      'Archive initial GET'
    );

  const html =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `Archive GET failed ${response.status}`
    );
  }

  return {
    html,

    cookie:
      mergeCookies(
        '',
        response
      ),
  };
}


/*
|--------------------------------------------------------------------------
| FORM SERIALIZATION
|--------------------------------------------------------------------------
*/

function buildForm(
  html,
  overrides = {}
) {
  const body =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(
      extractHidden(
        html
      )
    )
  ) {
    body.set(
      key,
      value
    );
  }

  /*
  | Important:
  | Do not send empty dependent selects.
  */

  for (
    const select
    of extractSelects(
      html
    )
  ) {
    if (
      !select.name ||
      !Array.isArray(
        select.options
      ) ||
      select.options.length === 0
    ) {
      continue;
    }

    const value =
      selectedValue(
        html,
        select.name
      );

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      continue;
    }

    body.set(
      select.name,
      value
    );
  }

  for (
    const [key, value]
    of Object.entries(
      overrides
    )
  ) {
    body.set(
      key,
      String(value)
    );
  }

  return body;
}


async function postback({
  html,
  cookie,
  field,
  value,
  label,
}) {
  const body =
    buildForm(
      html,
      {
        [field]:
          value,
      }
    );

  body.set(
    '__EVENTTARGET',
    field
  );

  body.set(
    '__EVENTARGUMENT',
    ''
  );

  body.delete(
    FIELDS.submit
  );

  const response =
    await fetchWithRetry(
      URL,
      {
        method:
          'POST',

        headers: {
          ...headers(
            cookie
          ),

          'Content-Type':
            'application/x-www-form-urlencoded',

          Origin:
            'https://admissions.nic.in',

          Referer:
            URL,
        },

        body:
          body.toString(),
      },
      label
    );

  const resultHtml =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `${label}: HTTP ${response.status}`
    );
  }

  if (
    /Something Went Wrong/i.test(
      stripHtml(
        resultHtml
      )
    )
  ) {
    throw new Error(
      `${label}: NIC returned Something Went Wrong`
    );
  }

  return {
    html:
      resultHtml,

    cookie:
      mergeCookies(
        cookie,
        response
      ),
  };
}


async function submit({
  html,
  cookie,
  label,
}) {
  const body =
    buildForm(
      html
    );

  body.set(
    '__EVENTTARGET',
    ''
  );

  body.set(
    '__EVENTARGUMENT',
    ''
  );

  body.set(
    FIELDS.submit,
    'Submit'
  );

  const response =
    await fetchWithRetry(
      URL,
      {
        method:
          'POST',

        headers: {
          ...headers(
            cookie
          ),

          'Content-Type':
            'application/x-www-form-urlencoded',

          Origin:
            'https://admissions.nic.in',

          Referer:
            URL,
        },

        body:
          body.toString(),
      },
      label
    );

  const resultHtml =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `${label}: HTTP ${response.status}`
    );
  }

  if (
    /Something Went Wrong/i.test(
      stripHtml(
        resultHtml
      )
    )
  ) {
    throw new Error(
      `${label}: NIC returned Something Went Wrong`
    );
  }

  return {
    html:
      resultHtml,

    cookie:
      mergeCookies(
        cookie,
        response
      ),
  };
}


/*
|--------------------------------------------------------------------------
| RESULT TABLE
|--------------------------------------------------------------------------
*/

function extractRows(html) {
  const tableRegex =
    /<table\b[^>]*>([\s\S]*?)<\/table>/gi;

  let tableMatch;

  while (
    (
      tableMatch =
        tableRegex.exec(html)
    ) !== null
  ) {
    const rows = [];

    const rowRegex =
      /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

    let rowMatch;

    while (
      (
        rowMatch =
          rowRegex.exec(
            tableMatch[1]
          )
      ) !== null
    ) {
      const cells = [];

      const cellRegex =
        /<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi;

      let cellMatch;

      while (
        (
          cellMatch =
            cellRegex.exec(
              rowMatch[1]
            )
        ) !== null
      ) {
        cells.push(
          stripHtml(
            cellMatch[1]
          )
        );
      }

      if (cells.length) {
        rows.push(
          cells
        );
      }
    }

    if (
      rows.length > 1 &&
      rows[0].some(
        cell =>
          /Opening Rank/i.test(
            cell
          )
      ) &&
      rows[0].some(
        cell =>
          /Closing Rank/i.test(
            cell
          )
      )
    ) {
      return rows;
    }
  }

  return [];
}


function normalizeRank(value) {
  const raw =
    String(
      value ?? ''
    ).trim();

  if (!raw) {
    return null;
  }

  const numeric =
    Number(
      raw.replace(
        /,/g,
        ''
      )
    );

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return null;
  }

  return Math.round(
    numeric
  );
}


function normalizeRows(
  tableRows,
  year,
  round
) {
  if (
    tableRows.length < 2
  ) {
    return [];
  }

  const header =
    tableRows[0]
      .map(
        value =>
          value
            .trim()
            .toLowerCase()
      );


  const getIndex =
    (...names) => {
      for (
        const name
        of names
      ) {
        const index =
          header.indexOf(
            name
          );

        if (
          index !== -1
        ) {
          return index;
        }
      }

      return -1;
    };


  const indexes = {
    institute:
      getIndex(
        'institute'
      ),

    program:
      getIndex(
        'academic program name',
        'academic program'
      ),

    quota:
      getIndex(
        'quota'
      ),

    category:
      getIndex(
        'seat type',
        'category'
      ),

    gender:
      getIndex(
        'gender'
      ),

    opening:
      getIndex(
        'opening rank'
      ),

    closing:
      getIndex(
        'closing rank'
      ),
  };


  const result = [];


  for (
    const cells
    of tableRows.slice(1)
  ) {
    const institute =
      cells[
        indexes.institute
      ]?.trim() || '';

    const program =
      cells[
        indexes.program
      ]?.trim() || '';

    const quota =
      cells[
        indexes.quota
      ]?.trim() || '';

    const category =
      cells[
        indexes.category
      ]?.trim() || '';

    const gender =
      cells[
        indexes.gender
      ]?.trim() || '';

    const openingRaw =
      cells[
        indexes.opening
      ]?.trim() || '';

    const closingRaw =
      cells[
        indexes.closing
      ]?.trim() || '';


    if (
      !institute ||
      !program
    ) {
      continue;
    }


    const isDasa =
      /\bDASA\b/i.test(
        program
      ) ||
      /\bDASA\b/i.test(
        quota
      );


    result.push({
      counselling_type:
        isDasa
          ? 'DASA'
          : 'CSAB',

      year,

      round:
        `Special Round ${round}`,

      institute_name:
        institute,

      program_name:
        program,

      quota,

      category,

      gender,

      opening_rank:
        normalizeRank(
          openingRaw
        ),

      closing_rank:
        normalizeRank(
          closingRaw
        ),

      opening_rank_raw:
        openingRaw,

      closing_rank_raw:
        closingRaw,

      source_label:
        'Official CSAB / NIC Previous Year Opening and Closing Rank',

      source_url:
        URL,

      is_verified:
        true,

      verification_status:
        'VERIFIED',
    });
  }

  return result;
}


/*
|--------------------------------------------------------------------------
| GET YEAR STATE
|--------------------------------------------------------------------------
*/

async function selectYear(
  year
) {
  const initial =
    await getInitial();

  return postback({
    html:
      initial.html,

    cookie:
      initial.cookie,

    field:
      FIELDS.year,

    value:
      String(year),

    label:
      `${year} Year`,
  });
}


/*
|--------------------------------------------------------------------------
| COMPLETE ONE ROUND
|--------------------------------------------------------------------------
*/

async function fetchRound(
  year,
  roundValue
) {
  console.log(
    '\n========================================'
  );

  console.log(
    `FETCHING ${year} ROUND ${roundValue}`
  );

  console.log(
    '========================================'
  );


  /*
  | New session for every round.
  */

  const yearState =
    await selectYear(
      year
    );

  await sleep(
    750
  );


  const roundState =
    await postback({
      html:
        yearState.html,

      cookie:
        yearState.cookie,

      field:
        FIELDS.round,

      value:
        roundValue,

      label:
        `${year} Round ${roundValue}`,
    });

  await sleep(
    750
  );


  const allType =
    findOption(
      roundState.html,
      FIELDS.instituteType,
      'ALL'
    );

  if (!allType) {
    throw new Error(
      `${year} Round ${roundValue}: ALL institute type not found`
    );
  }


  const typeState =
    await postback({
      html:
        roundState.html,

      cookie:
        roundState.cookie,

      field:
        FIELDS.instituteType,

      value:
        allType.value,

      label:
        `${year} Round ${roundValue} Type ALL`,
    });

  await sleep(
    750
  );


  const allInstitute =
    findOption(
      typeState.html,
      FIELDS.institute,
      'ALL'
    );

  if (!allInstitute) {
    throw new Error(
      `${year} Round ${roundValue}: ALL institute not found`
    );
  }


  const instituteState =
    await postback({
      html:
        typeState.html,

      cookie:
        typeState.cookie,

      field:
        FIELDS.institute,

      value:
        allInstitute.value,

      label:
        `${year} Round ${roundValue} Institute ALL`,
    });

  await sleep(
    750
  );


  const allProgram =
    findOption(
      instituteState.html,
      FIELDS.branch,
      'ALL'
    );

  if (!allProgram) {
    throw new Error(
      `${year} Round ${roundValue}: ALL program not found`
    );
  }


  const programState =
    await postback({
      html:
        instituteState.html,

      cookie:
        instituteState.cookie,

      field:
        FIELDS.branch,

      value:
        allProgram.value,

      label:
        `${year} Round ${roundValue} Program ALL`,
    });

  await sleep(
    750
  );


  const result =
    await submit({
      html:
        programState.html,

      cookie:
        programState.cookie,

      label:
        `${year} Round ${roundValue} Submit`,
    });


  const outputDir =
    `./tmp/csab/raw/${year}`;


  await fs.mkdir(
    outputDir,
    {
      recursive: true,
    }
  );


  await fs.writeFile(
    `${outputDir}/round-${roundValue}.html`,
    result.html,
    'utf8'
  );


  const tableRows =
    extractRows(
      result.html
    );


  if (
    tableRows.length < 2
  ) {
    throw new Error(
      `${year} Round ${roundValue}: result table not found`
    );
  }


  const normalized =
    normalizeRows(
      tableRows,
      year,
      roundValue
    );


  const csab =
    normalized.filter(
      row =>
        row.counselling_type ===
        'CSAB'
    );


  const dasa =
    normalized.filter(
      row =>
        row.counselling_type ===
        'DASA'
    );


  await fs.writeFile(
    `${outputDir}/round-${roundValue}-all.json`,

    JSON.stringify(
      normalized,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    `${outputDir}/round-${roundValue}-csab.json`,

    JSON.stringify(
      csab,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    `${outputDir}/round-${roundValue}-dasa.json`,

    JSON.stringify(
      dasa,
      null,
      2
    ),

    'utf8'
  );


  console.log(
    'Official rows:',
    normalized.length
  );

  console.log(
    'CSAB rows:',
    csab.length
  );

  console.log(
    'DASA rows excluded:',
    dasa.length
  );

  console.log(
    'CSAB missing opening:',
    csab.filter(
      row =>
        row.opening_rank ===
        null
    ).length
  );

  console.log(
    'CSAB missing closing:',
    csab.filter(
      row =>
        row.closing_rank ===
        null
    ).length
  );


  return {
    all:
      normalized,

    csab,

    dasa,
  };
}


function rowKey(row) {
  return [
    row.year,
    row.round,
    row.institute_name,
    row.program_name,
    row.quota,
    row.category,
    row.gender,
  ].join(
    '|||'
  );
}


function findDuplicates(rows) {
  const seen =
    new Map();

  const duplicates =
    [];

  for (
    const row
    of rows
  ) {
    const key =
      rowKey(
        row
      );

    if (
      seen.has(key)
    ) {
      duplicates.push({
        key,
        first:
          seen.get(key),
        duplicate:
          row,
      });
    } else {
      seen.set(
        key,
        row
      );
    }
  }

  return duplicates;
}


/*
|--------------------------------------------------------------------------
| COMPLETE YEAR
|--------------------------------------------------------------------------
*/

async function fetchYear(
  year
) {
  console.log(
    '\n########################################'
  );

  console.log(
    `CSAB ${year}`
  );

  console.log(
    '########################################'
  );


  /*
  | Discover every official round dynamically.
  */

  const yearState =
    await selectYear(
      year
    );


  const rounds =
    validOptions(
      yearState.html,
      FIELDS.round
    );


  console.log(
    `\n${year} official rounds:`
  );

  console.table(
    rounds
  );


  if (!rounds.length) {
    throw new Error(
      `${year}: no rounds found`
    );
  }


  const roundResults =
    [];


  for (
    const round
    of rounds
  ) {
    const result =
      await fetchRound(
        year,
        round.value
      );

    roundResults.push(
      result
    );

    await sleep(
      1500
    );
  }


  const allRows =
    roundResults.flatMap(
      result =>
        result.all
    );


  const csabRows =
    roundResults.flatMap(
      result =>
        result.csab
    );


  const dasaRows =
    roundResults.flatMap(
      result =>
        result.dasa
    );


  const duplicates =
    findDuplicates(
      csabRows
    );


  const uniqueInstitutes =
    new Set(
      csabRows.map(
        row =>
          row.institute_name
      )
    );


  const uniquePrograms =
    new Set(
      csabRows.map(
        row =>
          row.program_name
      )
    );


  const outputDir =
    `./tmp/csab/raw/${year}`;


  await fs.writeFile(
    `${outputDir}/csab-${year}-all-rounds.json`,

    JSON.stringify(
      csabRows,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    `${outputDir}/dasa-${year}-all-rounds.json`,

    JSON.stringify(
      dasaRows,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    `${outputDir}/csab-${year}-duplicates.json`,

    JSON.stringify(
      duplicates,
      null,
      2
    ),

    'utf8'
  );


  const summary = {
    year,

    rounds:
      rounds.map(
        round =>
          round.text
      ),

    total_official_rows:
      allRows.length,

    total_csab_rows:
      csabRows.length,

    total_dasa_rows_excluded:
      dasaRows.length,

    unique_csab_institutes:
      uniqueInstitutes.size,

    unique_csab_programs:
      uniquePrograms.size,

    missing_opening_rank:
      csabRows.filter(
        row =>
          row.opening_rank ===
          null
      ).length,

    missing_closing_rank:
      csabRows.filter(
        row =>
          row.closing_rank ===
          null
      ).length,

    duplicate_keys:
      duplicates.length,

    source_url:
      URL,
  };


  await fs.writeFile(
    `${outputDir}/summary.json`,

    JSON.stringify(
      summary,
      null,
      2
    ),

    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    `CSAB ${year} FETCH COMPLETE`
  );

  console.log(
    '========================================'
  );

  console.table(
    summary
  );


  return {
    summary,
    csabRows,
  };
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  const completed =
    [];


  for (
    const year
    of YEARS
  ) {
    const result =
      await fetchYear(
        year
      );

    completed.push(
      result
    );

    await sleep(
      2000
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Combined 3-year dataset:
  | 2026 already fetched separately.
  | Here we combine 2025 + 2024 archive data.
  |--------------------------------------------------------------------------
  */

  const archiveCombined =
    completed.flatMap(
      result =>
        result.csabRows
    );


  await fs.mkdir(
    './tmp/csab/combined',
    {
      recursive: true,
    }
  );


  await fs.writeFile(
    './tmp/csab/combined/csab-2025-2024.json',

    JSON.stringify(
      archiveCombined,
      null,
      2
    ),

    'utf8'
  );


  console.log(
    '\n########################################'
  );

  console.log(
    'ARCHIVE FETCH COMPLETE'
  );

  console.log(
    '########################################'
  );

  console.log(
    'Years:',
    YEARS.join(', ')
  );

  console.log(
    'Combined archive CSAB rows:',
    archiveCombined.length
  );

  console.log(
    '\nSaved under:'
  );

  console.log(
    './tmp/csab/raw/2025'
  );

  console.log(
    './tmp/csab/raw/2024'
  );
}


main().catch(
  error => {
    console.error(
      '\nCSAB ARCHIVE FETCH FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
