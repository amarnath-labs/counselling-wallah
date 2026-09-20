import 'dotenv/config';

import axios from 'axios';
import * as cheerio from 'cheerio';

const NAAC_URL =
  'https://assessmentonline-basic.naac.gov.in/mcdengg/';

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('NAAC OFFICIAL PORTAL INSPECTOR');
  console.log('=======================================');
  console.log('');

  console.log('[NAAC] Downloading official portal...');
  console.log('[NAAC] URL:', NAAC_URL);

  const response = await axios.get(
    NAAC_URL,
    {
      timeout: 30000,

      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36',

        Accept:
          'text/html,application/xhtml+xml',
      },
    }
  );

  console.log(
    '[NAAC] HTTP status:',
    response.status
  );

  const html =
    String(response.data || '');

  console.log(
    '[NAAC] HTML length:',
    html.length
  );

  const $ =
    cheerio.load(html);

  console.log('');
  console.log('---------------------------------------');
  console.log('PAGE STRUCTURE');
  console.log('---------------------------------------');

  console.log(
    'Title:',
    $('title').text().trim()
  );

  console.log(
    'Tables:',
    $('table').length
  );

  console.log(
    'Forms:',
    $('form').length
  );

  console.log(
    'Inputs:',
    $('input').length
  );

  console.log(
    'Selects:',
    $('select').length
  );

  console.log(
    'Scripts:',
    $('script').length
  );

  console.log('');
  console.log('---------------------------------------');
  console.log('FORMS');
  console.log('---------------------------------------');

  $('form').each(
    (index, element) => {
      console.log({
        index,
        action:
          $(element).attr('action') ||
          null,

        method:
          $(element).attr('method') ||
          null,

        id:
          $(element).attr('id') ||
          null,
      });
    }
  );

  console.log('');
  console.log('---------------------------------------');
  console.log('INPUTS');
  console.log('---------------------------------------');

  $('input').each(
    (index, element) => {
      if (index >= 30) {
        return;
      }

      console.log({
        index,

        name:
          $(element).attr('name') ||
          null,

        id:
          $(element).attr('id') ||
          null,

        type:
          $(element).attr('type') ||
          null,
      });
    }
  );

  console.log('');
  console.log('---------------------------------------');
  console.log('SELECTS');
  console.log('---------------------------------------');

  $('select').each(
    (index, element) => {
      console.log({
        index,

        name:
          $(element).attr('name') ||
          null,

        id:
          $(element).attr('id') ||
          null,

        options:
          $(element)
            .find('option')
            .length,
      });
    }
  );

  console.log('');
  console.log('---------------------------------------');
  console.log('SCRIPT SOURCES');
  console.log('---------------------------------------');

  $('script[src]').each(
    (index, element) => {
      console.log(
        index,
        $(element).attr('src')
      );
    }
  );

  console.log('');
  console.log('NAAC inspection complete.');

  console.log(
    'IMPORTANT: Database has NOT been modified.'
  );

  console.log(
    'Existing NIRF data has NOT been modified.'
  );

  console.log(
    'Recommendation logic has NOT been modified.'
  );
}

main().catch(
  (error) => {
    console.error(
      '[NAAC] FAILED:',
      error.response?.status ||
        error.message
    );

    process.exitCode = 1;
  }
);