const CURRENT_URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/currentorcr.aspx';

const ARCHIVE_URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/openingclosingrankarchieve.aspx';


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


function getAttr(tag, name) {
  const regex =
    new RegExp(
      `${name}\\s*=\\s*["']([^"']*)["']`,
      'i'
    );

  return (
    tag.match(regex)?.[1] ||
    ''
  );
}


function extractHiddenValues(html) {
  const result = {};

  const inputs =
    html.match(
      /<input\b[^>]*>/gi
    ) || [];

  for (const tag of inputs) {

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


function extractSelects(html) {
  const result = [];

  const regex =
    /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;

  let match;

  while (
    (
      match =
        regex.exec(html)
    ) !== null
  ) {
    const tag =
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
          decodeHtml(
            optionMatch[2]
              .replace(
                /<[^>]+>/g,
                ''
              )
              .replace(
                /\s+/g,
                ' '
              )
              .trim()
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
          tag,
          'name'
        ),

      id:
        getAttr(
          tag,
          'id'
        ),

      options,
    });
  }

  return result;
}


function currentSelectValue(
  html,
  name
) {
  const select =
    extractSelects(
      html
    ).find(
      (item) =>
        item.name === name
    );

  if (!select) {
    return '';
  }

  const selected =
    select.options.find(
      (option) =>
        option.selected
    );

  if (selected) {
    return selected.value;
  }

  return (
    select.options[0]?.value ||
    ''
  );
}


function showSelect(
  html,
  name,
  label
) {
  const select =
    extractSelects(
      html
    ).find(
      (item) =>
        item.name === name
    );

  console.log(
    `\n${label}`
  );

  if (!select) {
    console.log(
      'SELECT NOT FOUND'
    );

    return;
  }

  console.log(
    'name:',
    select.name
  );

  console.log(
    'id:',
    select.id
  );

  console.log(
    'options:',
    select.options.length
  );

  console.table(
    select.options
  );
}


/*
|--------------------------------------------------------------------------
| COOKIE HELPERS
|--------------------------------------------------------------------------
*/

function extractCookies(response) {

  let setCookies = [];

  if (
    typeof response.headers
      .getSetCookie === 'function'
  ) {
    setCookies =
      response.headers
        .getSetCookie();
  } else {

    const raw =
      response.headers.get(
        'set-cookie'
      );

    if (raw) {
      setCookies = [raw];
    }
  }

  return setCookies
    .map(
      (cookie) =>
        cookie
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

async function getPage(url) {

  const response =
    await fetch(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-CSAB-Fetcher/1.0',

          Accept:
            'text/html,application/xhtml+xml',
        },
      }
    );

  const html =
    await response.text();

  const cookie =
    extractCookies(
      response
    );

  if (!response.ok) {
    throw new Error(
      `GET failed: ${response.status}`
    );
  }

  return {
    html,
    cookie,
  };
}


/*
|--------------------------------------------------------------------------
| ASP.NET POSTBACK
|--------------------------------------------------------------------------
*/

async function postback({
  url,
  html,
  cookie,
  eventTarget,
  overrides = {},
}) {

  const hidden =
    extractHiddenValues(
      html
    );

  const body =
    new URLSearchParams();

  /*
  |--------------------------------------------------------------------------
  | ASP.NET hidden state
  |--------------------------------------------------------------------------
  */

  for (
    const [
      key,
      value
    ] of Object.entries(
      hidden
    )
  ) {
    body.set(
      key,
      value
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Current select values
  |--------------------------------------------------------------------------
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
      currentSelectValue(
        html,
        select.name
      )
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Override selected value
  |--------------------------------------------------------------------------
  */

  for (
    const [
      key,
      value
    ] of Object.entries(
      overrides
    )
  ) {
    body.set(
      key,
      String(value)
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Trigger ASP.NET AutoPostBack
  |--------------------------------------------------------------------------
  */

  body.set(
    '__EVENTTARGET',
    eventTarget
  );

  body.set(
    '__EVENTARGUMENT',
    ''
  );


  const response =
    await fetch(
      url,
      {
        method:
          'POST',

        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-CSAB-Fetcher/1.0',

          Accept:
            'text/html,application/xhtml+xml',

          'Content-Type':
            'application/x-www-form-urlencoded',

          ...(cookie
            ? {
                Cookie:
                  cookie,
              }
            : {}),
        },

        body:
          body.toString(),

        redirect:
          'follow',
      }
    );

  const resultHtml =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `POST failed: ${response.status}`
    );
  }

  return {
    html:
      resultHtml,

    cookie:
      cookie ||
      extractCookies(
        response
      ),
  };
}


/*
|--------------------------------------------------------------------------
| TEST CURRENT PAGE
|--------------------------------------------------------------------------
*/

async function testCurrent() {

  console.log(
    '\n========================================'
  );

  console.log(
    'CURRENT CSAB - ROUND POSTBACK'
  );

  console.log(
    '========================================'
  );

  const initial =
    await getPage(
      CURRENT_URL
    );

  console.log(
    'Initial HTML:',
    initial.html.length
  );

  console.log(
    'Cookie:',
    initial.cookie
      ? 'YES'
      : 'NO'
  );


  const afterRound =
    await postback({
      url:
        CURRENT_URL,

      html:
        initial.html,

      cookie:
        initial.cookie,

      eventTarget:
        'ctl00$ContentPlaceHolder1$ddlroundno',

      overrides: {
        'ctl00$ContentPlaceHolder1$ddlroundno':
          '1',
      },
    });


  console.log(
    'After Round 1 HTML:',
    afterRound.html.length
  );


  showSelect(
    afterRound.html,
    'ctl00$ContentPlaceHolder1$ddlroundno',
    'ROUND'
  );


  showSelect(
    afterRound.html,
    'ctl00$ContentPlaceHolder1$ddlInstype',
    'INSTITUTE TYPE'
  );
}


/*
|--------------------------------------------------------------------------
| TEST ARCHIVE PAGE
|--------------------------------------------------------------------------
*/

async function testArchive() {

  console.log(
    '\n========================================'
  );

  console.log(
    'ARCHIVE CSAB - YEAR POSTBACK'
  );

  console.log(
    '========================================'
  );


  const initial =
    await getPage(
      ARCHIVE_URL
    );


  console.log(
    'Initial HTML:',
    initial.html.length
  );

  console.log(
    'Cookie:',
    initial.cookie
      ? 'YES'
      : 'NO'
  );


  const afterYear =
    await postback({
      url:
        ARCHIVE_URL,

      html:
        initial.html,

      cookie:
        initial.cookie,

      eventTarget:
        'ctl00$ContentPlaceHolder1$ddlYear',

      overrides: {
        'ctl00$ContentPlaceHolder1$ddlYear':
          '2025',
      },
    });


  console.log(
    'After Year 2025 HTML:',
    afterYear.html.length
  );


  showSelect(
    afterYear.html,
    'ctl00$ContentPlaceHolder1$ddlYear',
    'YEAR'
  );


  showSelect(
    afterYear.html,
    'ctl00$ContentPlaceHolder1$ddlroundno',
    'ROUND'
  );


  return {
    html:
      afterYear.html,

    cookie:
      afterYear.cookie,
  };
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {

  try {

    await testCurrent();

    await testArchive();

    console.log(
      '\n========================================'
    );

    console.log(
      'POSTBACK TEST COMPLETE'
    );

    console.log(
      '========================================'
    );

  } catch (error) {

    console.error(
      '\nCSAB POSTBACK TEST FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
}


main();
