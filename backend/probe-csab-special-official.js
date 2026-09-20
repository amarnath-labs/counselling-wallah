import fs from 'node:fs';

const URLS = [
  'https://csab.nic.in/',
  'https://csab.nic.in/csab-special/',
  'https://csab.nic.in/archive/',
  'https://csab.nic.in/document/csab-special-opening-and-closing-ranks-2024/',
  'https://csab.nic.in/document/csab-special-round-1-opening-and-closing-ranks/',
];


async function fetchPage(url) {

  console.log(
    '\n----------------------------------------'
  );

  console.log(
    'FETCH:',
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
            'Mozilla/5.0 TruMarg-CSAB-Audit/1.0',

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
    requestedUrl:
      url,

    finalUrl:
      response.url,

    status:
      response.status,

    html,
  };
}


function extractLinks(
  html,
  baseUrl
) {

  const links =
    [];

  const regex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


  let match;


  while (
    (
      match =
        regex.exec(html)
    ) !==
    null
  ) {

    const href =
      match[1]
        ?.trim();

    const text =
      match[2]
        ?.replace(
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


    if (!href) {
      continue;
    }


    let absolute;

    try {

      absolute =
        new URL(
          href,
          baseUrl
        ).href;

    } catch {

      continue;
    }


    const combined =
      `${text} ${absolute}`
        .toLowerCase();


    if (
      combined.includes(
        'opening'
      ) ||
      combined.includes(
        'closing'
      ) ||
      combined.includes(
        'rank'
      ) ||
      combined.includes(
        'special'
      ) ||
      combined.includes(
        'orcr'
      )
    ) {

      links.push({
        text,
        url:
          absolute,
      });
    }
  }


  return links;
}


const results =
  [];


for (
  const url
  of URLS
) {

  const result =
    await fetchPage(
      url
    );


  const links =
    extractLinks(
      result.html,
      result.finalUrl
    );


  results.push({
    requestedUrl:
      result.requestedUrl,

    finalUrl:
      result.finalUrl,

    status:
      result.status,

    bytes:
      Buffer.byteLength(
        result.html,
        'utf8'
      ),

    relevantLinks:
      links,
  });


  const safeName =
    url
      .replace(
        /^https?:\/\//,
        ''
      )
      .replace(
        /[^a-z0-9]+/gi,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      );


  fs.writeFileSync(
    `./csab-probe-${safeName}.html`,
    result.html,
    'utf8'
  );


  console.log(
    '\nRelevant links:'
  );

  console.table(
    links.slice(
      0,
      100
    )
  );
}


fs.writeFileSync(
  './csab-special-official-probe.json',
  JSON.stringify(
    {
      generatedAt:
        new Date()
          .toISOString(),

      readOnly:
        true,

      results,
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
  'CSAB SPECIAL OFFICIAL PROBE COMPLETE'
);

console.log(
  '========================================'
);

console.log(
  'Saved:'
);

console.log(
  './csab-special-official-probe.json'
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);