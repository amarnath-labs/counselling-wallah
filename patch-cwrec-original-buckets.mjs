import fs from 'node:fs';

const file =
  './frontend/src/services/cwRecRecommendationService.js';

const backup =
  './frontend/src/services/cwRecRecommendationService.js.before-bucket-restore';

let source =
  fs.readFileSync(file, 'utf8');

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| ADD ORIGINAL ADMISSION BUCKET FUNCTION
|--------------------------------------------------------------------------
*/

const functionAnchor =
  'export function adaptCWRecRow(row) {';

if (!source.includes(functionAnchor)) {
  console.error(
    '❌ adaptCWRecRow function not found'
  );
  process.exit(1);
}

const bucketFunction = `
function getAdmissionBucketFromRank(
  studentRank,
  closingRank
) {
  const rank =
    Number(studentRank);

  const cutoff =
    Number(closingRank);

  if (
    !Number.isFinite(rank) ||
    rank <= 0 ||
    !Number.isFinite(cutoff) ||
    cutoff <= 0
  ) {
    return 'target';
  }

  const rankRatio =
    rank / cutoff;

  if (rankRatio <= 0.60) {
    return 'backup';
  }

  if (rankRatio <= 0.85) {
    return 'safe';
  }

  if (rankRatio <= 1.05) {
    return 'target';
  }

  return 'dream';
}


`;

source =
  source.replace(
    functionAnchor,
    bucketFunction +
    'export function adaptCWRecRow(row, studentRank = null) {'
  );


/*
|--------------------------------------------------------------------------
| REPLACE CW-REC BUCKET WITH ORIGINAL RANK-RATIO BUCKET
|--------------------------------------------------------------------------
*/

const oldBucket = `  const bucket =
    normalizeBucket(
      row?.admission?.bucket
    );`;

const newBucket = `  const bucket =
    getAdmissionBucketFromRank(
      studentRank,
      row?.closingRank
    );`;

if (!source.includes(oldBucket)) {
  console.error(
    '❌ Existing admission bucket block not found'
  );
  process.exit(1);
}

source =
  source.replace(
    oldBucket,
    newBucket
  );


/*
|--------------------------------------------------------------------------
| PASS STUDENT RANK INTO ADAPTER
|--------------------------------------------------------------------------
*/

const oldMap = `      ? payload.data.map(
          adaptCWRecRow
        )
      : [];`;

const newMap = `      ? payload.data.map(
          (row) =>
            adaptCWRecRow(
              row,
              rank
            )
        )
      : [];`;

if (!source.includes(oldMap)) {
  console.error(
    '❌ payload.data mapping block not found'
  );
  process.exit(1);
}

source =
  source.replace(
    oldMap,
    newMap
  );


fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ Original Dream/Target/Safe/Backup logic restored'
);

console.log(
  '✅ <= 0.60 Backup'
);

console.log(
  '✅ <= 0.85 Safe'
);

console.log(
  '✅ <= 1.05 Target'
);

console.log(
  '✅ > 1.05 Dream'
);

console.log(
  '✅ CW-REC overall scoring untouched'
);

console.log(
  '✅ Female/Home-State eligibility untouched'
);
