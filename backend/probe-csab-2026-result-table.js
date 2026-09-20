import fs from 'node:fs';

const URL =
  'https://admissions.nic.in/csabspl/Applicant/seatallotmentresult/currentorcr.aspx';

const ROUNDS = ['1', '2'];

const ROUND_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlroundno';

const TYPE_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlInstype';

const INSTITUTE_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlInstitute';

const BRANCH_CONTROL =
  'ctl00$ContentPlaceHolder1$ddlBranch';


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
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  );
}


function extractAttributes(tag) {
  const result = {};

  const regex =
    /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;

  let match;

  while ((match = regex.exec(tag)) !== null) {
    result[match[1].toLowerCase()] =
      decodeHtml(
        match[2] ??
        match[3] ??
        match[4] ??
        ''
      );
  }

  return result;
}


function extractHidden(html) {
  const result = {};

  const tags =
    html.match(
      /<input\b[^>]*type=["']hidden["'][^>]*>/gi
    ) ?? [];

  for (const tag of tags) {
    const attrs =
      extractAttributes(tag);

    const name =
      attrs.name ??
      attrs.id;

    if (name) {
      result[name] =
        attrs.value ?? '';
    }
  }

  return result;
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

  const raw =
    response.headers.get('set-cookie');

  if (!raw) {
    return '';
  }

  return raw
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
        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-CSAB-2026-Probe/1.0',
          'Accept':
            'text/html,application/xhtml+xml',
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `GET failed: HTTP ${response.status}`
    );
  }

  return {
    html:
      await response.text(),
    cookie:
      getCookies(response),
  };
}


async function postback({
  html,
  cookie,
  eventTarget,
  values,
}) {
  const hidden =
    extractHidden(html);

  const params =
    new URLSearchParams();

  for (
    const [key, value]
    of Object.entries(hidden)
  ) {
    params.set(key, value);
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
    const [key, value]
    of Object.entries(values)
  ) {
    params.set(key, value);
  }

  const response =
    await fetch(
      URL,
      {
        method: 'POST',

        headers: {
          'User-Agent':
            'Mozilla/5.0 TruMarg-CSAB-2026-Probe/1.0',
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
      `POST ${eventTarget} failed: HTTP ${response.status}`
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


function parseTables(html) {
  const tables =
    html.match(
      /<table\b[\s\S]*?<\/table>/gi
    ) ?? [];

  return tables.map(
    (table, index) => {
      const matrix = [];

      const rows =
        table.match(
          /<tr\b[\s\S]*?<\/tr>/gi
        ) ?? [];

      for (const row of rows) {
        const cells = [];

        const regex =
          /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;

        let match;

        while (
          (match = regex.exec(row)) !== null
        ) {
          cells.push(
            stripTags(match[1])
          );
        }

        if (cells.length) {
          matrix.push(cells);
        }
      }

      return {
        tableIndex: index,
        matrix,
        text:
          stripTags(table),
      };
    }
  );
}


function findOrcrTable(html) {
  const tables =
    parseTables(html);

  return (
    tables.find(
      table => {
        const text =
          table.text.toLowerCase();

        return (
          text.includes('opening rank') &&
          text.includes('closing rank')
        );
      }
    ) ?? null
  );
}


async function fetchRound(round) {
  console.log(
    '\n========================================'
  );
  console.log(
    `CSAB/DASA 2026 ROUND ${round}`
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
        [ROUND_CONTROL]: round,
      },
    });

  const afterType =
    await postback({
      html:
        afterRound.html,
      cookie:
        afterRound.cookie,
      eventTarget:
        TYPE_CONTROL,
      values: {
        [ROUND_CONTROL]: round,
        [TYPE_CONTROL]: 'ALL',
      },
    });

  const afterInstitute =
    await postback({
      html:
        afterType.html,
      cookie:
        afterType.cookie,
      eventTarget:
        INSTITUTE_CONTROL,
      values: {
        [ROUND_CONTROL]: round,
        [TYPE_CONTROL]: 'ALL',
        [INSTITUTE_CONTROL]: 'ALL',
      },
    });

  const afterBranch =
    await postback({
      html:
        afterInstitute.html,
      cookie:
        afterInstitute.cookie,
      eventTarget:
        BRANCH_CONTROL,
      values: {
        [ROUND_CONTROL]: round,
        [TYPE_CONTROL]: 'ALL',
        [INSTITUTE_CONTROL]: 'ALL',
        [BRANCH_CONTROL]: 'ALL',
      },
    });

  fs.writeFileSync(
    `./csab-2026-round-${round}-all-result.html`,
    afterBranch.html,
    'utf8'
  );

  const table =
    findOrcrTable(
      afterBranch.html
    );

  if (!table) {
    throw new Error(
      `No OR-CR table found for Round ${round}`
    );
  }

  console.log(
    'Table index:',
    table.tableIndex
  );

  console.log(
    'Matrix rows:',
    table.matrix.length
  );

  console.log(
    '\nHEADER / FIRST ROWS'
  );

  console.table(
    table.matrix.slice(0, 12)
  );

  const dataRows =
    table.matrix.slice(1);

  const dasaRows =
    dataRows.filter(
      row =>
        row.some(
          cell =>
            /\bDASA\b/i.test(
              String(cell)
            )
        )
    );

  const ciwgRows =
    dataRows.filter(
      row =>
        row.some(
          cell =>
            /\bCIWG\b/i.test(
              String(cell)
            )
        )
    );

  console.log(
    '\nRAW DATA ROWS:',
    dataRows.length
  );

  console.log(
    'ROWS CONTAINING DASA:',
    dasaRows.length
  );

  console.log(
    'ROWS CONTAINING CIWG:',
    ciwgRows.length
  );

  console.log(
    '\nDASA SAMPLE'
  );

  console.table(
    dasaRows.slice(0, 10)
  );

  fs.writeFileSync(
    `./csab-2026-round-${round}-table-matrix.json`,
    JSON.stringify(
      table.matrix,
      null,
      2
    ),
    'utf8'
  );

  return {
    round:
      Number(round),

    rawRows:
      dataRows.length,

    dasaMarkerRows:
      dasaRows.length,

    ciwgMarkerRows:
      ciwgRows.length,

    header:
      table.matrix[0] ?? [],

    samples:
      dataRows.slice(0, 10),
  };
}


const audit = [];

for (const round of ROUNDS) {
  audit.push(
    await fetchRound(round)
  );
}


fs.writeFileSync(
  './csab-2026-result-table-probe.json',
  JSON.stringify(
    {
      generatedAt:
        new Date().toISOString(),

      sourceUrl:
        URL,

      readOnly:
        true,

      rounds:
        audit,
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
  'CSAB 2026 RESULT TABLE PROBE COMPLETE'
);

console.log(
  '========================================'
);

console.table(
  audit.map(
    row => ({
      round:
        row.round,
      rawRows:
        row.rawRows,
      dasaMarkerRows:
        row.dasaMarkerRows,
      ciwgMarkerRows:
        row.ciwgMarkerRows,
    })
  )
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);