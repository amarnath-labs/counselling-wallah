import fs from 'fs';
import crypto from 'crypto';
import path from 'path';


const BASE =
  './data/neet/mcc/2024';

const PARSED =
  path.join(
    BASE,
    'parsed'
  );


function sha256(
  file
) {

  const data =
    fs.readFileSync(
      file
    );


  return crypto
    .createHash(
      'sha256'
    )
    .update(
      data
    )
    .digest(
      'hex'
    );
}


function load(
  file
) {

  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    )
  );
}


const rounds = [
  1,
  2,
  3,
];


const manifest = {
  exam:
    'NEET UG',

  counselling:
    'MCC',

  year:
    2024,

  status:
    'complete',

  rounds: {},
};


for (
  const round of
  rounds
) {

  const rowsFile =
    path.join(
      PARSED,
      `round-${round}-rows.json`
    );

  const rejectedFile =
    path.join(
      PARSED,
      `round-${round}-rejected.json`
    );

  const orcrFile =
    path.join(
      PARSED,
      `round-${round}-orcr.json`
    );

  const summaryFile =
    path.join(
      PARSED,
      `round-${round}-summary.json`
    );


  const rows =
    load(
      rowsFile
    );

  const rejected =
    load(
      rejectedFile
    );

  const orcr =
    load(
      orcrFile
    );

  const summary =
    load(
      summaryFile
    );


  manifest.rounds[
    `round${round}`
  ] = {
    rowCount:
      rows.length,

    rejectedCount:
      rejected.length,

    orcrGroups:
      orcr.length,

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

    hashes: {
      rows:
        sha256(
          rowsFile
        ),

      rejected:
        sha256(
          rejectedFile
        ),

      orcr:
        sha256(
          orcrFile
        ),

      summary:
        sha256(
          summaryFile
        ),
    },

    summary,
  };
}


/*
|--------------------------------------------------------------------------
| Cross-round checks
|--------------------------------------------------------------------------
*/

const checks = {
  round1RejectedZero:
    manifest.rounds
      .round1
      .rejectedCount ===
      0,

  round2RejectedZero:
    manifest.rounds
      .round2
      .rejectedCount ===
      0,

  round3RejectedZero:
    manifest.rounds
      .round3
      .rejectedCount ===
      0,

  round1Rows:
    manifest.rounds
      .round1
      .rowCount ===
      26109,

  round2Rows:
    manifest.rounds
      .round2
      .rowCount ===
      33890,

  round3Rows:
    manifest.rounds
      .round3
      .rowCount ===
      36761,

  round1FirstRank:
    manifest.rounds
      .round1
      .firstRankRaw ===
      '1.01',

  round2FirstRank:
    manifest.rounds
      .round2
      .firstRankRaw ===
      '1.01',

  round3FirstRank:
    manifest.rounds
      .round3
      .firstRankRaw ===
      '1.01',

  round1LastRank:
    manifest.rounds
      .round1
      .lastRankRaw ===
      '1394835',

  round2LastRank:
    manifest.rounds
      .round2
      .lastRankRaw ===
      '1395905',

  round3LastRank:
    manifest.rounds
      .round3
      .lastRankRaw ===
      '1395905',
};


manifest.validation =
  checks;


manifest.validationPassed =
  Object.values(
    checks
  )
    .every(
      Boolean
    );


const OUT =
  path.join(
    BASE,
    'neet-mcc-2024-freeze-manifest.json'
  );


fs.writeFileSync(
  OUT,
  JSON.stringify(
    manifest,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'NEET MCC 2024 FREEZE MANIFEST'
);

console.log(
  '========================================\n'
);


console.log(
  JSON.stringify(
    {
      status:
        manifest.status,

      round1Rows:
        manifest.rounds
          .round1
          .rowCount,

      round2Rows:
        manifest.rounds
          .round2
          .rowCount,

      round3Rows:
        manifest.rounds
          .round3
          .rowCount,

      validationPassed:
        manifest.validationPassed,

      manifestFile:
        OUT,
    },
    null,
    2
  )
);


console.log(
  '\nVALIDATION CHECKS'
);


console.log(
  JSON.stringify(
    checks,
    null,
    2
  )
);


if (
  manifest.validationPassed
) {

  console.log(
    '\n========================================'
  );

  console.log(
    'NEET MCC 2024 FULL YEAR FROZEN'
  );

  console.log(
    '========================================'
  );

} else {

  console.log(
    '\n========================================'
  );

  console.log(
    '2024 YEAR FREEZE VALIDATION FAILED'
  );

  console.log(
    'DO NOT MOVE TO IMPORT YET'
  );

  console.log(
    '========================================'
  );
}
