import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx';

const YEAR =
  '2025';

const ROUND =
  '1';

let cookies = '';


function decode(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}


function extractHidden(html) {

  const result = {};

  const regex =
    /<input[^>]+type=["']hidden["'][^>]*>/gi;

  const inputs =
    html.match(regex) || [];

  for (
    const input
    of inputs
  ) {

    const name =
      input.match(
        /name=["']([^"']+)["']/i
      )?.[1];

    const value =
      input.match(
        /value=["']([^"']*)["']/i
      )?.[1] ?? '';

    if (name) {
      result[name] =
        decode(value);
    }
  }

  return result;
}


function extractOptions(
  html,
  selectName
) {

  const escaped =
    selectName.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );

  const selectMatch =
    html.match(
      new RegExp(
        `<select[^>]+name=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/select>`,
        'i'
      )
    );

  if (!selectMatch) {
    return [];
  }

  const options = [];

  const optionRegex =
    /<option[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;

  let match;

  while (
    (
      match =
        optionRegex.exec(
          selectMatch[1]
        )
    )
  ) {

    options.push({
      value:
        decode(match[1]),

      text:
        decode(
          match[2]
            .replace(
              /<[^>]+>/g,
              ''
            )
            .trim()
        ),
    });
  }

  return options;
}


function updateCookies(
  response
) {

  const setCookie =
    response.headers.getSetCookie?.() ||
    [];

  if (
    setCookie.length
  ) {

    cookies =
      setCookie
        .map(
          item =>
            item.split(';')[0]
        )
        .join('; ');
  }
}


async function getPage() {

  const response =
    await fetch(URL);

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


async function postback(
  html,
  eventTarget,
  extra = {}
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
      extra
    )
  ) {
    body.set(
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

        headers: {
          'Content-Type':
            'application/x-www-form-urlencoded',

          'Cookie':
            cookies,

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
  'JOSAA 2025 ROUND-1 ARCHIVE PROBE'
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
| YEAR
|--------------------------------------------------------------------------
*/

html =
  await postback(
    html,
    'ctl00$ContentPlaceHolder1$ddlYear',
    {
      'ctl00$ContentPlaceHolder1$ddlYear':
        YEAR,
    }
  );


const rounds =
  extractOptions(
    html,
    'ctl00$ContentPlaceHolder1$ddlroundno'
  );


console.log(
  '\nRounds after selecting 2025:'
);

console.table(
  rounds
);


/*
|--------------------------------------------------------------------------
| ROUND
|--------------------------------------------------------------------------
*/

html =
  await postback(
    html,
    'ctl00$ContentPlaceHolder1$ddlroundno',
    {
      'ctl00$ContentPlaceHolder1$ddlYear':
        YEAR,

      'ctl00$ContentPlaceHolder1$ddlroundno':
        ROUND,
    }
  );


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


/*
|--------------------------------------------------------------------------
| INSTITUTE TYPE = ALL
|--------------------------------------------------------------------------
*/

const allInstituteType =
  instituteTypes.find(
    option =>
      option.text
        .trim()
        .toUpperCase() ===
      'ALL'
  ) ??
  instituteTypes[0];


if (!allInstituteType) {
  throw new Error(
    'No institute type options found.'
  );
}


html =
  await postback(
    html,
    'ctl00$ContentPlaceHolder1$ddlInstype',
    {
      'ctl00$ContentPlaceHolder1$ddlYear':
        YEAR,

      'ctl00$ContentPlaceHolder1$ddlroundno':
        ROUND,

      'ctl00$ContentPlaceHolder1$ddlInstype':
        allInstituteType.value,
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


/*
|--------------------------------------------------------------------------
| INSTITUTE = ALL
|--------------------------------------------------------------------------
*/

const allInstitute =
  institutes.find(
    option =>
      option.text
        .trim()
        .toUpperCase() ===
      'ALL'
  ) ??
  institutes[0];


if (!allInstitute) {
  throw new Error(
    'No institute options found.'
  );
}


html =
  await postback(
    html,
    'ctl00$ContentPlaceHolder1$ddlInstitute',
    {
      'ctl00$ContentPlaceHolder1$ddlYear':
        YEAR,

      'ctl00$ContentPlaceHolder1$ddlroundno':
        ROUND,

      'ctl00$ContentPlaceHolder1$ddlInstype':
        allInstituteType.value,

      'ctl00$ContentPlaceHolder1$ddlInstitute':
        allInstitute.value,
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


/*
|--------------------------------------------------------------------------
| BRANCH = ALL
|--------------------------------------------------------------------------
*/

const allBranch =
  branches.find(
    option =>
      option.text
        .trim()
        .toUpperCase() ===
      'ALL'
  ) ??
  branches[0];


if (!allBranch) {
  throw new Error(
    'No branch options found.'
  );
}


html =
  await postback(
    html,
    'ctl00$ContentPlaceHolder1$ddlBranch',
    {
      'ctl00$ContentPlaceHolder1$ddlYear':
        YEAR,

      'ctl00$ContentPlaceHolder1$ddlroundno':
        ROUND,

      'ctl00$ContentPlaceHolder1$ddlInstype':
        allInstituteType.value,

      'ctl00$ContentPlaceHolder1$ddlInstitute':
        allInstitute.value,

      'ctl00$ContentPlaceHolder1$ddlBranch':
        allBranch.value,
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


/*
|--------------------------------------------------------------------------
| SAVE FINAL PROBE HTML
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  './josaa-2025-round1-probe.html',
  html,
  'utf8'
);


console.log(
  '\nSaved:'
);

console.log(
  './josaa-2025-round1-probe.html'
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);