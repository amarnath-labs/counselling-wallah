import fs from 'node:fs';

const URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/currentorcr.aspx';

const YEAR =
  2026;

const ROUNDS =
  ['1', '2'];


const ROUND_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlroundno';

const TYPE_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlInstype';

const INSTITUTE_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlInstitute';

const BRANCH_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlBranch';

const SUBMIT_CONTROL =
  'ctl00$ContentPlaceHolder1$btnSubmit';


function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}


function stripTags(value) {
  return decodeHtml(
    String(value ?? '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  );
}


function extractAttributes(tag) {
  const result = {};

  const regex =
    /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

  let match;

  while (
    (match = regex.exec(tag)) !== null
  ) {
    result[
      match[1].toLowerCase()
    ] =
      decodeHtml(
        match[2] ??
        match[3] ??
        match[4] ??
        ''
      );
  }

  return result;
}


function extractHidden(html) {
  const result = {};

  const tags =
    html.match(
      /<input\b[^>]*type=["']hidden["'][^>]*>/gi
    ) ?? [];

  for (const tag of tags) {
    const attrs =
      extractAttributes(tag);

    const name =
      attrs.name ??
      attrs.id;

    if (name) {
      result[name] =
        attrs.value ?? '';
    }
  }

  return result;
}


function getCookies(response) {
  if (
    typeof response.headers.getSetCookie ===
    'function'
  ) {
    return response.headers
      .getSetCookie()
      .map(
        value =>
          value.split(';')[0]
      )
      .join('; ');
  }

  const raw =
    response.headers.get(
      'set-cookie'
    );

  if (!raw) {
    return '';
  }

  return raw
    .split(/,(?=[^;,]+=)/)
    .map(
      item =>
        item.split(';')[0]
    )
    .join('; ');
}


async function initialGet() {
  const response =
    await fetch(
      URL,
      {
        redirect:
          'follow',

        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-CSAB-2026-Fetch/1.0',

          'Accept':
            'text/html,application/xhtml+xml',
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `Initial GET failed: HTTP ${response.status}`
    );
  }

  return {
    html:
      await response.text(),

    cookie:
      getCookies(response),
  };
}


async function postForm({
  html,
  cookie,
  values,
  eventTarget = '',
}) {
  const hidden =
    extractHidden(html);

  const params =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(hidden)
  ) {
    params.set(
      key,
      value
    );
  }

  params.set(
    '__EVENTTARGET',
    eventTarget
  );

  params.set(
    '__EVENTARGUMENT',
    ''
  );

  for (
    const [key, value]
    of Object.entries(values)
  ) {
    params.set(
      key,
      value
    );
  }

  const response =
    await fetch(
      URL,
      {
        method:
          'POST',

        redirect:
          'follow',

        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-CSAB-2026-Fetch/1.0',

          'Accept':
            'text/html,application/xhtml+xml',

          'Content-Type':
            'application/x-www-form-urlencoded',

          'Cookie':
            cookie,

          'Referer':
            URL,
        },

        body:
          params.toString(),
      }
    );

  if (!response.ok) {
    throw new Error(
      `POST failed: HTTP ${response.status}`
    );
  }

  return {
    html:
      await response.text(),

    cookie:
      [
        cookie,
        getCookies(response),
      ]
        .filter(Boolean)
        .join('; '),
  };
}


function parseTables(html) {
  const tables =
    html.match(
      /<table\b[\s\S]*?<\/table>/gi
    ) ?? [];

  return tables.map(
    (table, index) => {
      const matrix = [];

      const rows =
        table.match(
          /<tr\b[\s\S]*?<\/tr>/gi
        ) ?? [];

      for (const row of rows) {
        const cells = [];

        const cellRegex =
          /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;

        let match;

        while (
          (match = cellRegex.exec(row)) !== null
        ) {
          cells.push(
            stripTags(
              match[1]
            )
          );
        }

        if (cells.length) {
          matrix.push(cells);
        }
      }

      return {
        index,
        matrix,
        text:
          stripTags(table),
      };
    }
  );
}


function findOrcrTable(html) {
  return (
    parseTables(html)
      .find(
        table => {
          const text =
            table.text.toLowerCase();

          return (
            text.includes(
              'opening rank'
            ) &&
            text.includes(
              'closing rank'
            )
          );
        }
      ) ?? null
  );
}


function normalizeHeader(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}


function indexOfHeader(
  header,
  candidates
) {
  for (const candidate of candidates) {
    const index =
      header.findIndex(
        value =>
          value === candidate ||
          value.includes(candidate)
      );

    if (index !== -1) {
      return index;
    }
  }

  return -1;
}


function parseResultRows(
  matrix,
  round
) {
  if (
    !Array.isArray(matrix) ||
    matrix.length < 2
  ) {
    throw new Error(
      `Empty result matrix for round ${round}`
    );
  }

  const header =
    matrix[0]
      .map(
        normalizeHeader
      );

  console.log(
    'Detected header:',
    header
  );


  const instituteIndex =
    indexOfHeader(
      header,
      [
        'institute',
        'institute name',
      ]
    );

  const programIndex =
    indexOfHeader(
      header,
      [
        'academic program',
        'academic programme',
        'program',
        'programme',
      ]
    );

  const quotaIndex =
    indexOfHeader(
      header,
      ['quota']
    );

  const categoryIndex =
    indexOfHeader(
      header,
      [
        'seat type',
        'category',
      ]
    );

  const genderIndex =
    indexOfHeader(
      header,
      [
        'gender',
        'gender pool',
      ]
    );

  const openingIndex =
    indexOfHeader(
      header,
      ['opening rank']
    );

  const closingIndex =
    indexOfHeader(
      header,
      ['closing rank']
    );


  if (
    instituteIndex === -1 ||
    programIndex === -1 ||
    openingIndex === -1 ||
    closingIndex === -1
  ) {
    throw new Error(
      `Could not map result columns for round ${round}`
    );
  }


  const output = [];


  for (
    const cells
    of matrix.slice(1)
  ) {
    const institute =
      cells[instituteIndex] ?? '';

    const academicProgram =
      cells[programIndex] ?? '';

    if (
      !String(institute).trim() ||
      !String(academicProgram).trim()
    ) {
      continue;
    }


    output.push({
      year:
        YEAR,

      round:
        Number(round),

      institute:
        String(institute).trim(),

      academicProgram:
        String(academicProgram).trim(),

      quota:
        quotaIndex >= 0
          ? String(
              cells[quotaIndex] ?? ''
            ).trim()
          : '',

      seatType:
        categoryIndex >= 0
          ? String(
              cells[categoryIndex] ?? ''
            ).trim()
          : '',

      gender:
        genderIndex >= 0
          ? String(
              cells[genderIndex] ?? ''
            ).trim()
          : '',

      openingRank:
        String(
          cells[openingIndex] ?? ''
        ).trim(),

      closingRank:
        String(
          cells[closingIndex] ?? ''
        ).trim(),

      sourceUrl:
        URL,

      source:
        'Official CSAB Special 2026 OR-CR',
    });
  }


  return output;
}


async function fetchRound(round) {
  console.log(
    '\n========================================'
  );

  console.log(
    `FETCH CSAB 2026 ROUND ${round}`
  );

  console.log(
    '========================================'
  );


  /*
  |--------------------------------------------------------------------------
  | INITIAL GET
  |--------------------------------------------------------------------------
  */

  const initial =
    await initialGet();


  /*
  |--------------------------------------------------------------------------
  | ROUND
  |--------------------------------------------------------------------------
  */

  const afterRound =
    await postForm({
      html:
        initial.html,

      cookie:
        initial.cookie,

      eventTarget:
        ROUND_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,
      },
    });


  /*
  |--------------------------------------------------------------------------
  | INSTITUTE TYPE = ALL
  |--------------------------------------------------------------------------
  */

  const afterType =
    await postForm({
      html:
        afterRound.html,

      cookie:
        afterRound.cookie,

      eventTarget:
        TYPE_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,

        [TYPE_CONTROL]:
          'ALL',
      },
    });


  /*
  |--------------------------------------------------------------------------
  | INSTITUTE = ALL
  |--------------------------------------------------------------------------
  */

  const afterInstitute =
    await postForm({
      html:
        afterType.html,

      cookie:
        afterType.cookie,

      eventTarget:
        INSTITUTE_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,

        [TYPE_CONTROL]:
          'ALL',

        [INSTITUTE_CONTROL]:
          'ALL',
      },
    });


  /*
  |--------------------------------------------------------------------------
  | BRANCH = ALL
  |--------------------------------------------------------------------------
  */

  const afterBranch =
    await postForm({
      html:
        afterInstitute.html,

      cookie:
        afterInstitute.cookie,

      eventTarget:
        BRANCH_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,

        [TYPE_CONTROL]:
          'ALL',

        [INSTITUTE_CONTROL]:
          'ALL',

        [BRANCH_CONTROL]:
          'ALL',
      },
    });


  /*
  |--------------------------------------------------------------------------
  | ACTUAL SUBMIT BUTTON
  |--------------------------------------------------------------------------
  */

  const submitted =
    await postForm({
      html:
        afterBranch.html,

      cookie:
        afterBranch.cookie,

      eventTarget:
        '',

      values: {
        [ROUND_CONTROL]:
          round,

        [TYPE_CONTROL]:
          'ALL',

        [INSTITUTE_CONTROL]:
          'ALL',

        [BRANCH_CONTROL]:
          'ALL',

        [SUBMIT_CONTROL]:
          'Submit',
      },
    });


  fs.writeFileSync(
    `./csab-2026-round-${round}-official.html`,
    submitted.html,
    'utf8'
  );


  const table =
    findOrcrTable(
      submitted.html
    );


  if (!table) {
    fs.writeFileSync(
      `./csab-2026-round-${round}-no-table-debug.html`,
      submitted.html,
      'utf8'
    );

    throw new Error(
      `No OR-CR result table found after Submit for round ${round}`
    );
  }


  console.log(
    'Result matrix rows:',
    table.matrix.length
  );


  console.log(
    '\nHEADER + SAMPLE'
  );

  console.table(
    table.matrix.slice(
      0,
      8
    )
  );


  const rows =
    parseResultRows(
      table.matrix,
      round
    );


  if (
    rows.length === 0
  ) {
    throw new Error(
      `Parsed zero rows for round ${round}`
    );
  }


  const dasaMarkerRows =
    rows.filter(
      row =>
        /\bDASA\b/i.test(
          [
            row.institute,
            row.academicProgram,
            row.quota,
            row.seatType,
            row.gender,
          ].join(' ')
        )
    );


  const ciwgMarkerRows =
    rows.filter(
      row =>
        /\bCIWG\b/i.test(
          [
            row.institute,
            row.academicProgram,
            row.quota,
            row.seatType,
            row.gender,
          ].join(' ')
        )
    );


  console.log(
    '\nPARSED ROWS:',
    rows.length
  );

  console.log(
    'DASA-MARKED ROWS:',
    dasaMarkerRows.length
  );

  console.log(
    'CIWG-MARKED ROWS:',
    ciwgMarkerRows.length
  );


  if (
    dasaMarkerRows.length > 0
  ) {
    console.log(
      '\nDASA SAMPLE'
    );

    console.table(
      dasaMarkerRows.slice(
        0,
        10
      )
    );
  }


  fs.writeFileSync(
    `./csab-2026-round-${round}.json`,
    JSON.stringify(
      rows,
      null,
      2
    ),
    'utf8'
  );


  return {
    rows,
    audit: {
      round:
        Number(round),

      rows:
        rows.length,

      dasaMarkerRows:
        dasaMarkerRows.length,

      ciwgMarkerRows:
        ciwgMarkerRows.length,
    },
  };
}


const allRows = [];

const roundAudit = [];


for (
  const round
  of ROUNDS
) {
  const result =
    await fetchRound(
      round
    );

  allRows.push(
    ...result.rows
  );

  roundAudit.push(
    result.audit
  );
}


const identity =
  row =>
    [
      row.year,
      row.round,
      row.institute,
      row.academicProgram,
      row.quota,
      row.seatType,
      row.gender,
      row.openingRank,
      row.closingRank,
    ].join('||');


const uniqueKeys =
  new Set(
    allRows.map(
      identity
    )
  );


const duplicateRows =
  allRows.length -
  uniqueKeys.size;


const missingOpening =
  allRows.filter(
    row =>
      !String(
        row.openingRank ?? ''
      ).trim()
  ).length;


const missingClosing =
  allRows.filter(
    row =>
      !String(
        row.closingRank ?? ''
      ).trim()
  ).length;


const totalDasaMarkerRows =
  allRows.filter(
    row =>
      /\bDASA\b/i.test(
        [
          row.institute,
          row.academicProgram,
          row.quota,
          row.seatType,
          row.gender,
        ].join(' ')
      )
  ).length;


const totalCiwgMarkerRows =
  allRows.filter(
    row =>
      /\bCIWG\b/i.test(
        [
          row.institute,
          row.academicProgram,
          row.quota,
          row.seatType,
          row.gender,
        ].join(' ')
      )
  ).length;


const audit = {
  year:
    YEAR,

  rounds:
    roundAudit,

  totalRows:
    allRows.length,

  uniqueRows:
    uniqueKeys.size,

  duplicateRows,

  missingOpening,

  missingClosing,

  dasaMarkerRows:
    totalDasaMarkerRows,

  ciwgMarkerRows:
    totalCiwgMarkerRows,

  sourceUrl:
    URL,

  fetchedAt:
    new Date()
      .toISOString(),

  databaseModified:
    false,
};


fs.writeFileSync(
  './csab-2026-all-rounds.json',
  JSON.stringify(
    allRows,
    null,
    2
  ),
  'utf8'
);


fs.writeFileSync(
  './csab-2026-all-rounds-audit.json',
  JSON.stringify(
    audit,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'CSAB 2026 ALL-ROUND FETCH COMPLETE'
);

console.log(
  '========================================'
);


console.table(
  roundAudit
);


console.log(
  'TOTAL ROWS:',
  allRows.length
);

console.log(
  'UNIQUE ROWS:',
  uniqueKeys.size
);

console.log(
  'DUPLICATE ROWS:',
  duplicateRows
);

console.log(
  'MISSING OPENING:',
  missingOpening
);

console.log(
  'MISSING CLOSING:',
  missingClosing
);

console.log(
  'DASA-MARKED ROWS:',
  totalDasaMarkerRows
);

console.log(
  'CIWG-MARKED ROWS:',
  totalCiwgMarkerRows
);


console.log(
  '\nSaved:'
);

console.log(
  './csab-2026-all-rounds.json'
);

console.log(
  './csab-2026-all-rounds-audit.json'
);


console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);