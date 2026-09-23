import fs from 'fs';

const file =
  './backend/src/services/neetRecommendationService.js';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


if (
  src.includes(
    'export async function fetchNeetAdmissionHistory'
  )
) {
  console.log(
    'NEET history service already exists.'
  );

  process.exit(0);
}


const code = `


/*
|--------------------------------------------------------------------------
| NEET MCC HISTORICAL ADMISSION INTELLIGENCE
|--------------------------------------------------------------------------
*/

function historyTextKey(
  value
) {
  return String(
    value ?? ''
  )
    .toLowerCase()
    .replace(
      /&/g,
      ' and '
    )
    .replace(
      /[^a-z0-9]+/g,
      ' '
    )
    .replace(
      /\\s+/g,
      ' '
    )
    .trim();
}


function instituteIdentityKey(
  value
) {
  const raw =
    String(
      value ?? ''
    );


  /*
   * MCC institute strings usually contain
   * institute name followed by address.
   *
   * First two comma components provide a
   * useful identity while avoiding most
   * postal/address noise.
   */

  const parts =
    raw
      .split(',')
      .map(
        item =>
          item.trim()
      )
      .filter(
        Boolean
      );


  return historyTextKey(
    parts
      .slice(
        0,
        2
      )
      .join(' ')
  );
}


function tokenSimilarity(
  left,
  right
) {
  const a =
    new Set(
      historyTextKey(
        left
      )
        .split(' ')
        .filter(
          token =>
            token.length > 1
        )
    );


  const b =
    new Set(
      historyTextKey(
        right
      )
        .split(' ')
        .filter(
          token =>
            token.length > 1
        )
    );


  if (
    !a.size ||
    !b.size
  ) {
    return 0;
  }


  let common =
    0;


  for (
    const token of
    a
  ) {
    if (
      b.has(
        token
      )
    ) {
      common +=
        1;
    }
  }


  return (
    common /
    Math.max(
      a.size,
      b.size
    )
  );
}


function historyBucket(
  studentRank,
  closingRank
) {
  const rank =
    Number(
      studentRank
    );

  const cutoff =
    Number(
      closingRank
    );


  if (
    !Number.isFinite(
      rank
    ) ||
    rank <= 0 ||
    !Number.isFinite(
      cutoff
    ) ||
    cutoff <= 0
  ) {
    return 'Target';
  }


  const ratio =
    rank /
    cutoff;


  if (
    ratio <=
    0.60
  ) {
    return 'Backup';
  }


  if (
    ratio <=
    0.85
  ) {
    return 'Safe';
  }


  if (
    ratio <=
    1.05
  ) {
    return 'Target';
  }


  return 'Dream';
}


function historyRoundNumber(
  value,
  fileName
) {
  const raw =
    String(
      value ??
      fileName ??
      ''
    )
      .toLowerCase();


  if (
    raw.includes(
      'special'
    ) &&
    raw.includes(
      'stray'
    )
  ) {
    return 99;
  }


  if (
    raw.includes(
      'stray'
    )
  ) {
    return 98;
  }


  const match =
    raw.match(
      /(\\d+)/
    );


  return match
    ? Number(
        match[1]
      )
    : 0;
}


function historyRoundLabel(
  value,
  fileName
) {
  const raw =
    String(
      value ??
      fileName ??
      ''
    );


  if (
    /special.*stray/i.test(
      raw
    )
  ) {
    return 'Special Stray';
  }


  if (
    /stray/i.test(
      raw
    )
  ) {
    return 'Stray Vacancy';
  }


  const match =
    raw.match(
      /(\\d+)/
    );


  return match
    ? \`Round \${match[1]}\`
    : raw;
}


function loadYearOrcrFiles(
  year
) {
  const directory =
    path.join(
      DATA_ROOT,
      String(
        year
      ),
      'parsed'
    );


  if (
    !fs.existsSync(
      directory
    )
  ) {
    return [];
  }


  return fs
    .readdirSync(
      directory
    )
    .filter(
      name =>
        /orcr\\.json$/i.test(
          name
        )
    )
    .map(
      name => ({
        name,

        file:
          path.join(
            directory,
            name
          ),
      })
    );
}


function findHistoricalInstituteRow({
  rows,
  collegeName,
  course,
  category,
  quota,
}) {
  const targetCourse =
    historyTextKey(
      normalizeCourse(
        course
      )
    );


  const targetCategory =
    historyTextKey(
      normalizeCategory(
        category
      )
    );


  const targetQuota =
    historyTextKey(
      quota
    );


  const targetInstitute =
    instituteIdentityKey(
      collegeName
    );


  const candidates =
    rows
      .filter(
        row =>
          historyTextKey(
            normalizeCourse(
              row?.course
            )
          ) ===
            targetCourse &&
          historyTextKey(
            row?.category
          ) ===
            targetCategory
      )
      .map(
        row => {

          const instituteScore =
            tokenSimilarity(
              targetInstitute,
              instituteIdentityKey(
                row?.institute
              )
            );


          const quotaScore =
            targetQuota
              ? tokenSimilarity(
                  targetQuota,
                  row?.quota
                )
              : 1;


          return {
            row,

            score:
              (
                instituteScore *
                0.85
              ) +
              (
                quotaScore *
                0.15
              ),
          };
        }
      )
      .filter(
        item =>
          item.score >=
            0.58
      )
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      );


  return (
    candidates[0] ||
    null
  );
}


function buildNeetTrend(
  years
) {
  if (
    years.length <
    2
  ) {
    return {
      label:
        'Insufficient multi-year data',

      direction:
        'UNKNOWN',

      percentChange:
        null,
    };
  }


  const chronological =
    [
      ...years,
    ].sort(
      (
        a,
        b
      ) =>
        a.year -
        b.year
    );


  const oldest =
    chronological[0];

  const latest =
    chronological[
      chronological.length -
      1
    ];


  const oldCutoff =
    Number(
      oldest.closingRank
    );

  const newCutoff =
    Number(
      latest.closingRank
    );


  if (
    !Number.isFinite(
      oldCutoff
    ) ||
    oldCutoff <= 0 ||
    !Number.isFinite(
      newCutoff
    )
  ) {
    return {
      label:
        'Trend unavailable',

      direction:
        'UNKNOWN',

      percentChange:
        null,
    };
  }


  const percentChange =
    (
      (
        newCutoff -
        oldCutoff
      ) /
      oldCutoff
    ) *
    100;


  if (
    Math.abs(
      percentChange
    ) <
    5
  ) {
    return {
      label:
        'Stable',

      direction:
        'STABLE',

      percentChange,
    };
  }


  if (
    percentChange >
    0
  ) {
    return {
      label:
        'More Accessible',

      direction:
        'MORE_ACCESSIBLE',

      percentChange,
    };
  }


  return {
    label:
      'More Competitive',

    direction:
      'MORE_COMPETITIVE',

    percentChange,
  };
}


export async function fetchNeetAdmissionHistory({
  collegeName,
  course,
  category = 'Open',
  quota = '',
  rank,
}) {
  const studentRank =
    Number(
      rank
    );


  if (
    !collegeName ||
    !course
  ) {
    throw new Error(
      'College and medical course are required.'
    );
  }


  const years =
    [];


  for (
    const year of
    [
      2026,
      2025,
      2024,
    ]
  ) {
    const files =
      loadYearOrcrFiles(
        year
      );


    const roundMatches =
      [];


    for (
      const info of
      files
    ) {
      const payload =
        readJson(
          info.file
        );


      const rows =
        Array.isArray(
          payload
        )
          ? payload
          : Array.isArray(
              payload?.rows
            )
            ? payload.rows
            : Array.isArray(
                payload?.data
              )
              ? payload.data
              : [];


      const match =
        findHistoricalInstituteRow({
          rows,
          collegeName,
          course,
          category,
          quota,
        });


      if (
        !match
      ) {
        continue;
      }


      const row =
        match.row;


      roundMatches.push({
        year,

        round:
          historyRoundLabel(
            row?.round,
            info.name
          ),

        roundOrder:
          historyRoundNumber(
            row?.round,
            info.name
          ),

        institute:
          row?.institute,

        course:
          normalizeCourse(
            row?.course
          ),

        category:
          row?.category,

        quota:
          row?.quota,

        openingRank:
          Number(
            row?.openingRank
          ),

        closingRank:
          Number(
            row?.closingRank
          ),

        matchConfidence:
          Math.round(
            match.score *
            100
          ),
      });
    }


    if (
      !roundMatches.length
    ) {
      continue;
    }


    roundMatches.sort(
      (
        a,
        b
      ) =>
        a.roundOrder -
        b.roundOrder
    );


    const first =
      roundMatches[0];


    const final =
      roundMatches[
        roundMatches.length -
        1
      ];


    const openingRank =
      Number(
        first.openingRank
      );


    const closingRank =
      Number(
        final.closingRank
      );


    years.push({
      year,

      finalRound:
        final.round,

      openingRank:
        Number.isFinite(
          openingRank
        )
          ? openingRank
          : null,

      closingRank:
        Number.isFinite(
          closingRank
        )
          ? closingRank
          : null,

      rankRatio:
        Number.isFinite(
          studentRank
        ) &&
        studentRank > 0 &&
        Number.isFinite(
          closingRank
        ) &&
        closingRank > 0
          ? studentRank /
            closingRank
          : null,

      bucket:
        historyBucket(
          studentRank,
          closingRank
        ),

      roundCount:
        roundMatches.length,

      rounds:
        roundMatches,
    });
  }


  const latestYear =
    years[0] ||
    null;


  const trend =
    buildNeetTrend(
      years
    );


  const availableYears =
    years.length;


  const confidenceLabel =
    availableYears >=
      3
      ? 'High'
      : availableYears ===
          2
        ? 'Medium'
        : availableYears ===
            1
          ? 'Low'
          : 'Unavailable';


  const intelligence = {
    route:
      'MCC',

    available:
      availableYears >
      0,

    historicalBucket:
      latestYear?.bucket ||
      null,

    latestYear:
      latestYear?.year ||
      null,

    likelyRound:
      latestYear
        ? {
            year:
              latestYear.year,

            round:
              latestYear.finalRound,

            openingRank:
              latestYear.openingRank,

            closingRank:
              latestYear.closingRank,

            margin:
              Number.isFinite(
                studentRank
              ) &&
              Number.isFinite(
                latestYear
                  .closingRank
              )
                ? latestYear
                    .closingRank -
                  studentRank
                : null,
          }
        : null,

    trend,

    confidence: {
      label:
        confidenceLabel,

      availableYears,
    },

    years,
  };


  /*
   * Keep "josaa" compatibility key only so the
   * existing historical UI can render the data.
   * Frontend relabels this route to MCC for NEET.
   */

  return {
    data: {
      neet:
        true,

      route:
        'MCC',

      collegeName,

      course:
        normalizeCourse(
          course
        ),

      category:
        normalizeCategory(
          category
        ),

      quota,

      josaa:
        years,

      csab:
        [],

      intelligence: {
        josaa:
          intelligence,

        csab: {
          route:
            'NOT_APPLICABLE',

          available:
            false,
        },
      },
    },
  };
}
`;


src =
  src +
  code;


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET MCC history service added.'
);
