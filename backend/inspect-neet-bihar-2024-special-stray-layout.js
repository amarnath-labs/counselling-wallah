import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const INPUT =
  path.resolve(
    './data/neet/state/bihar/2024/raw/special-stray-opening-closing-rank.pdf'
  );

const OUTPUT =
  path.resolve(
    './data/neet/state/bihar/2024/text/special-stray-layout-debug.json'
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
      textContent.items
        .map(
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


const first =
  pages[0] || [];

const groups =
  new Map();


for (
  const item of first
) {

  const y =
    Math.round(
      item.y * 2
    ) / 2;

  if (!groups.has(y)) {
    groups.set(
      y,
      []
    );
  }

  groups.get(y).push(item);
}


const ordered =
  [
    ...groups.entries(),
  ]
    .sort(
      (
        [a],
        [b]
      ) =>
        b - a
    );


console.log(
  '\n========================================'
);

console.log(
  'BIHAR UGMAC 2024 SPECIAL STRAY LAYOUT'
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
  ordered
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
  '\nLAYOUT JSON:'
);

console.log(
  OUTPUT
);
