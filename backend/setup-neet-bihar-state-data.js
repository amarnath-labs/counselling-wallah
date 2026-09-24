import fs from 'fs';
import path from 'path';

const root =
  path.resolve(
    './data/neet/state/bihar'
  );

const years = [
  2024,
  2025,
  2026,
];

for (const year of years) {
  for (
    const folder of [
      'raw',
      'text',
      'parsed',
      'audit',
    ]
  ) {
    fs.mkdirSync(
      path.join(
        root,
        String(year),
        folder
      ),
      {
        recursive: true,
      }
    );
  }
}

const registry = {
  exam:
    'NEET UG',

  counsellingType:
    'STATE',

  state:
    'Bihar',

  authority:
    'BCECEB',

  counsellingName:
    'UGMAC',

  officialDomains: [
    'https://bceceboard.bihar.gov.in',
    'https://bcece.admissions.nic.in',
  ],

  courses: [
    'MBBS',
    'BDS',
  ],

  years: {
    2024: {
      status:
        'historical',

      targetSources: [
        'Round 1 allotment',
        'Round 2 allotment',
        'Round 3 allotment',
        'Stray vacancy',
        'Special stray vacancy',
        'Opening-closing rank',
        'Seat matrix',
      ],
    },

    2025: {
      status:
        'historical',

      targetSources: [
        'Round 1 allotment',
        'Round 2 allotment',
        'Round 3 allotment',
        'Stray vacancy',
        'Special stray vacancy',
        'Opening-closing rank',
        'Seat matrix',
      ],
    },

    2026: {
      status:
        'current-partial',

      targetSources: [
        'Available UGMAC rounds',
        'Opening-closing rank',
        'Seat matrix',
      ],
    },
  },

  normalizedSchema: {
    exam:
      'NEET UG',

    counsellingType:
      'STATE',

    state:
      'Bihar',

    authority:
      'BCECEB',

    year:
      null,

    round:
      null,

    institute:
      null,

    course:
      null,

    category:
      null,

    seatType:
      null,

    quota:
      'Bihar State Counselling',

    neetAIROpening:
      null,

    neetAIRClosing:
      null,

    stateRankOpening:
      null,

    stateRankClosing:
      null,

    sourceUrl:
      null,

    sourceDocument:
      null,

    verified:
      false,
  },
};

fs.writeFileSync(
  path.join(
    root,
    'registry.json'
  ),
  JSON.stringify(
    registry,
    null,
    2
  ),
  'utf8'
);

console.log(
  'Bihar NEET state counselling registry created.'
);
