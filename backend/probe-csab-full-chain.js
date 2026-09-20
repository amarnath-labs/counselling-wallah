import fs from 'node:fs/promises';

const URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/openingclosingrankarchieve.aspx';

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


/*
|--------------------------------------------------------------------------
| BASIC HTML HELPERS
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| HIDDEN ASP.NET STATE
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| SELECT PARSER
|--------------------------------------------------------------------------
*/

function extractSelects(html) {

  const result = [];

  const selectRegex =
    /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;

  let match;

  while (
    (
      match =
        selectRegex.exec(html)
    ) !== null
  ) {

    const openTag =
      `<select${match[1]}>`;

    const body =
      match[2];

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
          openTag,
          'name'
        ),

      id:
        getAttr(
          openTag,
          'id'
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
  return extractSelects(
    html
  ).find(
    item =>
      item.name === name
  ) || null;
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

  return select.options
    .filter(
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
      item => item.selected
    )?.value ||
    select.options[0]?.value ||
    ''
  );
}


/*
|--------------------------------------------------------------------------
| COOKIES
|--------------------------------------------------------------------------
*/

function getCookies(response) {

  let cookies = [];

  if (
    typeof response.headers
      .getSetCookie === 'function'
  ) {

    cookies =
      response.headers
        .getSetCookie();

  } else {

    const raw =
      response.headers.get(
        'set-cookie'
      );

    if (raw) {
      cookies = [raw];
    }
  }

  return cookies
    .map(
      value =>
        value
          .split(';')[0]
          .trim()
    )
    .filter(Boolean)
    .join('; ');
}


/*
|--------------------------------------------------------------------------
| GET PAGE
|--------------------------------------------------------------------------
*/

async function getInitialPage() {

  const response =
    await fetch(
      URL,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 Chrome/142 Safari/537.36',

          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

          'Accept-Language':
            'en-US,en;q=0.9',
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `GET failed ${response.status}`
    );
  }

  return {
    html:
      await response.text(),

    cookie:
      getCookies(
        response
      ),
  };
}


/*
|--------------------------------------------------------------------------
| BUILD ASP.NET FORM
|--------------------------------------------------------------------------
*/

function buildForm(
  html,
  overrides = {}
) {

  const body =
    new URLSearchParams();

  const hidden =
    extractHidden(
      html
    );

  for (
    const [key, value]
    of Object.entries(hidden)
  ) {
    body.set(
      key,
      value
    );
  }


  /*
  | Preserve currently selected controls.
  */

  for (
    const select
    of extractSelects(
      html
    )
  ) {

    if (!select.name) {
      continue;
    }

    body.set(
      select.name,
      selectedValue(
        html,
        select.name
      )
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


/*
|--------------------------------------------------------------------------
| ASP.NET AUTOPOSTBACK
|--------------------------------------------------------------------------
*/

async function postback({
  html,
  cookie,
  field,
  value,
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
    await fetch(
      URL,
      {
        method: 'POST',

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 Chrome/142 Safari/537.36',

          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

          'Accept-Language':
            'en-US,en;q=0.9',

          'Content-Type':
            'application/x-www-form-urlencoded',

          Origin:
            'https://admissions.nic.in',

          Referer:
            URL,

          ...(cookie
            ? {
                Cookie:
                  cookie,
              }
            : {}),
        },

        body:
          body.toString(),
      }
    );

  const resultHtml =
    await response.text();

  if (!response.ok) {

    throw new Error(
      `POSTBACK ${field} failed ${response.status}`
    );
  }

  return {
    html:
      resultHtml,

    cookie:
      cookie ||
      getCookies(
        response
      ),
  };
}


/*
|--------------------------------------------------------------------------
| FINAL SUBMIT
|--------------------------------------------------------------------------
*/

async function submitForm({
  html,
  cookie,
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
    await fetch(
      URL,
      {
        method:
          'POST',

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 Chrome/142 Safari/537.36',

          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

          'Accept-Language':
            'en-US,en;q=0.9',

          'Content-Type':
            'application/x-www-form-urlencoded',

          Origin:
            'https://admissions.nic.in',

          Referer:
            URL,

          ...(cookie
            ? {
                Cookie:
                  cookie,
              }
            : {}),
        },

        body:
          body.toString(),
      }
    );

  const resultHtml =
    await response.text();

  if (!response.ok) {

    throw new Error(
      `SUBMIT failed ${response.status}`
    );
  }

  return resultHtml;
}


/*
|--------------------------------------------------------------------------
| TABLE PARSER
|--------------------------------------------------------------------------
*/

function extractTables(html) {

  const tables = [];

  const tableRegex =
    /<table\b[^>]*>([\s\S]*?)<\/table>/gi;

  let tableMatch;

  while (
    (
      tableMatch =
        tableRegex.exec(html)
    ) !== null
  ) {

    const tableBody =
      tableMatch[1];

    const rows = [];

    const rowRegex =
      /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

    let rowMatch;

    while (
      (
        rowMatch =
          rowRegex.exec(tableBody)
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

    if (rows.length) {
      tables.push(
        rows
      );
    }
  }

  return tables;
}


/*
|--------------------------------------------------------------------------
| PRINT OPTIONS
|--------------------------------------------------------------------------
*/

function printOptions(
  label,
  options
) {

  console.log(
    `\n===== ${label} =====`
  );

  console.log(
    'Count:',
    options.length
  );

  console.table(
    options
  );
}


/*
|--------------------------------------------------------------------------
| MAIN SAMPLE CHAIN
|--------------------------------------------------------------------------
*/

async function main() {

  await fs.mkdir(
    './tmp/csab/chain-test',
    {
      recursive: true,
    }
  );


  /*
  |--------------------------------------------------------------------------
  | STEP 0 - GET
  |--------------------------------------------------------------------------
  */

  const initial =
    await getInitialPage();

  console.log(
    '\nInitial page:',
    initial.html.length
  );


  /*
  |--------------------------------------------------------------------------
  | STEP 1 - YEAR 2025
  |--------------------------------------------------------------------------
  */

  const yearState =
    await postback({
      html:
        initial.html,

      cookie:
        initial.cookie,

      field:
        FIELDS.year,

      value:
        '2025',
    });

  const rounds =
    validOptions(
      yearState.html,
      FIELDS.round
    );

  printOptions(
    '2025 AVAILABLE ROUNDS',
    rounds
  );

  if (!rounds.length) {
    throw new Error(
      'No rounds found after year postback'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 2 - FIRST ROUND
  |--------------------------------------------------------------------------
  */

  const selectedRound =
    rounds[0];

  console.log(
    '\nUsing sample round:',
    selectedRound
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
        selectedRound.value,
    });


  const instituteTypes =
    validOptions(
      roundState.html,
      FIELDS.instituteType
    );

  printOptions(
    `INSTITUTE TYPES - ROUND ${selectedRound.text}`,
    instituteTypes
  );


  if (!instituteTypes.length) {
    throw new Error(
      'No institute types found'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 3 - FIRST INSTITUTE TYPE
  |--------------------------------------------------------------------------
  */

  const selectedType =
    instituteTypes[0];

  console.log(
    '\nUsing institute type:',
    selectedType
  );


  const typeState =
    await postback({
      html:
        roundState.html,

      cookie:
        roundState.cookie,

      field:
        FIELDS.instituteType,

      value:
        selectedType.value,
    });


  const institutes =
    validOptions(
      typeState.html,
      FIELDS.institute
    );

  printOptions(
    'INSTITUTES',
    institutes.slice(
      0,
      25
    )
  );

  console.log(
    'Total institutes:',
    institutes.length
  );


  if (!institutes.length) {
    throw new Error(
      'No institutes found'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 4 - FIRST INSTITUTE
  |--------------------------------------------------------------------------
  */

  const selectedInstitute =
    institutes[0];

  console.log(
    '\nUsing institute:',
    selectedInstitute
  );


  const instituteState =
    await postback({
      html:
        typeState.html,

      cookie:
        typeState.cookie,

      field:
        FIELDS.institute,

      value:
        selectedInstitute.value,
    });


  const branches =
    validOptions(
      instituteState.html,
      FIELDS.branch
    );

  printOptions(
    'ACADEMIC PROGRAMS',
    branches.slice(
      0,
      25
    )
  );

  console.log(
    'Total programs:',
    branches.length
  );


  if (!branches.length) {
    throw new Error(
      'No academic programs found'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 5 - FIRST BRANCH
  |--------------------------------------------------------------------------
  */

  const selectedBranch =
    branches[0];

  console.log(
    '\nUsing program:',
    selectedBranch
  );


  const branchState =
    await postback({
      html:
        instituteState.html,

      cookie:
        instituteState.cookie,

      field:
        FIELDS.branch,

      value:
        selectedBranch.value,
    });


  /*
  |--------------------------------------------------------------------------
  | STEP 6 - SUBMIT
  |--------------------------------------------------------------------------
  */

  const resultHtml =
    await submitForm({
      html:
        branchState.html,

      cookie:
        branchState.cookie,
    });


  await fs.writeFile(
    './tmp/csab/chain-test/sample-result.html',
    resultHtml,
    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'SAMPLE SELECTION'
  );

  console.log(
    '========================================'
  );

  console.log({
    year:
      2025,

    round:
      selectedRound,

    instituteType:
      selectedType,

    institute:
      selectedInstitute,

    program:
      selectedBranch,
  });


  /*
  |--------------------------------------------------------------------------
  | RESULT TABLES
  |--------------------------------------------------------------------------
  */

  const tables =
    extractTables(
      resultHtml
    );


  console.log(
    '\nRESULT TABLE COUNT:',
    tables.length
  );


  for (
    let i = 0;
    i < tables.length;
    i++
  ) {

    console.log(
      `\n===== TABLE ${i + 1} =====`
    );

    console.table(
      tables[i].slice(
        0,
        25
      )
    );
  }


  /*
  |--------------------------------------------------------------------------
  | KEYWORD CHECK
  |--------------------------------------------------------------------------
  */

  const text =
    stripHtml(
      resultHtml
    );


  console.log(
    '\nHas Opening Rank:',
    /opening\s*rank/i.test(
      text
    )
  );

  console.log(
    'Has Closing Rank:',
    /closing\s*rank/i.test(
      text
    )
  );


  console.log(
    '\nSaved result:'
  );

  console.log(
    './tmp/csab/chain-test/sample-result.html'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'CHAIN TEST COMPLETE'
  );

  console.log(
    '========================================'
  );
}


main().catch(
  error => {

    console.error(
      '\nCSAB CHAIN FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
