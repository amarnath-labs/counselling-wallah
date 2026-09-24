import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const INPUT =
  path.resolve(
    './data/neet/state/bihar/2025/raw/round-1-2-combined-opening-closing-rank.pdf'
  );

const OUTPUT =
  path.resolve(
    './data/neet/state/bihar/2025/text/round-1-2-layout-debug.json'
  );

const pages = [];

const pagerender =
  async pageData => {

    const textContent =
      await pageData.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });

    const items =
      textContent.items.map(
        item => ({
          text:
            String(
              item.str || ''
            ).trim(),

          x:
            Number(
              item.transform?.[4] || 0
            ),

          y:
            Number(
              item.transform?.[5] || 0
            ),

          width:
            Number(
              item.width || 0
            ),

          height:
            Number(
              item.height || 0
            ),
        })
      )
      .filter(
        item =>
          item.text
      );

    pages.push(items);

    return '';
  };


await pdf(
  fs.readFileSync(INPUT),
  {
    pagerender,
  }
);


fs.writeFileSync(
  OUTPUT,
  JSON.stringify(
    pages,
    null,
    2
  ),
  'utf8'
);


/*
|--------------------------------------------------------------------------
| GROUP FIRST PAGE ITEMS BY Y COORDINATE
|--------------------------------------------------------------------------
*/

const first =
  pages[0] || [];

const rows =
  new Map();


for (
  const item of first
) {

  /*
  PDF text positions can differ by tiny decimals.
  Round Y so same visual row groups together.
  */

  const y =
    Math.round(
      item.y * 2
    ) / 2;

  if (
    !rows.has(y)
  ) {
    rows.set(
      y,
      []
    );
  }

  rows
    .get(y)
    .push(item);
}


const orderedRows =
  [
    ...rows.entries(),
  ]
    .sort(
      (
        [yA],
        [yB]
      ) =>
        yB - yA
    );


console.log(
  '\n========================================'
);

console.log(
  'BIHAR UGMAC PDF COORDINATE INSPECTION'
);

console.log(
  '========================================'
);


let shown = 0;


for (
  const [
    y,
    items
  ] of
  orderedRows
) {

  items.sort(
    (
      a,
      b
    ) =>
      a.x - b.x
  );


  const joined =
    items
      .map(
        item =>
          item.text
      )
      .join(' | ');


  if (
    /M\.?B\.?B\.?S|B\.?D\.?S|INSTITUTE|OPENING RANK/i.test(
      joined
    )
  ) {

    console.log(
      `\nY=${y}`
    );


    console.table(
      items.map(
        item => ({
          x:
            Math.round(
              item.x * 100
            ) / 100,

          text:
            item.text,
        })
      )
    );


    shown += 1;


    if (
      shown >= 12
    ) {
      break;
    }
  }
}


console.log(
  '\nLAYOUT JSON SAVED:'
);

console.log(
  OUTPUT
);
