import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const INPUT =
  path.resolve(
    './data/neet/state/bihar/2025/raw/round-1-2-combined-opening-closing-rank.pdf'
  );

const OUTPUT_DIR =
  path.resolve(
    './data/neet/state/bihar/2025/parsed'
  );

fs.mkdirSync(
  OUTPUT_DIR,
  {
    recursive: true,
  }
);

const rows = [];
const rejected = [];


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

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
        /\s+/g,
        ''
      );

  if (
    /^M\.?B\.?B\.?S\.?$/.test(
      compact
    )
  ) {
    return 'MBBS';
  }

  if (
    /^B\.?D\.?S\.?$/.test(
      compact
    )
  ) {
    return 'BDS';
  }

  return null;
}


function numberFromItem(
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

  return Number.isFinite(value)
    ? value
    : null;
}


/*
|--------------------------------------------------------------------------
| PDF PAGE RENDER
|--------------------------------------------------------------------------
*/

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
          })
        )
        .filter(
          item =>
            item.text
        );


    /*
    |--------------------------------------------------------------------------
    | GROUP ITEMS BY VISUAL Y POSITION
    |--------------------------------------------------------------------------
    */

    const visualRows =
      new Map();


    for (
      const item of items
    ) {

      const y =
        Math.round(
          item.y * 2
        ) / 2;


      if (
        !visualRows.has(y)
      ) {
        visualRows.set(
          y,
          []
        );
      }


      visualRows
        .get(y)
        .push(item);
    }


    const ordered =
      [
        ...visualRows.entries(),
      ]
        .sort(
          (
            [yA],
            [yB]
          ) =>
            yB - yA
        );


    /*
    |--------------------------------------------------------------------------
    | PARSE EACH VISUAL TABLE ROW
    |--------------------------------------------------------------------------
    */

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


      const joined =
        rowItems
          .map(
            item =>
              item.text
          )
          .join(' ');


      /*
      Skip headers/noise
      */

      if (
        /INSTITUTE.*COURSE/i.test(
          joined
        ) ||
        /OPENING AND CLOSING RANK/i.test(
          joined
        ) ||
        /Page No/i.test(
          joined
        )
      ) {
        continue;
      }


      /*
      |--------------------------------------------------------------------------
      | INSTITUTE
      |--------------------------------------------------------------------------
      |
      | Everything visually before the course column.
      |
      */

      const institute =
        clean(
          rowItems
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


      /*
      |--------------------------------------------------------------------------
      | COURSE + SEAT TYPE + CATEGORY
      |--------------------------------------------------------------------------
      */

      const descriptor =
        clean(
          rowItems
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


      /*
      Accept:
        M.B.B.S. General UR
        M.B.B.S. Female SC
        B.D.S.General UR
        B.D.S.Female EWS
      */

      const descriptorMatch =
        descriptor.match(
          /^(M\.?B\.?B\.?S\.?|B\.?D\.?S\.?)\s*(General|Female)\s*(UR|ST|SC|RCG|EWS|EBC|DQ|BC|NRI|MM|SM|WQ)$/i
        );


      /*
      Skip non-MBBS/BDS such as B.V.Sc.
      */

      if (
        !descriptorMatch
      ) {

        if (
          /M\.?B\.?B\.?S|B\.?D\.?S/i.test(
            descriptor
          )
        ) {
          rejected.push({
            page:
              pageNumber,

            y,

            institute,

            descriptor,

            raw:
              joined,

            reason:
              'MBBS/BDS descriptor could not be parsed',
          });
        }

        continue;
      }


      const course =
        normalizeCourse(
          descriptorMatch[1]
        );

      const seatType =
        descriptorMatch[2]
          .replace(
            /^general$/i,
            'General'
          )
          .replace(
            /^female$/i,
            'Female'
          );

      const category =
        descriptorMatch[3]
          .toUpperCase();


      /*
      |--------------------------------------------------------------------------
      | NUMERIC COLUMN EXTRACTION BY X COORDINATE
      |--------------------------------------------------------------------------
      */

      const numericItems =
        rowItems
          .map(
            item => ({
              ...item,

              number:
                numberFromItem(
                  item
                ),
            })
          )
          .filter(
            item =>
              item.number !== null
          );


      function valueInRange(
        minX,
        maxX
      ) {

        const found =
          numericItems.find(
            item =>
              item.x >= minX &&
              item.x < maxX
          );

        return found
          ? found.number
          : null;
      }


      const neetOpeningRank =
        valueInRange(
          350,
          420
        );

      const neetClosingRank =
        valueInRange(
          420,
          490
        );

      const urOpeningRank =
        valueInRange(
          490,
          560
        );

      const urClosingRank =
        valueInRange(
          560,
          630
        );

      const categoryOpeningRank =
        valueInRange(
          630,
          700
        );

      const categoryClosingRank =
        valueInRange(
          700,
          780
        );


      /*
      |--------------------------------------------------------------------------
      | REQUIRED DATA VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        !institute ||
        !course ||
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

          descriptor,

          neetOpeningRank,

          neetClosingRank,

          urOpeningRank,

          urClosingRank,

          categoryOpeningRank,

          categoryClosingRank,

          raw:
            joined,

          reason:
            'Required institute/course/NEET rank fields missing',
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

          descriptor,

          neetOpeningRank,

          neetClosingRank,

          raw:
            joined,

          reason:
            'NEET opening rank is greater than closing rank',
        });

        continue;
      }


      /*
      |--------------------------------------------------------------------------
      | NORMALIZED ROW
      |--------------------------------------------------------------------------
      */

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
          2025,

        round:
          'Combined Round 1 + Round 2',

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
          'round-1-2-combined-opening-closing-rank.pdf',

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

    const instituteCompare =
      a.institute.localeCompare(
        b.institute
      );

    if (
      instituteCompare !== 0
    ) {
      return instituteCompare;
    }


    const courseCompare =
      a.course.localeCompare(
        b.course
      );

    if (
      courseCompare !== 0
    ) {
      return courseCompare;
    }


    const categoryCompare =
      a.category.localeCompare(
        b.category
      );

    if (
      categoryCompare !== 0
    ) {
      return categoryCompare;
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
      row.year,
      row.round,
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
          count,
        ]
      ) =>
        count > 1
    );


/*
|--------------------------------------------------------------------------
| WRITE OUTPUTS
|--------------------------------------------------------------------------
*/

const outputFile =
  path.join(
    OUTPUT_DIR,
    'round-1-2-combined-orcr.json'
  );

const rejectedFile =
  path.join(
    OUTPUT_DIR,
    'round-1-2-combined-rejected.json'
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


/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

const courseCounts =
  rows.reduce(
    (
      acc,
      row
    ) => {

      acc[row.course] =
        (
          acc[row.course] ||
          0
        ) + 1;

      return acc;
    },
    {}
  );


const categoryCounts =
  rows.reduce(
    (
      acc,
      row
    ) => {

      acc[row.category] =
        (
          acc[row.category] ||
          0
        ) + 1;

      return acc;
    },
    {}
  );


const seatTypeCounts =
  rows.reduce(
    (
      acc,
      row
    ) => {

      acc[row.seatType] =
        (
          acc[row.seatType] ||
          0
        ) + 1;

      return acc;
    },
    {}
  );


console.log(
  '\n========================================'
);

console.log(
  'BIHAR UGMAC 2025 COORDINATE PARSE'
);

console.log(
  '========================================'
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
    courseCounts
  ).map(
    (
      [
        course,
        count,
      ]
    ) => ({
      course,
      count,
    })
  )
);


console.log(
  '\nSEAT TYPES'
);

console.table(
  Object.entries(
    seatTypeCounts
  ).map(
    (
      [
        seatType,
        count,
      ]
    ) => ({
      seatType,
      count,
    })
  )
);


console.log(
  '\nCATEGORIES'
);

console.table(
  Object.entries(
    categoryCounts
  ).map(
    (
      [
        category,
        count,
      ]
    ) => ({
      category,
      count,
    })
  )
);


console.log(
  '\nSAMPLE FIRST 10'
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
  '\nOUTPUT:',
  outputFile
);
