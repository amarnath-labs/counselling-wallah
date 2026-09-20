import 'dotenv/config';

import axios from 'axios';
import * as cheerio from 'cheerio';

const URL =
  'https://www.nirfindia.org/Rankings/2025/EngineeringRanking.html';

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('NIRF PLACEMENT SOURCE INSPECTOR');
  console.log('=======================================');
  console.log('');

  console.log('[INSPECT] Downloading NIRF Engineering page...');

  const response = await axios.get(URL, {
    timeout: 30000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  console.log('[INSPECT] HTTP:', response.status);

  const $ = cheerio.load(response.data);

  let targetRow = null;

  $('tr').each((index, element) => {
    const text = $(element)
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    if (
      text.includes(
        'Indian Institute of Technology Madras'
      )
    ) {
      targetRow = element;
    }
  });

  if (!targetRow) {
    throw new Error('IIT Madras row not found');
  }

  console.log('');
  console.log('IIT MADRAS ROW FOUND');
  console.log('---------------------------------------');

  const row = $(targetRow);

  console.log(
    row.text()
      .replace(/\s+/g, ' ')
      .trim()
  );

  console.log('');
  console.log('---------------------------------------');
  console.log('LINKS INSIDE ROW');
  console.log('---------------------------------------');

  row.find('a').each((index, element) => {
    console.log({
      index,
      text:
        $(element)
          .text()
          .replace(/\s+/g, ' ')
          .trim(),

      href:
        $(element).attr('href') || null,

      onclick:
        $(element).attr('onclick') || null,

      id:
        $(element).attr('id') || null,

      class:
        $(element).attr('class') || null,
    });
  });

  console.log('');
  console.log('---------------------------------------');
  console.log('DATA ATTRIBUTES');
  console.log('---------------------------------------');

  row.find('*').each((index, element) => {
    const attributes =
      element.attribs || {};

    const interesting =
      Object.entries(attributes)
        .filter(([key]) =>
          key.startsWith('data-') ||
          key === 'href' ||
          key === 'onclick'
        );

    if (interesting.length > 0) {
      console.log(
        element.tagName,
        Object.fromEntries(interesting)
      );
    }
  });

  console.log('');
  console.log('Inspection complete.');
  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}

main().catch((error) => {
  console.error(
    '[INSPECT] FAILED:',
    error.message
  );

  process.exitCode = 1;
});