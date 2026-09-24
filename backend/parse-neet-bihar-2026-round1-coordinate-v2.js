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

for (const dir of [
  OUTPUT_DIR,
  AUDIT_DIR,
  TEXT_DIR,
]) {
  fs.mkdirSync(
    dir,
    {
      recursive: true,
    }
  );
}

if (!fs.existsSync(INPUT)) {
  throw new Error(
    `PDF not found: ${INPUT}`
  );
}


function clean(value) {
  return String(
    value ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}


function normalizeCourse(value) {

  const compact =
    clean(value)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

  if (compact === 'MBBS') {
    return 'MBBS';
  }

  if (compact === 'BDS') {
    return 'BDS';
  }

  return null;
}


function numericValue(item) {

  const text =
    clean(item?.text);

  if (
    !/^\d+(?:\.\d+)?$/.test(
      text
    )
  ) {
    return null;
  }

  const n =
    Number(text);

  return Number.isFinite(n)
    ? n
    : null;
}


function round2(value) {
  return (
    Math.round(
      value * 100
    ) / 100
  );
}


/*
|--------------------------------------------------------------------------
| READ PDF
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
              clean(item.str),

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

    pages.push(items);

    return '';
  };


await pdf(
  fs.readFileSync(INPUT),
  {
    pagerender,
  }
);


/*
|--------------------------------------------------------------------------
| BUILD ORDERED VISUAL ROWS
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

    for (const item of pageItems) {

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

      groups
        .get(y)
        .push(item);
    }


    const pageRows =
      [...groups.entries()]
        .map(
          (
            [
              y,
              items
            ]
          ) => {

            items.sort(
              (
                a,
                b
              ) =>
                a.x - b.x
            );

            return {
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
            };
          }
        )
        .sort(
          (
            a,
            b
          ) =>
            b.y - a.y
        );


    visualRows.push(
      ...pageRows
    );
  }
);


/*
|--------------------------------------------------------------------------
| HELPERS FOR WRAPPED INSTITUTE NAMES
|--------------------------------------------------------------------------
*/

function isNoiseRow(row) {

  return (
    /INSTITUTE|COURSE|OPENING RANK|CLOSING RANK|UGMAC-2026|Page No/i.test(
      row.raw
    )
  );
}


function hasCourse(row) {

  return row.items.some(
    item =>
      normalizeCourse(
        item.text
      )
  );
}


function hasRankColumns(row) {

  return row.items.some(
    item =>
      item.x >= 350 &&
      numericValue(item) !== null
  );
}


function continuationText(row) {

  return clean(
    row.items
      .filter(
        item =>
          item.x < 350
      )
      .map(
        item =>
          item.text
      )
      .join(' ')
  );
}


/*
|--------------------------------------------------------------------------
| FIRST PASS — FIND MEDICAL ROWS + RECONSTRUCT INSTITUTE/DESCRIPTOR
|--------------------------------------------------------------------------
*/

const medicalRows = [];


for (
  let i = 0;
  i < visualRows.length;
  i += 1
) {

  const row =
    visualRows[i];

  const courseIndex =
    row.items.findIndex(
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
      row.items[
        courseIndex
      ].text
    );


  /*
  Current-line institute fragment.
  */

  let institute =
    clean(
      row.items
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
  Prepend immediately preceding wrapped institute/address rows.

  Conditions:
  - same page
  - physically close
  - no course
  - no rank columns
  - not header/title
  */

  let previousY =
    row.y;

  const prefixes = [];


  for (
    let j = i - 1;
    j >= 0;
    j -= 1
  ) {

    const previous =
      visualRows[j];


    if (
      previous.page !==
      row.page
    ) {
      break;
    }


    const gap =
      previous.y -
      previousY;


    if (
      gap < 0 ||
      gap > 22
    ) {
      break;
    }


    if (
      isNoiseRow(
        previous
      ) ||
      hasCourse(
        previous
      ) ||
      hasRankColumns(
        previous
      )
    ) {
      break;
    }


    const fragment =
      continuationText(
        previous
      );


    if (!fragment) {
      break;
    }


    prefixes.unshift(
      fragment
    );

    previousY =
      previous.y;
  }


  if (
    prefixes.length
  ) {

    institute =
      clean(
        [
          ...prefixes,
          institute,
        ].join(' ')
      );
  }


  /*
  Descriptor is everything after course and before first numeric item.

  Handles:
    General + UR
    "General UR"
    Female + SC
    "General NRI"
  */

  const descriptor =
    clean(
      row.items
        .slice(
          courseIndex + 1
        )
        .filter(
          item =>
            numericValue(
              item
            ) === null
        )
        .map(
          item =>
            item.text
        )
        .join(' ')
    );


  const descriptorMatch =
    descriptor.match(
      /^(General|Female)\s+(.+)$/i
    );


  const seatType =
    descriptorMatch
      ? (
          /^female$/i.test(
            descriptorMatch[1]
          )
            ? 'Female'
            : 'General'
        )
      : '';


  const category =
    descriptorMatch
      ? clean(
          descriptorMatch[2]
        )
          .toUpperCase()
      : '';


  const numericItems =
    row.items
      .slice(
        courseIndex + 1
      )
      .map(
        item => ({
          ...item,

          number:
            numericValue(
              item
            ),
        })
      )
      .filter(
        item =>
          item.number !== null
      );


  medicalRows.push({
    ...row,

    institute,
    course,
    descriptor,
    seatType,
    category,
    numericItems,
  });
}


/*
|--------------------------------------------------------------------------
| DETECT SIX RANK COLUMNS
|--------------------------------------------------------------------------
*/

const numericXs =
  medicalRows
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


for (const x of numericXs) {

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


  if (!target) {

    clusters.push({
      values: [x],
      center: x,
    });

    continue;
  }


  target.values.push(x);

  target.center =
    target.values.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
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


const minimumOccurrence =
  Math.max(
    2,
    Math.floor(
      medicalRows.length *
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


if (
  rankClusters.length !==
  6
) {
  throw new Error(
    `Expected 6 rank columns, detected ${rankClusters.length}.`
  );
}


const [
  neetOpenColumn,
  neetCloseColumn,
  urOpenColumn,
  urCloseColumn,
  catOpenColumn,
  catCloseColumn,
] =
  rankClusters;


function valueForColumn(
  numericItems,
  column
) {

  let best = null;
  let distance =
    Infinity;


  for (
    const item of
    numericItems
  ) {

    const d =
      Math.abs(
        item.x -
        column.center
      );


    if (
      d <
      distance
    ) {

      best =
        item;

      distance =
        d;
    }
  }


  return (
    best &&
    distance <= 18
  )
    ? best.number
    : null;
}


/*
|--------------------------------------------------------------------------
| FINAL PARSE
|--------------------------------------------------------------------------
*/

const rows = [];
const rejected = [];


for (
  const source of
  medicalRows
) {

  const neetOpeningRank =
    valueForColumn(
      source.numericItems,
      neetOpenColumn
    );

  const neetClosingRank =
    valueForColumn(
      source.numericItems,
      neetCloseColumn
    );

  const urOpeningRank =
    valueForColumn(
      source.numericItems,
      urOpenColumn
    );

  const urClosingRank =
    valueForColumn(
      source.numericItems,
      urCloseColumn
    );

  const categoryOpeningRank =
    valueForColumn(
      source.numericItems,
      catOpenColumn
    );

  const categoryClosingRank =
    valueForColumn(
      source.numericItems,
      catCloseColumn
    );


  if (
    !source.institute ||
    !source.course ||
    !source.seatType ||
    !source.category ||
    !Number.isFinite(
      neetOpeningRank
    ) ||
    !Number.isFinite(
      neetClosingRank
    )
  ) {

    rejected.push({
      page:
        source.page,

      y:
        source.y,

      institute:
        source.institute,

      descriptor:
        source.descriptor,

      seatType:
        source.seatType,

      category:
        source.category,

      neetOpeningRank,
      neetClosingRank,

      raw:
        source.raw,

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
        source.page,

      y:
        source.y,

      institute:
        source.institute,

      descriptor:
        source.descriptor,

      neetOpeningRank,
      neetClosingRank,

      raw:
        source.raw,

      reason:
        'Opening rank greater than closing rank',
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

    institute:
      source.institute,

    course:
      source.course,

    seatType:
      source.seatType,

    category:
      source.category,

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

    sourceUrl:
      'https://bceceboard.bihar.gov.in/pdf_Web/UGMAC26_OCR_R1.pdf',

    sourceAuthority:
      'BCECEB',

    sourceType:
      'official-opening-closing-rank',

    dataStatus:
      'current-partial',

    verified:
      true,
  });
}


/*
|--------------------------------------------------------------------------
| DUPLICATES
|--------------------------------------------------------------------------
*/

const keys =
  new Map();


for (const row of rows) {

  const key =
    [
      row.institute,
      row.course,
      row.seatType,
      row.category,
      row.neetOpeningRank,
      row.neetClosingRank,
    ].join('||');


  keys.set(
    key,
    (
      keys.get(key) ||
      0
    ) + 1
  );
}


const duplicates =
  [...keys.entries()]
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
| SUSPICIOUS INSTITUTE AUDIT
|--------------------------------------------------------------------------
*/

const suspiciousInstitutes =
  rows.filter(
    row =>
      /^\d+$/.test(
        row.institute
      ) ||
      /^(PATNA|SAHARSA|MUZAFFARPUR|KHAGARIA)$/i.test(
        row.institute
      ) ||
      row.institute.length <
        6
  );


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

const complete =
  medicalRows.length ===
    rows.length &&
  rejected.length ===
    0 &&
  duplicates.length ===
    0 &&
  suspiciousInstitutes.length ===
    0;


fs.writeFileSync(
  path.join(
    OUTPUT_DIR,
    'round-1-orcr.json'
  ),

  JSON.stringify(
    rows,
    null,
    2
  ),

  'utf8'
);


fs.writeFileSync(
  path.join(
    OUTPUT_DIR,
    'round-1-rejected.json'
  ),

  JSON.stringify(
    rejected,
    null,
    2
  ),

  'utf8'
);


fs.writeFileSync(
  path.join(
    AUDIT_DIR,
    'round-1-source-reconciliation.json'
  ),

  JSON.stringify(
    {
      coordinateSourceRows:
        medicalRows.length,

      parsedRows:
        rows.length,

      rejectedRows:
        rejected.length,

      duplicateGroups:
        duplicates.length,

      suspiciousInstitutes:
        suspiciousInstitutes.map(
          row =>
            row.institute
        ),

      complete,

      yearStatus:
        'current-partial',

      detectedColumnCenters:
        rankClusters.map(
          cluster =>
            round2(
              cluster.center
            )
        ),

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

function countBy(field) {

  return rows.reduce(
    (
      acc,
      row
    ) => {

      const value =
        row[field] ||
        'NULL';

      acc[value] =
        (
          acc[value] ||
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
  'BIHAR UGMAC 2026 ROUND 1 V2'
);

console.log(
  '========================================'
);

console.log(
  'Coordinate MBBS/BDS source rows:',
  medicalRows.length
);

console.log(
  'Parsed MBBS/BDS rows:',
  rows.length
);

console.log(
  'Rejected rows:',
  rejected.length
);

console.log(
  'Duplicate groups:',
  duplicates.length
);

console.log(
  'Suspicious institutes:',
  suspiciousInstitutes.length
);


console.log(
  '\nCOURSES'
);

console.table(
  Object.entries(
    countBy('course')
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
    countBy('category')
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
  '\nWRAPPED / LONG INSTITUTE EXAMPLES'
);

console.table(
  rows
    .filter(
      row =>
        row.institute.length >
        35
    )
    .slice(
      0,
      15
    )
    .map(
      row => ({
        institute:
          row.institute,

        category:
          row.category,

        neetOpen:
          row.neetOpeningRank,

        neetClose:
          row.neetClosingRank,
      })
    )
);


if (
  suspiciousInstitutes.length
) {

  console.log(
    '\nSUSPICIOUS INSTITUTES'
  );

  console.table(
    suspiciousInstitutes.map(
      row => ({
        institute:
          row.institute,

        course:
          row.course,

        category:
          row.category,

        neetOpen:
          row.neetOpeningRank,
      })
    )
  );
}


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
  rejected.length
) {

  console.log(
    '\nREJECTED'
  );

  console.log(
    JSON.stringify(
      rejected,
      null,
      2
    )
  );
}
