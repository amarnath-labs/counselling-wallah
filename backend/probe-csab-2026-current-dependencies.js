import fs from 'node:fs';

const URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/currentorcr.aspx';

const ROUNDS =
  ['1', '2'];


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

  const tags =
    html.match(
      /<input\b[^>]*type=["']hidden["'][^>]*>/gi
    ) ?? [];


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
            'Mozilla/5.0 TruMarg-CSAB-2026-Audit/1.0',

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
            'Mozilla/5.0 TruMarg-CSAB-2026-Audit/1.0',

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


  return {
    html:
      await response.text(),

    cookie:
      [
        cookie,
        getCookies(response),
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
  'CSAB SPECIAL 2026 CURRENT DEPENDENCY PROBE'
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

  rounds: {},
};


for (
  const round
  of ROUNDS
) {

  console.log(
    '\n========================================'
  );

  console.log(
    `ROUND ${round}`
  );

  console.log(
    '========================================'
  );


  const initial =
    await initialGet();


  const afterRound =
    await postback({
      html:
        initial.html,

      cookie:
        initial.cookie,

      eventTarget:
        ROUND_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,
      },
    });


  fs.writeFileSync(
    `./csab-2026-round-${round}-after-round.html`,
    afterRound.html,
    'utf8'
  );


  const roundSelects =
    extractSelects(
      afterRound.html
    );


  const typeOptions =
    printSelect(
      roundSelects,
      TYPE_CONTROL
    );


  audit.rounds[round] = {
    instituteTypes:
      typeOptions,
  };


  const allType =
    typeOptions.find(
      option =>
        option.value === 'ALL'
    );


  if (!allType) {
    throw new Error(
      `ALL institute type not found for round ${round}`
    );
  }


  const fresh =
    await initialGet();


  const freshRound =
    await postback({
      html:
        fresh.html,

      cookie:
        fresh.cookie,

      eventTarget:
        ROUND_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,
      },
    });


  const afterType =
    await postback({
      html:
        freshRound.html,

      cookie:
        freshRound.cookie,

      eventTarget:
        TYPE_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,

        [TYPE_CONTROL]:
          'ALL',
      },
    });


  fs.writeFileSync(
    `./csab-2026-round-${round}-after-all-type.html`,
    afterType.html,
    'utf8'
  );


  const typeSelects =
    extractSelects(
      afterType.html
    );


  const instituteOptions =
    printSelect(
      typeSelects,
      INSTITUTE_CONTROL
    );


  audit.rounds[round]
    .institutes =
    instituteOptions;


  const allInstitute =
    instituteOptions.find(
      option =>
        option.value === 'ALL'
    );


  if (!allInstitute) {
    throw new Error(
      `ALL institute option not found for round ${round}`
    );
  }


  const fresh2 =
    await initialGet();


  const fresh2Round =
    await postback({
      html:
        fresh2.html,

      cookie:
        fresh2.cookie,

      eventTarget:
        ROUND_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,
      },
    });


  const fresh2Type =
    await postback({
      html:
        fresh2Round.html,

      cookie:
        fresh2Round.cookie,

      eventTarget:
        TYPE_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,

        [TYPE_CONTROL]:
          'ALL',
      },
    });


  const afterInstitute =
    await postback({
      html:
        fresh2Type.html,

      cookie:
        fresh2Type.cookie,

      eventTarget:
        INSTITUTE_CONTROL,

      values: {
        [ROUND_CONTROL]:
          round,

        [TYPE_CONTROL]:
          'ALL',

        [INSTITUTE_CONTROL]:
          'ALL',
      },
    });


  fs.writeFileSync(
    `./csab-2026-round-${round}-after-all-institute.html`,
    afterInstitute.html,
    'utf8'
  );


  const instituteSelects =
    extractSelects(
      afterInstitute.html
    );


  const branchOptions =
    printSelect(
      instituteSelects,
      BRANCH_CONTROL
    );


  audit.rounds[round]
    .branches =
    branchOptions;


  const allBranch =
    branchOptions.find(
      option =>
        option.value === 'ALL'
    );


  if (!allBranch) {
    throw new Error(
      `ALL branch option not found for round ${round}`
    );
  }
}


fs.writeFileSync(
  './csab-2026-current-dependency-audit.json',
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
  'CSAB SPECIAL 2026 DEPENDENCY PROBE COMPLETE'
);

console.log(
  '========================================'
);

console.log(
  'Saved:'
);

console.log(
  './csab-2026-current-dependency-audit.json'
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);