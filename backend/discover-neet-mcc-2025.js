import fs from 'fs';
import path from 'path';

const ARCHIVE =
  'https://mcc.nic.in/archive-ug/';


const TARGETS = [
  {
    key:
      'round-1',

    patterns: [
      'Final Result for Round-I of NEET UG Counselling 2025',
      'Final Result for Round 1 of NEET UG Counselling 2025',
    ],
  },

  {
    key:
      'round-2',

    patterns: [
      'Final Result for Round 2 of UG Counselling 2025',
    ],
  },

  {
    key:
      'round-3',

    patterns: [
      'Final Allotment Result for Round 3 of UG Counselling 2025',
    ],
  },

  {
    key:
      'stray',

    patterns: [
      'Final Allotment Result for Stray Vacacy Round UG 2025',
      'Final Allotment Result for Stray Vacancy Round UG 2025',
    ],
  },

  {
    key:
      'special-stray',

    patterns: [
      'Final Result for Special Stray Round of UG counselling 2025',
      'Final Result for Special Stray Round of UG Counselling 2025',
    ],
  },
];


function normalize(
  value
) {
  return String(
    value || ''
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


async function fetchText(
  url
) {
  const response =
    await fetch(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

          'Accept-Language':
            'en-US,en;q=0.9',
        },
      }
    );


  if (
    !response.ok
  ) {
    throw new Error(
      `HTTP ${response.status} ${url}`
    );
  }


  return response.text();
}


function decodeHtml(
  value
) {
  return String(
    value || ''
  )
    .replace(
      /&amp;/g,
      '&'
    )
    .replace(
      /&#038;/g,
      '&'
    )
    .replace(
      /&quot;/g,
      '"'
    )
    .replace(
      /&#8211;/g,
      '–'
    )
    .replace(
      /&#8212;/g,
      '—'
    )
    .replace(
      /&#8217;/g,
      "'"
    )
    .replace(
      /&nbsp;/g,
      ' '
    );
}


function stripTags(
  value
) {
  return normalize(
    decodeHtml(
      String(
        value || ''
      )
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
    )
  );
}


function extractLinks(
  html
) {
  const links = [];

  const regex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;


  let match;


  while (
    (
      match =
        regex.exec(
          html
        )
    )
  ) {
    links.push({
      href:
        decodeHtml(
          match[1]
        ),

      text:
        stripTags(
          match[2]
        ),
    });
  }


  return links;
}


function absoluteUrl(
  href
) {
  try {
    return new URL(
      href,
      ARCHIVE
    ).href;
  } catch {
    return null;
  }
}


function scoreTarget(
  linkText,
  patterns
) {
  const text =
    normalize(
      linkText
    )
      .toLowerCase();


  let best =
    0;


  for (
    const pattern of
    patterns
  ) {
    const wanted =
      normalize(
        pattern
      )
        .toLowerCase();


    if (
      text ===
      wanted
    ) {
      best =
        Math.max(
          best,
          100
        );

      continue;
    }


    if (
      text.includes(
        wanted
      )
    ) {
      best =
        Math.max(
          best,
          90
        );

      continue;
    }


    const words =
      wanted
        .split(
          ' '
        )
        .filter(
          word =>
            word.length >
            2
        );


    const hits =
      words.filter(
        word =>
          text.includes(
            word
          )
      ).length;


    const ratio =
      words.length
        ? hits /
          words.length
        : 0;


    best =
      Math.max(
        best,
        Math.round(
          ratio *
          80
        )
      );
  }


  return best;
}


async function run() {

  console.log(
    'Fetching MCC UG archive...'
  );


  const html =
    await fetchText(
      ARCHIVE
    );


  const links =
    extractLinks(
      html
    )
      .map(
        item => ({
          ...item,

          url:
            absoluteUrl(
              item.href
            ),
        })
      )
      .filter(
        item =>
          item.url
      );


  const results = [];


  for (
    const target of
    TARGETS
  ) {

    const candidates =
      links
        .map(
          item => ({
            ...item,

            score:
              scoreTarget(
                item.text,
                target.patterns
              ),
          })
        )
        .filter(
          item =>
            item.score >=
            60
        )
        .sort(
          (
            a,
            b
          ) =>
            b.score -
            a.score
        );


    const best =
      candidates[0] ||
      null;


    results.push({
      key:
        target.key,

      found:
        Boolean(
          best
        ),

      title:
        best?.text ||
        null,

      url:
        best?.url ||
        null,

      score:
        best?.score ||
        0,

      candidates:
        candidates
          .slice(
            0,
            5
          ),
    });
  }


  const outDir =
    path.resolve(
      './data/neet/mcc/2025'
    );


  fs.mkdirSync(
    outDir,
    {
      recursive: true,
    }
  );


  const outFile =
    path.join(
      outDir,
      'document-discovery.json'
    );


  fs.writeFileSync(
    outFile,
    JSON.stringify(
      results,
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'MCC 2025 DOCUMENT DISCOVERY'
  );

  console.log(
    '========================================'
  );


  console.table(
    results.map(
      item => ({
        key:
          item.key,

        found:
          item.found,

        score:
          item.score,

        title:
          item.title,

        url:
          item.url,
      })
    )
  );


  console.log(
    `\nSaved: ${outFile}`
  );
}


run()
  .catch(
    error => {
      console.error(
        '\nFAILED'
      );

      console.error(
        error
      );

      process.exitCode =
        1;
    }
  );
