import fs from 'node:fs/promises';

const URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/currentorcr.aspx';

const FIELDS = {
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
| HTML HELPERS
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
| ASP.NET HIDDEN STATE
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
          /\bselected\b/i.test(
            optionTag
          ),
      });
    }

    result.push({
      name:
        getAttr(
          selectTag,
          'name'
        ),

      id:
        getAttr(
          selectTag,
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


/*
|--------------------------------------------------------------------------
| COOKIE JAR
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
      item =>
        item
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


/*
|--------------------------------------------------------------------------
| COMMON HEADERS
|--------------------------------------------------------------------------
*/

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
| INITIAL GET
|--------------------------------------------------------------------------
*/

async function getInitial() {

  const response =
    await fetch(
      URL,
      {
        headers:
          headers(),
      }
    );

  const html =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `GET failed: ${response.status}`
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
| BUILD FORM
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
    of Object.entries(
      hidden
    )
  ) {

    body.set(
      key,
      value
    );
  }


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
| ASP.NET POSTBACK
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
      }
    );


  const resultHtml =
    await response.text();

  if (!response.ok) {

    throw new Error(
      `POSTBACK failed: ${response.status}`
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
| SUBMIT
|--------------------------------------------------------------------------
*/

async function submit({
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
      }
    );


  const resultHtml =
    await response.text();

  if (!response.ok) {

    throw new Error(
      `SUBMIT failed: ${response.status}`
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
| TABLE PARSER
|--------------------------------------------------------------------------
*/

function extractTables(html) {

  const result = [];

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

    if (rows.length) {
      result.push(
        rows
      );
    }
  }

  return result;
}


function printOptions(
  title,
  options
) {

  console.log(
    `\n===== ${title} =====`
  );

  console.log(
    'Count:',
    options.length
  );

  console.table(
    options.slice(
      0,
      30
    )
  );
}


/*
|--------------------------------------------------------------------------
| MAIN — 2026 SAMPLE
|--------------------------------------------------------------------------
*/

async function main() {

  await fs.mkdir(
    './tmp/csab/2026-test',
    {
      recursive: true,
    }
  );


  /*
  | Initial 2026 page
  */

  const initial =
    await getInitial();


  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB 2026'
  );

  console.log(
    '========================================'
  );


  console.log(
    'Initial HTML:',
    initial.html.length
  );


  const rounds =
    validOptions(
      initial.html,
      FIELDS.round
    );


  printOptions(
    '2026 AVAILABLE ROUNDS',
    rounds
  );


  if (!rounds.length) {

    throw new Error(
      'No 2026 rounds found'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ROUND 1
  |--------------------------------------------------------------------------
  */

  const round =
    rounds[0];


  console.log(
    '\nTesting round:',
    round
  );


  const roundState =
    await postback({
      html:
        initial.html,

      cookie:
        initial.cookie,

      field:
        FIELDS.round,

      value:
        round.value,
    });


  await fs.writeFile(
    './tmp/csab/2026-test/after-round.html',
    roundState.html,
    'utf8'
  );


  const instituteTypes =
    validOptions(
      roundState.html,
      FIELDS.instituteType
    );


  printOptions(
    'INSTITUTE TYPES',
    instituteTypes
  );


  if (!instituteTypes.length) {

    console.log(
      '\nPOSTBACK RESPONSE TEXT:\n'
    );

    console.log(
      stripHtml(
        roundState.html
      ).slice(
        0,
        2000
      )
    );

    throw new Error(
      'No institute types found'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FIRST INSTITUTE TYPE
  |--------------------------------------------------------------------------
  */

  const instituteType =
    instituteTypes[0];


  console.log(
    '\nTesting institute type:',
    instituteType
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
        instituteType.value,
    });


  const institutes =
    validOptions(
      typeState.html,
      FIELDS.institute
    );


  printOptions(
    'INSTITUTES',
    institutes
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
  | FIRST INSTITUTE
  |--------------------------------------------------------------------------
  */

  const institute =
    institutes[0];


  console.log(
    '\nTesting institute:',
    institute
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
        institute.value,
    });


  const programs =
    validOptions(
      instituteState.html,
      FIELDS.branch
    );


  printOptions(
    'PROGRAMS',
    programs
  );


  console.log(
    'Total programs:',
    programs.length
  );


  if (!programs.length) {

    throw new Error(
      'No programs found'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FIRST PROGRAM
  |--------------------------------------------------------------------------
  */

  const program =
    programs[0];


  console.log(
    '\nTesting program:',
    program
  );


  const programState =
    await postback({
      html:
        instituteState.html,

      cookie:
        instituteState.cookie,

      field:
        FIELDS.branch,

      value:
        program.value,
    });


  /*
  |--------------------------------------------------------------------------
  | SUBMIT RESULT
  |--------------------------------------------------------------------------
  */

  const result =
    await submit({
      html:
        programState.html,

      cookie:
        programState.cookie,
    });


  await fs.writeFile(
    './tmp/csab/2026-test/sample-result.html',
    result.html,
    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    '2026 SAMPLE'
  );

  console.log(
    '========================================'
  );


  console.log({
    year:
      2026,

    round,

    instituteType,

    institute,

    program,
  });


  const tables =
    extractTables(
      result.html
    );


  console.log(
    '\nTABLE COUNT:',
    tables.length
  );


  for (
    let index = 0;
    index < tables.length;
    index++
  ) {

    console.log(
      `\n===== TABLE ${index + 1} =====`
    );

    console.table(
      tables[index].slice(
        0,
        30
      )
    );
  }


  const pageText =
    stripHtml(
      result.html
    );


  console.log(
    '\nHas Opening Rank:',
    /opening\s*rank/i.test(
      pageText
    )
  );


  console.log(
    'Has Closing Rank:',
    /closing\s*rank/i.test(
      pageText
    )
  );


  console.log(
    '\nSaved:'
  );

  console.log(
    './tmp/csab/2026-test/sample-result.html'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    '2026 CHAIN TEST COMPLETE'
  );

  console.log(
    '========================================'
  );
}


main().catch(
  error => {

    console.error(
      '\nCSAB 2026 TEST FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
