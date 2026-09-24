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

const ALLOWED_COURSES =
  new Set([
    'M.B.B.S.',
    'B.D.S.',
  ]);

const SEAT_TYPES =
  new Set([
    'General',
    'Female',
  ]);

const CATEGORIES =
  new Set([
    'UR',
    'SC',
    'ST',
    'EWS',
    'EBC',
    'BC',
    'RCG',
    'DQ',
    'NRI',
    'MM',
    'WQ',
  ]);

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
  const v =
    clean(value);

  if (
    v === 'M.B.B.S.'
  ) {
    return 'MBBS';
  }

  if (
    v === 'B.D.S.'
  ) {
    return 'BDS';
  }

  return v;
}

const buffer =
  fs.readFileSync(
    INPUT
  );

const parsed =
  await pdf(buffer);

const lines =
  parsed.text
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean)
    .filter(
      line =>
        !/^COMBINED .*OPENING AND CLOSING RANK/i.test(
          line
        ) &&
        !/^INSTITUTE COURSE SEAT TYPE CATEGORY/i.test(
          line
        ) &&
        !/^Page No/i.test(
          line
        )
    );

const rows = [];
const rejected = [];

for (const line of lines) {

  const numberMatches =
    [
      ...line.matchAll(
        /\b\d+(?:\.\d+)?\b/g
      ),
    ];

  if (
    numberMatches.length < 4
  ) {
    continue;
  }

  const firstNumber =
    numberMatches[
      numberMatches.length - 4
    ];

  const prefix =
    clean(
      line.slice(
        0,
        firstNumber.index
      )
    );

  const numericTail =
    numberMatches
      .slice(-4)
      .map(
        match =>
          Number(
            match[0]
          )
      );

  let matchedCourse = null;
  let matchedSeatType = null;
  let matchedCategory = null;

  for (
    const course of
    ALLOWED_COURSES
  ) {
    const courseIndex =
      prefix.lastIndexOf(
        course
      );

    if (
      courseIndex < 0
    ) {
      continue;
    }

    const beforeCourse =
      clean(
        prefix.slice(
          0,
          courseIndex
        )
      );

    const afterCourse =
      clean(
        prefix.slice(
          courseIndex +
          course.length
        )
      );

    const tokens =
      afterCourse.split(
        ' '
      );

    const seatType =
      tokens[0];

    const category =
      tokens[1];

    if (
      !SEAT_TYPES.has(
        seatType
      ) ||
      !CATEGORIES.has(
        category
      )
    ) {
      continue;
    }

    matchedCourse =
      course;

    matchedSeatType =
      seatType;

    matchedCategory =
      category;

    const [
      neetOpeningRank,
      neetClosingRank,
      stateOpeningRank,
      stateClosingRank,
    ] =
      numericTail;

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

      institute:
        beforeCourse,

      course:
        normalizeCourse(
          matchedCourse
        ),

      seatType:
        matchedSeatType,

      category:
        matchedCategory,

      quota:
        'Bihar State Counselling',

      neetOpeningRank,

      neetClosingRank,

      stateOpeningRank,

      stateClosingRank,

      sourceDocument:
        'round-1-2-combined-opening-closing-rank.pdf',

      sourceType:
        'official-opening-closing-rank',

      verified:
        true,
    });

    break;
  }

  if (
    matchedCourse === null &&
    (
      line.includes(
        'M.B.B.S.'
      ) ||
      line.includes(
        'B.D.S.'
      )
    )
  ) {
    rejected.push({
      line,
      reason:
        'MBBS/BDS row structure not parsed',
    });
  }
}

rows.sort(
  (
    a,
    b
  ) => {

    const institute =
      a.institute.localeCompare(
        b.institute
      );

    if (
      institute !== 0
    ) {
      return institute;
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

    return (
      a.neetOpeningRank -
      b.neetOpeningRank
    );
  }
);

fs.writeFileSync(
  path.join(
    OUTPUT_DIR,
    'round-1-2-combined-orcr.json'
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
    'round-1-2-combined-rejected.json'
  ),
  JSON.stringify(
    rejected,
    null,
    2
  ),
  'utf8'
);

console.log(
  '\n========================================'
);

console.log(
  'BIHAR UGMAC 2025 PARSE'
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
  '\nCOURSES'
);

console.table(
  Object.entries(
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
    )
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
  '\nCATEGORIES'
);

console.table(
  Object.entries(
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
    )
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
  '\nOUTPUT:',
  path.join(
    OUTPUT_DIR,
    'round-1-2-combined-orcr.json'
  )
);
