import fs from 'fs';
import path from 'path';
import {
  fileURLToPath,
} from 'url';


const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  path.dirname(
    __filename
  );


const DATA_ROOT =
  path.resolve(
    __dirname,
    '../../../data/neet/mcc'
  );

const STATE_DATA_ROOT =
  path.resolve(
    __dirname,
    '../../../data/neet/state'
  );


const DEFAULT_COURSES = [
  'MBBS',
  'BDS',
  'B.Sc. Nursing',
];


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalize(
  value
) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase();
}


function normalizeCategory(
  value
) {
  const key =
    normalize(
      value
    )
      .replace(
        /[^a-z0-9]/g,
        ''
      );


  const map = {
    general:
      'Open',

    gen:
      'Open',

    open:
      'Open',

    ur:
      'Open',

    ews:
      'EWS',

    obc:
      'OBC',

    obcncl:
      'OBC',

    sc:
      'SC',

    st:
      'ST',

    generalpwd:
      'Open PwD',

    openpwd:
      'Open PwD',

    obcpwd:
      'OBC PwD',

    ewspwd:
      'EWS PwD',

    scpwd:
      'SC PwD',

    stpwd:
      'ST PwD',
  };


  return (
    map[key] ||
    String(
      value ||
      'Open'
    ).trim()
  );
}


function normalizeCourse(
  value
) {
  const raw =
    String(
      value ?? ''
    )
      .trim();

  const key =
    normalize(
      raw
    )
      .replace(
        /[^a-z0-9]/g,
        ''
      );


  if (
    key ===
    'mbbs'
  ) {
    return 'MBBS';
  }


  if (
    key ===
    'bds'
  ) {
    return 'BDS';
  }


  if (
    key ===
      'bscnursing' ||
    key ===
      'nursing'
  ) {
    return 'B.Sc. Nursing';
  }


  return raw;
}


function normalizeRound(
  value
) {
  const raw =
    String(
      value ?? '1'
    )
      .trim()
      .toLowerCase();


  if (
    raw ===
      'stray' ||
    raw.includes(
      'stray vacancy'
    )
  ) {
    return {
      key:
        'stray',

      label:
        'Stray Vacancy',
    };
  }


  if (
    raw.includes(
      'special'
    ) &&
    raw.includes(
      'stray'
    )
  ) {
    return {
      key:
        'special-stray',

      label:
        'Special Stray',
    };
  }


  const match =
    raw.match(
      /(\d+)/
    );


  const number =
    match
      ? Number(
          match[1]
        )
      : 1;


  return {
    key:
      `round-${number}`,

    label:
      `Round ${number}`,
  };
}


function readJson(
  file
) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    )
  );
}


function loadOrcrRows({
  year,
  round,
}) {
  const yearDir =
    path.join(
      DATA_ROOT,
      String(
        year
      ),
      'parsed'
    );


  if (
    !fs.existsSync(
      yearDir
    )
  ) {
    throw new Error(
      `NEET MCC data is not available for ${year}.`
    );
  }


  const roundInfo =
    normalizeRound(
      round
    );


  const file =
    path.join(
      yearDir,
      `${roundInfo.key}-orcr.json`
    );


  if (
    !fs.existsSync(
      file
    )
  ) {
    throw new Error(
      `NEET MCC ${year} ${roundInfo.label} data is not available.`
    );
  }


  const payload =
    readJson(
      file
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


  return {
    file,
    roundInfo,
    rows,
  };
}



function normalizeStateKey(
  value
) {
  return String(
    value || ''
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );
}


function normalizeBiharStateRow(
  row
) {
  return {
    ...row,

    openingRank:
      Number(
        row?.neetOpeningRank
      ),

    closingRank:
      Number(
        row?.neetClosingRank
      ),

    category:
      normalizeCategory(
        row?.category
      ),

    quota:
      row?.quota ||
      'Bihar State Counselling',

    authority:
      row?.authority ||
      'BCECEB',

    counselling:
      row?.counselling ||
      'UGMAC',

    counsellingType:
      'STATE',

    state:
      'Bihar',

    neetStateAuthoritative:
      true,
  };
}


function resolveBiharStateFile({
  year,
  round,
}) {

  const y =
    Number(
      year
    );

  const roundText =
    String(
      round ?? ''
    )
      .trim()
      .toLowerCase();


  const roundNumber =
    Number(
      round
    );


  if (
    y === 2026
  ) {

    if (
      roundNumber === 1 ||
      roundText === 'round 1' ||
      roundText === 'r1'
    ) {
      return {
        fileName:
          'round-1-orcr.json',

        roundInfo: {
          key:
            'round-1',

          label:
            'Round 1',
        },
      };
    }

    throw new Error(
      'Bihar UGMAC 2026 currently has verified Round 1 data only.'
    );
  }


  if (
    y === 2025
  ) {

    if (
      roundNumber === 1 ||
      roundNumber === 2 ||
      roundText === 'round 1' ||
      roundText === 'round 2' ||
      roundText === 'combined round 1 + round 2' ||
      roundText === 'combined'
    ) {
      return {
        fileName:
          'round-1-2-combined-orcr.json',

        roundInfo: {
          key:
            'round-1-2-combined',

          label:
            'Combined Round 1 + Round 2',
        },
      };
    }

    throw new Error(
      'Bihar UGMAC 2025 currently has verified Combined Round 1 + Round 2 data only.'
    );
  }


  if (
    y === 2024
  ) {

    if (
      roundNumber === 3 ||
      roundText === 'round 3' ||
      roundText === 'r3'
    ) {
      return {
        fileName:
          'round-3-orcr.json',

        roundInfo: {
          key:
            'round-3',

          label:
            'Round 3',
        },
      };
    }


    if (
      roundText === 'special stray' ||
      roundText === 'special stray vacancy' ||
      roundText === 'special-stray'
    ) {
      return {
        fileName:
          'special-stray-orcr.json',

        roundInfo: {
          key:
            'special-stray',

          label:
            'Special Stray Vacancy',
        },
      };
    }


    throw new Error(
      'Bihar UGMAC 2024 currently has verified Round 3 and Special Stray Vacancy data only.'
    );
  }


  throw new Error(
    `Bihar UGMAC data is not available for ${year}.`
  );
}


function loadBiharStateOrcrRows({
  year,
  round,
}) {

  const resolved =
    resolveBiharStateFile({
      year,
      round,
    });


  const yearDir =
    path.join(
      STATE_DATA_ROOT,
      'bihar',
      String(
        year
      ),
      'parsed'
    );


  if (
    !fs.existsSync(
      yearDir
    )
  ) {
    throw new Error(
      `Bihar UGMAC data is not available for ${year}.`
    );
  }


  const file =
    path.join(
      yearDir,
      resolved.fileName
    );


  if (
    !fs.existsSync(
      file
    )
  ) {
    throw new Error(
      `Bihar UGMAC ${year} ${resolved.roundInfo.label} data is not available.`
    );
  }


  const payload =
    readJson(
      file
    );


  const rawRows =
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


  const rows =
    rawRows.map(
      normalizeBiharStateRow
    );


  return {
    file,
    roundInfo:
      resolved.roundInfo,
    rows,
  };
}


function loadNeetRows({
  year,
  round,
  counsellingMode,
  state,
}) {

  const mode =
    normalize(
      counsellingMode
    );


  const isState =
    mode === 'state' ||
    mode === 'state counselling' ||
    mode === 'state-counselling';


  if (
    !isState
  ) {
    return loadOrcrRows({
      year,
      round,
    });
  }


  const stateKey =
    normalizeStateKey(
      state
    );


  if (
    stateKey !== 'bihar'
  ) {
    throw new Error(
      `State counselling for ${state || 'selected state'} is not connected yet.`
    );
  }


  return loadBiharStateOrcrRows({
    year,
    round,
  });
}


function safeSlug(
  value
) {
  const slug =
    String(
      value ?? ''
    )
      .normalize(
        'NFKD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      )
      .slice(
        0,
        90
      );


  return (
    slug ||
    'neet-college'
  );
}


function getAdmissionBucket(
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
    return 'target';
  }


  const ratio =
    rank /
    cutoff;


  if (
    ratio <=
    0.60
  ) {
    return 'backup';
  }


  if (
    ratio <=
    0.85
  ) {
    return 'safe';
  }


  if (
    ratio <=
    1.05
  ) {
    return 'target';
  }


  return 'dream';
}


function getAdmissionScore(
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
    return null;
  }


  const ratio =
    rank /
    cutoff;


  /*
   * Compatibility score only.
   * This is NOT TruMarg's final premium score.
   */

  if (
    ratio <=
    0.60
  ) {
    return 90;
  }


  if (
    ratio <=
    0.85
  ) {
    return 82;
  }


  if (
    ratio <=
    1.00
  ) {
    return 74;
  }


  if (
    ratio <=
    1.05
  ) {
    return 65;
  }


  return 45;
}


function normalizeRow(
  row,
  studentRank
) {
  const isStateRow =
    row?.neetStateAuthoritative === true ||
    normalize(
      row?.counsellingType
    ) === 'state';
  const institute =
    String(
      row?.institute ||
      'Medical College'
    ).trim();


  const course =
    normalizeCourse(
      row?.course ||
      'MBBS'
    );


  const openingRank =
    Number(
      row?.openingRank
    );


  const closingRank =
    Number(
      row?.closingRank
    );


  const category =
    String(
      row?.category ||
      'Open'
    ).trim();


  const quota =
    String(
      row?.quota ||
      ''
    ).trim();


  const year =
    Number(
      row?.year
    );


  const round =
    String(
      row?.round ??
      ''
    ).trim();


  const collegeId =
    `neet-${safeSlug(
      institute
    )}`;


  const branchId =
    `${collegeId}-${safeSlug(
      course
    )}`;


  const bucket =
    getAdmissionBucket(
      studentRank,
      closingRank
    );


  const admissionScore =
    getAdmissionScore(
      studentRank,
      closingRank
    );


  return {
    examId:
      'neet',

    sourceExam:
      'NEET UG',

    counsellingType:
      isStateRow
        ? 'STATE'
        : 'MCC',

    authority:
      isStateRow
        ? (
            row?.authority ||
            'BCECEB'
          )
        : (
            row?.authority ||
            row?.counselling ||
            'MCC'
          ),

    collegeId,

    collegeName:
      institute,

    college: {
      id:
        collegeId,

      name:
        institute,

      city:
        '',

      state:
      isStateRow
        ? (
            row?.state ||
            'Bihar'
          )
        : '',

      type:
        'Medical',
    },

    city:
      '',

    state:
      isStateRow
        ? (
            row?.state ||
            'Bihar'
          )
        : '',

    type:
      'Medical',

    collegeType:
      'Medical',

    branchId,

    branchName:
      course,

    branch: {
      id:
        branchId,

      name:
        course,

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
    },

    course,

    year,

    round,

    quota,

    category,

    gender:
      null,

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

    allotmentCount:
      Number(
        row?.allotmentCount ??
        row?.allotments ??
        0
      ),

    admissionBucket:
      bucket,

    bucket,

    admission: {
      bucket,

      score:
        admissionScore,

      status:
        admissionScore ===
        null
          ? 'UNAVAILABLE'
          : 'AVAILABLE',

      studentRank:
        Number(
          studentRank
        ),

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
    },

    /*
     * Existing CollegeCard percentage meter reads row.overall.
     * Keep NEET compatibility without changing JEE/UPTAC.
     */

    overall:
      admissionScore,

    overallScore:
      admissionScore,

    score:
      admissionScore,

    recommendationScore:
      admissionScore,

    verified:
      true,

    isVerified:
      true,

    verificationStatus:
      'VERIFIED',

    source:
      isStateRow
        ? 'BCECEB UGMAC official opening-closing rank'
        : 'MCC official allotment OR-CR',

    sourceLabel:
      isStateRow
        ? 'BCECEB UGMAC official opening-closing rank'
        : 'MCC official allotment OR-CR',

    dataSource:
      isStateRow
        ? 'BCECEB'
        : 'MCC',

    cwRecAuthoritative:
      false,

    neetMccAuthoritative:
      !isStateRow,

    neetStateAuthoritative:
      isStateRow,
  };
}


/*
|--------------------------------------------------------------------------
| MAIN SERVICE
|--------------------------------------------------------------------------
*/

export async function fetchNeetRecommendations({
  rank,
  year = 2026,
  round = 1,
  category = 'Open',
  courses = [],
  counsellingMode = 'mcc',
  state = '',
  limit = 100,
}) {
  const studentRank =
    Number(
      rank
    );


  if (
    !Number.isInteger(
      studentRank
    ) ||
    studentRank <= 0
  ) {
    throw new Error(
      'Valid NEET rank is required.'
    );
  }


  const targetYear =
    Number(
      year
    );


  if (
    ![
      2024,
      2025,
      2026,
    ].includes(
      targetYear
    )
  ) {
    throw new Error(
      'NEET MCC data is currently available for 2024, 2025 and 2026.'
    );
  }


  const mode =
    normalize(
      counsellingMode
    );


  const isStateMode =
    mode === 'state' ||
    mode === 'state counselling' ||
    mode === 'state-counselling';


  const isMccMode =
    !mode ||
    mode === 'mcc' ||
    mode === 'all india' ||
    mode === 'all-india';


  if (
    !isStateMode &&
    !isMccMode
  ) {
    throw new Error(
      `Unsupported NEET counselling mode: ${counsellingMode}`
    );
  }


  if (
    isStateMode &&
    normalizeStateKey(
      state
    ) !== 'bihar'
  ) {
    throw new Error(
      `State counselling for ${state || 'selected state'} is not connected yet.`
    );
  }


  const wantedCategory =
    normalizeCategory(
      category
    );


  const requestedCourses =
    (
      Array.isArray(
        courses
      )
        ? courses
        : String(
            courses || ''
          ).split(',')
    )
      .map(
        normalizeCourse
      )
      .filter(
        Boolean
      );


  const wantedCourses =
    requestedCourses.length
      ? requestedCourses
      : DEFAULT_COURSES;


  const safeLimit =
    Math.min(
      Math.max(
        Number(
          limit
        ) || 100,
        1
      ),
      500
    );


  const {
    file,
    roundInfo,
    rows,
  } =
    loadNeetRows({
      year:
        targetYear,

      round,

      counsellingMode:
        mode,

      state,
    });


  const normalizedCategory =
    normalize(
      wantedCategory
    );


  const wantedCourseKeys =
    new Set(
      wantedCourses.map(
        course =>
          normalize(
            normalizeCourse(
              course
            )
          )
      )
    );


  const filtered =
    rows
      .filter(
        row => {

          const rowCategory =
            normalize(
              row?.category
            );


          const rowCourse =
            normalize(
              normalizeCourse(
                row?.course
              )
            );


          const closingRank =
            Number(
              row?.closingRank
            );


          /*
           * Historical feasibility:
           * candidate rank must be at or better
           * than that row's historical closing rank.
           */

          const rankEligible =
            Number.isFinite(
              closingRank
            ) &&
            closingRank >=
              studentRank;


          return (
            rowCategory ===
              normalizedCategory &&
            wantedCourseKeys.has(
              rowCourse
            ) &&
            rankEligible
          );
        }
      )
      .map(
        row =>
          normalizeRow(
            row,
            studentRank
          )
      );


  /*
   * Closest historical closing ranks first.
   * Tie-breaker: lower opening rank.
   */

  filtered.sort(
    (
      a,
      b
    ) => {

      const aDistance =
        Math.abs(
          Number(
            a.closingRank
          ) -
          studentRank
        );


      const bDistance =
        Math.abs(
          Number(
            b.closingRank
          ) -
          studentRank
        );


      if (
        aDistance !==
        bDistance
      ) {
        return (
          aDistance -
          bDistance
        );
      }


      return (
        Number(
          a.openingRank ||
          Number.MAX_SAFE_INTEGER
        ) -
        Number(
          b.openingRank ||
          Number.MAX_SAFE_INTEGER
        )
      );
    }
  );


  const data =
    filtered.slice(
      0,
      safeLimit
    );


  return {
    data,

    meta: {
      exam:
        'NEET UG',

      authority:
        isStateMode
          ? 'BCECEB'
          : 'MCC',

      counsellingType:
        isStateMode
          ? 'STATE'
          : 'MCC',

      state:
        isStateMode
          ? 'Bihar'
          : '',

      year:
        targetYear,

      round:
        roundInfo.label,

      category:
        wantedCategory,

      courses:
        wantedCourses,

      sourceRows:
        rows.length,

      eligibleRows:
        filtered.length,

      count:
        data.length,

      dataStatus:
        targetYear ===
          2026
          ? 'partial-current-year'
          : 'historical',

      sourceFile:
        path.relative(
          path.resolve(
            __dirname,
            '../../..'
          ),
          file
        ),
    },

    scoringVersion:
      isStateMode
        ? 'NEET-STATE-ORCR-V1'
        : 'NEET-MCC-ORCR-V1',
  };
}



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
      /\s+/g,
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
      /(\d+)/
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
      /(\d+)/
    );


  return match
    ? `Round ${match[1]}`
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
        /orcr\.json$/i.test(
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
  round = 1,
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


    /*
    |--------------------------------------------------------------------------
    | SELECTED-ROUND ALIGNMENT
    |--------------------------------------------------------------------------
    |
    | If current result is Round 1, compare historical Round 1.
    | Do NOT silently replace it with a later/final round cutoff.
    |
    */

    const requestedRound =
      historyRoundNumber(
        round,
        String(
          round
        )
      );


    const selected =
      roundMatches.find(
        item =>
          item.roundOrder ===
          requestedRound
      ) ||
      roundMatches[0];


    const latestAvailable =
      roundMatches[
        roundMatches.length -
        1
      ];


    const openingRank =
      Number(
        selected.openingRank
      );


    const closingRank =
      Number(
        selected.closingRank
      );


    years.push({
      year,

      selectedRound:
        selected.round,

      finalRound:
        selected.round,

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

      latestAvailableRound:
        latestAvailable.round,

      latestAvailableOpeningRank:
        Number.isFinite(
          Number(
            latestAvailable.openingRank
          )
        )
          ? Number(
              latestAvailable.openingRank
            )
          : null,

      latestAvailableClosingRank:
        Number.isFinite(
          Number(
            latestAvailable.closingRank
          )
        )
          ? Number(
              latestAvailable.closingRank
            )
          : null,

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
