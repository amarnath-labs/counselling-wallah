import fs from 'fs';
import path from 'path';

const root =
  './frontend/src';

const extensions =
  new Set([
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
  ]);


function walk(dir) {
  const out = [];

  for (
    const item of
    fs.readdirSync(
      dir,
      {
        withFileTypes: true,
      }
    )
  ) {
    const full =
      path.join(
        dir,
        item.name
      );

    if (
      item.isDirectory()
    ) {
      out.push(
        ...walk(full)
      );

      continue;
    }

    if (
      extensions.has(
        path.extname(
          item.name
        )
      )
    ) {
      out.push(full);
    }
  }

  return out;
}


const replacements = [

  // arrows
  ['â†‘ ', ''],
  ['â†“ ', ''],
  ['â†’ ', ''],
  ['â† ', ''],

  // dashes
  ['â€”', '-'],
  ['â€“', '-'],

  // bullet / middle dot
  ['â€¢', ''],
  ['Â·', '-'],

  // quotes
  ['â€™', "'"],
  ['â€˜', "'"],
  ['â€œ', '"'],
  ['â€', '"'],

  // check/cross/warning style encoding garbage
  ['âœ…', ''],
  ['âœ”', ''],
  ['âœ•', ''],
  ['âŒ', ''],
  ['âš ', ''],

  // common double encoded fragments
  ['Ã¢â‚¬â€œ', '-'],
  ['Ã¢â‚¬â€', '-'],
  ['Ã¢â€ â€˜', ''],
  ['Ã¢â€ â€œ', ''],
  ['Ã¢â€ â€™', ''],

  // stray NBSP marker
  ['Â ', ' '],
];


let changedFiles = 0;


for (
  const file of
  walk(root)
) {
  let src =
    fs.readFileSync(
      file,
      'utf8'
    );

  const original =
    src;


  for (
    const [
      bad,
      good,
    ] of replacements
  ) {
    src =
      src
        .split(bad)
        .join(good);
  }


  /*
  |--------------------------------------------------------------------------
  | Counselling history trend:
  | no arrows/symbols, text only
  |--------------------------------------------------------------------------
  */

  src =
    src.replaceAll(
      "return '↑ More Accessible';",
      "return 'More Accessible';"
    );

  src =
    src.replaceAll(
      "return '↓ More Competitive';",
      "return 'More Competitive';"
    );


  /*
  |--------------------------------------------------------------------------
  | Broken em-dash fallbacks
  |--------------------------------------------------------------------------
  */

  src =
    src.replaceAll(
      "'â€”'",
      "'-'"
    );

  src =
    src.replaceAll(
      "'â€“'",
      "'-'"
    );


  if (
    src !==
    original
  ) {
    fs.writeFileSync(
      file,
      src,
      'utf8'
    );

    changedFiles += 1;

    console.log(
      'Fixed:',
      file
    );
  }
}


console.log(
  '\nChanged files:',
  changedFiles
);
