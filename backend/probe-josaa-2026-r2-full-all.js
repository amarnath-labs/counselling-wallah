import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx';

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

let cookieHeader = '';


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
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
  );
}


function captureCookies(response) {

  let cookies = [];

  if (
    typeof response.headers.getSetCookie ===
    'function'
  ) {
    cookies =
      response.headers.getSetCookie();
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

  if (cookieHeader) {

    for (
      const piece
      of cookieHeader.split(';')
    ) {

      const parts =
        piece.trim().split('=');

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

  for (const raw of cookies) {

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
        parts.join('=').trim()
      );
    }
  }

  cookieHeader =
    [...map.entries()]
      .map(
        ([key, value]) =>
          `${key}=${value}`
      )
      .join('; ');
}


async function request(
  options = {}
) {

  const headers = {
    'User-Agent':
      'Mozilla/5.0 TruMarg-Data-Audit/1.0',

    Accept:
      'text/html,application/xhtml+xml',

    ...(options.headers || {}),
  };

  if (cookieHeader) {
    headers.Cookie =
      cookieHeader;
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

  captureCookies(
    response
  );

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  return response.text();
}


function extractHidden(html) {

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

    const name =
      tag.match(
        /name=["']([^"']+)["']/i
      );

    if (!name) {
      continue;
    }

    const value =
      tag.match(
        /value=["']([^"']*)["']/i
      );

    result[
      decodeHtml(
        name[1]
      )
    ] =
      value
        ? decodeHtml(
            value[1]
          )
        : '';
  }

  return result;
}


function extractSelect(
  html,
  id
) {

  const safe =
    id.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      '\\$&'
    );

  const match =
    html.match(
      new RegExp(
        `<select[^>]+id=["']${safe}["'][^>]*>([\\s\\S]*?)<\\/select>`,
        'i'
      )
    );

  if (!match) {
    return [];
  }

  const output = [];

  const optionRegex =
    /<option([^>]*)value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;

  let option;

  while (
    (
      option =
        optionRegex.exec(
          match[1]
        )
    ) !== null
  ) {

    output.push({
      value:
        decodeHtml(
          option[2]
        ),

      label:
        stripHtml(
          option[3]
        ),

      selected:
        /selected/i.test(
          option[1]
        ),
    });
  }

  return output;
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
    html.match(regex);

  if (!match) {
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
  html,
  target,
  selections
) {

  const hidden =
    extractHidden(
      html
    );

  const form =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(hidden)
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
    const [key, value]
    of Object.entries(selections)
  ) {
    form.set(
      key,
      value
    );
  }

  return request({
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
    const [key, value]
    of Object.entries(hidden)
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
    const [key, value]
    of Object.entries(selections)
  ) {
    form.set(
      key,
      value
    );
  }

  const buttonValue =
    extractInputValue(
      html,
      F.submit
    );

  if (buttonValue !== null) {

    form.set(
      F.submit,
      buttonValue || 'Submit'
    );
  }

  return request({
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


function parseTables(html) {

  const result = [];

  const tableRegex =
    /<table\b([^>]*)>([\s\S]*?)<\/table>/gi;

  let tableMatch;
  let tableIndex = 0;

  while (
    (
      tableMatch =
        tableRegex.exec(html)
    ) !== null
  ) {

    tableIndex += 1;

    const attrs =
      tableMatch[1];

    const body =
      tableMatch[2];

    const idMatch =
      attrs.match(
        /id=["']([^"']+)["']/i
      );

    const rows = [];

    const rowRegex =
      /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

    let rowMatch;

    while (
      (
        rowMatch =
          rowRegex.exec(body)
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

      if (cells.length) {
        rows.push(
          cells
        );
      }
    }

    result.push({
      index:
        tableIndex,

      id:
        idMatch
          ? idMatch[1]
          : null,

      rowCount:
        rows.length,

      rows,
    });
  }

  return result;
}


async function main() {

  console.log(
    '\n========================================'
  );

  console.log(
    'JOSAA 2026 ROUND-2 FULL ALL PROBE'
  );

  console.log(
    '========================================\n'
  );


  /*
  | STEP 1
  | initial page
  */

  let html =
    await request();


  /*
  | STEP 2
  | Round 2
  */

  html =
    await postBack(
      html,
      F.round,
      {
        [F.round]:
          '2',
      }
    );


  /*
  | STEP 3
  | Institute Type = ALL
  */

  html =
    await postBack(
      html,
      F.instituteType,
      {
        [F.round]:
          '2',

        [F.instituteType]:
          'ALL',
      }
    );


  /*
  | STEP 4
  | Institute = ALL
  */

  html =
    await postBack(
      html,
      F.institute,
      {
        [F.round]:
          '2',

        [F.instituteType]:
          'ALL',

        [F.institute]:
          'ALL',
      }
    );

  fs.writeFileSync(
    './josaa-2026-r2-after-institute-all.html',
    html,
    'utf8'
  );

  const branches =
    extractSelect(
      html,
      'ctl00_ContentPlaceHolder1_ddlBranch'
    );

  console.log(
    'BRANCH OPTIONS AFTER INSTITUTE=ALL'
  );

  console.table(
    branches.slice(
      0,
      30
    )
  );

  console.log(
    `Branch option count: ${branches.length}`
  );


  const branchAll =
    branches.find(
      item =>
        item.value ===
        'ALL'
    );

  if (!branchAll) {

    console.log(
      '\nBranch ALL is NOT available.'
    );

    console.log(
      'Stopping safely before submit.'
    );

    return;
  }


  /*
  | STEP 5
  | Branch = ALL
  */

  html =
    await postBack(
      html,
      F.branch,
      {
        [F.round]:
          '2',

        [F.instituteType]:
          'ALL',

        [F.institute]:
          'ALL',

        [F.branch]:
          'ALL',
      }
    );

  fs.writeFileSync(
    './josaa-2026-r2-after-branch-all.html',
    html,
    'utf8'
  );

  const seatTypes =
    extractSelect(
      html,
      'ctl00_ContentPlaceHolder1_ddlSeattype'
    );

  console.log(
    '\nSEAT TYPE OPTIONS AFTER BRANCH=ALL'
  );

  console.table(
    seatTypes
  );

  console.log(
    `Seat type option count: ${seatTypes.length}`
  );


  const seatAll =
    seatTypes.find(
      item =>
        item.value ===
        'ALL'
    );

  if (!seatAll) {

    console.log(
      '\nSeat Type ALL is NOT available.'
    );

    console.log(
      'Stopping safely before submit.'
    );

    return;
  }


  /*
  | STEP 6
  | FINAL SUBMIT
  */

  html =
    await submitForm(
      html,
      {
        [F.round]:
          '2',

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


  fs.writeFileSync(
    './josaa-2026-r2-full-result.html',
    html,
    'utf8'
  );


  /*
  | STEP 7
  | PARSE RESULT TABLES
  */

  const tables =
    parseTables(
      html
    );

  console.log(
    '\nTABLE SUMMARY'
  );

  console.table(
    tables.map(
      table => ({
        index:
          table.index,

        id:
          table.id,

        rows:
          table.rowCount,

        firstRow:
          table.rows[0]
            ? table.rows[0]
                .join(' | ')
                .slice(
                  0,
                  180
                )
            : '',
      })
    )
  );


  const cutoffTable =
    tables.find(
      table => {

        const text =
          table.rows
            .slice(
              0,
              3
            )
            .flat()
            .join(' ')
            .toLowerCase();

        return (
          text.includes(
            'opening rank'
          ) &&
          text.includes(
            'closing rank'
          )
        );
      }
    );


  if (!cutoffTable) {

    console.log(
      '\nNo Opening/Closing Rank table detected.'
    );

    console.log(
      'Saved HTML for inspection.'
    );

    return;
  }


  console.log(
    '\nOR-CR TABLE DETECTED'
  );

  console.log(
    `Rows: ${cutoffTable.rowCount}`
  );

  console.log(
    '\nFIRST 10 ROWS'
  );

  console.table(
    cutoffTable.rows
      .slice(
        0,
        10
      )
  );


  fs.writeFileSync(
    './josaa-2026-r2-table.json',
    JSON.stringify(
      {
        year:
          2026,

        round:
          '2',

        counsellingType:
          'JOSAA',

        rowCount:
          cutoffTable.rowCount,

        rows:
          cutoffTable.rows,
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
    'SUCCESS'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Saved:'
  );

  console.log(
    './josaa-2026-r2-full-result.html'
  );

  console.log(
    './josaa-2026-r2-table.json'
  );

  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );
}


main().catch(
  error => {

    console.error(
      '\nPROBE FAILED:\n',
      error
    );

    process.exit(1);
  }
);
