import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx';

const FIELD = {
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

    const single =
      response.headers.get(
        'set-cookie'
      );

    if (single) {
      cookies = [single];
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

      const [
        key,
        ...rest
      ] =
        piece.trim().split('=');

      if (key) {
        map.set(
          key,
          rest.join('=')
        );
      }
    }
  }

  for (const raw of cookies) {

    const first =
      String(raw)
        .split(';')[0];

    const [
      key,
      ...rest
    ] =
      first.split('=');

    if (key) {
      map.set(
        key.trim(),
        rest.join('=').trim()
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

  const hidden = {};

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

    if (!nameMatch) {
      continue;
    }

    const valueMatch =
      tag.match(
        /value=["']([^"']*)["']/i
      );

    hidden[
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

  return hidden;
}


function extractSelect(
  html,
  id
) {

  const escaped =
    id.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      '\\$&'
    );

  const regex =
    new RegExp(
      `<select[^>]+id=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/select>`,
      'i'
    );

  const match =
    html.match(regex);

  if (!match) {
    return [];
  }

  const rows = [];

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

    rows.push({
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

  return rows;
}


async function postBack(
  html,
  eventTarget,
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
    eventTarget
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


function inspectTables(
  html
) {

  const tables = [];

  const tableRegex =
    /<table\b([^>]*)>([\s\S]*?)<\/table>/gi;

  let match;
  let index = 0;

  while (
    (
      match =
        tableRegex.exec(html)
    ) !== null
  ) {

    index += 1;

    const attributes =
      match[1];

    const body =
      match[2];

    const idMatch =
      attributes.match(
        /id=["']([^"']+)["']/i
      );

    const rows =
      (
        body.match(
          /<tr\b/gi
        ) || []
      ).length;

    const text =
      stripHtml(body);

    tables.push({
      index,

      id:
        idMatch
          ? idMatch[1]
          : null,

      rows,

      preview:
        text.slice(
          0,
          180
        ),
    });
  }

  return tables;
}


async function main() {

  console.log(
    '\n========================================'
  );

  console.log(
    'TRUMARG JOSAA 2026 ROUND-2 ALL PROBE'
  );

  console.log(
    '========================================\n'
  );


  /*
  |--------------------------------------------------------------------------
  | INITIAL PAGE
  |--------------------------------------------------------------------------
  */

  let html =
    await request();

  console.log(
    'Initial page loaded.'
  );


  /*
  |--------------------------------------------------------------------------
  | ROUND 2
  |--------------------------------------------------------------------------
  */

  html =
    await postBack(
      html,
      FIELD.round,
      {
        [FIELD.round]:
          '2',
      }
    );

  console.log(
    '\nROUND 2 selected.'
  );

  console.log(
    '\nInstitute Types:'
  );

  console.table(
    extractSelect(
      html,
      'ctl00_ContentPlaceHolder1_ddlInstype'
    )
  );


  /*
  |--------------------------------------------------------------------------
  | INSTITUTE TYPE = ALL
  |--------------------------------------------------------------------------
  */

  html =
    await postBack(
      html,
      FIELD.instituteType,
      {
        [FIELD.round]:
          '2',

        [FIELD.instituteType]:
          'ALL',
      }
    );

  fs.writeFileSync(
    './josaa-2026-r2-after-type-all.html',
    html,
    'utf8'
  );


  /*
  |--------------------------------------------------------------------------
  | DEPENDENT OPTIONS
  |--------------------------------------------------------------------------
  */

  const institutes =
    extractSelect(
      html,
      'ctl00_ContentPlaceHolder1_ddlInstitute'
    );

  const branches =
    extractSelect(
      html,
      'ctl00_ContentPlaceHolder1_ddlBranch'
    );

  const seatTypes =
    extractSelect(
      html,
      'ctl00_ContentPlaceHolder1_ddlSeattype'
    );


  console.log(
    '\nINSTITUTES AFTER TYPE=ALL'
  );

  console.table(
    institutes.slice(
      0,
      20
    )
  );

  console.log(
    `Institute option count: ${institutes.length}`
  );


  console.log(
    '\nBRANCH OPTIONS'
  );

  console.table(
    branches.slice(
      0,
      20
    )
  );

  console.log(
    `Branch option count: ${branches.length}`
  );


  console.log(
    '\nSEAT TYPE OPTIONS'
  );

  console.table(
    seatTypes
  );


  /*
  |--------------------------------------------------------------------------
  | TABLE DISCOVERY
  |--------------------------------------------------------------------------
  */

  const tables =
    inspectTables(
      html
    );

  console.log(
    '\nTABLES PRESENT BEFORE SUBMIT'
  );

  console.table(
    tables
  );


  /*
  |--------------------------------------------------------------------------
  | SAVE DISCOVERY JSON
  |--------------------------------------------------------------------------
  */

  const output = {
    counsellingType:
      'JOSAA',

    year:
      2026,

    round:
      '2',

    instituteType:
      'ALL',

    instituteOptionCount:
      institutes.length,

    institutes,

    branchOptionCount:
      branches.length,

    branches,

    seatTypes,

    tables,

    discoveredAt:
      new Date()
        .toISOString(),
  };


  fs.writeFileSync(
    './josaa-2026-r2-all-probe.json',
    JSON.stringify(
      output,
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'PROBE COMPLETE'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Saved:'
  );

  console.log(
    './josaa-2026-r2-after-type-all.html'
  );

  console.log(
    './josaa-2026-r2-all-probe.json'
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
