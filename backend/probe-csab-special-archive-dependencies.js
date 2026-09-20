import fs from 'node:fs';

const URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/openingclosingrankarchieve.aspx';

const YEARS =
  ['2025', '2024'];


function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}


function stripTags(value) {
  return decodeHtml(
    String(value ?? '')
      .replace(/<[^>]*>/g, ' ')
  );
}


function extractAttributes(tag) {

  const attributes = {};

  const regex =
    /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

  let match;

  while (
    (
      match =
        regex.exec(tag)
    ) !== null
  ) {

    attributes[
      match[1].toLowerCase()
    ] =
      decodeHtml(
        match[2] ??
        match[3] ??
        match[4] ??
        ''
      );
  }

  return attributes;
}


function extractHidden(html) {

  const result = {};

  const regex =
    /<input\b[^>]*type=["']hidden["'][^>]*>/gi;

  const tags =
    html.match(regex) ?? [];


  for (
    const tag
    of tags
  ) {

    const attrs =
      extractAttributes(tag);

    const name =
      attrs.name ??
      attrs.id;

    if (!name) {
      continue;
    }

    result[name] =
      attrs.value ?? '';
  }

  return result;
}


function extractSelects(html) {

  const output =
    new Map();

  const regex =
    /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;

  let match;

  while (
    (
      match =
        regex.exec(html)
    ) !== null
  ) {

    const attrs =
      extractAttributes(
        `<select ${match[1]}>`
      );

    const name =
      attrs.name ??
      attrs.id;

    if (!name) {
      continue;
    }


    const options = [];

    const optionRegex =
      /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;

    let optionMatch;

    while (
      (
        optionMatch =
          optionRegex.exec(
            match[2]
          )
      ) !== null
    ) {

      const optionAttrs =
        extractAttributes(
          `<option ${optionMatch[1]}>`
        );

      options.push({
        value:
          optionAttrs.value ?? '',

        text:
          stripTags(
            optionMatch[2]
          ),

        selected:
          /\bselected\b/i.test(
            optionMatch[1]
          ),
      });
    }


    output.set(
      name,
      {
        id:
          attrs.id ?? null,

        name,
        options,
      }
    );
  }

  return output;
}


function getCookies(response) {

  if (
    typeof response.headers.getSetCookie ===
    'function'
  ) {

    return response.headers
      .getSetCookie()
      .map(
        value =>
          value.split(';')[0]
      )
      .join('; ');
  }


  const value =
    response.headers.get(
      'set-cookie'
    );

  if (!value) {
    return '';
  }


  return value
    .split(/,(?=[^;,]+=)/)
    .map(
      item =>
        item.split(';')[0]
    )
    .join('; ');
}


async function initialGet() {

  const response =
    await fetch(
      URL,
      {
        redirect:
          'follow',

        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-CSAB-Audit/1.0',

          'Accept':
            'text/html,application/xhtml+xml',
        },
      }
    );


  if (!response.ok) {
    throw new Error(
      `Initial GET failed: HTTP ${response.status}`
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


async function postback({
  html,
  cookie,
  eventTarget,
  values,
}) {

  const hidden =
    extractHidden(
      html
    );


  const params =
    new URLSearchParams();


  for (
    const [
      key,
      value
    ]
    of Object.entries(
      hidden
    )
  ) {

    params.set(
      key,
      value
    );
  }


  params.set(
    '__EVENTTARGET',
    eventTarget
  );

  params.set(
    '__EVENTARGUMENT',
    ''
  );


  for (
    const [
      key,
      value
    ]
    of Object.entries(
      values
    )
  ) {

    params.set(
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

        redirect:
          'follow',

        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-CSAB-Audit/1.0',

          'Accept':
            'text/html,application/xhtml+xml',

          'Content-Type':
            'application/x-www-form-urlencoded',

          'Cookie':
            cookie,

          'Referer':
            URL,
        },

        body:
          params.toString(),
      }
    );


  if (!response.ok) {
    throw new Error(
      `POST failed for ${eventTarget}: HTTP ${response.status}`
    );
  }


  const nextCookie =
    getCookies(
      response
    );


  return {
    html:
      await response.text(),

    cookie:
      [
        cookie,
        nextCookie,
      ]
        .filter(Boolean)
        .join('; '),
  };
}


function printSelect(
  selects,
  name
) {

  const select =
    selects.get(name);

  if (!select) {

    console.log(
      `${name}: NOT FOUND`
    );

    return [];
  }


  console.log(
    `\n${name}`
  );

  console.log(
    'Options:',
    select.options.length
  );

  console.table(
    select.options
  );


  return select.options;
}


const YEAR_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlYear';

const ROUND_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlroundno';

const TYPE_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlInstype';

const INSTITUTE_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlInstitute';

const BRANCH_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlBranch';


console.log(
  '\n========================================'
);

console.log(
  'CSAB SPECIAL ARCHIVE DEPENDENCY PROBE'
);

console.log(
  '========================================'
);


const audit = {
  generatedAt:
    new Date()
      .toISOString(),

  readOnly:
    true,

  years: {},
};


for (
  const year
  of YEARS
) {

  console.log(
    '\n\n========================================'
  );

  console.log(
    `YEAR ${year}`
  );

  console.log(
    '========================================'
  );


  /*
  |--------------------------------------------------------------------------
  | INITIAL GET
  |--------------------------------------------------------------------------
  */

  const initial =
    await initialGet();


  /*
  |--------------------------------------------------------------------------
  | SELECT YEAR
  |--------------------------------------------------------------------------
  */

  const afterYear =
    await postback({
      html:
        initial.html,

      cookie:
        initial.cookie,

      eventTarget:
        YEAR_CONTROL,

      values: {
        [YEAR_CONTROL]:
          year,
      },
    });


  fs.writeFileSync(
    `./csab-${year}-after-year.html`,
    afterYear.html,
    'utf8'
  );


  const yearSelects =
    extractSelects(
      afterYear.html
    );


  const roundOptions =
    printSelect(
      yearSelects,
      ROUND_CONTROL
    );


  const validRounds =
    roundOptions.filter(
      option =>
        option.value &&
        option.value !== '0'
    );


  audit.years[year] = {
    rounds:
      validRounds,
  };


  if (
    validRounds.length === 0
  ) {
    throw new Error(
      `No rounds exposed for ${year}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | PROBE EVERY ROUND TO GET INSTITUTE TYPES
  |--------------------------------------------------------------------------
  */

  audit.years[year]
    .roundDetails =
    {};


  for (
    const round
    of validRounds
  ) {

    console.log(
      '\n----------------------------------------'
    );

    console.log(
      `YEAR ${year} / ROUND ${round.value}`
    );


    const freshInitial =
      await initialGet();


    const freshYear =
      await postback({
        html:
          freshInitial.html,

        cookie:
          freshInitial.cookie,

        eventTarget:
          YEAR_CONTROL,

        values: {
          [YEAR_CONTROL]:
            year,
        },
      });


    const afterRound =
      await postback({
        html:
          freshYear.html,

        cookie:
          freshYear.cookie,

        eventTarget:
          ROUND_CONTROL,

        values: {
          [YEAR_CONTROL]:
            year,

          [ROUND_CONTROL]:
            round.value,
        },
      });


    fs.writeFileSync(
      `./csab-${year}-round-${round.value}-probe.html`,
      afterRound.html,
      'utf8'
    );


    const selects =
      extractSelects(
        afterRound.html
      );


    const typeOptions =
      printSelect(
        selects,
        TYPE_CONTROL
      );


    const instituteOptions =
      selects.get(
        INSTITUTE_CONTROL
      )?.options ?? [];


    const branchOptions =
      selects.get(
        BRANCH_CONTROL
      )?.options ?? [];


    audit.years[year]
      .roundDetails[
        round.value
      ] =
      {
        roundText:
          round.text,

        instituteTypes:
          typeOptions,

        institutesBeforeTypeSelection:
          instituteOptions,

        branchesBeforeInstituteSelection:
          branchOptions,
      };
  }
}


fs.writeFileSync(
  './csab-special-archive-dependency-audit.json',
  JSON.stringify(
    audit,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'CSAB SPECIAL ARCHIVE DEPENDENCY PROBE COMPLETE'
);

console.log(
  '========================================'
);

console.log(
  'Saved:'
);

console.log(
  './csab-special-archive-dependency-audit.json'
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);