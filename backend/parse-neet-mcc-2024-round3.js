import fs from 'fs';
import path from 'path';


const YEAR =
  2024;

const ROUND =
  3;


const TEXT_FILE =
  './data/neet/mcc/2024/text/round-3.txt';

const SEG_FILE =
  './data/neet/mcc/2024/round3-terminal-segmentation.json';

const OUT =
  './data/neet/mcc/2024/parsed';


fs.mkdirSync(
  OUT,
  {
    recursive:
      true,
  }
);


const lines =
  fs.readFileSync(
    TEXT_FILE,
    'utf8'
  )
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


const segmentation =
  JSON.parse(
    fs.readFileSync(
      SEG_FILE,
      'utf8'
    )
  );


const segmentedRows =
  segmentation.rows;


/*
|--------------------------------------------------------------------------
| Helpers
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


function grammar(
  value
) {

  return normalize(
    value
  )

    .replace(
      /\bUpgradati\s+on\b/gi,
      'Upgradation'
    )

    .replace(
      /\bUniversit\s+y\b/gi,
      'University'
    )

    .replace(
      /\bWi\s+dows\b/gi,
      'Widows'
    )

    .replace(
      /\bWid\s+ows\b/gi,
      'Widows'
    )

    .replace(
      /\bPersonne\s+l\b/gi,
      'Personnel'
    )

    .replace(
      /\bSurrende\s+red\b/gi,
      'Surrendered'
    )

    .replace(
      /\bDeemed\/\s+Paid\b/gi,
      'Deemed/Paid'
    )

    .replace(
      /\bDeemed\/P\s+aid\b/gi,
      'Deemed/Paid'
    )

    .replace(
      /\bEmploye\s+es\b/gi,
      'Employees'
    )

    /*
     * MCC 2024 Round-3 PDF extraction artifacts.
     */

    .replace(
      /\bEmployee\s+s\b/gi,
      'Employees'
    )

    .replace(
      /\bInsuranc\s+e\b/gi,
      'Insurance'
    )

    .replace(
      /\bPuducher\s+ry\b/gi,
      'Puducherry'
    )

    .replace(
      /\bPuducherr\s+y\b/gi,
      'Puducherry'
    )

    .replace(
      /\bPUDUCHERR\s+Y\b/g,
      'PUDUCHERRY'
    )

    .replace(
      /\bNon-\s+Resident\b/gi,
      'Non-Resident'
    )

    .replace(
      /\(\s*A\s+MU\s*\)/gi,
      '(AMU)'
    )

    .replace(
      /\(\s*AM\s+U\s*\)/gi,
      '(AMU)'
    )

    .replace(
      /\bQuot\s+a\b/gi,
      'Quota'
    )

    .replace(
      /\bCancelle\s+d\b/gi,
      'Cancelled'
    )

    .replace(
      /Scheme\(\s*E\s+SI\s*\)/gi,
      'Scheme(ESI)'
    )

    .replace(
      /Scheme\(\s*ESI\s*\)/gi,
      'Scheme(ESI)'
    )

    .replace(
      /\bInternal\s+-\s+Puducherry\b/gi,
      'Internal -Puducherry'
    )

    .replace(
      /\bMEDICA\s+L\b/g,
      'MEDICAL'
    )

    .replace(
      /\bGOVERNMEN\s+T\b/g,
      'GOVERNMENT'
    )

    .replace(
      /\bBHUBANESW\s+AR\b/gi,
      'BHUBANESWAR'
    )

    .replace(
      /\bMANGALAGI\s+RI\b/gi,
      'MANGALAGIRI'
    )

    .replace(
      /\brat\b/gi,
      'rat'
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


function joinedRow(
  row
) {

  return lines
    .slice(
      row.lineIndex,
      row.endLineIndex + 1
    )
    .join(' ');
}


/*
|--------------------------------------------------------------------------
| Quotas
|--------------------------------------------------------------------------
*/

const KNOWN_QUOTAS = [
  'Open Seat Quota',
  'All India',
  'Delhi University Quota',
  'Deemed/Paid Seats Quota',
  'IP University Quota',
  'Foreign Country Quota',
  'Aligarh Muslim University (AMU) Quota',
  'Internal -Puducherry UT Domicile',
  'Employees State Insurance Scheme(ESI)',
  'Delhi NCR Children/Widows of Personnel of the Armed Forces (CW) Quota',
  'Delhi NCR Children/Widows of Personnel of the Armed Forces (CW) DU Quota',
  'Delhi NCR Children/Widows of Personnel of the Armed Forces (CW) IP Quota',
  'Non-Resident Indian',
  'Non-Resident Indian(AMU) Quota',
  'B.Sc Nursing All India',
  'B.Sc Nursing Delhi NCR',
  'B.Sc Nursing Delhi NCR CW Quota',
  'Employees State Insurance Scheme Nursing Quota (ESI-IP Quota Nursing)',
  'Muslim Minority Quota',
  'Muslim Women Quota',
  'Muslim OBC Quota',
  'Muslim ST Quota',
  'Muslim Quota',
  'Jamia Internal Quota',
  'Jain Minority Quota',
];


function quotaKey(
  value
) {

  return grammar(
    value
  )
    .toLowerCase()

    .replace(
      /\s*\/\s*/g,
      '/'
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
      /\(\s*a\s+mu\s*\)/g,
      '(amu)'
    )

    .replace(
      /\(\s*am\s+u\s*\)/g,
      '(amu)'
    )

    .replace(
      /\bquot\s+a\b/g,
      'quota'
    )

    .replace(
      /\)\s+quota\b/g,
      ')quota'
    )

    .replace(
      /\binternal\s+-\s*puducherry\b/g,
      'internal -puducherry'
    )

    .replace(
      /\bscheme\(\s*e\s+si\s*\)/g,
      'scheme(esi)'
    )

    .replace(
      /\bscheme\(\s*esi\s*\)/g,
      'scheme(esi)'
    )

    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


const QUOTAS =
  KNOWN_QUOTAS.map(
    description => ({
      description,
      key:
        quotaKey(
          description
        ),
    })
  );


function matchQuotaAtStart(
  input
) {

  const tokens =
    grammar(
      input
    )
      .split(/\s+/);


  let best =
    null;


  for (
    let count = 1;
    count <=
      Math.min(
        24,
        tokens.length
      );
    count += 1
  ) {

    const candidate =
      quotaKey(
        tokens
          .slice(
            0,
            count
          )
          .join(' ')
      );


    for (
      const quota of
      QUOTAS
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


/*
|--------------------------------------------------------------------------
| Course + status helpers
|--------------------------------------------------------------------------
*/

const COURSES = [
  'B.Sc. Nursing',
  'B.Sc Nursing',
  'MBBS',
  'BDS',
];


const R1_R2_STATUSES = [
  'Seat Surrendered',
  'Seat Cancelled',
  'Not Reported',
  'Reported',
];


function splitHistoricalSeat(
  input
) {

  const text =
    grammar(
      input
    );


  for (
    const status of
    R1_R2_STATUSES
  ) {

    const regex =
      new RegExp(
        `\\s+${status
          .split(/\s+/)
          .join('\\s+')}$`
      );


    const match =
      text.match(
        regex
      );


    if (
      !match
    ) {
      continue;
    }


    const beforeStatus =
      text
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
      return null;
    }


    const remainder =
      beforeStatus
        .split(/\s+/)
        .slice(
          quota.tokenCount
        )
        .join(' ');


    for (
      const course of
      COURSES
    ) {

      const escaped =
        course.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );


      const m =
        remainder.match(
          new RegExp(
            `^(.*)\\s+(${escaped})$`
          )
        );


      if (
        m
      ) {

        return {
          hasSeat:
            true,

          quota:
            quota.description,

          institute:
            normalize(
              m[1]
            ),

          course:
            m[2]
              .replace(
                'B.Sc Nursing',
                'B.Sc. Nursing'
              ),

          status,
        };
      }
    }
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| Round-3 terminal status
|--------------------------------------------------------------------------
*/

function normalizedTerminalStatus(
  value
) {

  const text =
    grammar(
      value
    );


  if (
    /Did not opt for Upgradation\.?$/.test(
      text
    )
  ) {
    return 'Did not opt for Upgradation';
  }


  if (
    /Did not fill up fresh choices\.?$/.test(
      text
    )
  ) {
    return 'Did not fill up fresh choices.';
  }


  if (
    /No Upgradation\.?$/.test(
      text
    )
  ) {
    return 'No Upgradation';
  }


  if (
    /Not Allotted\.?$/.test(
      text
    )
  ) {
    return 'Not Allotted';
  }


  if (
    /Upgraded$/.test(
      text
    )
  ) {
    return 'Upgraded';
  }


  if (
    /Fresh Allotted in 3nd Round(?:\s*\(\s*CW\s+Rank\s*:\s*\d+\s*\))?$/.test(
      text
    )
  ) {
    return 'Fresh Allotted in 3nd Round';
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| Parse current Round-3 seat from right side
|--------------------------------------------------------------------------
*/

const ALLOTTED_CATS = [
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


function parseRound3Seat(
  input,
  status
) {

  const text =
    grammar(
      input
    );


  const cwMatch =
    text.match(
      /\(\s*CW\s+Rank\s*:\s*(\d+)\s*\)\s*$/
    );


  const cwRank =
    cwMatch
      ? Number(
          cwMatch[1]
        )
      : null;


  let withoutTerminal =
    text;


  if (
    status ===
    'Fresh Allotted in 3nd Round'
  ) {

    withoutTerminal =
      withoutTerminal.replace(
        /\s+Fresh Allotted in 3nd Round(?:\s*\(\s*CW\s+Rank\s*:\s*\d+\s*\))?$/,
        ''
      );

  } else if (
    status ===
    'Upgraded'
  ) {

    withoutTerminal =
      withoutTerminal.replace(
        /\s+Upgraded$/,
        ''
      );
  }


  for (
    const course of
    COURSES
  ) {

    const escapedCourse =
      course.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      );


    for (
      const allotted of
      ALLOTTED_CATS
    ) {

      const escapedAllotted =
        allotted.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        );


      /*
       * Normal rows:
       *
       * course allotted candidate option
       *
       * Special CW row:
       *
       * MBBS Open - 1
       */

      const regex =
        new RegExp(
          `^(.*)\\s+(${escapedCourse})\\s+(${escapedAllotted})\\s+([A-Za-z]+(?:\\s+PwD)?|GNYes|-)\\s+(\\d+)$`
        );


      const m =
        withoutTerminal.match(
          regex
        );


      if (
        !m
      ) {
        continue;
      }


      let candidate =
        m[4];


      if (
        candidate ===
        'GNYes'
      ) {
        candidate =
          'General PwD';
      }


      if (
        candidate ===
        '-'
      ) {
        candidate =
          null;
      }


      const beforeSeat =
        normalize(
          m[1]
        );


      /*
       * Find actual Round-3 quota boundary by scanning
       * possible quota starts and keeping the first whose
       * prefix is a valid Round1/Round2 historical structure.
       */

      const tokens =
        beforeSeat.split(/\s+/);


      const candidates = [];


      for (
        let i = 0;
        i <
          tokens.length;
        i += 1
      ) {

        const possible =
          tokens
            .slice(i)
            .join(' ');


        const quota =
          matchQuotaAtStart(
            possible
          );


        if (
          !quota
        ) {
          continue;
        }


        candidates.push({
          tokenStart:
            i,

          quota,
        });
      }


      return {
        beforeSeat,
        candidates,

        course:
          m[2]
            .replace(
              'B.Sc Nursing',
              'B.Sc. Nursing'
            ),

        allottedCategory:
          m[3],

        candidateCategory:
          candidate,

        optionNo:
          Number(
            m[5]
          ),

        cwRank,
      };
    }
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| Parse historical prefix using dash-block grammar
|--------------------------------------------------------------------------
*/

function parseHistory(
  prefix
) {

  let text =
    grammar(
      prefix
    );


  const emptyRound = () => ({
    hasSeat:
      false,

    quota:
      null,

    institute:
      null,

    course:
      null,

    status:
      null,
  });


  /*
   * 8 leading dashes:
   *
   * no Round1, no Round2
   */

  if (
    /^-\s+-\s+-\s+-\s+-\s+-\s+-\s+-\s*$/.test(
      text
    )
  ) {

    return {
      round1:
        emptyRound(),

      round2:
        emptyRound(),
    };
  }


  /*
   * 4 leading dashes:
   *
   * no Round1, then possible Round2 historical seat
   */

  if (
    /^-\s+-\s+-\s+-\s+/.test(
      text
    )
  ) {

    text =
      text.replace(
        /^-\s+-\s+-\s+-\s+/,
        ''
      );


    const r2 =
      splitHistoricalSeat(
        text
      );


    if (
      !r2
    ) {
      return null;
    }


    return {
      round1:
        emptyRound(),

      round2:
        r2,
    };
  }


  /*
   * Otherwise:
   *
   * Round1 historical seat exists.
   *
   * Then either:
   *   6 trailing dashes = no Round2/3 seat
   * or
   *   Round2 historical seat follows.
   */


  /*
   * Find first historical seat end.
   */

  const tokens =
    text.split(/\s+/);


  let r1 =
    null;

  let r1End =
    null;


  for (
    let end = 1;
    end <=
      tokens.length;
    end += 1
  ) {

    const candidate =
      tokens
        .slice(
          0,
          end
        )
        .join(' ');


    const parsed =
      splitHistoricalSeat(
        candidate
      );


    if (
      parsed
    ) {

      r1 =
        parsed;

      r1End =
        end;

      break;
    }
  }


  if (
    !r1
  ) {
    return null;
  }


  let remainder =
    tokens
      .slice(
        r1End
      )
      .join(' ')
      .trim();


  if (
    !remainder
  ) {

    return {
      round1:
        r1,

      round2:
        emptyRound(),
    };
  }


  if (
    /^-\s+-\s+-\s+-\s*$/.test(
      remainder
    ) ||
    /^-\s+-\s+-\s+-\s+-\s+-\s*$/.test(
      remainder
    )
  ) {

    return {
      round1:
        r1,

      round2:
        emptyRound(),
    };
  }


  const r2 =
    splitHistoricalSeat(
      remainder
    );


  if (
    !r2
  ) {
    return null;
  }


  return {
    round1:
      r1,

    round2:
      r2,
  };
}


/*
|--------------------------------------------------------------------------
| Parse rows
|--------------------------------------------------------------------------
*/

const rows = [];

const rejected = [];


for (
  const seg of
  segmentedRows
) {

  const rawRow =
    joinedRow(
      seg
    );


  let text =
    grammar(
      rawRow
    );


  const rankRaw =
    seg.rankRaw;


  text =
    text.replace(
      new RegExp(
        `^${rankRaw.replace(
          '.',
          '\\.'
        )}\\s+`
      ),
      ''
    );


  const status =
    normalizedTerminalStatus(
      text
    );


  if (
    !status
  ) {

    rejected.push({
      rankRaw,
      reason:
        'terminal-status-failed',
      text,
    });

    continue;
  }


  const hasRound3Seat =
    status ===
      'Upgraded' ||
    status ===
      'Fresh Allotted in 3nd Round';


  let round3 = {
    hasSeat:
      false,

    quota:
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

    cwRank:
      null,

    status,
  };


  let historyPrefix =
    null;


  if (
    hasRound3Seat
  ) {

    const current =
      parseRound3Seat(
        text,
        status
      );


    if (
      !current
    ) {

      rejected.push({
        rankRaw,
        reason:
          'round3-seat-tail-failed',
        text,
      });

      continue;
    }


    let selected =
      null;


    for (
      const candidate of
      current.candidates
    ) {

      const prefixTokens =
        current.beforeSeat
          .split(/\s+/)
          .slice(
            0,
            candidate.tokenStart
          )
          .join(' ')
          .trim();


      const history =
        parseHistory(
          prefixTokens
        );


      if (
        history
      ) {

        selected = {
          quota:
            candidate.quota,

          tokenStart:
            candidate.tokenStart,

          history,
        };

        break;
      }
    }


    if (
      !selected
    ) {

      rejected.push({
        rankRaw,
        reason:
          'round3-quota-boundary-failed',
        text,
      });

      continue;
    }


    const seatTokens =
      current.beforeSeat
        .split(/\s+/)
        .slice(
          selected.tokenStart +
          selected.quota.tokenCount
        );


    const institute =
      seatTokens.join(' ');


    round3 = {
      hasSeat:
        true,

      quota:
        selected.quota.description,

      institute:
        normalize(
          institute
        ),

      course:
        current.course,

      allottedCategory:
        current.allottedCategory,

      candidateCategory:
        current.candidateCategory,

      optionNo:
        current.optionNo,

      cwRank:
        current.cwRank,

      status,
    };


    rows.push({
      year:
        YEAR,

      counselling:
        'MCC',

      exam:
        'NEET UG',

      round:
        ROUND,

      rank:
        Number(
          rankRaw
        ),

      rankRaw,

      rankFormat:
        rankRaw.includes('.')
          ? 'decimal-source-rank'
          : 'integer',

      round1:
        selected.history.round1,

      round2:
        selected.history.round2,

      round3,
    });


    continue;
  }


  /*
   * Non-seat Round-3 row:
   *
   * Strip terminal status and trailing empty Round-3 columns.
   */

  let prefix =
    text;


  const terminalPatterns = [
    /Did not opt for Upgradation\.?$/,
    /Did not fill up fresh choices\.?$/,
    /No Upgradation\.?$/,
    /Not Allotted\.?$/,
  ];


  for (
    const regex of
    terminalPatterns
  ) {

    if (
      regex.test(
        prefix
      )
    ) {

      prefix =
        prefix.replace(
          regex,
          ''
        )
        .trim();

      break;
    }
  }


  prefix =
    prefix.replace(
      /\s+-\s+-\s+-\s+-\s+-\s+-\s*$/,
      ''
    )
    .trim();


  const history =
    parseHistory(
      prefix
    );


  if (
    !history
  ) {

    rejected.push({
      rankRaw,
      reason:
        'history-parse-failed',
      text,
      prefix,
    });

    continue;
  }


  rows.push({
    year:
      YEAR,

    counselling:
      'MCC',

    exam:
      'NEET UG',

    round:
      ROUND,

    rank:
      Number(
        rankRaw
      ),

    rankRaw,

    rankFormat:
      rankRaw.includes('.')
        ? 'decimal-source-rank'
        : 'integer',

    round1:
      history.round1,

    round2:
      history.round2,

    round3,
  });
}


/*
|--------------------------------------------------------------------------
| OR-CR
|--------------------------------------------------------------------------
*/

const groups =
  new Map();


for (
  const row of
  rows
) {

  if (
    !row.round3
      ?.hasSeat
  ) {
    continue;
  }


  const seat =
    row.round3;


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

  const out = {};


  for (
    const value of
    values
  ) {

    const k =
      String(
        value ?? 'NULL'
      );


    out[k] =
      (
        out[k] ||
        0
      ) +
      1;
  }


  return out;
}


const currentSeats =
  rows.filter(
    row =>
      row.round3
        ?.hasSeat
  );


const summary = {
  segmentedRows:
    segmentedRows.length,

  parsedRows:
    rows.length,

  rejectedRows:
    rejected.length,

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
        row.rankRaw.includes('.')
    ).length,

  round3StatusCounts:
    countBy(
      rows.map(
        row =>
          row.round3.status
      )
    ),

  rowsWithRound3Seat:
    currentSeats.length,

  rowsWithoutRound3Seat:
    rows.length -
    currentSeats.length,

  round3CourseCounts:
    countBy(
      currentSeats.map(
        row =>
          row.round3.course
      )
    ),

  round3AllottedCategoryCounts:
    countBy(
      currentSeats.map(
        row =>
          row.round3.allottedCategory
      )
    ),

  round3CandidateCategoryCounts:
    countBy(
      currentSeats.map(
        row =>
          row.round3.candidateCategory
      )
    ),

  cwRankRows:
    currentSeats.filter(
      row =>
        Number.isInteger(
          row.round3.cwRank
        )
    ).length,

  orcrGroups:
    orcr.length,
};


fs.writeFileSync(
  path.join(
    OUT,
    'round-3-rows.json'
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
    OUT,
    'round-3-rejected.json'
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
    OUT,
    'round-3-orcr.json'
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
    OUT,
    'round-3-summary.json'
  ),
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
  'NEET 2024 ROUND 3 PARSE COMPLETE'
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
    '\nFIRST 25 REJECTED'
  );


  console.dir(
    rejected.slice(
      0,
      25
    ),
    {
      depth:
        null,
    }
  );
}


