import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx';

const YEAR =
  2026;

const ROUNDS = [
  '1',
  '2',
  '3',
  '4',
  '5',
];

const F = {
  round:
    'ctl00$ContentPlaceHolder1$ddlroundno',

  instituteType:
    'ctl00$ContentPlaceHolder1$ddlInstype',

  institute:
    'ctl00$ContentPlaceHolder1$ddlInstitute',

  branch:
    'ctl00$ContentPlaceHolder1$ddlBranch',

  seatType:
    'ctl00$ContentPlaceHolder1$ddlSeattype',

  submit:
    'ctl00$ContentPlaceHolder1$btnSubmit',
};


function sleep(ms) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}


function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}


function stripHtml(value) {
  return decodeHtml(
    String(value || '')
      .replace(
        /<br\s*\/?>/gi,
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
  );
}


function numericRankOrNull(
  value
) {

  const text =
    String(
      value ?? ''
    )
      .trim();

  /*
  |--------------------------------------------------------------------------
  | Preserve non-standard official rank values.
  |--------------------------------------------------------------------------
  |
  | Example:
  | rank values containing non-numeric characters must NOT silently
  | become fake numeric ranks.
  |
  */

  if (
    !/^\d+$/.test(
      text
    )
  ) {
    return null;
  }

  const number =
    Number(text);

  return Number.isSafeInteger(
    number
  )
    ? number
    : null;
}


function csvEscape(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  const text =
    String(value);

  if (
    text.includes(',') ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r')
  ) {

    return (
      '"' +
      text.replace(
        /"/g,
        '""'
      ) +
      '"'
    );
  }

  return text;
}


class JosaaSession {

  constructor() {
    this.cookieHeader =
      '';
  }


  captureCookies(
    response
  ) {

    let cookies = [];

    if (
      typeof response.headers
        .getSetCookie ===
      'function'
    ) {

      cookies =
        response.headers
          .getSetCookie();

    } else {

      const value =
        response.headers.get(
          'set-cookie'
        );

      if (value) {
        cookies = [value];
      }
    }

    if (!cookies.length) {
      return;
    }

    const map =
      new Map();

    if (
      this.cookieHeader
    ) {

      for (
        const piece
        of this.cookieHeader
          .split(';')
      ) {

        const parts =
          piece
            .trim()
            .split('=');

        const key =
          parts.shift();

        if (key) {

          map.set(
            key,
            parts.join('=')
          );
        }
      }
    }

    for (
      const raw
      of cookies
    ) {

      const first =
        String(raw)
          .split(';')[0];

      const parts =
        first.split('=');

      const key =
        parts.shift();

      if (key) {

        map.set(
          key.trim(),
          parts
            .join('=')
            .trim()
        );
      }
    }

    this.cookieHeader =
      [...map.entries()]
        .map(
          ([key, value]) =>
            `${key}=${value}`
        )
        .join('; ');
  }


  async request(
    options = {}
  ) {

    const headers = {

      'User-Agent':
        'Mozilla/5.0 TruMarg-Data-Audit/1.0',

      Accept:
        'text/html,application/xhtml+xml',

      ...(options.headers || {}),
    };

    if (
      this.cookieHeader
    ) {
      headers.Cookie =
        this.cookieHeader;
    }

    const response =
      await fetch(
        URL,
        {
          ...options,

          headers,

          redirect:
            'follow',
        }
      );

    this.captureCookies(
      response
    );

    if (
      !response.ok
    ) {

      throw new Error(
        `HTTP ${response.status}`
      );
    }

    return response.text();
  }
}


function extractHidden(
  html
) {

  const result = {};

  const regex =
    /<input\b[^>]*type=["']hidden["'][^>]*>/gi;

  let match;

  while (
    (
      match =
        regex.exec(html)
    ) !== null
  ) {

    const tag =
      match[0];

    const nameMatch =
      tag.match(
        /name=["']([^"']+)["']/i
      );

    if (
      !nameMatch
    ) {
      continue;
    }

    const valueMatch =
      tag.match(
        /value=["']([^"']*)["']/i
      );

    result[
      decodeHtml(
        nameMatch[1]
      )
    ] =
      valueMatch
        ? decodeHtml(
            valueMatch[1]
          )
        : '';
  }

  return result;
}


function extractInputValue(
  html,
  name
) {

  const safe =
    name.replace(
      /[$]/g,
      '\\$'
    );

  const regex =
    new RegExp(
      `<input[^>]+name=["']${safe}["'][^>]*>`,
      'i'
    );

  const match =
    html.match(
      regex
    );

  if (
    !match
  ) {
    return null;
  }

  const valueMatch =
    match[0].match(
      /value=["']([^"']*)["']/i
    );

  return valueMatch
    ? decodeHtml(
        valueMatch[1]
      )
    : '';
}


async function postBack(
  session,
  html,
  target,
  selections = {}
) {

  const hidden =
    extractHidden(
      html
    );

  const form =
    new URLSearchParams();

  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      hidden
    )
  ) {

    form.set(
      key,
      value ?? ''
    );
  }

  form.set(
    '__EVENTTARGET',
    target
  );

  form.set(
    '__EVENTARGUMENT',
    ''
  );

  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      selections
    )
  ) {

    form.set(
      key,
      value ?? ''
    );
  }

  return session.request({

    method:
      'POST',

    headers: {
      'Content-Type':
        'application/x-www-form-urlencoded',
    },

    body:
      form.toString(),
  });
}


async function submitForm(
  session,
  html,
  selections
) {

  const hidden =
    extractHidden(
      html
    );

  const form =
    new URLSearchParams();

  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      hidden
    )
  ) {

    form.set(
      key,
      value ?? ''
    );
  }

  form.set(
    '__EVENTTARGET',
    ''
  );

  form.set(
    '__EVENTARGUMENT',
    ''
  );

  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      selections
    )
  ) {

    form.set(
      key,
      value ?? ''
    );
  }

  const submitValue =
    extractInputValue(
      html,
      F.submit
    );

  form.set(
    F.submit,
    submitValue ||
      'Submit'
  );

  return session.request({

    method:
      'POST',

    headers: {
      'Content-Type':
        'application/x-www-form-urlencoded',
    },

    body:
      form.toString(),
  });
}


function parseCutoffTable(
  html
) {

  const tableMatch =
    html.match(
      /<table\b[^>]*id=["']ctl00_ContentPlaceHolder1_GridView1["'][^>]*>([\s\S]*?)<\/table>/i
    );

  if (
    !tableMatch
  ) {

    throw new Error(
      'Official OR-CR table not found'
    );
  }

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

    let cell;

    while (
      (
        cell =
          cellRegex.exec(
            rowMatch[1]
          )
      ) !== null
    ) {

      cells.push(
        stripHtml(
          cell[1]
        )
      );
    }

    if (
      cells.length
    ) {

      rows.push(
        cells
      );
    }
  }

  if (
    rows.length < 2
  ) {

    throw new Error(
      'OR-CR table contains no data rows'
    );
  }

  const header =
    rows[0]
      .map(
        value =>
          value
            .toLowerCase()
            .trim()
      );

  const expected = [
    'institute',
    'academic program name',
    'quota',
    'seat type',
    'gender',
    'opening rank',
    'closing rank',
  ];

  for (
    let index = 0;
    index < expected.length;
    index += 1
  ) {

    if (
      header[index] !==
      expected[index]
    ) {

      throw new Error(
        `Unexpected table header at column ${index + 1}: ` +
        `${rows[0][index]}`
      );
    }
  }

  return rows
    .slice(1)
    .map(
      cells => {

        const [
          institute,
          academicProgram,
          quota,
          seatType,
          gender,
          openingRankRaw,
          closingRankRaw,
        ] =
          cells;

        return {

          counsellingType:
            'JOSAA',

          year:
            YEAR,

          institute:
            institute || '',

          academicProgram:
            academicProgram || '',

          quota:
            quota || '',

          seatType:
            seatType || '',

          gender:
            gender || '',

          openingRankRaw:
            openingRankRaw || '',

          closingRankRaw:
            closingRankRaw || '',

          openingRank:
            numericRankOrNull(
              openingRankRaw
            ),

          closingRank:
            numericRankOrNull(
              closingRankRaw
            ),

          sourceUrl:
            URL,

          sourceLabel:
            `Official JoSAA ${YEAR} OR-CR`,
        };
      }
    );
}


async function fetchRound(
  round
) {

  console.log(
    '\n========================================'
  );

  console.log(
    `FETCHING ROUND ${round}`
  );

  console.log(
    '========================================'
  );


  /*
  |--------------------------------------------------------------------------
  | Fresh ASP.NET session for this round
  |--------------------------------------------------------------------------
  */

  const session =
    new JosaaSession();

  let html =
    await session.request();


  /*
  |--------------------------------------------------------------------------
  | ROUND
  |--------------------------------------------------------------------------
  */

  html =
    await postBack(
      session,
      html,
      F.round,
      {
        [F.round]:
          round,
      }
    );


  /*
  |--------------------------------------------------------------------------
  | INSTITUTE TYPE = ALL
  |--------------------------------------------------------------------------
  */

  html =
    await postBack(
      session,
      html,
      F.instituteType,
      {
        [F.round]:
          round,

        [F.instituteType]:
          'ALL',
      }
    );


  /*
  |--------------------------------------------------------------------------
  | INSTITUTE = ALL
  |--------------------------------------------------------------------------
  */

  html =
    await postBack(
      session,
      html,
      F.institute,
      {
        [F.round]:
          round,

        [F.instituteType]:
          'ALL',

        [F.institute]:
          'ALL',
      }
    );


  /*
  |--------------------------------------------------------------------------
  | PROGRAM = ALL
  |--------------------------------------------------------------------------
  */

  html =
    await postBack(
      session,
      html,
      F.branch,
      {
        [F.round]:
          round,

        [F.instituteType]:
          'ALL',

        [F.institute]:
          'ALL',

        [F.branch]:
          'ALL',
      }
    );


  /*
  |--------------------------------------------------------------------------
  | SUBMIT ALL SEAT TYPES
  |--------------------------------------------------------------------------
  */

  html =
    await submitForm(
      session,
      html,
      {
        [F.round]:
          round,

        [F.instituteType]:
          'ALL',

        [F.institute]:
          'ALL',

        [F.branch]:
          'ALL',

        [F.seatType]:
          'ALL',
      }
    );


  /*
  |--------------------------------------------------------------------------
  | Preserve official raw HTML
  |--------------------------------------------------------------------------
  */

  fs.writeFileSync(
    `./josaa-${YEAR}-round-${round}-official.html`,
    html,
    'utf8'
  );


  /*
  |--------------------------------------------------------------------------
  | Parse official table
  |--------------------------------------------------------------------------
  */

  const parsed =
    parseCutoffTable(
      html
    )
      .map(
        row => ({
          ...row,

          round:
            round,
        })
      );


  console.log(
    `Round ${round} rows: ${parsed.length}`
  );


  /*
  |--------------------------------------------------------------------------
  | Audit
  |--------------------------------------------------------------------------
  */

  const missingOpening =
    parsed.filter(
      row =>
        row.openingRankRaw === ''
    ).length;

  const missingClosing =
    parsed.filter(
      row =>
        row.closingRankRaw === ''
    ).length;

  const nonNumericOpening =
    parsed.filter(
      row =>
        row.openingRankRaw !== '' &&
        row.openingRank === null
    ).length;

  const nonNumericClosing =
    parsed.filter(
      row =>
        row.closingRankRaw !== '' &&
        row.closingRank === null
    ).length;


  console.log(
    `Missing opening: ${missingOpening}`
  );

  console.log(
    `Missing closing: ${missingClosing}`
  );

  console.log(
    `Non-numeric opening: ${nonNumericOpening}`
  );

  console.log(
    `Non-numeric closing: ${nonNumericClosing}`
  );


  fs.writeFileSync(
    `./josaa-${YEAR}-round-${round}.json`,
    JSON.stringify(
      {
        counsellingType:
          'JOSAA',

        year:
          YEAR,

        round,

        fetchedAt:
          new Date()
            .toISOString(),

        sourceUrl:
          URL,

        rowCount:
          parsed.length,

        audit: {
          missingOpening,
          missingClosing,
          nonNumericOpening,
          nonNumericClosing,
        },

        rows:
          parsed,
      },
      null,
      2
    ),
    'utf8'
  );

  return parsed;
}


function buildCsv(
  rows
) {

  const columns = [
    'counselling_type',
    'year',
    'round',
    'institute',
    'academic_program',
    'quota',
    'seat_type',
    'gender',
    'opening_rank_raw',
    'closing_rank_raw',
    'opening_rank',
    'closing_rank',
    'source_label',
    'source_url',
  ];

  const lines = [
    columns.join(','),
  ];

  for (
    const row
    of rows
  ) {

    lines.push(
      [
        row.counsellingType,
        row.year,
        row.round,
        row.institute,
        row.academicProgram,
        row.quota,
        row.seatType,
        row.gender,
        row.openingRankRaw,
        row.closingRankRaw,
        row.openingRank,
        row.closingRank,
        row.sourceLabel,
        row.sourceUrl,
      ]
        .map(
          csvEscape
        )
        .join(',')
    );
  }

  return lines.join(
    '\n'
  );
}


function duplicateKey(
  row
) {

  return [
    row.year,
    row.round,
    row.institute,
    row.academicProgram,
    row.quota,
    row.seatType,
    row.gender,
  ]
    .map(
      value =>
        String(
          value || ''
        )
          .trim()
          .toLowerCase()
    )
    .join('|');
}


async function main() {

  console.log(
    '\n========================================'
  );

  console.log(
    'TRUMARG JOSAA 2026 ALL-ROUND FETCH'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Rounds:',
    ROUNDS.join(', ')
  );

  console.log(
    '\nNO DATABASE WRITES WILL OCCUR.\n'
  );


  const allRows = [];

  const roundSummary = [];


  for (
    const round
    of ROUNDS
  ) {

    const rows =
      await fetchRound(
        round
      );

    allRows.push(
      ...rows
    );

    roundSummary.push({
      round,
      rows:
        rows.length,
    });


    /*
    |--------------------------------------------------------------------------
    | Be polite to official server
    |--------------------------------------------------------------------------
    */

    if (
      round !==
      ROUNDS[
        ROUNDS.length - 1
      ]
    ) {

      console.log(
        '\nWaiting before next round...'
      );

      await sleep(
        1500
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | DUPLICATE AUDIT
  |--------------------------------------------------------------------------
  */

  const seen =
    new Set();

  const duplicates = [];

  for (
    const row
    of allRows
  ) {

    const key =
      duplicateKey(
        row
      );

    if (
      seen.has(
        key
      )
    ) {

      duplicates.push(
        row
      );

    } else {

      seen.add(
        key
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | CATEGORY / QUOTA / GENDER SUMMARY
  |--------------------------------------------------------------------------
  */

  const seatTypes =
    {};

  const quotas =
    {};

  const genders =
    {};


  for (
    const row
    of allRows
  ) {

    seatTypes[
      row.seatType
    ] =
      (
        seatTypes[
          row.seatType
        ] ||
        0
      ) + 1;

    quotas[
      row.quota
    ] =
      (
        quotas[
          row.quota
        ] ||
        0
      ) + 1;

    genders[
      row.gender
    ] =
      (
        genders[
          row.gender
        ] ||
        0
      ) + 1;
  }


  const summary = {

    counsellingType:
      'JOSAA',

    year:
      YEAR,

    fetchedAt:
      new Date()
        .toISOString(),

    sourceUrl:
      URL,

    rounds:
      roundSummary,

    totalRows:
      allRows.length,

    duplicateRows:
      duplicates.length,

    uniqueRows:
      seen.size,

    seatTypes,

    quotas,

    genders,

    missingOpening:
      allRows.filter(
        row =>
          row.openingRankRaw === ''
      ).length,

    missingClosing:
      allRows.filter(
        row =>
          row.closingRankRaw === ''
      ).length,

    nonNumericOpening:
      allRows.filter(
        row =>
          row.openingRankRaw !== '' &&
          row.openingRank === null
      ).length,

    nonNumericClosing:
      allRows.filter(
        row =>
          row.closingRankRaw !== '' &&
          row.closingRank === null
      ).length,
  };


  /*
  |--------------------------------------------------------------------------
  | SAVE MASTER JSON
  |--------------------------------------------------------------------------
  */

  fs.writeFileSync(
    `./josaa-${YEAR}-all-rounds.json`,
    JSON.stringify(
      {
        ...summary,
        rows:
          allRows,
      },
      null,
      2
    ),
    'utf8'
  );


  /*
  |--------------------------------------------------------------------------
  | SAVE CSV
  |--------------------------------------------------------------------------
  */

  fs.writeFileSync(
    `./josaa-${YEAR}-all-rounds.csv`,
    buildCsv(
      allRows
    ),
    'utf8'
  );


  /*
  |--------------------------------------------------------------------------
  | SAVE AUDIT
  |--------------------------------------------------------------------------
  */

  fs.writeFileSync(
    `./josaa-${YEAR}-all-rounds-audit.json`,
    JSON.stringify(
      {
        ...summary,

        duplicateSamples:
          duplicates.slice(
            0,
            50
          ),
      },
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'ALL ROUNDS FETCH COMPLETE'
  );

  console.log(
    '========================================\n'
  );

  console.table(
    roundSummary
  );

  console.log(
    '\nTOTAL ROWS:',
    allRows.length
  );

  console.log(
    'UNIQUE ROWS:',
    seen.size
  );

  console.log(
    'DUPLICATE ROWS:',
    duplicates.length
  );

  console.log(
    'MISSING OPENING:',
    summary.missingOpening
  );

  console.log(
    'MISSING CLOSING:',
    summary.missingClosing
  );

  console.log(
    'NON-NUMERIC OPENING:',
    summary.nonNumericOpening
  );

  console.log(
    'NON-NUMERIC CLOSING:',
    summary.nonNumericClosing
  );


  console.log(
    '\nSaved:'
  );

  console.log(
    `josaa-${YEAR}-all-rounds.json`
  );

  console.log(
    `josaa-${YEAR}-all-rounds.csv`
  );

  console.log(
    `josaa-${YEAR}-all-rounds-audit.json`
  );

  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
  );
}


main().catch(
  error => {

    console.error(
      '\nFETCH FAILED:\n',
      error
    );

    process.exit(1);
  }
);
