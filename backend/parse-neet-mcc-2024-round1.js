import fs from 'fs';
import path from 'path';


const YEAR =
  2024;

const ROUND =
  1;


const INPUT =
  path.resolve(
    './data/neet/mcc/2024/text/round-1.txt'
  );


const OUTPUT_DIR =
  path.resolve(
    './data/neet/mcc/2024/parsed'
  );


fs.mkdirSync(
  OUTPUT_DIR,
  {
    recursive:
      true,
  }
);


const ROWS_FILE =
  path.join(
    OUTPUT_DIR,
    'round-1-rows.json'
  );


const REJECTED_FILE =
  path.join(
    OUTPUT_DIR,
    'round-1-rejected.json'
  );


const ORCR_FILE =
  path.join(
    OUTPUT_DIR,
    'round-1-orcr.json'
  );


const SUMMARY_FILE =
  path.join(
    OUTPUT_DIR,
    'round-1-summary.json'
  );


const raw =
  fs.readFileSync(
    INPUT,
    'utf8'
  );


const lines =
  raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(
      line =>
        String(
          line || ''
        )
          .replace(/\s+/g, ' ')
          .trim()
    )
    .filter(Boolean);


/*
|--------------------------------------------------------------------------
| Normalization
|--------------------------------------------------------------------------
*/

function normalize(
  value
) {

  return String(
    value ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}


function matchKey(
  value
) {

  return normalize(
    value
  )
    .toLowerCase()

    .replace(
      /\s*\/\s*/g,
      '/'
    )

    .replace(
      /\s*-\s*/g,
      '-'
    )

    .replace(
      /\(\s+/g,
      '('
    )

    .replace(
      /\s+\)/g,
      ')'
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


/*
|--------------------------------------------------------------------------
| Official quota dictionary
|--------------------------------------------------------------------------
*/

const quotaStart =
  lines.findIndex(
    line =>
      /^Quota Abbrevation$/i.test(
        line
      )
  );


const quotaEnd =
  lines.findIndex(
    (
      line,
      index
    ) =>
      index >
        quotaStart &&
      /^Allotted Category Abbrevations$/i.test(
        line
      )
  );


if (
  quotaStart <
    0 ||
  quotaEnd <=
    quotaStart
) {

  throw new Error(
    'Official quota dictionary not found.'
  );
}


const quotas = [];


for (
  let i =
    quotaStart + 2;
  i <
    quotaEnd;
  i += 1
) {

  const line =
    lines[i];


  const match =
    line.match(
      /^([A-Z]{2})\s+(.+)$/
    );


  if (
    !match
  ) {
    continue;
  }


  quotas.push({
    code:
      match[1],

    description:
      normalize(
        match[2]
      ),

    key:
      matchKey(
        match[2]
      ),
  });
}


if (
  quotas.length <
    20
) {

  throw new Error(
    `Only ${quotas.length} quotas detected.`
  );
}


console.log(
  `Quota descriptions detected: ${quotas.length}`
);


/*
|--------------------------------------------------------------------------
| Category vocabularies
|--------------------------------------------------------------------------
*/

const ALLOTTED_CATEGORIES = [
  'Open PwD',
  'OBC PwD',
  'EWS PwD',
  'SC PwD',
  'ST PwD',

  'Open',
  'OBC',
  'EWS',
  'SC',
  'ST',
];


const CANDIDATE_CATEGORIES = [
  'General PwD',
  'OBC PwD',
  'EWS PwD',
  'SC PwD',
  'ST PwD',

  'General',
  'OBC',
  'EWS',
  'SC',
  'ST',
];


const COURSES = [
  'B.Sc. Nursing',
  'MBBS',
  'BDS',
];


/*
|--------------------------------------------------------------------------
| Detect all official rows using SNo + source rank
|--------------------------------------------------------------------------
*/

const ROW_START =
  /^(\d+)\s+(\d+(?:\.\d+)?)\s+(.+)$/;


const starts = [];


for (
  let i = 0;
  i <
    lines.length;
  i += 1
) {

  const match =
    lines[i].match(
      ROW_START
    );


  if (
    !match
  ) {
    continue;
  }


  starts.push({
    lineIndex:
      i,

    sno:
      Number(
        match[1]
      ),

    rankRaw:
      match[2],
  });
}


/*
|--------------------------------------------------------------------------
| Quota matcher
|--------------------------------------------------------------------------
*/

function matchQuota(
  body
) {

  const tokens =
    normalize(
      body
    )
      .split(' ');


  let best =
    null;


  /*
   * Longest MCC 2024 quota is comfortably
   * below this token count.
   */

  const maxParts =
    Math.min(
      tokens.length,
      20
    );


  for (
    let parts = 1;
    parts <=
      maxParts;
    parts += 1
  ) {

    const candidate =
      matchKey(
        tokens
          .slice(
            0,
            parts
          )
          .join(
            ' '
          )
      );


    for (
      const quota of
      quotas
    ) {

      if (
        candidate !==
        quota.key
      ) {
        continue;
      }


      best = {
        ...quota,

        tokenCount:
          parts,
      };
    }
  }


  return best;
}


/*
|--------------------------------------------------------------------------
| Parse category pair
|--------------------------------------------------------------------------
*/

function parseCategoryPair(
  value
) {

  const text =
    normalize(
      value
    );


  for (
    const allotted of
    ALLOTTED_CATEGORIES
  ) {

    for (
      const candidate of
      CANDIDATE_CATEGORIES
    ) {

      if (
        text ===
        `${allotted} ${candidate}`
      ) {

        return {
          allottedCategory:
            allotted,

          candidateCategory:
            candidate,
        };
      }
    }
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| Parse one row
|--------------------------------------------------------------------------
*/

function parseRow(
  start,
  endIndex
) {

  const rowLines =
    lines.slice(
      start.lineIndex,
      endIndex
    );


  let joined =
    normalize(
      rowLines.join(
        ' '
      )
    );


  const prefix =
    new RegExp(
      `^${start.sno}\\s+${String(
        start.rankRaw
      ).replace(
        '.',
        '\\.'
      )}\\s+`
    );


  joined =
    joined.replace(
      prefix,
      ''
    );


  /*
   * MCC Round-1 remark:
   *
   *   Allotted
   *
   * or
   *
   *   Allotted( CW Rank : 45 )
   */

  const remarkMatch =
    joined.match(
      /\s+Allotted(?:\(\s*CW\s+Rank\s*:\s*(\d+)\s*\))?$/
    );


  if (
    !remarkMatch
  ) {

    return {
      ok:
        false,

      reason:
        'remark-not-found',

      rowLines,
      joined,
    };
  }


  const cwRank =
    remarkMatch[1]
      ? Number(
          remarkMatch[1]
        )
      : null;


  joined =
    joined
      .slice(
        0,
        remarkMatch.index
      )
      .trim();


  /*
   * Quota must be the first semantic field.
   */

  const quota =
    matchQuota(
      joined
    );


  if (
    !quota
  ) {

    return {
      ok:
        false,

      reason:
        'quota-not-found',

      rowLines,
      joined,
    };
  }


  const allTokens =
    joined.split(
      /\s+/
    );


  const afterQuota =
    allTokens
      .slice(
        quota.tokenCount
      )
      .join(
        ' '
      )
      .trim();


  /*
   * Parse from right side:
   *
   * Institute + Course +
   * AllottedCategory + CandidateCategory
   */

  let courseMatch =
    null;


  for (
    const course of
    COURSES
  ) {

    const escaped =
      course.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );


    const regex =
      new RegExp(
        `^(.*)\\s+(${escaped})\\s+(.+)$`
      );


    const match =
      afterQuota.match(
        regex
      );


    if (
      !match
    ) {
      continue;
    }


    const pair =
      parseCategoryPair(
        match[3]
      );


    if (
      !pair
    ) {
      continue;
    }


    courseMatch = {
      institute:
        normalize(
          match[1]
        ),

      course:
        course,

      ...pair,
    };


    break;
  }


  if (
    !courseMatch
  ) {

    return {
      ok:
        false,

      reason:
        'course-or-category-not-found',

      rowLines,
      joined,

      quota:
        quota.description,

      afterQuota,
    };
  }


  if (
    !courseMatch.institute
  ) {

    return {
      ok:
        false,

      reason:
        'empty-institute',

      rowLines,
    };
  }


  const rankNumeric =
    Number(
      start.rankRaw
    );


  return {
    ok:
      true,

    row: {
      year:
        YEAR,

      counselling:
        'MCC',

      exam:
        'NEET UG',

      round:
        ROUND,

      sno:
        start.sno,

      rank:
        rankNumeric,

      rankRaw:
        start.rankRaw,

      rankFormat:
        start.rankRaw.includes(
          '.'
        )
          ? 'decimal-source-rank'
          : 'integer',

      quotaCode:
        quota.code,

      quota:
        quota.description,

      institute:
        courseMatch.institute,

      course:
        courseMatch.course,

      allottedCategory:
        courseMatch.allottedCategory,

      candidateCategory:
        courseMatch.candidateCategory,

      status:
        'Allotted',

      cwRank,

      source: {
        authority:
          'Medical Counselling Committee',

        year:
          YEAR,

        round:
          ROUND,
      },
    },
  };
}


/*
|--------------------------------------------------------------------------
| Parse complete source
|--------------------------------------------------------------------------
*/

const rows = [];

const rejected = [];


for (
  let index = 0;
  index <
    starts.length;
  index += 1
) {

  const current =
    starts[index];


  const nextLineIndex =
    index + 1 <
      starts.length
      ? starts[
          index + 1
        ].lineIndex
      : lines.length;


  const result =
    parseRow(
      current,
      nextLineIndex
    );


  if (
    result.ok
  ) {

    rows.push(
      result.row
    );

  } else {

    rejected.push({
      sno:
        current.sno,

      rankRaw:
        current.rankRaw,

      ...result,
    });
  }
}


/*
|--------------------------------------------------------------------------
| OR-CR
|--------------------------------------------------------------------------
|
| Group by actual seat identity:
|
| Institute
| Course
| Quota
| Allotted Category
|
| Candidate category is preserved in rows,
| but does not define the seat category itself.
|
*/

const groups =
  new Map();


for (
  const row of
  rows
) {

  const key =
    JSON.stringify([
      row.institute,
      row.course,
      row.quota,
      row.allottedCategory,
    ]);


  let group =
    groups.get(
      key
    );


  if (
    !group
  ) {

    group = {
      year:
        YEAR,

      counselling:
        'MCC',

      exam:
        'NEET UG',

      round:
        ROUND,

      institute:
        row.institute,

      course:
        row.course,

      quota:
        row.quota,

      quotaCode:
        row.quotaCode,

      category:
        row.allottedCategory,

      openingRank:
        row.rank,

      openingRankRaw:
        row.rankRaw,

      openingSNo:
        row.sno,

      closingRank:
        row.rank,

      closingRankRaw:
        row.rankRaw,

      closingSNo:
        row.sno,

      allotments:
        0,

      cwAllotments:
        0,
    };


    groups.set(
      key,
      group
    );
  }


  group.allotments +=
    1;


  if (
    row.cwRank !==
      null
  ) {
    group.cwAllotments +=
      1;
  }


  if (
    row.rank <
      group.openingRank
  ) {

    group.openingRank =
      row.rank;

    group.openingRankRaw =
      row.rankRaw;

    group.openingSNo =
      row.sno;
  }


  if (
    row.rank >
      group.closingRank
  ) {

    group.closingRank =
      row.rank;

    group.closingRankRaw =
      row.rankRaw;

    group.closingSNo =
      row.sno;
  }
}


const orcr =
  [...groups.values()]
    .sort(
      (
        a,
        b
      ) => {

        return (
          a.institute.localeCompare(
            b.institute
          ) ||
          a.course.localeCompare(
            b.course
          ) ||
          a.quota.localeCompare(
            b.quota
          ) ||
          a.category.localeCompare(
            b.category
          )
        );
      }
    );


/*
|--------------------------------------------------------------------------
| Summary
|--------------------------------------------------------------------------
*/

function countBy(
  values
) {

  const counts = {};


  for (
    const value of
    values
  ) {

    const key =
      String(
        value ?? 'NULL'
      );


    counts[key] =
      (
        counts[key] ||
        0
      ) +
      1;
  }


  return counts;
}


const summary = {
  detectedRowStarts:
    starts.length,

  parsedRows:
    rows.length,

  rejectedRows:
    rejected.length,

  firstSNo:
    rows[0]
      ?.sno ??
    null,

  lastSNo:
    rows[
      rows.length -
      1
    ]
      ?.sno ??
    null,

  firstRankRaw:
    rows[0]
      ?.rankRaw ??
    null,

  lastRankRaw:
    rows[
      rows.length -
      1
    ]
      ?.rankRaw ??
    null,

  decimalSourceRanks:
    rows.filter(
      row =>
        row.rankFormat ===
        'decimal-source-rank'
    ).length,

  cwRankRows:
    rows.filter(
      row =>
        row.cwRank !==
        null
    ).length,

  courseCounts:
    countBy(
      rows.map(
        row =>
          row.course
      )
    ),

  quotaCounts:
    countBy(
      rows.map(
        row =>
          row.quota
      )
    ),

  allottedCategoryCounts:
    countBy(
      rows.map(
        row =>
          row.allottedCategory
      )
    ),

  candidateCategoryCounts:
    countBy(
      rows.map(
        row =>
          row.candidateCategory
      )
    ),

  orcrGroups:
    orcr.length,
};


/*
|--------------------------------------------------------------------------
| Save
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  ROWS_FILE,
  JSON.stringify(
    rows,
    null,
    2
  ),
  'utf8'
);


fs.writeFileSync(
  REJECTED_FILE,
  JSON.stringify(
    rejected,
    null,
    2
  ),
  'utf8'
);


fs.writeFileSync(
  ORCR_FILE,
  JSON.stringify(
    orcr,
    null,
    2
  ),
  'utf8'
);


fs.writeFileSync(
  SUMMARY_FILE,
  JSON.stringify(
    summary,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND 1 PARSE COMPLETE'
);

console.log(
  '========================================\n'
);


console.log(
  'SUMMARY'
);


console.log(
  JSON.stringify(
    summary,
    null,
    2
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
        sno:
          row.sno,

        rank:
          row.rankRaw,

        quota:
          row.quota,

        institute:
          row.institute,

        course:
          row.course,

        allotted:
          row.allottedCategory,

        candidate:
          row.candidateCategory,

        cwRank:
          row.cwRank,
      })
    )
);


console.log(
  '\nCW RANK SAMPLE'
);


console.table(
  rows
    .filter(
      row =>
        row.cwRank !==
        null
    )
    .slice(
      0,
      10
    )
    .map(
      row => ({
        sno:
          row.sno,

        rank:
          row.rankRaw,

        quota:
          row.quota,

        course:
          row.course,

        allotted:
          row.allottedCategory,

        candidate:
          row.candidateCategory,

        cwRank:
          row.cwRank,
      })
    )
);


if (
  rejected.length
) {

  console.log(
    '\nFIRST 20 REJECTED'
  );


  console.dir(
    rejected.slice(
      0,
      20
    ),
    {
      depth:
        null,
    }
  );
}


console.log(
  '\nOUTPUT FILES'
);

console.log(
  ROWS_FILE
);

console.log(
  ORCR_FILE
);

console.log(
  REJECTED_FILE
);

console.log(
  SUMMARY_FILE
);
