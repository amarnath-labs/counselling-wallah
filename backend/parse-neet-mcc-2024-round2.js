import fs from 'fs';
import path from 'path';


const YEAR =
  2024;

const ROUND =
  2;


const INPUT =
  path.resolve(
    './data/neet/mcc/2024/text/round-2.txt'
  );


const OUT =
  path.resolve(
    './data/neet/mcc/2024/parsed'
  );


fs.mkdirSync(
  OUT,
  {
    recursive:
      true,
  }
);


const ROWS_FILE =
  path.join(
    OUT,
    'round-2-rows.json'
  );

const REJECTED_FILE =
  path.join(
    OUT,
    'round-2-rejected.json'
  );

const ORCR_FILE =
  path.join(
    OUT,
    'round-2-orcr.json'
  );

const SUMMARY_FILE =
  path.join(
    OUT,
    'round-2-summary.json'
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
        String(line || '')
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


function key(
  value
) {

  return normalize(
    value
  )
    .toLowerCase()

    .replace(
      /\bpa\s+id\b/g,
      'paid'
    )

    .replace(
      /\bes\s+i\b/g,
      'esi'
    )

    .replace(
      /\bwid\s+ows\b/g,
      'widows'
    )

    .replace(
      /\bwi\s+dows\b/g,
      'widows'
    )

    .replace(
      /\)\s+quota\b/g,
      ')quota'
    )

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
| Quota dictionary
|--------------------------------------------------------------------------
*/

const qStart =
  lines.findIndex(
    line =>
      /^Quota Abbrevation$/i.test(
        line
      )
  );


const qEnd =
  lines.findIndex(
    (
      line,
      index
    ) =>
      index >
        qStart &&
      /^Allotted Category Abbrevations$/i.test(
        line
      )
  );


if (
  qStart < 0 ||
  qEnd <= qStart
) {
  throw new Error(
    'Quota dictionary not found.'
  );
}


const quotas = [];


for (
  let i =
    qStart + 2;
  i <
    qEnd;
  i += 1
) {

  const m =
    lines[i].match(
      /^([A-Z]{2})\s+(.+)$/
    );


  if (
    !m
  ) {
    continue;
  }


  quotas.push({
    code:
      m[1],

    description:
      normalize(
        m[2]
      ),

    key:
      key(
        m[2]
      ),
  });
}


/*
|--------------------------------------------------------------------------
| Historical Round-1 quota missing from Round-2 glossary
|--------------------------------------------------------------------------
|
| MCC 2024 Round-2 table retains Round-1 historical seats.
| "Foreign Country Quota" exists in Round-1 source but is not
| repeated in the Round-2 quota glossary.
|
*/

if (
  !quotas.some(
    quota =>
      quota.key ===
        key(
          'Foreign Country Quota'
        )
  )
) {

  quotas.push({
    code:
      'FQ',

    description:
      'Foreign Country Quota',

    key:
      key(
        'Foreign Country Quota'
      ),
  });
}


console.log(
  `Quota descriptions detected: ${quotas.length}`
);


/*
|--------------------------------------------------------------------------
| Continuity-aware row starts
|--------------------------------------------------------------------------
*/

const starts = [];

let expectedSNo =
  1;


for (
  let i = 0;
  i <
    lines.length;
  i += 1
) {

  const m =
    lines[i].match(
      /^(\d+)\s+(\d+(?:\.\d+)?)\s+(.+)$/
    );


  if (
    !m
  ) {
    continue;
  }


  const sno =
    Number(
      m[1]
    );


  if (
    sno !==
    expectedSNo
  ) {
    continue;
  }


  starts.push({
    lineIndex:
      i,

    sno,

    rankRaw:
      m[2],
  });


  expectedSNo +=
    1;
}


if (
  starts.length !==
    33890
) {
  throw new Error(
    `Expected 33890 rows, detected ${starts.length}`
  );
}


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const COURSES = [
  'B.Sc. Nursing',
  'MBBS',
  'BDS',
];


const ALLOTTED = [
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


function normalizeCandidate(
  value
) {

  const v =
    normalize(
      value
    );


  const map = {
    GNYes:
      'General PwD',

    'General PwD':
      'General PwD',

    General:
      'General',

    OBC:
      'OBC',

    EWS:
      'EWS',

    SC:
      'SC',

    ST:
      'ST',

    'OBC PwD':
      'OBC PwD',

    'EWS PwD':
      'EWS PwD',

    'SC PwD':
      'SC PwD',

    'ST PwD':
      'ST PwD',
  };


  return map[
    v
  ] ??
    null;
}


function matchQuotaAtStart(
  text
) {

  const tokens =
    normalize(
      text
    )
      .split(' ');


  let best =
    null;


  for (
    let count = 1;
    count <=
      Math.min(
        20,
        tokens.length
      );
    count += 1
  ) {

    const candidate =
      key(
        tokens
          .slice(
            0,
            count
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
        candidate ===
        quota.key
      ) {

        best = {
          ...quota,

          tokenCount:
            count,
        };
      }
    }
  }


  return best;
}


function parseCourseSeatTail(
  text,
  requireOption
) {

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
      requireOption
        ? new RegExp(
            `^(.*)\\s+(${escaped})\\s+(${ALLOTTED.join('|')})\\s+([A-Za-z]+(?:\\s+PwD)?)\\s+(\\d+)$`
          )
        : new RegExp(
            `^(.*)\\s+(${escaped})$`
          );


    const m =
      text.match(
        regex
      );


    if (
      !m
    ) {
      continue;
    }


    if (
      requireOption
    ) {

      const candidate =
        normalizeCandidate(
          m[4]
        );


      if (
        !candidate
      ) {
        continue;
      }


      return {
        institute:
          normalize(
            m[1]
          ),

        course,

        allottedCategory:
          normalize(
            m[3]
          ),

        candidateCategory:
          candidate,

        optionNo:
          Number(
            m[5]
          ),
      };

    } else {

      return {
        institute:
          normalize(
            m[1]
          ),

        course,
      };
    }
  }


  return null;
}


function normalizeTerminalStatus(
  text
) {

  const v =
    normalize(
      text
    )
      .replace(
        /\s*\(\s*CW\s+Rank\s*:\s*\d+\s*\)\s*$/,
        ''
      )
      .trim();


  if (
    /^Did not opt for Upgradation\.?$/.test(
      v
    )
  ) {
    return 'Did not opt for Upgradation';
  }


  if (
    /^Did not fill up fresh choices\.?$/.test(
      v
    )
  ) {
    return 'Did not fill up fresh choices.';
  }


  if (
    /^Fresh Allotted in 2nd Round$/.test(
      v
    )
  ) {
    return 'Fresh Allotted in 2nd Round';
  }


  if (
    /^No Upgradation\.?$/.test(
      v
    )
  ) {
    return 'No Upgradation';
  }


  if (
    /^Not Allotted\.?$/.test(
      v
    )
  ) {
    return 'Not Allotted';
  }


  if (
    /^Upgraded$/.test(
      v
    )
  ) {
    return 'Upgraded';
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| Validate Round-1 historical prefix
|--------------------------------------------------------------------------
*/

function historicalPrefixIsValid(
  input
) {

  const value =
    normalize(
      input
    );


  /*
   * No Round-1 seat.
   */

  if (
    /^-\s+-\s+-\s+-$/.test(
      value
    )
  ) {
    return true;
  }


  const historicalStatuses = [
    'Seat Surrendered',
    'Seat Cancelled',
    'Not Reported',
    'Reported',
  ];


  for (
    const status of
    historicalStatuses
  ) {

    const escapedStatus =
      status
        .split(/\s+/)
        .join(
          '\\s+'
        );


    const regex =
      new RegExp(
        `\\s+${escapedStatus}$`
      );


    const match =
      value.match(
        regex
      );


    if (
      !match
    ) {
      continue;
    }


    const beforeStatus =
      value
        .slice(
          0,
          match.index
        )
        .trim();


    const quota =
      matchQuotaAtStart(
        beforeStatus
      );


    if (
      !quota
    ) {
      continue;
    }


    const remainder =
      beforeStatus
        .split(/\s+/)
        .slice(
          quota.tokenCount
        )
        .join(
          ' '
        )
        .trim();


    const seat =
      parseCourseSeatTail(
        remainder,
        false
      );


    if (
      seat
    ) {
      return true;
    }
  }


  return false;
}


/*
|--------------------------------------------------------------------------
| Parse row
|--------------------------------------------------------------------------
*/

function parseRow(
  start,
  end
) {

  const rowLines =
    lines.slice(
      start.lineIndex,
      end
    );


  let text =
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


  text =
    text.replace(
      prefix,
      ''
    );


  /*
   * Terminal status
   */

  const terminalPatterns = [
    /Did not opt\s+for\s+Upgradation\.?$/,
    /Did not fill up\s+fresh choices\.?$/,
    /Fresh Allotted\s+in 2nd Round(?:\s*\(\s*CW\s+Rank\s*:\s*\d+\s*\))?$/,
    /No\s+Upgradation\.?$/,
    /Not Allotted\.?$/,
    /Upgraded$/,
  ];


  let statusRaw =
    null;

  let statusMatch =
    null;


  for (
    const regex of
    terminalPatterns
  ) {

    const m =
      text.match(
        regex
      );


    if (
      m
    ) {

      statusRaw =
        m[0];

      statusMatch =
        m;

      break;
    }
  }


  if (
    !statusMatch
  ) {

    return {
      ok:
        false,

      reason:
        'terminal-status-not-found',

      rowLines,
      text,
    };
  }


  const status =
    normalizeTerminalStatus(
      statusRaw
    );


  const cwRankMatch =
    statusRaw.match(
      /\(\s*CW\s+Rank\s*:\s*(\d+)\s*\)/
    );


  const cwRank =
    cwRankMatch
      ? Number(
          cwRankMatch[1]
        )
      : null;


  text =
    text
      .slice(
        0,
        statusMatch.index
      )
      .trim();


  /*
   * Current Round-2 seat exists only for:
   *
   * Fresh Allotted
   * Upgraded
   */

  const hasSeat =
    status ===
      'Fresh Allotted in 2nd Round' ||
    status ===
      'Upgraded';


  let round2 =
    {
      hasSeat:
        false,

      quota:
        null,

      quotaCode:
        null,

      institute:
        null,

      course:
        null,

      allottedCategory:
        null,

      candidateCategory:
        null,

      optionNo:
        null,

      cwRank,

      status,
    };


  /*
   * If current seat exists, parse from right side.
   */

  if (
    hasSeat
  ) {

    /*
     * Find current quota from the last viable quota occurrence.
     */

    const tokens =
      text.split(
        ' '
      );


    let currentSeat =
      null;


    for (
      let startIndex = 0;
      startIndex <
        tokens.length;
      startIndex += 1
    ) {

      const candidateText =
        tokens
          .slice(
            startIndex
          )
          .join(
            ' '
          );


      const quota =
        matchQuotaAtStart(
          candidateText
        );


      if (
        !quota
      ) {
        continue;
      }


      const remainder =
        candidateText
          .split(' ')
          .slice(
            quota.tokenCount
          )
          .join(
            ' '
          );


      const seat =
        parseCourseSeatTail(
          remainder,
          true
        );


      if (
        !seat
      ) {
        continue;
      }


      const historicalPrefix =
        tokens
          .slice(
            0,
            startIndex
          )
          .join(
            ' '
          )
          .trim();


      if (
        !historicalPrefixIsValid(
          historicalPrefix
        )
      ) {
        continue;
      }


      currentSeat = {
        quota,
        seat,

        tokenStart:
          startIndex,
      };


      /*
       * First quota whose preceding text forms a valid
       * historical Round-1 block is the real Round-2
       * quota boundary.
       */

      break;
    }


    if (
      !currentSeat
    ) {

      return {
        ok:
          false,

        reason:
          'round2-seat-parse-failed',

        status,

        text,

        rowLines,
      };
    }


    round2 = {
      hasSeat:
        true,

      quota:
        currentSeat.quota.description,

      quotaCode:
        currentSeat.quota.code,

      institute:
        currentSeat.seat.institute,

      course:
        currentSeat.seat.course,

      allottedCategory:
        currentSeat.seat.allottedCategory,

      candidateCategory:
        currentSeat.seat.candidateCategory,

      optionNo:
        currentSeat.seat.optionNo,

      cwRank,

      status,
    };


    /*
     * Historical Round-1 portion is everything
     * before current Round-2 quota.
     */

    text =
      tokens
        .slice(
          0,
          currentSeat.tokenStart
        )
        .join(
          ' '
        )
        .trim();
  }


  /*
   * When Round-2 has no current seat, MCC prints six dashes
   * for the empty Round-2 seat columns after the Round-1
   * historical status.
   *
   * Example:
   *
   *   ... MBBS Reported - - - - - -
   *
   * Remove ONLY that trailing empty-column marker.
   */

  if (
    !hasSeat
  ) {

    text =
      text
        .replace(
          /\s+-\s+-\s+-\s+-\s+-\s+-\s*$/,
          ''
        )
        .trim();
  }


  /*
   * Parse Round-1 historical section.
   *
   * Either:
   *
   * - - - -
   *
   * or:
   *
   * quota institute course historical-status
   */

  let round1 =
    {
      hasSeat:
        false,

      quota:
        null,

      quotaCode:
        null,

      institute:
        null,

      course:
        null,

      status:
        null,
    };


  if (
    /^-\s+-\s+-\s+-$/.test(
      text
    ) ||
    /^-\s+-\s+-\s+-\s+-\s+-?$/.test(
      text
    )
  ) {

    // no previous seat

  } else {

    const r1Statuses = [
      'Seat Surrendered',
      'Seat Cancelled',
      'Not Reported',
      'Reported',
    ];


    let historicalStatus =
      null;

    let beforeStatus =
      null;


    for (
      const candidate of
      r1Statuses
    ) {

      const regex =
        new RegExp(
          `\\s+${candidate.replace(
            ' ',
            '\\s+'
          )}$`
        );


      const m =
        text.match(
          regex
        );


      if (
        !m
      ) {
        continue;
      }


      historicalStatus =
        candidate;

      beforeStatus =
        text
          .slice(
            0,
            m.index
          )
          .trim();

      break;
    }


    if (
      historicalStatus
    ) {

      const quota =
        matchQuotaAtStart(
          beforeStatus
        );


      if (
        quota
      ) {

        const remainder =
          beforeStatus
            .split(' ')
            .slice(
              quota.tokenCount
            )
            .join(
              ' '
            );


        const seat =
          parseCourseSeatTail(
            remainder,
            false
          );


        if (
          seat
        ) {

          round1 = {
            hasSeat:
              true,

            quota:
              quota.description,

            quotaCode:
              quota.code,

            institute:
              seat.institute,

            course:
              seat.course,

            status:
              historicalStatus,
          };

        } else {

          return {
            ok:
              false,

            reason:
              'round1-course-parse-failed',

            text,
            rowLines,
          };
        }

      } else {

        return {
          ok:
            false,

          reason:
            'round1-quota-parse-failed',

          text,
          rowLines,
        };
      }

    } else {

      /*
       * If no Round-1 historical seat and the text
       * is dash-only after current seat removal.
       */

      if (
        !/^[-\s]+$/.test(
          text
        )
      ) {

        return {
          ok:
            false,

          reason:
            'round1-status-not-found',

          text,
          rowLines,
        };
      }
    }
  }


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
        Number(
          start.rankRaw
        ),

      rankRaw:
        start.rankRaw,

      rankFormat:
        start.rankRaw.includes(
          '.'
        )
          ? 'decimal-source-rank'
          : 'integer',

      round1,

      round2,
    },
  };
}


/*
|--------------------------------------------------------------------------
| Parse all
|--------------------------------------------------------------------------
*/

const rows = [];

const rejected = [];


for (
  let i = 0;
  i <
    starts.length;
  i += 1
) {

  const start =
    starts[i];


  const end =
    i + 1 <
      starts.length
      ? starts[
          i + 1
        ].lineIndex
      : lines.length;


  const result =
    parseRow(
      start,
      end
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
        start.sno,

      rankRaw:
        start.rankRaw,

      ...result,
    });
  }
}


/*
|--------------------------------------------------------------------------
| OR-CR for current Round-2 holdings
|--------------------------------------------------------------------------
*/

const groups =
  new Map();


for (
  const row of
  rows
) {

  if (
    !row.round2
      ?.hasSeat
  ) {
    continue;
  }


  const seat =
    row.round2;


  const groupKey =
    JSON.stringify([
      seat.institute,
      seat.course,
      seat.quota,
      seat.allottedCategory,
    ]);


  let group =
    groups.get(
      groupKey
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
        seat.institute,

      course:
        seat.course,

      quota:
        seat.quota,

      quotaCode:
        seat.quotaCode,

      category:
        seat.allottedCategory,

      openingRank:
        row.rank,

      openingRankRaw:
        row.rankRaw,

      closingRank:
        row.rank,

      closingRankRaw:
        row.rankRaw,

      allotments:
        0,
    };


    groups.set(
      groupKey,
      group
    );
  }


  group.allotments +=
    1;


  if (
    row.rank <
      group.openingRank
  ) {

    group.openingRank =
      row.rank;

    group.openingRankRaw =
      row.rankRaw;
  }


  if (
    row.rank >
      group.closingRank
  ) {

    group.closingRank =
      row.rank;

    group.closingRankRaw =
      row.rankRaw;
  }
}


const orcr =
  [...groups.values()];


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

    const k =
      String(
        value ?? 'NULL'
      );


    counts[k] =
      (
        counts[k] ||
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
    rows.at(
      -1
    )
      ?.sno ??
    null,

  firstRankRaw:
    rows[0]
      ?.rankRaw ??
    null,

  lastRankRaw:
    rows.at(
      -1
    )
      ?.rankRaw ??
    null,

  decimalSourceRanks:
    rows.filter(
      row =>
        row.rankRaw.includes(
          '.'
        )
    ).length,

  round1StatusCounts:
    countBy(
      rows.map(
        row =>
          row.round1
            ?.status
      )
    ),

  round2StatusCounts:
    countBy(
      rows.map(
        row =>
          row.round2
            ?.status
      )
    ),

  rowsWithRound2Seat:
    rows.filter(
      row =>
        row.round2
          ?.hasSeat
    ).length,

  rowsWithoutRound2Seat:
    rows.filter(
      row =>
        !row.round2
          ?.hasSeat
    ).length,

  round2CourseCounts:
    countBy(
      rows
        .filter(
          row =>
            row.round2
              ?.hasSeat
        )
        .map(
          row =>
            row.round2
              .course
        )
    ),

  round2AllottedCategoryCounts:
    countBy(
      rows
        .filter(
          row =>
            row.round2
              ?.hasSeat
        )
        .map(
          row =>
            row.round2
              .allottedCategory
        )
    ),

  round2CandidateCategoryCounts:
    countBy(
      rows
        .filter(
          row =>
            row.round2
              ?.hasSeat
        )
        .map(
          row =>
            row.round2
              .candidateCategory
        )
    ),

  orcrGroups:
    orcr.length,
};


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
  'NEET 2024 ROUND 2 PARSE COMPLETE'
);

console.log(
  '========================================\n'
);


console.log(
  JSON.stringify(
    summary,
    null,
    2
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
  '\nFIRST 10 CURRENT ROUND-2 SEATS'
);


console.table(
  rows
    .filter(
      row =>
        row.round2
          ?.hasSeat
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
          row.round2.quota,

        institute:
          row.round2.institute,

        course:
          row.round2.course,

        category:
          row.round2.allottedCategory,

        candidate:
          row.round2.candidateCategory,

        option:
          row.round2.optionNo,

        status:
          row.round2.status,
      })
    )
);



