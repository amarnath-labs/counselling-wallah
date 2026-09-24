import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const INPUT =
  path.resolve(
    './data/neet/state/bihar/2024/raw/special-stray-opening-closing-rank.pdf'
  );

const OUTPUT_DIR =
  path.resolve(
    './data/neet/state/bihar/2024/parsed'
  );

const AUDIT_DIR =
  path.resolve(
    './data/neet/state/bihar/2024/audit'
  );

fs.mkdirSync(
  OUTPUT_DIR,
  {
    recursive: true,
  }
);

fs.mkdirSync(
  AUDIT_DIR,
  {
    recursive: true,
  }
);

const rows = [];
const rejected = [];
const sourceRows = [];


function clean(
  value
) {
  return String(
    value || ''
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function normalizeCourse(
  value
) {

  const compact =
    clean(value)
      .toUpperCase()
      .replace(
        /[^A-Z]/g,
        ''
      );

  if (
    compact === 'MBBS'
  ) {
    return 'MBBS';
  }

  if (
    compact === 'BDS'
  ) {
    return 'BDS';
  }

  return null;
}


function numericValue(
  item
) {

  const text =
    clean(
      item?.text
    );

  if (
    !/^\d+(?:\.\d+)?$/.test(
      text
    )
  ) {
    return null;
  }

  const value =
    Number(text);

  return Number.isFinite(
    value
  )
    ? value
    : null;
}


function valueInRange(
  items,
  minX,
  maxX
) {

  const found =
    items.find(
      item =>
        item.x >= minX &&
        item.x < maxX &&
        numericValue(item) !== null
    );

  return found
    ? numericValue(
        found
      )
    : null;
}


let pageNumber = 0;


const pagerender =
  async pageData => {

    pageNumber += 1;

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
              clean(
                item.str
              ),

            x:
              Number(
                item.transform?.[4] ||
                0
              ),

            y:
              Number(
                item.transform?.[5] ||
                0
              ),
          })
        )
        .filter(
          item =>
            item.text
        );


    const groups =
      new Map();


    for (
      const item of items
    ) {

      const y =
        Math.round(
          item.y * 2
        ) / 2;


      if (
        !groups.has(
          y
        )
      ) {
        groups.set(
          y,
          []
        );
      }


      groups
        .get(y)
        .push(item);
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


    for (
      const [
        y,
        rowItems
      ] of ordered
    ) {

      rowItems.sort(
        (
          a,
          b
        ) =>
          a.x - b.x
      );


      const raw =
        rowItems
          .map(
            item =>
              item.text
          )
          .join(' ');


      if (
        /INSTITUTE|OPENING AND CLOSING RANK|Page No/i.test(
          raw
        )
      ) {
        continue;
      }


      /*
      |--------------------------------------------------------------------------
      | COURSE
      |--------------------------------------------------------------------------
      */

      const courseItem =
        rowItems.find(
          item =>
            item.x >= 275 &&
            item.x < 335
        );


      const course =
        normalizeCourse(
          courseItem?.text
        );


      if (!course) {
        continue;
      }


      /*
      Every MBBS/BDS coordinate row becomes a source row.
      */

      sourceRows.push({
        page:
          pageNumber,

        y,

        raw:
          rowItems
            .map(
              item =>
                `${Math.round(item.x * 100) / 100}:${item.text}`
            )
            .join(' | ')
      });


      /*
      |--------------------------------------------------------------------------
      | INSTITUTE
      |--------------------------------------------------------------------------
      */

      const institute =
        clean(
          rowItems
            .filter(
              item =>
                item.x < 275
            )
            .map(
              item =>
                item.text
            )
            .join(' ')
        );


      /*
      |--------------------------------------------------------------------------
      | SEAT TYPE
      |--------------------------------------------------------------------------
      */

      const seatType =
        clean(
          rowItems.find(
            item =>
              item.x >= 335 &&
              item.x < 390
          )?.text
        );


      /*
      |--------------------------------------------------------------------------
      | CATEGORY
      |--------------------------------------------------------------------------
      |
      | No hard-coded whitelist.
      | Preserve exact BCECEB value.
      |--------------------------------------------------------------------------
      */

      const category =
        clean(
          rowItems.find(
            item =>
              item.x >= 390 &&
              item.x < 445
          )?.text
        );


      /*
      |--------------------------------------------------------------------------
      | RANK COLUMNS
      |--------------------------------------------------------------------------
      */

      const neetOpeningRank =
        valueInRange(
          rowItems,
          445,
          500
        );

      const neetClosingRank =
        valueInRange(
          rowItems,
          500,
          555
        );

      const urOpeningRank =
        valueInRange(
          rowItems,
          555,
          620
        );

      const urClosingRank =
        valueInRange(
          rowItems,
          620,
          685
        );

      const categoryOpeningRank =
        valueInRange(
          rowItems,
          685,
          755
        );

      const categoryClosingRank =
        valueInRange(
          rowItems,
          755,
          830
        );


      /*
      |--------------------------------------------------------------------------
      | VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        !institute ||
        !seatType ||
        !category ||
        !Number.isFinite(
          neetOpeningRank
        ) ||
        !Number.isFinite(
          neetClosingRank
        )
      ) {

        rejected.push({
          page:
            pageNumber,

          y,

          institute,

          course,

          seatType,

          category,

          neetOpeningRank,

          neetClosingRank,

          urOpeningRank,

          urClosingRank,

          categoryOpeningRank,

          categoryClosingRank,

          raw,

          reason:
            'Required field missing',
        });

        continue;
      }


      if (
        neetOpeningRank >
        neetClosingRank
      ) {

        rejected.push({
          page:
            pageNumber,

          y,

          institute,

          course,

          seatType,

          category,

          neetOpeningRank,

          neetClosingRank,

          raw,

          reason:
            'NEET opening rank greater than closing rank',
        });

        continue;
      }


      rows.push({
        exam:
          'NEET UG',

        counsellingType:
          'STATE',

        state:
          'Bihar',

        authority:
          'BCECEB',

        counselling:
          'UGMAC',

        year:
          2024,

        round:
          'Special Stray Vacancy',

        institute,

        course,

        seatType,

        category,

        quota:
          'Bihar State Counselling',

        neetOpeningRank,

        neetClosingRank,

        urOpeningRank,

        urClosingRank,

        categoryOpeningRank,

        categoryClosingRank,

        sourceDocument:
          'special-stray-opening-closing-rank.pdf',

        sourceType:
          'official-opening-closing-rank',

        sourceAuthority:
          'BCECEB',

        verified:
          true,
      });
    }


    return '';
  };


await pdf(
  fs.readFileSync(
    INPUT
  ),
  {
    pagerender,
  }
);


/*
|--------------------------------------------------------------------------
| SORT
|--------------------------------------------------------------------------
*/

rows.sort(
  (
    a,
    b
  ) => {

    const institution =
      a.institute.localeCompare(
        b.institute
      );

    if (
      institution !== 0
    ) {
      return institution;
    }


    const course =
      a.course.localeCompare(
        b.course
      );

    if (
      course !== 0
    ) {
      return course;
    }


    const category =
      a.category.localeCompare(
        b.category
      );

    if (
      category !== 0
    ) {
      return category;
    }


    return (
      a.neetOpeningRank -
      b.neetOpeningRank
    );
  }
);


/*
|--------------------------------------------------------------------------
| DUPLICATE CHECK
|--------------------------------------------------------------------------
*/

const duplicateMap =
  new Map();


for (
  const row of rows
) {

  const key =
    [
      row.institute,
      row.course,
      row.seatType,
      row.category,
      row.neetOpeningRank,
      row.neetClosingRank,
    ].join('||');


  duplicateMap.set(
    key,
    (
      duplicateMap.get(key) ||
      0
    ) + 1
  );
}


const duplicates =
  [
    ...duplicateMap.entries(),
  ]
    .filter(
      (
        [
          ,
          count
        ]
      ) =>
        count > 1
    );


/*
|--------------------------------------------------------------------------
| OUTPUT
|--------------------------------------------------------------------------
*/

const outputFile =
  path.join(
    OUTPUT_DIR,
    'special-stray-orcr.json'
  );

const rejectedFile =
  path.join(
    OUTPUT_DIR,
    'special-stray-rejected.json'
  );

const auditFile =
  path.join(
    AUDIT_DIR,
    'special-stray-source-reconciliation.json'
  );


fs.writeFileSync(
  outputFile,
  JSON.stringify(
    rows,
    null,
    2
  ),
  'utf8'
);


fs.writeFileSync(
  rejectedFile,
  JSON.stringify(
    rejected,
    null,
    2
  ),
  'utf8'
);


const complete =
  sourceRows.length ===
    rows.length &&
  rejected.length ===
    0 &&
  duplicates.length ===
    0;


fs.writeFileSync(
  auditFile,
  JSON.stringify(
    {
      sourceRows:
        sourceRows.length,

      parsedRows:
        rows.length,

      rejectedRows:
        rejected.length,

      duplicateGroups:
        duplicates.length,

      complete,

      rejected,

      duplicates,
    },
    null,
    2
  ),
  'utf8'
);


/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

function countBy(
  field
) {

  return rows.reduce(
    (
      acc,
      row
    ) => {

      const key =
        row[field] ||
        'NULL';

      acc[key] =
        (
          acc[key] ||
          0
        ) + 1;

      return acc;
    },
    {}
  );
}


console.log(
  '\n========================================'
);

console.log(
  'BIHAR UGMAC 2024 SPECIAL STRAY PARSE'
);

console.log(
  '========================================'
);

console.log(
  'Coordinate MBBS/BDS source rows:',
  sourceRows.length
);

console.log(
  'Parsed MBBS/BDS rows:',
  rows.length
);

console.log(
  'Rejected MBBS/BDS rows:',
  rejected.length
);

console.log(
  'Duplicate groups:',
  duplicates.length
);


console.log(
  '\nCOURSES'
);

console.table(
  Object.entries(
    countBy(
      'course'
    )
  ).map(
    (
      [
        course,
        count
      ]
    ) => ({
      course,
      count
    })
  )
);


console.log(
  '\nCATEGORIES'
);

console.table(
  Object.entries(
    countBy(
      'category'
    )
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


console.log(
  '\nFIRST 10 ROWS'
);

console.table(
  rows
    .slice(
      0,
      10
    )
    .map(
      row => ({
        institute:
          row.institute,

        course:
          row.course,

        seatType:
          row.seatType,

        category:
          row.category,

        neetOpen:
          row.neetOpeningRank,

        neetClose:
          row.neetClosingRank,

        urOpen:
          row.urOpeningRank,

        urClose:
          row.urClosingRank,

        catOpen:
          row.categoryOpeningRank,

        catClose:
          row.categoryClosingRank,
      })
    )
);


console.log(
  '\n========================================'
);

console.log(
  complete
    ? 'SPECIAL STRAY SOURCE RECONCILIATION: PASS'
    : 'SPECIAL STRAY SOURCE RECONCILIATION: FAIL'
);

console.log(
  '========================================'
);

if (
  rejected.length
) {

  console.log(
    '\nREJECTED ROWS'
  );

  console.log(
    JSON.stringify(
      rejected,
      null,
      2
    )
  );
}
