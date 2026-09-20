import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx';

const YEAR =
  '2024';

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

    const name =
      first.slice(
        0,
        separator
      );

    const value =
      first.slice(
        separator + 1
      );

    cookieJar.set(
      name,
      value
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


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2024 ARCHIVE PROBE'
);

console.log(
  '========================================\n'
);


let html =
  await getPage();


console.log(
  'Initial GET bytes:',
  html.length
);


/*
|--------------------------------------------------------------------------
| YEAR OPTIONS
|--------------------------------------------------------------------------
*/

const yearOptions =
  extractOptions(
    html,
    'ctl00$ContentPlaceHolder1$ddlYear'
  );


console.log(
  '\nAvailable years:'
);

console.table(
  yearOptions
);


const year2024 =
  yearOptions.find(
    option =>
      option.value === YEAR ||
      option.text.trim() === YEAR
  );


if (!year2024) {

  fs.writeFileSync(
    './josaa-2024-probe-initial.html',
    html,
    'utf8'
  );

  console.log(
    '\n2024 NOT AVAILABLE in current year dropdown.'
  );

  console.log(
    'Saved initial HTML:'
  );

  console.log(
    './josaa-2024-probe-initial.html'
  );

  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
  );

  process.exit(2);
}


/*
|--------------------------------------------------------------------------
| SELECT 2024
|--------------------------------------------------------------------------
*/

html =
  await postForm(
    html,
    {
      eventTarget:
        'ctl00$ContentPlaceHolder1$ddlYear',

      fields: {
        'ctl00$ContentPlaceHolder1$ddlYear':
          year2024.value,
      },
    }
  );


const rounds =
  extractOptions(
    html,
    'ctl00$ContentPlaceHolder1$ddlroundno'
  );


console.log(
  '\nRounds after selecting 2024:'
);

console.table(
  rounds
);


const validRounds =
  rounds.filter(
    option =>
      /^[1-9]\d*$/.test(
        option.value
      )
  );


if (
  validRounds.length === 0
) {
  throw new Error(
    '2024 selected but no numeric rounds were exposed.'
  );
}


/*
|--------------------------------------------------------------------------
| SELECT ROUND 1
|--------------------------------------------------------------------------
*/

const roundOne =
  validRounds.find(
    option =>
      option.value === '1'
  ) ??
  validRounds[0];


html =
  await postForm(
    html,
    {
      eventTarget:
        'ctl00$ContentPlaceHolder1$ddlroundno',

      fields: {
        'ctl00$ContentPlaceHolder1$ddlYear':
          year2024.value,

        'ctl00$ContentPlaceHolder1$ddlroundno':
          roundOne.value,
      },
    }
  );


/*
|--------------------------------------------------------------------------
| INSTITUTE TYPES
|--------------------------------------------------------------------------
*/

const instituteTypes =
  extractOptions(
    html,
    'ctl00$ContentPlaceHolder1$ddlInstype'
  );


console.log(
  '\nInstitute types:'
);

console.table(
  instituteTypes
);


const instituteTypeAll =
  findAllValue(
    instituteTypes,
    'Institute Type'
  );


/*
|--------------------------------------------------------------------------
| SELECT INSTITUTE TYPE ALL
|--------------------------------------------------------------------------
*/

html =
  await postForm(
    html,
    {
      eventTarget:
        'ctl00$ContentPlaceHolder1$ddlInstype',

      fields: {
        'ctl00$ContentPlaceHolder1$ddlYear':
          year2024.value,

        'ctl00$ContentPlaceHolder1$ddlroundno':
          roundOne.value,

        'ctl00$ContentPlaceHolder1$ddlInstype':
          instituteTypeAll,
      },
    }
  );


const institutes =
  extractOptions(
    html,
    'ctl00$ContentPlaceHolder1$ddlInstitute'
  );


console.log(
  '\nInstitutes:',
  institutes.length
);

console.table(
  institutes.slice(
    0,
    10
  )
);


const instituteAll =
  findAllValue(
    institutes,
    'Institute'
  );


/*
|--------------------------------------------------------------------------
| SELECT INSTITUTE ALL
|--------------------------------------------------------------------------
*/

html =
  await postForm(
    html,
    {
      eventTarget:
        'ctl00$ContentPlaceHolder1$ddlInstitute',

      fields: {
        'ctl00$ContentPlaceHolder1$ddlYear':
          year2024.value,

        'ctl00$ContentPlaceHolder1$ddlroundno':
          roundOne.value,

        'ctl00$ContentPlaceHolder1$ddlInstype':
          instituteTypeAll,

        'ctl00$ContentPlaceHolder1$ddlInstitute':
          instituteAll,
      },
    }
  );


const branches =
  extractOptions(
    html,
    'ctl00$ContentPlaceHolder1$ddlBranch'
  );


console.log(
  '\nBranches:',
  branches.length
);

console.table(
  branches.slice(
    0,
    10
  )
);


const branchAll =
  findAllValue(
    branches,
    'Branch'
  );


/*
|--------------------------------------------------------------------------
| SELECT BRANCH ALL
|--------------------------------------------------------------------------
*/

html =
  await postForm(
    html,
    {
      eventTarget:
        'ctl00$ContentPlaceHolder1$ddlBranch',

      fields: {
        'ctl00$ContentPlaceHolder1$ddlYear':
          year2024.value,

        'ctl00$ContentPlaceHolder1$ddlroundno':
          roundOne.value,

        'ctl00$ContentPlaceHolder1$ddlInstype':
          instituteTypeAll,

        'ctl00$ContentPlaceHolder1$ddlInstitute':
          instituteAll,

        'ctl00$ContentPlaceHolder1$ddlBranch':
          branchAll,
      },
    }
  );


const seatTypes =
  extractOptions(
    html,
    'ctl00$ContentPlaceHolder1$ddlSeatType'
  );


console.log(
  '\nSeat types:',
  seatTypes.length
);

console.table(
  seatTypes
);


findAllValue(
  seatTypes,
  'Seat Type'
);


/*
|--------------------------------------------------------------------------
| SAVE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  './josaa-2024-round1-probe.html',
  html,
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2024 ARCHIVE PROBE PASSED'
);

console.log(
  '========================================'
);

console.log(
  'Year:',
  YEAR
);

console.log(
  'Rounds exposed:',
  validRounds.map(
    row =>
      row.value
  ).join(', ')
);

console.log(
  'Institute types:',
  instituteTypes.length
);

console.log(
  'Institutes:',
  institutes.length
);

console.log(
  'Branches:',
  branches.length
);

console.log(
  'Seat types:',
  seatTypes.length
);

console.log(
  '\nSaved:'
);

console.log(
  './josaa-2024-round1-probe.html'
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);