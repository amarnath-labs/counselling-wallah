import fs from 'fs';
import path from 'path';

const INPUT =
  path.resolve(
    './data/neet/mcc/2026/text/round-1.txt'
  );

const OUTPUT_DIR =
  path.resolve(
    './data/neet/mcc/2026/parsed'
  );


const COURSES =
  new Set([
    'MBBS',
    'BDS',
    'B.Sc Nursing',
    'B.SC NURSING',
    'B.Sc. Nursing',
  ]);


const REMARKS =
  new Set([
    'Allotted',
  ]);


const ALLOTTED_CATEGORY_BASE =
  new Set([
    'Open',
    'OBC',
    'SC',
    'ST',
    'EWS',
  ]);


const CANDIDATE_CATEGORY_BASE =
  new Set([
    'General',
    'OBC',
    'SC',
    'ST',
    'EWS',
  ]);


function ensureDir(
  dir
) {
  fs.mkdirSync(
    dir,
    {
      recursive: true,
    }
  );
}


function normalize(
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


function normalizeCategory(
  value
) {
  const text =
    normalize(
      value
    );

  const lower =
    text.toLowerCase();


  if (
    lower ===
    'general pwd'
  ) {
    return 'General PwD';
  }


  if (
    lower ===
    'open pwd'
  ) {
    return 'Open PwD';
  }


  if (
    lower ===
    'obc pwd'
  ) {
    return 'OBC PwD';
  }


  if (
    lower ===
    'sc pwd'
  ) {
    return 'SC PwD';
  }


  if (
    lower ===
    'st pwd'
  ) {
    return 'ST PwD';
  }


  if (
    lower ===
    'ews pwd'
  ) {
    return 'EWS PwD';
  }


  if (
    lower ===
    'general'
  ) {
    return 'General';
  }


  if (
    lower ===
    'open'
  ) {
    return 'Open';
  }


  if (
    lower ===
    'obc'
  ) {
    return 'OBC';
  }


  if (
    lower ===
    'sc'
  ) {
    return 'SC';
  }


  if (
    lower ===
    'st'
  ) {
    return 'ST';
  }


  if (
    lower ===
    'ews'
  ) {
    return 'EWS';
  }


  return text;
}


function getLines(
  text
) {
  return String(
    text || ''
  )
    .replace(
      /\r\n/g,
      '\n'
    )
    .replace(
      /\r/g,
      '\n'
    )
    .split(
      '\n'
    )
    .map(
      normalize
    )
    .filter(
      Boolean
    );
}


function isPageNoise(
  value
) {
  return (
    /^Page No\.\s*\d+$/i.test(
      value
    ) ||
    /^\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2}\s+(AM|PM)$/i.test(
      value
    ) ||
    /^NEET-UG\s+Counselling Seats Allotment/i.test(
      value
    )
  );
}


function isHeader(
  value
) {
  const headers =
    new Set([
      'SNo',
      'Rank',
      'Allotted Quota',
      'Allotted Institute',
      'Course',
      'Alloted',
      'Category',
      'Candidate',
      'Remarks',
    ]);


  return headers.has(
    value
  );
}


function cleanDataLines(
  lines
) {
  const start =
    lines.findIndex(
      (
        value,
        index
      ) =>
        value ===
          'SNo' &&
        lines[
          index + 1
        ] ===
          'Rank'
    );


  if (
    start < 0
  ) {
    throw new Error(
      'Round 1 table header not found.'
    );
  }


  return lines
    .slice(
      start + 1
    )
    .filter(
      line =>
        !isPageNoise(
          line
        ) &&
        !isHeader(
          line
        )
    );
}


function isInteger(
  value
) {
  return /^\d+$/.test(
    String(
      value || ''
    )
  );
}


function findCourseIndex(
  values
) {
  for (
    let i = 0;
    i <
      values.length;
    i += 1
  ) {
    if (
      COURSES.has(
        values[i]
      )
    ) {
      return i;
    }
  }


  return -1;
}


function findRemarkIndex(
  values
) {
  for (
    let i = 0;
    i <
      values.length;
    i += 1
  ) {
    if (
      REMARKS.has(
        values[i]
      )
    ) {
      return i;
    }
  }


  return -1;
}


/*
|--------------------------------------------------------------------------
| CATEGORY PARSER
|--------------------------------------------------------------------------
|
| MCC PDF may render:
|
| Open PwD
|
| as:
|
| Open
| PwD
|
| It may also render:
|
| General
| PwD
|
| So we consume category tokens intelligently instead of assuming
| exactly one line per category.
|
|--------------------------------------------------------------------------
*/


function readCategory(
  tokens,
  start,
  allowedBase
) {
  if (
    start >=
    tokens.length
  ) {
    return null;
  }


  const first =
    normalizeCategory(
      tokens[start]
    );


  /*
   * Already combined:
   *
   * OBC PwD
   * SC PwD
   * General PwD
   * etc.
   */

  if (
    /\sPwD$/i.test(
      first
    )
  ) {
    return {
      value:
        first,

      consumed:
        1,
    };
  }


  if (
    !allowedBase.has(
      first
    )
  ) {
    return null;
  }


  /*
   * Split form:
   *
   * Open
   * PwD
   */

  if (
    normalize(
      tokens[
        start + 1
      ]
    ).toLowerCase() ===
    'pwd'
  ) {
    return {
      value:
        `${first} PwD`,

      consumed:
        2,
    };
  }


  return {
    value:
      first,

    consumed:
      1,
  };
}


function parseCategories(
  tokens
) {
  const allotted =
    readCategory(
      tokens,
      0,
      ALLOTTED_CATEGORY_BASE
    );


  if (
    !allotted
  ) {
    return null;
  }


  const candidate =
    readCategory(
      tokens,
      allotted.consumed,
      CANDIDATE_CATEGORY_BASE
    );


  if (
    !candidate
  ) {
    return null;
  }


  const consumed =
    allotted.consumed +
    candidate.consumed;


  if (
    consumed !==
    tokens.length
  ) {
    return {
      allottedCategory:
        allotted.value,

      candidateCategory:
        candidate.value,

      extraTokens:
        tokens.slice(
          consumed
        ),
    };
  }


  return {
    allottedCategory:
      allotted.value,

    candidateCategory:
      candidate.value,

    extraTokens: [],
  };
}


/*
|--------------------------------------------------------------------------
| QUOTA / INSTITUTE
|--------------------------------------------------------------------------
*/


const KNOWN_QUOTA_PREFIXES = [
  'Open Seat Quota',
  'All India',

  'Delhi University Quota',
  'IP University Quota',

  'Employees State Insurance Scheme Nursing Quota (ESI-IP Quota Nursing)',
  'Employees State Insurance Scheme(ESI)',

  'Foreign Country Quota',
  'Internal -Puducherry UT Domicile',

  'Jain Minority Quota',
  'Jamia Internal Quota',

  'Muslim Minority Quota',
  'Muslim OBC Quota',
  'Muslim Quota',
  'Muslim ST Quota',
  'Muslim Women Quota',

  'Non-Resident Indian',
  'Non-Resident Indian(AMU)Quota',

  'Self-Financed Merit Seat',

  '(AMU) Self finance All India',
  '(AMU)Self finance internal',
  'Aligarh Muslim University (AMU) Quota',

  'B.Sc Nursing All India',
  'B.Sc Nursing Delhi NCR',
  'B.Sc Nursing Delhi NCR CW Quota',
  'B.Sc Nursing IP CW Quota',

  'Delhi NCR Children/Widows of Personnel of the Armed Forces (CW) DU Quota',
  'Delhi NCR Children/Widows of Personnel of the Armed Forces (CW) IP Quota',
];


function splitQuotaInstitute(
  values
) {
  const joined =
    normalize(
      values.join(
        ' '
      )
    );


  const sorted =
    [...KNOWN_QUOTA_PREFIXES]
      .sort(
        (
          a,
          b
        ) =>
          b.length -
          a.length
      );


  for (
    const quota of sorted
  ) {

    if (
      joined
        .toLowerCase()
        .startsWith(
          quota.toLowerCase()
        )
    ) {

      return {
        quota:
          normalize(
            joined.slice(
              0,
              quota.length
            )
          ),

        institute:
          normalize(
            joined.slice(
              quota.length
            )
          ),

        fallbackSplit:
          false,
      };
    }
  }


  return {
    quota:
      values[0] ||
      null,

    institute:
      normalize(
        values
          .slice(
            1
          )
          .join(
            ' '
          )
      ),

    fallbackSplit:
      true,
  };
}


/*
|--------------------------------------------------------------------------
| ROW PARSER
|--------------------------------------------------------------------------
*/


function parseRows(
  lines
) {
  const rows = [];
  const rejected = [];

  let i = 0;


  while (
    i <
    lines.length
  ) {

    if (
      !isInteger(
        lines[i]
      ) ||
      !isInteger(
        lines[
          i + 1
        ]
      )
    ) {
      i += 1;
      continue;
    }


    const sno =
      Number(
        lines[i]
      );


    const rank =
      Number(
        lines[
          i + 1
        ]
      );


    let next =
      i + 2;


    while (
      next <
      lines.length
    ) {

      if (
        isInteger(
          lines[next]
        ) &&
        isInteger(
          lines[
            next + 1
          ]
        )
      ) {
        break;
      }


      next += 1;
    }


    const block =
      lines.slice(
        i + 2,
        next
      );


    const courseIndex =
      findCourseIndex(
        block
      );


    const remarkIndex =
      findRemarkIndex(
        block
      );


    if (
      courseIndex < 0 ||
      remarkIndex < 0 ||
      remarkIndex <=
        courseIndex
    ) {

      rejected.push({
        sno,
        rank,
        block,

        reason:
          'Course or remark structure not identified.',
      });


      i =
        next;

      continue;
    }


    const categoryTokens =
      block.slice(
        courseIndex + 1,
        remarkIndex
      );


    const parsedCategories =
      parseCategories(
        categoryTokens
      );


    if (
      !parsedCategories
    ) {

      rejected.push({
        sno,
        rank,
        block,

        categoryTokens,

        reason:
          'Category structure not identified.',
      });


      i =
        next;

      continue;
    }


    if (
      parsedCategories
        .extraTokens
        .length >
      0
    ) {

      rejected.push({
        sno,
        rank,
        block,

        categoryTokens,

        parsedCategories,

        reason:
          'Unexpected extra category tokens.',
      });


      i =
        next;

      continue;
    }


    const beforeCourse =
      block.slice(
        0,
        courseIndex
      );


    const quotaInstitute =
      splitQuotaInstitute(
        beforeCourse
      );


    if (
      !quotaInstitute.quota ||
      !quotaInstitute.institute
    ) {

      rejected.push({
        sno,
        rank,
        block,

        reason:
          'Quota or institute missing.',
      });


      i =
        next;

      continue;
    }


    rows.push({
      exam:
        'NEET UG',

      authority:
        'MCC',

      year:
        2026,

      round:
        'Round 1',

      sno,

      rank,

      quota:
        normalize(
          quotaInstitute.quota
        ),

      institute:
        normalize(
          quotaInstitute.institute
        ),

      course:
        normalize(
          block[
            courseIndex
          ]
        ),

      allottedCategory:
        parsedCategories
          .allottedCategory,

      candidateCategory:
        parsedCategories
          .candidateCategory,

      remarks:
        normalize(
          block[
            remarkIndex
          ]
        ),

      fallbackQuotaSplit:
        quotaInstitute
          .fallbackSplit,
    });


    i =
      next;
  }


  return {
    rows,
    rejected,
  };
}


/*
|--------------------------------------------------------------------------
| OR-CR
|--------------------------------------------------------------------------
*/


function aggregateORCR(
  rows
) {
  const groups =
    new Map();


  for (
    const row of rows
  ) {

    const key =
      [
        row.institute,
        row.course,
        row.quota,
        row.allottedCategory,
      ]
        .map(
          normalize
        )
        .join(
          '||'
        );


    let group =
      groups.get(
        key
      );


    if (
      !group
    ) {

      group = {
        exam:
          row.exam,

        authority:
          row.authority,

        year:
          row.year,

        round:
          row.round,

        institute:
          row.institute,

        course:
          row.course,

        quota:
          row.quota,

        category:
          row.allottedCategory,

        openingRank:
          row.rank,

        closingRank:
          row.rank,

        allotmentCount:
          0,
      };


      groups.set(
        key,
        group
      );
    }


    group.openingRank =
      Math.min(
        group.openingRank,
        row.rank
      );


    group.closingRank =
      Math.max(
        group.closingRank,
        row.rank
      );


    group.allotmentCount +=
      1;
  }


  return [
    ...groups.values(),
  ].sort(
    (
      a,
      b
    ) => {

      if (
        a.openingRank !==
        b.openingRank
      ) {
        return (
          a.openingRank -
          b.openingRank
        );
      }


      return (
        a.closingRank -
        b.closingRank
      );
    }
  );
}


/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/


function countValues(
  rows,
  field
) {
  const map =
    new Map();


  for (
    const row of rows
  ) {

    const value =
      row[field] ||
      'UNKNOWN';


    map.set(
      value,
      (
        map.get(
          value
        ) ||
        0
      ) +
      1
    );
  }


  return Object.fromEntries(
    [...map.entries()]
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      )
  );
}


function summarize(
  rows,
  rejected
) {
  return {

    parsedRows:
      rows.length,

    rejectedRows:
      rejected.length,

    uniqueInstitutes:
      new Set(
        rows.map(
          row =>
            row.institute
        )
      ).size,

    courseCounts:
      countValues(
        rows,
        'course'
      ),

    allottedCategoryCounts:
      countValues(
        rows,
        'allottedCategory'
      ),

    candidateCategoryCounts:
      countValues(
        rows,
        'candidateCategory'
      ),

    firstRank:
      rows.length
        ? Math.min(
            ...rows.map(
              row =>
                row.rank
            )
          )
        : null,

    lastRank:
      rows.length
        ? Math.max(
            ...rows.map(
              row =>
                row.rank
            )
          )
        : null,

    fallbackQuotaSplitCount:
      rows.filter(
        row =>
          row.fallbackQuotaSplit
      ).length,
  };
}


/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/


function validateKnownRows(
  rows
) {

  const TESTS = [
    {
      rank: 1,

      allottedCategory:
        'Open',

      candidateCategory:
        'General',
    },

    {
      rank: 5866,

      allottedCategory:
        'Open PwD',

      candidateCategory:
        'EWS PwD',
    },

    {
      rank: 20015,

      allottedCategory:
        'OBC PwD',

      candidateCategory:
        'OBC PwD',
    },

    {
      rank: 49241,

      allottedCategory:
        'Open PwD',

      candidateCategory:
        'General PwD',
    },

    {
      rank: 54144,

      allottedCategory:
        'Open PwD',

      candidateCategory:
        'OBC PwD',
    },

    {
      rank: 263229,

      allottedCategory:
        'Open PwD',

      candidateCategory:
        'General PwD',
    },
  ];


  const results = [];


  for (
    const test of TESTS
  ) {

    const row =
      rows.find(
        item =>
          item.rank ===
          test.rank
      );


    results.push({
      rank:
        test.rank,

      found:
        Boolean(
          row
        ),

      expectedAllotted:
        test.allottedCategory,

      actualAllotted:
        row?.allottedCategory ||
        null,

      expectedCandidate:
        test.candidateCategory,

      actualCandidate:
        row?.candidateCategory ||
        null,

      pass:
        Boolean(
          row
        ) &&
        row.allottedCategory ===
          test.allottedCategory &&
        row.candidateCategory ===
          test.candidateCategory,
    });
  }


  return results;
}


/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/


function run() {

  ensureDir(
    OUTPUT_DIR
  );


  const raw =
    fs.readFileSync(
      INPUT,
      'utf8'
    );


  const allLines =
    getLines(
      raw
    );


  const lines =
    cleanDataLines(
      allLines
    );


  const {
    rows,
    rejected,
  } =
    parseRows(
      lines
    );


  const orcr =
    aggregateORCR(
      rows
    );


  const summary =
    summarize(
      rows,
      rejected
    );


  const validation =
    validateKnownRows(
      rows
    );


  fs.writeFileSync(
    path.join(
      OUTPUT_DIR,
      'round-1-rows.json'
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
      OUTPUT_DIR,
      'round-1-orcr.json'
    ),

    JSON.stringify(
      orcr,
      null,
      2
    ),

    'utf8'
  );


  fs.writeFileSync(
    path.join(
      OUTPUT_DIR,
      'round-1-summary.json'
    ),

    JSON.stringify(
      summary,
      null,
      2
    ),

    'utf8'
  );


  fs.writeFileSync(
    path.join(
      OUTPUT_DIR,
      'round-1-validation.json'
    ),

    JSON.stringify(
      validation,
      null,
      2
    ),

    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'NEET 2026 ROUND 1 PWD FIX COMPLETE'
  );

  console.log(
    '========================================'
  );


  console.log(
    '\nSUMMARY'
  );

  console.log(
    JSON.stringify(
      summary,
      null,
      2
    )
  );


  console.log(
    '\nKNOWN-RANK VALIDATION'
  );

  console.table(
    validation
  );


  const failed =
    validation.filter(
      item =>
        !item.pass
    );


  console.log(
    '\n========================================'
  );


  if (
    failed.length ===
    0
  ) {

    console.log(
      'ALL KNOWN CATEGORY TESTS PASSED'
    );

  } else {

    console.log(
      `${failed.length} VALIDATION TEST(S) FAILED`
    );

  }


  console.log(
    '========================================'
  );


  console.log(
    '\nAIIMS DELHI MBBS OR-CR'
  );


  console.table(
    orcr
      .filter(
        row =>
          row.course ===
            'MBBS' &&
          row.institute
            .toLowerCase()
            .includes(
              'aiims, new delhi'
            )
      )
      .map(
        row => ({
          quota:
            row.quota,

          category:
            row.category,

          openingRank:
            row.openingRank,

          closingRank:
            row.closingRank,

          seats:
            row.allotmentCount,
        })
      )
  );


  console.log(
    '\nJIPMER PUDUCHERRY MBBS OR-CR'
  );


  console.table(
    orcr
      .filter(
        row =>
          row.course ===
            'MBBS' &&
          row.institute
            .toLowerCase()
            .includes(
              'jipmer puducherry'
            )
      )
      .map(
        row => ({
          quota:
            row.quota,

          category:
            row.category,

          openingRank:
            row.openingRank,

          closingRank:
            row.closingRank,

          seats:
            row.allotmentCount,
        })
      )
  );

}


run();
