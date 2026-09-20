import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx';

async function main() {

  console.log('\n========================================');
  console.log('TRUMARG JOSAA 2026 CURRENT OR-CR INSPECTOR');
  console.log('========================================\n');

  const response =
    await fetch(URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 TruMarg-Data-Audit/1.0',

        Accept:
          'text/html,application/xhtml+xml',
      },

      redirect:
        'follow',
    });

  console.log(
    'HTTP:',
    response.status,
    response.statusText
  );

  console.log(
    'Final URL:',
    response.url
  );

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status}`
    );
  }

  const html =
    await response.text();

  fs.writeFileSync(
    './josaa-2026-current-page.html',
    html,
    'utf8'
  );

  console.log(
    'HTML chars:',
    html.length
  );

  const hiddenNames = [
    '__VIEWSTATE',
    '__VIEWSTATEGENERATOR',
    '__EVENTVALIDATION',
    '__EVENTTARGET',
  ];

  for (const name of hiddenNames) {

    const regex =
      new RegExp(
        `name=["']${name}["'][^>]*value=["']([^"']*)`,
        'i'
      );

    const match =
      html.match(regex);

    console.log(
      name,
      match
        ? `FOUND (${match[1].length} chars)`
        : 'NOT FOUND'
    );
  }


  const selectRegex =
    /<select[^>]+(?:id|name)=["']([^"']+)["'][^>]*>/gi;

  const selects = [];

  let match;

  while (
    (match =
      selectRegex.exec(html)) !== null
  ) {
    selects.push(
      match[1]
    );
  }

  console.log(
    '\nSELECT CONTROLS'
  );

  console.table(
    [...new Set(selects)]
      .map(
        name => ({
          name,
        })
      )
  );


  /*
  |--------------------------------------------------------------------------
  | ROUND OPTIONS
  |--------------------------------------------------------------------------
  */

  const roundSelect =
    html.match(
      /<select[^>]+id=["'][^"']*ddlround[^"']*["'][^>]*>([\s\S]*?)<\/select>/i
    );

  if (roundSelect) {

    const options = [];

    const optionRegex =
      /<option[^>]*value=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;

    let option;

    while (
      (option =
        optionRegex.exec(
          roundSelect[1]
        )) !== null
    ) {

      options.push({
        value:
          option[1],

        label:
          option[2]
            .replace(
              /<[^>]+>/g,
              ''
            )
            .trim(),
      });
    }

    console.log(
      '\nROUND OPTIONS'
    );

    console.table(
      options
    );

  } else {

    console.log(
      '\nROUND SELECT NOT FOUND'
    );
  }


  console.log(
    '\nSaved: ./josaa-2026-current-page.html'
  );

  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );
}

main().catch(
  error => {

    console.error(
      '\nINSPECTION FAILED:\n',
      error
    );

    process.exit(1);
  }
);
