import fs from 'node:fs';

function decodeHtml(value = '') {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ');
}

function getAttr(tag, name) {
  const regex =
    new RegExp(
      `${name}\\s*=\\s*["']([^"']*)["']`,
      'i'
    );

  return (
    tag.match(regex)?.[1] ||
    ''
  );
}

function extractHiddenInputs(html) {
  const inputs =
    html.match(
      /<input\b[^>]*>/gi
    ) || [];

  return inputs
    .filter((tag) =>
      /type\s*=\s*["']hidden["']/i
        .test(tag)
    )
    .map((tag) => ({
      name:
        getAttr(tag, 'name'),

      id:
        getAttr(tag, 'id'),

      valueLength:
        getAttr(
          tag,
          'value'
        ).length,
    }))
    .filter(
      (row) =>
        row.name ||
        row.id
    );
}

function extractSelects(html) {
  const selects = [];

  const selectRegex =
    /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;

  let selectMatch;

  while (
    (
      selectMatch =
        selectRegex.exec(html)
    ) !== null
  ) {
    const openTag =
      `<select${selectMatch[1]}>`;

    const body =
      selectMatch[2];

    const options = [];

    const optionRegex =
      /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;

    let optionMatch;

    while (
      (
        optionMatch =
          optionRegex.exec(body)
      ) !== null
    ) {
      const optionTag =
        `<option${optionMatch[1]}>`;

      options.push({
        value:
          decodeHtml(
            getAttr(
              optionTag,
              'value'
            )
          ),

        text:
          decodeHtml(
            optionMatch[2]
              .replace(
                /<[^>]+>/g,
                ''
              )
              .replace(
                /\s+/g,
                ' '
              )
              .trim()
          ),

        selected:
          /\bselected\b/i.test(
            optionTag
          ),
      });
    }

    selects.push({
      name:
        getAttr(
          openTag,
          'name'
        ),

      id:
        getAttr(
          openTag,
          'id'
        ),

      options,
    });
  }

  return selects;
}

function extractButtons(html) {
  const controls =
    html.match(
      /<(?:input|button)\b[^>]*>/gi
    ) || [];

  return controls
    .map((tag) => {
      const type =
        getAttr(
          tag,
          'type'
        ).toLowerCase();

      if (
        type !== 'submit' &&
        type !== 'button'
      ) {
        return null;
      }

      return {
        type,
        name:
          getAttr(
            tag,
            'name'
          ),

        id:
          getAttr(
            tag,
            'id'
          ),

        value:
          decodeHtml(
            getAttr(
              tag,
              'value'
            )
          ),
      };
    })
    .filter(Boolean);
}

function inspectFile(label, path) {
  console.log(
    '\n========================================'
  );

  console.log(
    label
  );

  console.log(
    '========================================'
  );

  const html =
    fs.readFileSync(
      path,
      'utf8'
    );

  const form =
    html.match(
      /<form\b[^>]*>/i
    )?.[0];

  if (form) {
    console.log(
      '\nFORM'
    );

    console.log({
      action:
        getAttr(
          form,
          'action'
        ),

      method:
        getAttr(
          form,
          'method'
        ),

      id:
        getAttr(
          form,
          'id'
        ),

      name:
        getAttr(
          form,
          'name'
        ),
    });
  }

  console.log(
    '\nHIDDEN INPUTS'
  );

  console.table(
    extractHiddenInputs(
      html
    )
  );

  const selects =
    extractSelects(
      html
    );

  console.log(
    '\nSELECT CONTROLS:',
    selects.length
  );

  for (
    const select
    of selects
  ) {
    console.log(
      '\n----------------------------------------'
    );

    console.log(
      'SELECT'
    );

    console.log(
      'name:',
      select.name
    );

    console.log(
      'id:',
      select.id
    );

    console.log(
      'options:',
      select.options.length
    );

    console.table(
      select.options
    );
  }

  console.log(
    '\nBUTTONS'
  );

  console.table(
    extractButtons(
      html
    )
  );
}

inspectFile(
  'CSAB CURRENT',
  './tmp/csab/current.html'
);

inspectFile(
  'CSAB ARCHIVE',
  './tmp/csab/archive.html'
);
