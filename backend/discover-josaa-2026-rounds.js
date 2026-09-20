import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx';

const FIELDS = {
  round:
    'ctl00$ContentPlaceHolder1$ddlroundno',

  instituteType:
    'ctl00$ContentPlaceHolder1$ddlInstype',
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
  const regex =
    /<input[^>]+type=["']hidden["'][^>]*>/gi;

  const hidden = {};

  let match;

  while (
    (match = regex.exec(html)) !== null
  ) {
    const tag =
      match[0];

    const nameMatch =
      tag.match(
        /name=["']([^"']+)["']/i
      );

    if (!nameMatch) {
      continue;
    }

    const valueMatch =
      tag.match(
        /value=["']([^"']*)["']/i
      );

    hidden[
      decodeHtml(nameMatch[1])
    ] =
      valueMatch
        ? decodeHtml(valueMatch[1])
        : '';
  }

  return hidden;
}

function extractSelect(
  html,
  id
) {
  const escapedId =
    id.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      '\\$&'
    );

  const regex =
    new RegExp(
      `<select[^>]+id=["']${escapedId}["'][^>]*>([\\s\\S]*?)<\\/select>`,
      'i'
    );

  const match =
    html.match(regex);

  if (!match) {
    return [];
  }

  const result = [];

  const optionRegex =
    /<option([^>]*)value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;

  let option;

  while (
    (
      option =
        optionRegex.exec(
          match[1]
        )
    ) !== null
  ) {
    result.push({
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

  return result;
}

async function getPage() {
  const response =
    await fetch(
      URL,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-Data-Audit/1.0',

          Accept:
            'text/html,application/xhtml+xml',
        },

        redirect:
          'follow',
      }
    );

  if (!response.ok) {
    throw new Error(
      `GET failed: ${response.status}`
    );
  }

  return response.text();
}

async function postBack(
  html,
  eventTarget,
  extra = {}
) {
  const hidden =
    extractHidden(
      html
    );

  const form =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(hidden)
  ) {
    form.set(
      key,
      value ?? ''
    );
  }

  form.set(
    '__EVENTTARGET',
    eventTarget
  );

  form.set(
    '__EVENTARGUMENT',
    ''
  );

  for (
    const [key, value]
    of Object.entries(extra)
  ) {
    form.set(
      key,
      value ?? ''
    );
  }

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
    'TRUMARG JOSAA 2026 ROUND DISCOVERY'
  );

  console.log(
    '========================================\n'
  );

  const initialHtml =
    await getPage();

  const roundOptions =
    extractSelect(
      initialHtml,
      'ctl00_ContentPlaceHolder1_ddlroundno'
    )
      .filter(
        row =>
          row.value &&
          row.value !== '0'
      );

  console.log(
    'Available rounds:'
  );

  console.table(
    roundOptions
  );

  const discovery = [];

  for (
    const round
    of roundOptions
  ) {

    console.log(
      `\n----------------------------------------`
    );

    console.log(
      `ROUND ${round.label}`
    );

    console.log(
      `----------------------------------------`
    );

    const roundHtml =
      await postBack(
        initialHtml,
        FIELDS.round,
        {
          [FIELDS.round]:
            round.value,
        }
      );

    fs.writeFileSync(
      `./josaa-2026-round-${round.value}.html`,
      roundHtml,
      'utf8'
    );

    const instituteTypes =
      extractSelect(
        roundHtml,
        'ctl00_ContentPlaceHolder1_ddlInstype'
      )
        .filter(
          row =>
            row.value &&
            row.value !== '0'
        );

    console.log(
      'Institute types:'
    );

    console.table(
      instituteTypes
    );

    discovery.push({
      round:
        round.value,

      roundLabel:
        round.label,

      instituteTypes,
    });

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          700
        )
    );
  }

  const output = {
    source:
      URL,

    counsellingType:
      'JOSAA',

    year:
      2026,

    discoveredAt:
      new Date()
        .toISOString(),

    rounds:
      discovery,
  };

  fs.writeFileSync(
    './josaa-2026-round-discovery.json',
    JSON.stringify(
      output,
      null,
      2
    ),
    'utf8'
  );

  console.log(
    '\n========================================'
  );

  console.log(
    'DISCOVERY COMPLETE'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Saved: ./josaa-2026-round-discovery.json'
  );

  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );
}

main().catch(
  error => {

    console.error(
      '\nDISCOVERY FAILED:\n',
      error
    );

    process.exit(1);
  }
);
