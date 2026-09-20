import axios from 'axios';
import * as cheerio from 'cheerio';

const URL =
  'https://www.cuh.ac.in/cucetUG.aspx';

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('CUH 2026 FEE DOCUMENT DISCOVERY');
  console.log('========================================');

  const response = await axios.get(URL, {
    timeout: 25000,
    maxRedirects: 5,
    headers: {
      'User-Agent':
        'Mozilla/5.0 CounsellingWallah Fee Verification'
    }
  });

  const $ = cheerio.load(response.data);

  const matches = [];

  $('a[href]').each((_, el) => {
    const label =
      $(el)
        .text()
        .replace(/\s+/g, ' ')
        .trim();

    const href =
      $(el).attr('href');

    const url =
      absoluteUrl(URL, href);

    if (!url) return;

    const combined =
      `${label} ${url}`;

    if (
      /fee structure|fee|2026-27|notification/i
        .test(combined)
    ) {
      matches.push({
        label:
          label || '(no text)',
        url,
        pdf:
          /\.pdf(?:$|\?)/i.test(url)
      });
    }
  });

  const unique = [
    ...new Map(
      matches.map(
        item => [
          item.url,
          item
        ]
      )
    ).values()
  ];

  console.table(unique);

  console.log(
    `Relevant links: ${unique.length}`
  );
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
