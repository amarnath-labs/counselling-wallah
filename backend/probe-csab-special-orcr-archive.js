import fs from 'node:fs';

const ARCHIVE_URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/openingclosingrankarchieve.aspx';

const CURRENT_URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/currentorcr.aspx';


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


function extractSelects(html) {

  const output = [];

  const regex =
    /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;

  let match;

  while (
    (
      match =
        regex.exec(html)
    ) !== null
  ) {

    const selectAttrs =
      extractAttributes(
        `<select ${match[1]}>`
      );


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

      const attrs =
        extractAttributes(
          `<option ${optionMatch[1]}>`
        );

      options.push({
        value:
          attrs.value ?? '',

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


    output.push({
      id:
        selectAttrs.id ?? null,

      name:
        selectAttrs.name ?? null,

      options,
    });
  }

  return output;
}


function extractHiddenInputs(html) {

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


async function fetchPage(url) {

  console.log(
    '\nFETCH:',
    url
  );


  const response =
    await fetch(
      url,
      {
        redirect:
          'follow',

        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-CSAB-ORCR-Audit/1.0',

          'Accept':
            'text/html,application/xhtml+xml',
        },
      }
    );


  console.log(
    'Status:',
    response.status
  );

  console.log(
    'Final URL:',
    response.url
  );


  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} for ${url}`
    );
  }


  const html =
    await response.text();


  console.log(
    'Bytes:',
    Buffer.byteLength(
      html,
      'utf8'
    )
  );


  return {
    html,
    finalUrl:
      response.url,
  };
}


async function inspect({
  label,
  url,
  output,
}) {

  console.log(
    '\n========================================'
  );

  console.log(label);

  console.log(
    '========================================'
  );


  const {
    html,
    finalUrl,
  } =
    await fetchPage(url);


  fs.writeFileSync(
    output,
    html,
    'utf8'
  );


  const selects =
    extractSelects(html);


  console.log(
    '\nSELECT CONTROLS'
  );


  for (
    const select
    of selects
  ) {

    console.log(
      '\n----------------------------------------'
    );

    console.log(
      'id:',
      select.id
    );

    console.log(
      'name:',
      select.name
    );

    console.log(
      'options:',
      select.options.length
    );

    console.table(
      select.options.slice(
        0,
        100
      )
    );
  }


  const hidden =
    extractHiddenInputs(html);


  const importantHidden =
    Object.fromEntries(
      Object.entries(hidden)
        .filter(
          ([key]) =>
            [
              '__VIEWSTATE',
              '__VIEWSTATEGENERATOR',
              '__EVENTVALIDATION',
              '__EVENTTARGET',
              '__EVENTARGUMENT',
            ].includes(key)
        )
        .map(
          ([key, value]) => [
            key,
            value
              ? `${value.slice(0, 80)}${value.length > 80 ? '...' : ''}`
              : '',
          ]
        )
    );


  console.log(
    '\nASP.NET HIDDEN FIELDS'
  );

  console.table(
    importantHidden
  );


  return {
    finalUrl,
    bytes:
      Buffer.byteLength(
        html,
        'utf8'
      ),

    selects:
      selects.map(
        select => ({
          id:
            select.id,

          name:
            select.name,

          optionCount:
            select.options.length,

          options:
            select.options,
        })
      ),

    hiddenFieldNames:
      Object.keys(hidden),
  };
}


const archive =
  await inspect({
    label:
      'CSAB SPECIAL ARCHIVE',

    url:
      ARCHIVE_URL,

    output:
      './csab-special-archive-probe.html',
  });


const current =
  await inspect({
    label:
      'CSAB SPECIAL CURRENT 2026',

    url:
      CURRENT_URL,

    output:
      './csab-special-current-2026-probe.html',
  });


fs.writeFileSync(
  './csab-special-orcr-structure-audit.json',
  JSON.stringify(
    {
      generatedAt:
        new Date()
          .toISOString(),

      readOnly:
        true,

      archive,
      current,
    },
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'CSAB SPECIAL OR-CR STRUCTURE PROBE COMPLETE'
);

console.log(
  '========================================'
);

console.log(
  'Saved:'
);

console.log(
  './csab-special-archive-probe.html'
);

console.log(
  './csab-special-current-2026-probe.html'
);

console.log(
  './csab-special-orcr-structure-audit.json'
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);