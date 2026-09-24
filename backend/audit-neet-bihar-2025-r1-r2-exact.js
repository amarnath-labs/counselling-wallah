import fs from 'fs';

const layoutFile =
  './data/neet/state/bihar/2025/text/round-1-2-layout-debug.json';

const parsedFile =
  './data/neet/state/bihar/2025/parsed/round-1-2-combined-orcr.json';


const pages =
  JSON.parse(
    fs.readFileSync(
      layoutFile,
      'utf8'
    )
  );

const parsed =
  JSON.parse(
    fs.readFileSync(
      parsedFile,
      'utf8'
    )
  );


function clean(value) {
  return String(
    value || ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}


function keyPart(value) {
  return clean(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}


function normalizeCourse(value) {

  const v =
    keyPart(value);

  if (v === 'MBBS') {
    return 'MBBS';
  }

  if (v === 'BDS') {
    return 'BDS';
  }

  return null;
}


function numberInRange(
  items,
  minX,
  maxX
) {

  const item =
    items.find(
      item =>
        item.x >= minX &&
        item.x < maxX &&
        /^\d+(?:\.\d+)?$/.test(
          clean(item.text)
        )
    );

  return item
    ? Number(item.text)
    : null;
}


const parsedKeys =
  new Set(
    parsed.map(
      row =>
        [
          keyPart(row.institute),
          row.course,
          row.seatType,
          row.category,
          row.neetOpeningRank,
          row.neetClosingRank,
        ].join('|')
    )
  );


const sourceRows = [];


pages.forEach(
  (
    pageItems,
    pageIndex
  ) => {

    const groups =
      new Map();


    for (const item of pageItems) {

      const y =
        Math.round(
          Number(item.y) * 2
        ) / 2;


      if (!groups.has(y)) {
        groups.set(
          y,
          []
        );
      }


      groups.get(y).push({
        ...item,
        text:
          clean(item.text),
      });
    }


    for (
      const [
        y,
        items
      ] of
      groups.entries()
    ) {

      items.sort(
        (
          a,
          b
        ) =>
          a.x - b.x
      );


      const institute =
        clean(
          items
            .filter(
              item =>
                item.x < 200
            )
            .map(
              item =>
                item.text
            )
            .join(' ')
        );


      const descriptor =
        clean(
          items
            .filter(
              item =>
                item.x >= 200 &&
                item.x < 360
            )
            .map(
              item =>
                item.text
            )
            .join(' ')
        );


      if (
        !/M\.?B\.?B\.?S|B\.?D\.?S/i.test(
          descriptor
        )
      ) {
        continue;
      }


      /*
      Broad descriptor matcher.
      Do NOT whitelist category yet.
      */

      const match =
        descriptor.match(
          /^(M\.?B\.?B\.?S\.?|B\.?D\.?S\.?)\s*(General|Female)\s*([A-Z0-9-]+)$/i
        );


      if (!match) {

        sourceRows.push({
          page:
            pageIndex + 1,

          y,

          institute,

          descriptor,

          status:
            'DESCRIPTOR_NOT_PARSED',

          raw:
            items
              .map(
                item =>
                  `${Math.round(item.x * 100) / 100}:${item.text}`
              )
              .join(' | ')
        });

        continue;
      }


      const course =
        normalizeCourse(
          match[1]
        );

      const seatType =
        /^female$/i.test(
          match[2]
        )
          ? 'Female'
          : 'General';

      const category =
        match[3]
          .toUpperCase();


      const neetOpen =
        numberInRange(
          items,
          350,
          420
        );

      const neetClose =
        numberInRange(
          items,
          420,
          490
        );


      const key =
        [
          keyPart(institute),
          course,
          seatType,
          category,
          neetOpen,
          neetClose,
        ].join('|');


      sourceRows.push({
        page:
          pageIndex + 1,

        y,

        institute,

        course,

        seatType,

        category,

        neetOpen,

        neetClose,

        status:
          parsedKeys.has(key)
            ? 'PARSED'
            : 'MISSING_FROM_OUTPUT',

        raw:
          items
            .map(
              item =>
                `${Math.round(item.x * 100) / 100}:${item.text}`
            )
            .join(' | ')
      });
    }
  }
);


const missing =
  sourceRows.filter(
    row =>
      row.status !==
      'PARSED'
  );


console.log(
  '\n========================================'
);

console.log(
  'BIHAR 2025 EXACT SOURCE RECONCILIATION'
);

console.log(
  '========================================'
);

console.log(
  'Coordinate MBBS/BDS rows:',
  sourceRows.length
);

console.log(
  'Successfully represented:',
  sourceRows.filter(
    row =>
      row.status ===
      'PARSED'
  ).length
);

console.log(
  'Not represented:',
  missing.length
);


console.log(
  '\n===== NOT REPRESENTED ====='
);

console.log(
  JSON.stringify(
    missing,
    null,
    2
  )
);


console.log(
  '\n===== SOURCE CATEGORY COUNTS ====='
);

const categories = {};

for (const row of sourceRows) {

  const category =
    row.category ||
    'UNPARSED';

  categories[category] =
    (
      categories[category] ||
      0
    ) + 1;
}

console.table(
  Object.entries(
    categories
  )
    .sort(
      (
        a,
        b
      ) =>
        a[0].localeCompare(
          b[0]
        )
    )
    .map(
      (
        [
          category,
          count
        ]
      ) => ({
        category,
        count
      })
    )
);


fs.writeFileSync(
  './data/neet/state/bihar/2025/audit/round-1-2-source-reconciliation.json',

  JSON.stringify(
    {
      sourceCount:
        sourceRows.length,

      parsedCount:
        parsed.length,

      missingCount:
        missing.length,

      missing,

      sourceRows,
    },
    null,
    2
  ),

  'utf8'
);


console.log(
  '\nAudit saved to:'
);

console.log(
  'data/neet/state/bihar/2025/audit/round-1-2-source-reconciliation.json'
);
