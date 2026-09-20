import 'dotenv/config';

import axios from 'axios';
import * as cheerio from 'cheerio';

const URL =
  'https://www.nirfindia.org/Rankings/2025/EngineeringRankingALL.html';

const TARGET =
  'National Institute of Technology Agartala';

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('NIRF ALL-INSTITUTES ID INSPECTOR');
  console.log('=======================================');
  console.log('');

  console.log('[INSPECT] Downloading:', URL);

  const response = await axios.get(
    URL,
    {
      timeout: 30000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    }
  );

  console.log(
    '[INSPECT] HTTP:',
    response.status
  );

  const $ =
    cheerio.load(
      response.data
    );

  let targetRow = null;

  $('tr').each(
    (_, element) => {
      const text =
        $(element)
          .text()
          .replace(/\s+/g, ' ')
          .trim();

      if (
        text.includes(TARGET)
      ) {
        targetRow = element;
      }
    }
  );

  if (!targetRow) {
    throw new Error(
      'Target college row not found'
    );
  }

  const row =
    $(targetRow);

  console.log('');
  console.log('ROW FOUND');
  console.log('---------------------------------------');

  console.log(
    row.text()
      .replace(/\s+/g, ' ')
      .trim()
  );

  console.log('');
  console.log('---------------------------------------');
  console.log('CELLS');
  console.log('---------------------------------------');

  row.find('td').each(
    (index, element) => {
      console.log(
        index,
        $(element)
          .text()
          .replace(/\s+/g, ' ')
          .trim()
      );
    }
  );

  console.log('');
  console.log('---------------------------------------');
  console.log('LINKS');
  console.log('---------------------------------------');

  row.find('a').each(
    (index, element) => {
      console.log({
        index,

        text:
          $(element)
            .text()
            .replace(/\s+/g, ' ')
            .trim(),

        href:
          $(element).attr('href') ||
          null,

        id:
          $(element).attr('id') ||
          null,

        class:
          $(element).attr('class') ||
          null,

        onclick:
          $(element).attr('onclick') ||
          null,
      });
    }
  );

  console.log('');
  console.log('---------------------------------------');
  console.log('ALL ATTRIBUTES');
  console.log('---------------------------------------');

  row.find('*').each(
    (index, element) => {
      const attrs =
        element.attribs || {};

      const interesting =
        Object.entries(attrs)
          .filter(
            ([key]) =>
              key === 'href' ||
              key === 'onclick' ||
              key.startsWith('data-')
          );

      if (
        interesting.length > 0
      ) {
        console.log(
          element.tagName,
          Object.fromEntries(
            interesting
          )
        );
      }
    }
  );

  console.log('');
  console.log(
    'INSPECTION COMPLETE.'
  );

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch(
  (error) => {
    console.error(
      '[INSPECT] FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);
