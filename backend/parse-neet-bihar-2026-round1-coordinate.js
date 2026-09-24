import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const INPUT =
  path.resolve(
    './data/neet/state/bihar/2026/raw/round-1-opening-closing-rank.pdf'
  );

const OUTPUT_DIR =
  path.resolve(
    './data/neet/state/bihar/2026/parsed'
  );

const AUDIT_DIR =
  path.resolve(
    './data/neet/state/bihar/2026/audit'
  );

const TEXT_DIR =
  path.resolve(
    './data/neet/state/bihar/2026/text'
  );

for (
  const directory of [
    OUTPUT_DIR,
    AUDIT_DIR,
    TEXT_DIR,
  ]
) {
  fs.mkdirSync(
    directory,
    {
      recursive: true,
    }
  );
}


if (
  !fs.existsSync(INPUT)
) {
  throw new Error(
    `2026 Round 1 PDF not found:\n${INPUT}`
  );
}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function clean(
  value
) {
  return String(
    value ?? ''
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

  const value =
    clean(
      item?.text
    );

  if (
    !/^\d+(?:\.\d+)?$/.test(
      value
    )
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}


function round2(
  value
) {
  return (
    Math.round(
      value * 100
    ) / 100
  );
}


/*
|--------------------------------------------------------------------------
| LOAD PDF COORDINATES
|--------------------------------------------------------------------------
*/

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

            width:
              Number(
                item.width ||
                0
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
  fs.readFileSync(
    INPUT
  ),
  {
    pagerender,
  }
);


/*
|--------------------------------------------------------------------------
| CONVERT PAGE ITEMS TO VISUAL ROWS
|--------------------------------------------------------------------------
*/

const visualRows = [];


pages.forEach(
  (
    pageItems,
    pageIndex
  ) => {

    const groups =
      new Map();


    for (
      const item of pageItems
    ) {

      const y =
        Math.round(
          item.y * 2
        ) / 2;


      if (
        !groups.has(y)
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


    for (
      const [
        y,
        items
      ] of groups.entries()
    ) {

      items.sort(
        (
          a,
          b
        ) =>
          a.x - b.x
      );


      visualRows.push({
        page:
          pageIndex + 1,

        y,

        items,

        raw:
          items
            .map(
              item =>
                item.text
            )
            .join(' ')
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| FIND MBBS / BDS SOURCE ROWS
|--------------------------------------------------------------------------
*/

const medicalSourceRows = [];


for (
  const visualRow of
  visualRows
) {

  const {
    items,
  } =
    visualRow;


  const courseIndex =
    items.findIndex(
      item =>
        normalizeCourse(
          item.text
        ) !== null
    );


  if (
    courseIndex < 0
  ) {
    continue;
  }


  const course =
    normalizeCourse(
      items[
        courseIndex
      ].text
    );


  /*
  Course token found.

  Expected visual sequence:

  Institute
  Course
  Seat Type
  Category
  numeric rank columns...
  */


  const afterCourse =
    items.slice(
      courseIndex + 1
    );


  const descriptorItems =
    afterCourse.filter(
      item =>
        numericValue(
          item
        ) === null
    );


  const seatTypeItem =
    descriptorItems[0] ||
    null;

  const categoryItem =
    descriptorItems[1] ||
    null;


  const seatType =
    clean(
      seatTypeItem?.text
    );

  const category =
    clean(
      categoryItem?.text
    );


  /*
  Everything before course is institute.
  */

  const institute =
    clean(
      items
        .slice(
          0,
          courseIndex
        )
        .map(
          item =>
            item.text
        )
        .join(' ')
    );


  /*
  Only numbers positioned after the category/course area.
  */

  const numericItems =
    afterCourse
      .filter(
        item =>
          numericValue(
            item
          ) !== null
      )
      .map(
        item => ({
          ...item,

          number:
            numericValue(
              item
            ),
        })
      );


  medicalSourceRows.push({
    ...visualRow,

    institute,

    course,

    seatType,

    category,

    courseX:
      items[
        courseIndex
      ].x,

    numericItems,
  });
}


/*
|--------------------------------------------------------------------------
| DISCOVER NUMERIC COLUMN X POSITIONS
|--------------------------------------------------------------------------
|
| Numeric x-values move slightly according to digit width.
| Cluster values within 15 PDF units.
|--------------------------------------------------------------------------
*/

const numericXs =
  medicalSourceRows
    .flatMap(
      row =>
        row.numericItems.map(
          item =>
            item.x
        )
    )
    .sort(
      (
        a,
        b
      ) =>
        a - b
    );


const clusters = [];


for (
  const x of numericXs
) {

  let target = null;


  for (
    const cluster of
    clusters
  ) {

    if (
      Math.abs(
        x -
        cluster.center
      ) <= 15
    ) {
      target =
        cluster;

      break;
    }
  }


  if (
    !target
  ) {

    clusters.push({
      values: [
        x,
      ],

      center:
        x,
    });

    continue;
  }


  target.values.push(
    x
  );


  target.center =
    target.values.reduce(
      (
        total,
        value
      ) =>
        total +
        value,
      0
    ) /
    target.values.length;
}


clusters.sort(
  (
    a,
    b
  ) =>
    a.center -
    b.center
);


/*
|--------------------------------------------------------------------------
| FILTER TINY ACCIDENTAL CLUSTERS
|--------------------------------------------------------------------------
|
| Real rank columns should occur repeatedly.
|--------------------------------------------------------------------------
*/

const minimumOccurrence =
  Math.max(
    2,
    Math.floor(
      medicalSourceRows.length *
      0.03
    )
  );


const rankClusters =
  clusters.filter(
    cluster =>
      cluster.values.length >=
      minimumOccurrence
  );


console.log(
  '\n========================================'
);

console.log(
  '2026 DETECTED NUMERIC COLUMN CENTERS'
);

console.log(
  '========================================'
);


console.table(
  rankClusters.map(
    (
      cluster,
      index
    ) => ({
      column:
        index + 1,

      x:
        round2(
          cluster.center
        ),

      occurrences:
        cluster.values.length,
    })
  )
);


/*
|--------------------------------------------------------------------------
| REQUIRE SIX RANK COLUMNS
|--------------------------------------------------------------------------
|
| Expected BCECEB structure:
|
| 1 NEET Opening
| 2 NEET Closing
| 3 UR Opening
| 4 UR Closing
| 5 Category Opening
| 6 Category Closing
|
| Do not guess if PDF changes structurally.
|--------------------------------------------------------------------------
*/

if (
  rankClusters.length !==
  6
) {

  fs.writeFileSync(
    path.join(
      TEXT_DIR,
      'round-1-column-detection-debug.json'
    ),

    JSON.stringify(
      {
        medicalRows:
          medicalSourceRows.length,

        minimumOccurrence,

        allClusters:
          clusters.map(
            cluster => ({
              center:
                round2(
                  cluster.center
                ),

              occurrences:
                cluster.values.length,
            })
          ),

        acceptedClusters:
          rankClusters.map(
            cluster => ({
              center:
                round2(
                  cluster.center
                ),

              occurrences:
                cluster.values.length,
            })
          ),
      },
      null,
      2
    ),

    'utf8'
  );


  throw new Error(
    [
      '',
      '2026 PDF layout needs inspection.',
      `Detected ${rankClusters.length} repeated numeric columns instead of 6.`,
      'No rank data was guessed.',
      '',
      'Debug saved:',
      'data/neet/state/bihar/2026/text/round-1-column-detection-debug.json',
    ].join('\n')
  );
}


const [
  neetOpeningCluster,
  neetClosingCluster,
  urOpeningCluster,
  urClosingCluster,
  categoryOpeningCluster,
  categoryClosingCluster,
] =
  rankClusters;


/*
|--------------------------------------------------------------------------
| MATCH A NUMERIC ITEM TO NEAREST COLUMN
|--------------------------------------------------------------------------
*/

function valueForCluster(
  numericItems,
  cluster
) {

  let best = null;

  let bestDistance =
    Infinity;


  for (
    const item of numericItems
  ) {

    const distance =
      Math.abs(
        item.x -
        cluster.center
      );


    if (
      distance <
      bestDistance
    ) {

      best =
        item;

      bestDistance =
        distance;
    }
  }


  /*
  Reject if it is too far away from the column.
  */

  if (
    !best ||
    bestDistance >
      18
  ) {
    return null;
  }


  return best.number;
}


/*
|--------------------------------------------------------------------------
| PARSE
|--------------------------------------------------------------------------
*/

const rows = [];
const rejected = [];


for (
  const sourceRow of
  medicalSourceRows
) {

  const {
    page,
    y,
    institute,
    course,
    seatType,
    category,
    numericItems,
    raw,
  } =
    sourceRow;


  const neetOpeningRank =
    valueForCluster(
      numericItems,
      neetOpeningCluster
    );

  const neetClosingRank =
    valueForCluster(
      numericItems,
      neetClosingCluster
    );

  const urOpeningRank =
    valueForCluster(
      numericItems,
      urOpeningCluster
    );

  const urClosingRank =
    valueForCluster(
      numericItems,
      urClosingCluster
    );

  const categoryOpeningRank =
    valueForCluster(
      numericItems,
      categoryOpeningCluster
    );

  const categoryClosingRank =
    valueForCluster(
      numericItems,
      categoryClosingCluster
    );


  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */


  if (
    !institute ||
    !course ||
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
      page,
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
      page,
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
      2026,

    round:
      'Round 1',

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
      'round-1-opening-closing-rank.pdf',

    sourceType:
      'official-opening-closing-rank',

    sourceAuthority:
      'BCECEB',

    dataStatus:
      'current-partial',

    verified:
      true,
  });
}


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
      institution !==
      0
    ) {
      return institution;
    }


    const course =
      a.course.localeCompare(
        b.course
      );

    if (
      course !==
      0
    ) {
      return course;
    }


    const category =
      a.category.localeCompare(
        b.category
      );

    if (
      category !==
      0
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
| DUPLICATES
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
    ].join(
      '||'
    );


  duplicateMap.set(
    key,
    (
      duplicateMap.get(
        key
      ) ||
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
| FILES
|--------------------------------------------------------------------------
*/

const outputFile =
  path.join(
    OUTPUT_DIR,
    'round-1-orcr.json'
  );

const rejectedFile =
  path.join(
    OUTPUT_DIR,
    'round-1-rejected.json'
  );

const auditFile =
  path.join(
    AUDIT_DIR,
    'round-1-source-reconciliation.json'
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
  medicalSourceRows.length ===
    rows.length &&
  rejected.length ===
    0 &&
  duplicates.length ===
    0;


fs.writeFileSync(
  auditFile,

  JSON.stringify(
    {
      year:
        2026,

      round:
        'Round 1',

      status:
        complete
          ? 'verified-round'
          : 'verification-failed',

      yearStatus:
        'current-partial',

      detectedColumnCenters:
        rankClusters.map(
          cluster =>
            round2(
              cluster.center
            )
        ),

      coordinateSourceRows:
        medicalSourceRows.length,

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
| COUNTS
|--------------------------------------------------------------------------
*/

function countBy(
  field
) {

  return rows.reduce(
    (
      result,
      row
    ) => {

      const key =
        row[field] ||
        'NULL';

      result[key] =
        (
          result[key] ||
          0
        ) + 1;

      return result;
    },
    {}
  );
}


/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

console.log(
  '\n========================================'
);

console.log(
  'BIHAR UGMAC 2026 ROUND 1 PARSE'
);

console.log(
  '========================================'
);


console.log(
  'Coordinate MBBS/BDS source rows:',
  medicalSourceRows.length
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
  '\nSEAT TYPES'
);

console.table(
  Object.entries(
    countBy(
      'seatType'
    )
  ).map(
    (
      [
        seatType,
        count
      ]
    ) => ({
      seatType,
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
    ? '2026 ROUND 1 SOURCE RECONCILIATION: PASS'
    : '2026 ROUND 1 SOURCE RECONCILIATION: FAIL'
);

console.log(
  '========================================'
);


if (
  rejected.length >
  0
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
