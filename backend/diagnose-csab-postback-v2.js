import fs from 'node:fs/promises';

const URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/openingclosingrankarchieve.aspx';

const YEAR_FIELD =
  'ctl00$ContentPlaceHolder1$ddlYear';

function attr(tag, name) {
  return (
    tag.match(
      new RegExp(
        `${name}\\s*=\\s*["']([^"']*)["']`,
        'i'
      )
    )?.[1] || ''
  );
}

function decode(value = '') {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ');
}

function hiddenFields(html) {
  const result = {};

  for (
    const tag
    of html.match(
      /<input\b[^>]*>/gi
    ) || []
  ) {
    if (
      !/type\s*=\s*["']hidden["']/i
        .test(tag)
    ) {
      continue;
    }

    const name =
      attr(tag, 'name');

    if (!name) {
      continue;
    }

    result[name] =
      decode(
        attr(tag, 'value')
      );
  }

  return result;
}

function cookiesFrom(response) {
  if (
    typeof response.headers
      .getSetCookie === 'function'
  ) {
    return response.headers
      .getSetCookie()
      .map(
        item =>
          item.split(';')[0]
      )
      .join('; ');
  }

  const raw =
    response.headers.get(
      'set-cookie'
    );

  return raw
    ? raw.split(';')[0]
    : '';
}

function titleOf(html) {
  return (
    html.match(
      /<title[^>]*>([\s\S]*?)<\/title>/i
    )?.[1]
      ?.replace(/\s+/g, ' ')
      ?.trim() ||
    ''
  );
}

function visibleText(html) {
  return html
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
      /&nbsp;/gi,
      ' '
    )
    .replace(
      /&amp;/gi,
      '&'
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

async function main() {

  await fs.mkdir(
    './tmp/csab/debug-v2',
    {
      recursive: true,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | GET
  |--------------------------------------------------------------------------
  */

  const getResponse =
    await fetch(
      URL,
      {
        redirect: 'manual',

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

          'Accept-Language':
            'en-US,en;q=0.9',
        },
      }
    );

  const initialHtml =
    await getResponse.text();

  const cookie =
    cookiesFrom(
      getResponse
    );

  console.log(
    '\n===== INITIAL GET ====='
  );

  console.log(
    'Status:',
    getResponse.status
  );

  console.log(
    'URL:',
    getResponse.url
  );

  console.log(
    'Length:',
    initialHtml.length
  );

  console.log(
    'Title:',
    titleOf(initialHtml)
  );

  console.log(
    'Cookie:',
    cookie || 'NONE'
  );


  /*
  |--------------------------------------------------------------------------
  | BUILD ASP.NET POST
  |--------------------------------------------------------------------------
  */

  const hidden =
    hiddenFields(
      initialHtml
    );

  const body =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(hidden)
  ) {
    body.set(
      key,
      value
    );
  }

  body.set(
    '__EVENTTARGET',
    YEAR_FIELD
  );

  body.set(
    '__EVENTARGUMENT',
    ''
  );

  body.set(
    '__LASTFOCUS',
    ''
  );

  body.set(
    YEAR_FIELD,
    '2025'
  );

  /*
  |--------------------------------------------------------------------------
  | POSTBACK
  |--------------------------------------------------------------------------
  */

  const postResponse =
    await fetch(
      URL,
      {
        method: 'POST',

        redirect: 'manual',

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

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
                Cookie: cookie,
              }
            : {}),
        },

        body:
          body.toString(),
      }
    );

  const returnedHtml =
    await postResponse.text();

  await fs.writeFile(
    './tmp/csab/debug-v2/archive-post-2025.html',
    returnedHtml,
    'utf8'
  );

  console.log(
    '\n===== YEAR 2025 POSTBACK ====='
  );

  console.log(
    'Status:',
    postResponse.status
  );

  console.log(
    'Status text:',
    postResponse.statusText
  );

  console.log(
    'Returned URL:',
    postResponse.url
  );

  console.log(
    'Location header:',
    postResponse.headers.get(
      'location'
    )
  );

  console.log(
    'Content-Type:',
    postResponse.headers.get(
      'content-type'
    )
  );

  console.log(
    'Length:',
    returnedHtml.length
  );

  console.log(
    'Title:',
    titleOf(
      returnedHtml
    )
  );

  console.log(
    '\nVISIBLE TEXT:\n'
  );

  console.log(
    visibleText(
      returnedHtml
    ).slice(
      0,
      3000
    )
  );

  console.log(
    '\nRAW HTML START:\n'
  );

  console.log(
    returnedHtml.slice(
      0,
      1500
    )
  );

  console.log(
    '\n===== CONTROL CHECK ====='
  );

  console.log(
    'Has YEAR:',
    returnedHtml.includes(
      'ctl00_ContentPlaceHolder1_ddlYear'
    )
  );

  console.log(
    'Has ROUND:',
    returnedHtml.includes(
      'ctl00_ContentPlaceHolder1_ddlroundno'
    )
  );

  console.log(
    'Has VIEWSTATE:',
    returnedHtml.includes(
      '__VIEWSTATE'
    )
  );

  console.log(
    '\nSaved:'
  );

  console.log(
    './tmp/csab/debug-v2/archive-post-2025.html'
  );
}

main().catch(
  error => {
    console.error(
      '\nFAILED:',
      error
    );

    process.exitCode = 1;
  }
);
