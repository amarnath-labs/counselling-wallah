import axios from 'axios';
import * as cheerio from 'cheerio';

const URL =
  'https://www.shiksha.com/college/amani-group-of-institutions-amroha-59319/fees';

function clean(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('AMANI FEE DEEP INSPECT V7');
  console.log('========================================');

  const response = await axios.get(URL, {
    timeout: 25000,
    maxRedirects: 5,
    headers: {
      'User-Agent':
        'Mozilla/5.0 CounsellingWallah Fee Verification',
      Accept:
        'text/html,application/xhtml+xml'
    }
  });

  const $ = cheerio.load(response.data);

  const hits = [];

  $('body *').each((_, el) => {
    const text = clean($(el).text());

    if (
      !text ||
      text.length > 600
    ) {
      return;
    }

    if (
      /b\.?tech|tuition|total fee|course fee|fees|semester|year|₹|lakh/i
        .test(text)
    ) {
      hits.push(text);
    }
  });

  const unique = [
    ...new Set(hits)
  ];

  console.log('');
  console.log('=== FEE RELATED TEXT ===');

  for (const line of unique.slice(0, 200)) {
    console.log(line);
  }

  console.log('');
  console.log(
    `Unique fee-related snippets: ${unique.length}`
  );
}

main()
  .catch(error => {
    console.error(
      '\nAMANI INSPECT ERROR:\n',
      error
    );
    process.exitCode = 1;
  });
