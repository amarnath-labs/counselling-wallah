import fs from 'node:fs';

const URL =
  'https://josaa.admissions.nic.in/applicant/seatmatrix/openingclosingrankarchieve.aspx';

async function main() {
  console.log('\n========================================');
  console.log('TRUMARG JOSAA ARCHIVE INSPECTOR');
  console.log('========================================\n');

  const response =
    await fetch(URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 TruMarg-Data-Audit/1.0',
        Accept:
          'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
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
      `JoSAA archive request failed: ${response.status}`
    );
  }

  const html =
    await response.text();

  fs.writeFileSync(
    './josaa-archive-page.html',
    html,
    'utf8'
  );

  console.log(
    'HTML chars:',
    html.length
  );

  console.log(
    'Saved:',
    './josaa-archive-page.html'
  );

  const hiddenFields = [
    '__VIEWSTATE',
    '__VIEWSTATEGENERATOR',
    '__EVENTVALIDATION',
    '__EVENTTARGET',
  ];

  for (const field of hiddenFields) {
    const regex =
      new RegExp(
        `name=["']${field}["'][^>]*value=["']([^"']*)`,
        'i'
      );

    const match =
      html.match(regex);

    console.log(
      field,
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
    [...new Set(selects)].map(
      (name) => ({
        name,
      })
    )
  );

  const inputRegex =
    /<input[^>]+(?:id|name)=["']([^"']+)["'][^>]*>/gi;

  const inputs = [];

  while (
    (match =
      inputRegex.exec(html)) !== null
  ) {
    inputs.push(
      match[1]
    );
  }

  console.log(
    '\nINPUT CONTROLS'
  );

  console.table(
    [...new Set(inputs)]
      .slice(0, 100)
      .map(
        (name) => ({
          name,
        })
      )
  );

  console.log(
    '\nDONE — no database changes were made.'
  );
}

main().catch(
  (error) => {
    console.error(
      '\nINSPECTION FAILED:\n',
      error
    );

    process.exit(1);
  }
);
