import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx';

const YEAR =
  '2024';

const ROUNDS =
  ['1', '2', '3', '4', '5'];

const SOURCE_LABEL =
  'Official JoSAA 2024 OR-CR Archive';

let cookieJar =
  new Map();


function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) =>
      String.fromCharCode(
        Number(n)
      )
    )
    .replace(/\s+/g, ' ')
    .trim();
}


function stripTags(value) {
  return decodeHtml(
    String(value ?? '')
      .replace(
        /<br\s*\/?>/gi,
        ' '
      )
      .replace(
        /<[^>]+>/g,
        ' '
      )
  );
}


function escapeRegex(value) {
  return String(value)
    .replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );
}


function updateCookies(response) {

  const setCookies =
    response.headers.getSetCookie?.() ??
    [];

  for (
    const item
    of setCookies
  ) {

    const first =
      item.split(';')[0];

    const separator =
      first.indexOf('=');

    if (
      separator <= 0
    ) {
      continue;
    }

    cookieJar.set(
      first.slice(0, separator),
      first.slice(separator + 1)
    );
  }
}


function cookieHeader() {
  return [
    ...cookieJar.entries(),
  ]
    .map(
      ([name, value]) =>
        `${name}=${value}`
    )
    .join('; ');
}


function extractHidden(html) {

  const output = {};

  const inputs =
    html.match(
      /<input\b[^>]*type=["']hidden["'][^>]*>/gi
    ) ?? [];

  for (
    const input
    of inputs
  ) {

    const name =
      input.match(
        /\bname=["']([^"']+)["']/i
      )?.[1];

    if (!name) {
      continue;
    }

    const value =
      input.match(
        /\bvalue=["']([^"']*)["']/i
      )?.[1] ?? '';

    output[
      decodeHtml(name)
    ] =
      decodeHtml(value);
  }

  return output;
}


function extractOptions(
  html,
  selectName
) {

  const escaped =
    escapeRegex(
      selectName
    );

  const select =
    html.match(
      new RegExp(
        `<select\\b[^>]*name=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/select>`,
        'i'
      )
    );

  if (!select) {
    return [];
  }

  const options = [];

  const regex =
    /<option\b[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;

  let match;

  while (
    (
      match =
        regex.exec(
          select[1]
        )
    )
  ) {

    options.push({
      value:
        decodeHtml(
          match[1]
        ),

      text:
        stripTags(
          match[2]
        ),
    });
  }

  return options;
}


function findAllValue(
  options,
  label
) {

  const all =
    options.find(
      option =>
        option.text
          .trim()
          .toUpperCase() ===
        'ALL'
    );

  if (!all) {
    throw new Error(
      `ALL option not found for ${label}`
    );
  }

  return all.value;
}


function findSubmitControl(
  html
) {

  const inputs =
    html.match(
      /<input\b[^>]*>/gi
    ) ?? [];

  for (
    const input
    of inputs
  ) {

    const type =
      input.match(
        /\btype=["']([^"']+)["']/i
      )?.[1]
        ?.toLowerCase();

    if (
      type !== 'submit'
    ) {
      continue;
    }

    const name =
      input.match(
        /\bname=["']([^"']+)["']/i
      )?.[1];

    const value =
      input.match(
        /\bvalue=["']([^"']*)["']/i
      )?.[1] ?? '';

    if (
      name &&
      /submit|view|search|show/i.test(
        value
      )
    ) {
      return {
        name:
          decodeHtml(name),

        value:
          decodeHtml(value),
      };
    }
  }

  throw new Error(
    'Submit button could not be discovered.'
  );
}


async function getPage() {

  const response =
    await fetch(
      URL,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0',
        },
      }
    );

  updateCookies(
    response
  );

  if (!response.ok) {
    throw new Error(
      `GET failed: HTTP ${response.status}`
    );
  }

  return await response.text();
}


async function postForm(
  html,
  {
    eventTarget = '',
    fields = {},
    submit = null,
  } = {}
) {

  const hidden =
    extractHidden(
      html
    );

  const body =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(
      hidden
    )
  ) {
    body.set(
      key,
      value
    );
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
    of Object.entries(
      fields
    )
  ) {
    body.set(
      key,
      String(value)
    );
  }

  if (submit) {
    body.set(
      submit.name,
      submit.value
    );
  }


  const response =
    await fetch(
      URL,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',

          'Cookie':
            cookieHeader(),

          'User-Agent':
            'Mozilla/5.0',
        },

        body:
          body.toString(),
      }
    );

  updateCookies(
    response
  );

  if (!response.ok) {
    throw new Error(
      `POST failed: HTTP ${response.status}`
    );
  }

  return await response.text();
}


function extractGridRows(
  html,
  round
) {

  const tables =
    html.match(
      /<table\b[\s\S]*?<\/table>/gi
    ) ?? [];

  let table =
    null;

  for (
    const candidate
    of tables
  ) {

    const plain =
      stripTags(
        candidate
      ).toLowerCase();

    if (
      plain.includes(
        'academic program name'
      ) &&
      plain.includes(
        'opening rank'
      ) &&
      plain.includes(
        'closing rank'
      ) &&
      plain.includes(
        'seat type'
      )
    ) {
      table =
        candidate;

      break;
    }
  }


  if (!table) {
    throw new Error(
      `Round ${round}: OR-CR result table not found.`
    );
  }


  const trRegex =
    /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

  const rows = [];

  let trMatch;

  while (
    (
      trMatch =
        trRegex.exec(
          table
        )
    )
  ) {

    const cells = [];

    const cellRegex =
      /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;

    let cellMatch;

    while (
      (
        cellMatch =
          cellRegex.exec(
            trMatch[1]
          )
      )
    ) {

      cells.push(
        stripTags(
          cellMatch[1]
        )
      );
    }


    if (
      cells.length < 7
    ) {
      continue;
    }


    const first =
      cells[0]
        .toLowerCase();

    if (
      first === 'institute' ||
      (
        first.includes(
          'institute'
        ) &&
        cells[1]
          .toLowerCase()
          .includes(
            'academic program'
          )
      )
    ) {
      continue;
    }


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


    if (
      !institute ||
      !academicProgram ||
      !seatType
    ) {
      continue;
    }


    rows.push({
      counsellingType:
        'JOSAA',

      year:
        2024,

      round:
        String(round),

      institute,

      academicProgram,

      quota,

      seatType,

      gender,

      openingRankRaw,

      closingRankRaw,

      sourceLabel:
        SOURCE_LABEL,

      sourceUrl:
        URL,
    });
  }


  if (
    rows.length === 0
  ) {
    throw new Error(
      `Round ${round}: parsed zero rows.`
    );
  }


  return rows;
}


function csvEscape(value) {

  const text =
    String(value ?? '');

  if (
    /[",\r\n]/.test(
      text
    )
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


function saveCsv(
  filename,
  rows
) {

  const headers = [
    'counsellingType',
    'year',
    'round',
    'institute',
    'academicProgram',
    'quota',
    'seatType',
    'gender',
    'openingRankRaw',
    'closingRankRaw',
    'sourceLabel',
    'sourceUrl',
  ];


  const lines = [
    headers.join(','),
  ];


  for (
    const row
    of rows
  ) {

    lines.push(
      headers
        .map(
          header =>
            csvEscape(
              row[header]
            )
        )
        .join(',')
    );
  }


  fs.writeFileSync(
    filename,
    lines.join('\r\n'),
    'utf8'
  );
}


async function fetchRound(
  round
) {

  console.log(
    '\n========================================'
  );

  console.log(
    `FETCHING JOSAA 2024 ROUND ${round}`
  );

  console.log(
    '========================================'
  );


  cookieJar =
    new Map();


  let html =
    await getPage();


  /*
  | YEAR
  */

  html =
    await postForm(
      html,
      {
        eventTarget:
          'ctl00$ContentPlaceHolder1$ddlYear',

        fields: {
          'ctl00$ContentPlaceHolder1$ddlYear':
            YEAR,
        },
      }
    );


  /*
  | ROUND
  */

  html =
    await postForm(
      html,
      {
        eventTarget:
          'ctl00$ContentPlaceHolder1$ddlroundno',

        fields: {
          'ctl00$ContentPlaceHolder1$ddlYear':
            YEAR,

          'ctl00$ContentPlaceHolder1$ddlroundno':
            round,
        },
      }
    );


  /*
  | INSTITUTE TYPE ALL
  */

  const instituteTypes =
    extractOptions(
      html,
      'ctl00$ContentPlaceHolder1$ddlInstype'
    );


  const instituteTypeAll =
    findAllValue(
      instituteTypes,
      'Institute Type'
    );


  html =
    await postForm(
      html,
      {
        eventTarget:
          'ctl00$ContentPlaceHolder1$ddlInstype',

        fields: {
          'ctl00$ContentPlaceHolder1$ddlYear':
            YEAR,

          'ctl00$ContentPlaceHolder1$ddlroundno':
            round,

          'ctl00$ContentPlaceHolder1$ddlInstype':
            instituteTypeAll,
        },
      }
    );


  /*
  | INSTITUTE ALL
  */

  const institutes =
    extractOptions(
      html,
      'ctl00$ContentPlaceHolder1$ddlInstitute'
    );


  const instituteAll =
    findAllValue(
      institutes,
      'Institute'
    );


  html =
    await postForm(
      html,
      {
        eventTarget:
          'ctl00$ContentPlaceHolder1$ddlInstitute',

        fields: {
          'ctl00$ContentPlaceHolder1$ddlYear':
            YEAR,

          'ctl00$ContentPlaceHolder1$ddlroundno':
            round,

          'ctl00$ContentPlaceHolder1$ddlInstype':
            instituteTypeAll,

          'ctl00$ContentPlaceHolder1$ddlInstitute':
            instituteAll,
        },
      }
    );


  /*
  | BRANCH ALL
  */

  const branches =
    extractOptions(
      html,
      'ctl00$ContentPlaceHolder1$ddlBranch'
    );


  const branchAll =
    findAllValue(
      branches,
      'Branch'
    );


  html =
    await postForm(
      html,
      {
        eventTarget:
          'ctl00$ContentPlaceHolder1$ddlBranch',

        fields: {
          'ctl00$ContentPlaceHolder1$ddlYear':
            YEAR,

          'ctl00$ContentPlaceHolder1$ddlroundno':
            round,

          'ctl00$ContentPlaceHolder1$ddlInstype':
            instituteTypeAll,

          'ctl00$ContentPlaceHolder1$ddlInstitute':
            instituteAll,

          'ctl00$ContentPlaceHolder1$ddlBranch':
            branchAll,
        },
      }
    );


  /*
  | SEAT TYPE ALL
  */

  const seatTypes =
    extractOptions(
      html,
      'ctl00$ContentPlaceHolder1$ddlSeatType'
    );


  const seatTypeAll =
    findAllValue(
      seatTypes,
      'Seat Type'
    );


  const submit =
    findSubmitControl(
      html
    );


  console.log(
    'Submit control:',
    submit
  );


  /*
  | FINAL SUBMIT
  */

  html =
    await postForm(
      html,
      {
        fields: {
          'ctl00$ContentPlaceHolder1$ddlYear':
            YEAR,

          'ctl00$ContentPlaceHolder1$ddlroundno':
            round,

          'ctl00$ContentPlaceHolder1$ddlInstype':
            instituteTypeAll,

          'ctl00$ContentPlaceHolder1$ddlInstitute':
            instituteAll,

          'ctl00$ContentPlaceHolder1$ddlBranch':
            branchAll,

          'ctl00$ContentPlaceHolder1$ddlSeatType':
            seatTypeAll,
        },

        submit,
      }
    );


  const htmlFile =
    `./josaa-2024-round-${round}-official.html`;


  fs.writeFileSync(
    htmlFile,
    html,
    'utf8'
  );


  const rows =
    extractGridRows(
      html,
      round
    );


  const jsonFile =
    `./josaa-2024-round-${round}-official.json`;


  fs.writeFileSync(
    jsonFile,
    JSON.stringify(
      {
        counsellingType:
          'JOSAA',

        year:
          2024,

        round:
          String(round),

        fetchedAt:
          new Date()
            .toISOString(),

        sourceUrl:
          URL,

        rowCount:
          rows.length,

        rows,
      },
      null,
      2
    ),
    'utf8'
  );


  console.log(
    `Round ${round} rows:`,
    rows.length
  );


  return rows;
}


const allRows = [];

const roundAudit = [];


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


  roundAudit.push({
    round,
    rows:
      rows.length,
  });


  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        750
      )
  );
}


function identityKey(row) {

  return [
    row.year,
    row.round,
    row.institute,
    row.academicProgram,
    row.quota,
    row.seatType,
    row.gender,
    row.openingRankRaw,
    row.closingRankRaw,
  ]
    .map(
      value =>
        String(value ?? '')
          .trim()
          .toLowerCase()
    )
    .join('|');
}


const seen =
  new Set();

const duplicates =
  [];


for (
  const row
  of allRows
) {

  const key =
    identityKey(
      row
    );

  if (
    seen.has(key)
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


fs.writeFileSync(
  './josaa-2024-all-rounds.json',
  JSON.stringify(
    {
      counsellingType:
        'JOSAA',

      year:
        2024,

      fetchedAt:
        new Date()
          .toISOString(),

      sourceUrl:
        URL,

      totalRows:
        allRows.length,

      rows:
        allRows,
    },
    null,
    2
  ),
  'utf8'
);


saveCsv(
  './josaa-2024-all-rounds.csv',
  allRows
);


const audit = {
  year:
    2024,

  totalRows:
    allRows.length,

  uniqueRows:
    seen.size,

  duplicateRows:
    duplicates.length,

  byRound:
    roundAudit,

  nonEmptyOpening:
    allRows.filter(
      row =>
        String(
          row.openingRankRaw ?? ''
        ).trim() !== ''
    ).length,

  nonEmptyClosing:
    allRows.filter(
      row =>
        String(
          row.closingRankRaw ?? ''
        ).trim() !== ''
    ).length,
};


fs.writeFileSync(
  './josaa-2024-all-rounds-audit.json',
  JSON.stringify(
    audit,
    null,
    2
  ),
  'utf8'
);


if (
  duplicates.length
) {

  fs.writeFileSync(
    './josaa-2024-duplicate-rows.json',
    JSON.stringify(
      duplicates,
      null,
      2
    ),
    'utf8'
  );
}


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2024 FETCH COMPLETE'
);

console.log(
  '========================================\n'
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
  seen.size
);

console.log(
  'DUPLICATES:',
  duplicates.length
);

console.log(
  'NON-EMPTY OPENING:',
  audit.nonEmptyOpening
);

console.log(
  'NON-EMPTY CLOSING:',
  audit.nonEmptyClosing
);


console.log(
  '\nSaved:'
);

console.log(
  './josaa-2024-all-rounds.json'
);

console.log(
  './josaa-2024-all-rounds.csv'
);

console.log(
  './josaa-2024-all-rounds-audit.json'
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);