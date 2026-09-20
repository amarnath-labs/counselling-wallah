import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx';

const FIELD = {
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

  seatType:
    'ctl00$ContentPlaceHolder1$ddlSeatType',

  submit:
    'ctl00$ContentPlaceHolder1$btnSubmit',
};

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

function extractHidden(html) {
  const names = [
    '__EVENTTARGET',
    '__EVENTARGUMENT',
    '__LASTFOCUS',
    '__VIEWSTATE',
    '__VIEWSTATEGENERATOR',
    '__EVENTVALIDATION',
    'ctl00$hdnSecKey',
  ];

  const result = {};

  for (const name of names) {
    const escaped =
      name.replace(
        /[$]/g,
        '\\$'
      );

    const regex =
      new RegExp(
        `<input[^>]+name=["']${escaped}["'][^>]*value=["']([^"']*)["']`,
        'i'
      );

    const match =
      html.match(regex);

    result[name] =
      match
        ? decodeHtml(match[1])
        : '';
  }

  return result;
}

function extractSelect(
  html,
  id
) {
  const regex =
    new RegExp(
      `<select[^>]+id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/select>`,
      'i'
    );

  const match =
    html.match(regex);

  if (!match) {
    return [];
  }

  const options = [];

  const optionRegex =
    /<option([^>]*)value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;

  let option;

  while (
    (option =
      optionRegex.exec(
        match[1]
      )) !== null
  ) {
    options.push({
      value:
        decodeHtml(
          option[2]
        ),

      label:
        decodeHtml(
          option[3]
            .replace(
              /<[^>]+>/g,
              ''
            )
        ),

      selected:
        /selected/i.test(
          option[1]
        ),
    });
  }

  return options;
}

function buildForm(
  hidden,
  overrides = {}
) {
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

  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      overrides
    )
  ) {
    form.set(
      key,
      value ?? ''
    );
  }

  return form;
}

async function postForm(
  html,
  overrides
) {
  const hidden =
    extractHidden(
      html
    );

  const form =
    buildForm(
      hidden,
      overrides
    );

  const response =
    await fetch(
      URL,
      {
        method:
          'POST',

        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-Data-Audit/1.0',

          'Content-Type':
            'application/x-www-form-urlencoded',

          Accept:
            'text/html,application/xhtml+xml',
        },

        body:
          form.toString(),

        redirect:
          'follow',
      }
    );

  if (!response.ok) {
    throw new Error(
      `POST failed: ${response.status}`
    );
  }

  return response.text();
}

async function main() {

  console.log(
    '\n========================================'
  );

  console.log(
    'TRUMARG JOSAA 2025 FORM EXPLORER'
  );

  console.log(
    '========================================\n'
  );


  /*
  |--------------------------------------------------------------------------
  | INITIAL GET
  |--------------------------------------------------------------------------
  */

  const initialResponse =
    await fetch(
      URL,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-Data-Audit/1.0',

          Accept:
            'text/html,application/xhtml+xml',
        },
      }
    );

  if (!initialResponse.ok) {
    throw new Error(
      `Initial GET failed: ${initialResponse.status}`
    );
  }

  let html =
    await initialResponse.text();


  /*
  |--------------------------------------------------------------------------
  | SELECT YEAR 2025
  |--------------------------------------------------------------------------
  */

  html =
    await postForm(
      html,
      {
        __EVENTTARGET:
          FIELD.year,

        [FIELD.year]:
          '2025',
      }
    );

  fs.writeFileSync(
    './josaa-2025-after-year.html',
    html,
    'utf8'
  );


  /*
  |--------------------------------------------------------------------------
  | EXTRACT ROUND OPTIONS
  |--------------------------------------------------------------------------
  */

  const rounds =
    extractSelect(
      html,
      'ctl00_ContentPlaceHolder1_ddlroundno'
    )
      .filter(
        (row) =>
          row.value &&
          row.value !== '0'
      );

  console.log(
    'ROUND OPTIONS'
  );

  console.table(
    rounds
  );


  /*
  |--------------------------------------------------------------------------
  | EXTRACT INSTITUTE TYPES
  |--------------------------------------------------------------------------
  */

  const instituteTypes =
    extractSelect(
      html,
      'ctl00_ContentPlaceHolder1_ddlInstype'
    )
      .filter(
        (row) =>
          row.value &&
          row.value !== '0'
      );

  console.log(
    '\nINSTITUTE TYPE OPTIONS'
  );

  console.table(
    instituteTypes
  );


  /*
  |--------------------------------------------------------------------------
  | SAVE MACHINE-READABLE DISCOVERY
  |--------------------------------------------------------------------------
  */

  const output = {
    source: URL,

    counsellingType:
      'JOSAA',

    year:
      2025,

    discoveredAt:
      new Date()
        .toISOString(),

    rounds,

    instituteTypes,
  };

  fs.writeFileSync(
    './josaa-2025-discovery.json',
    JSON.stringify(
      output,
      null,
      2
    ),
    'utf8'
  );

  console.log(
    '\nSaved:'
  );

  console.log(
    './josaa-2025-after-year.html'
  );

  console.log(
    './josaa-2025-discovery.json'
  );

  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );
}

main().catch(
  (error) => {

    console.error(
      '\nDISCOVERY FAILED:\n',
      error
    );

    process.exit(1);
  }
);
