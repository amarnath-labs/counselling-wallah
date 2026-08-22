import axios from 'axios';
import * as cheerio from 'cheerio';

const URL =
  'https://josaa.admissions.nic.in/applicant/seatmatrix/currentorcr.aspx';

const client = axios.create({
  baseURL: 'https://josaa.admissions.nic.in',
  withCredentials: true,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0 Safari/537.36',
  },
});

function hiddenFields($) {
  const data = {};

  $('input[type="hidden"]').each((_, el) => {
    const name = $(el).attr('name');

    if (name) {
      data[name] = $(el).attr('value') || '';
    }
  });

  return data;
}

function options($, selector) {
  const result = [];

  $(selector + ' option').each((_, el) => {
    result.push({
      value: $(el).attr('value') || '',
      text: $(el).text().trim(),
    });
  });

  return result;
}

async function main() {
  console.log('========================================');
  console.log('JOSAA POSTBACK TEST');
  console.log('========================================');

  console.log('\nGET:', URL);

  const response = await client.get(URL);

  console.log('HTTP STATUS:', response.status);
  console.log('HTML SIZE:', response.data.length);

  const cookies = response.headers['set-cookie'] || [];

  console.log('COOKIES:', cookies.length);

  const $ = cheerio.load(response.data);

  console.log('\nInitial ROUND options:');

  console.table(
    options(
      $,
      '#ctl00_ContentPlaceHolder1_ddlroundno'
    )
  );

  console.log('\nInitial INSTITUTE TYPE options:');

  console.table(
    options(
      $,
      '#ctl00_ContentPlaceHolder1_ddlInstype'
    )
  );

  const form = hiddenFields($);

  console.log(
    '\nHidden fields:',
    Object.keys(form).length
  );

  console.log(
    Object.keys(form)
  );

  /*
   * ASP.NET Round postback
   */

  form['__EVENTTARGET'] =
    'ctl00$ContentPlaceHolder1$ddlroundno';

  form['__EVENTARGUMENT'] = '';

  form[
    'ctl00$ContentPlaceHolder1$ddlroundno'
  ] = '1';

  console.log('\n========================================');
  console.log('POSTING ROUND 1');
  console.log('========================================');

  const postResponse = await client.post(
    '/applicant/seatmatrix/currentorcr.aspx',
    new URLSearchParams(form).toString(),
    {
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',

        Referer: URL,

        Origin:
          'https://josaa.admissions.nic.in',
      },
    }
  );

  console.log(
    'POST STATUS:',
    postResponse.status
  );

  console.log(
    'POST RESPONSE SIZE:',
    postResponse.data.length
  );

  /*
   * Save response for debugging
   */

  const fs = await import('node:fs/promises');

  await fs.writeFile(
    './data/official/josaa-round1-test.html',
    postResponse.data,
    'utf8'
  );

  console.log(
    'Saved:',
    './data/official/josaa-round1-test.html'
  );

  const $2 = cheerio.load(postResponse.data);

  console.log(
    '\n========================================'
  );
  console.log(
    'INSTITUTE TYPES AFTER ROUND 1'
  );
  console.log(
    '========================================'
  );

  console.table(
    options(
      $2,
      '#ctl00_ContentPlaceHolder1_ddlInstype'
    )
  );

  console.log(
    '\n========================================'
  );
  console.log(
    'INSTITUTES AFTER ROUND 1'
  );
  console.log(
    '========================================'
  );

  console.table(
    options(
      $2,
      '#ctl00_ContentPlaceHolder1_ddlInstitute'
    ).slice(0, 30)
  );

  console.log(
    '\n========================================'
  );
  console.log(
    'BRANCHES AFTER ROUND 1'
  );
  console.log(
    '========================================'
  );

  console.table(
    options(
      $2,
      '#ctl00_ContentPlaceHolder1_ddlBranch'
    ).slice(0, 30)
  );

  console.log('\nDONE');
}

main().catch((error) => {
  console.error('\n========================================');
  console.error('JOSAA TEST FAILED');
  console.error('========================================');

  console.error(error.message);

  if (error.response) {
    console.error(
      'HTTP:',
      error.response.status
    );

    console.error(
      'Response:',
      String(error.response.data).slice(0, 2000)
    );
  }

  process.exitCode = 1;
});