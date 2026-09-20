import fs from 'node:fs';

const INPUT =
  './josaa-2026-all-rounds.json';

const OUTPUT =
  './josaa-2026-all-rounds-normalized.json';

const AUDIT_OUTPUT =
  './josaa-2026-normalization-audit.json';

function parseOfficialRank(rawValue) {
  const raw =
    String(rawValue ?? '')
      .trim();

  if (!raw) {
    return {
      raw,
      value: null,
      rankKind: 'MISSING',
      usableForStandardPrediction: false,
    };
  }

  if (/^\d+$/.test(raw)) {
    const value =
      Number(raw);

    return {
      raw,
      value:
        Number.isSafeInteger(value)
          ? value
          : null,
      rankKind: 'STANDARD',
      usableForStandardPrediction:
        Number.isSafeInteger(value),
    };
  }

  if (/^\d+\.0+$/.test(raw)) {
    const value =
      Number(raw);

    return {
      raw,
      value:
        Number.isSafeInteger(value)
          ? value
          : null,
      rankKind: 'STANDARD',
      usableForStandardPrediction:
        Number.isSafeInteger(value),
    };
  }

  const preparatory =
    raw.match(/^(\d+)P$/i);

  if (preparatory) {
    const value =
      Number(preparatory[1]);

    return {
      raw,
      value:
        Number.isSafeInteger(value)
          ? value
          : null,
      rankKind: 'PREPARATORY',
      usableForStandardPrediction: false,
    };
  }

  return {
    raw,
    value: null,
    rankKind: 'UNKNOWN',
    usableForStandardPrediction: false,
  };
}

const source =
  JSON.parse(
    fs.readFileSync(
      INPUT,
      'utf8'
    )
  );

if (!Array.isArray(source.rows)) {
  throw new Error(
    'Input file does not contain rows[]'
  );
}

const rows =
  source.rows.map(row => {
    const opening =
      parseOfficialRank(
        row.openingRankRaw
      );

    const closing =
      parseOfficialRank(
        row.closingRankRaw
      );

    let rankRecordType =
      'STANDARD';

    if (
      opening.rankKind === 'PREPARATORY' ||
      closing.rankKind === 'PREPARATORY'
    ) {
      rankRecordType =
        'PREPARATORY';
    } else if (
      opening.rankKind === 'UNKNOWN' ||
      closing.rankKind === 'UNKNOWN'
    ) {
      rankRecordType =
        'UNKNOWN';
    } else if (
      opening.rankKind === 'MISSING' ||
      closing.rankKind === 'MISSING'
    ) {
      rankRecordType =
        'INCOMPLETE';
    }

    return {
      counsellingType:
        'JOSAA',

      year:
        Number(row.year),

      round:
        String(row.round),

      institute:
        row.institute,

      academicProgram:
        row.academicProgram,

      quota:
        row.quota,

      seatType:
        row.seatType,

      gender:
        row.gender,

      openingRankRaw:
        opening.raw,

      openingRank:
        opening.value,

      openingRankKind:
        opening.rankKind,

      closingRankRaw:
        closing.raw,

      closingRank:
        closing.value,

      closingRankKind:
        closing.rankKind,

      rankRecordType,

      usableForStandardPrediction:
        (
          rankRecordType === 'STANDARD' &&
          opening.usableForStandardPrediction &&
          closing.usableForStandardPrediction
        ),

      sourceLabel:
        row.sourceLabel ||
        'Official JoSAA 2026 OR-CR',

      sourceUrl:
        row.sourceUrl,
    };
  });

function countBy(input, getter) {
  const output = {};

  for (const row of input) {
    const key =
      getter(row);

    output[key] =
      (output[key] || 0) + 1;
  }

  return output;
}

const audit = {
  totalRows:
    rows.length,

  recordTypes:
    countBy(
      rows,
      row => row.rankRecordType
    ),

  openingKinds:
    countBy(
      rows,
      row => row.openingRankKind
    ),

  closingKinds:
    countBy(
      rows,
      row => row.closingRankKind
    ),

  standardPredictionRows:
    rows.filter(
      row =>
        row.usableForStandardPrediction
    ).length,

  preparatoryRows:
    rows.filter(
      row =>
        row.rankRecordType === 'PREPARATORY'
    ).length,

  unknownRows:
    rows.filter(
      row =>
        row.rankRecordType === 'UNKNOWN'
    ).length,

  incompleteRows:
    rows.filter(
      row =>
        row.rankRecordType === 'INCOMPLETE'
    ).length,

  byRound: {},
};

for (
  const round
  of ['1', '2', '3', '4', '5']
) {
  const roundRows =
    rows.filter(
      row =>
        row.round === round
    );

  audit.byRound[round] = {
    total:
      roundRows.length,

    standard:
      roundRows.filter(
        row =>
          row.rankRecordType === 'STANDARD'
      ).length,

    preparatory:
      roundRows.filter(
        row =>
          row.rankRecordType === 'PREPARATORY'
      ).length,

    unknown:
      roundRows.filter(
        row =>
          row.rankRecordType === 'UNKNOWN'
      ).length,

    incomplete:
      roundRows.filter(
        row =>
          row.rankRecordType === 'INCOMPLETE'
      ).length,
  };
}

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(
    {
      counsellingType:
        'JOSAA',

      year:
        2026,

      normalizedAt:
        new Date()
          .toISOString(),

      totalRows:
        rows.length,

      rows,
    },
    null,
    2
  ),
  'utf8'
);

fs.writeFileSync(
  AUDIT_OUTPUT,
  JSON.stringify(
    audit,
    null,
    2
  ),
  'utf8'
);

console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2026 NORMALIZATION COMPLETE'
);

console.log(
  '========================================\n'
);

console.log(
  'Total rows:',
  audit.totalRows
);

console.log(
  '\nRecord types:'
);

console.table(
  audit.recordTypes
);

console.log(
  '\nOpening rank kinds:'
);

console.table(
  audit.openingKinds
);

console.log(
  '\nClosing rank kinds:'
);

console.table(
  audit.closingKinds
);

console.log(
  '\nRound summary:'
);

console.table(
  Object.entries(
    audit.byRound
  ).map(
    ([round, values]) => ({
      round,
      ...values,
    })
  )
);

console.log(
  '\nStandard predictor rows:',
  audit.standardPredictionRows
);

console.log(
  'Preparatory rows:',
  audit.preparatoryRows
);

console.log(
  'Unknown rows:',
  audit.unknownRows
);

console.log(
  'Incomplete rows:',
  audit.incompleteRows
);

console.log(
  '\nSaved:'
);

console.log(
  OUTPUT
);

console.log(
  AUDIT_OUTPUT
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);