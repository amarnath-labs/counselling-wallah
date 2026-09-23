import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT =
  path.resolve(
    './data/neet/mcc'
  );

const YEARS = [
  2024,
  2025,
  2026,
];

function readJson(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    )
  );
}

function sha256(file) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(file)
    )
    .digest('hex');
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.rows)) {
    return payload.rows;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function auditORCRFile(file) {

  const rows =
    normalizeRows(
      readJson(file)
    );

  const issues = [];

  let invalidOpening = 0;
  let invalidClosing = 0;
  let openingAboveClosing = 0;
  let missingInstitute = 0;
  let missingCourse = 0;
  let missingCategory = 0;
  let missingQuota = 0;

  const duplicateKeys =
    new Map();

  const courseCounts = {};
  const categoryCounts = {};
  const quotaCounts = {};

  for (const row of rows) {

    const opening =
      Number(row?.openingRank);

    const closing =
      Number(row?.closingRank);

    if (
      !Number.isFinite(opening) ||
      opening <= 0
    ) {
      invalidOpening += 1;
    }

    if (
      !Number.isFinite(closing) ||
      closing <= 0
    ) {
      invalidClosing += 1;
    }

    if (
      Number.isFinite(opening) &&
      Number.isFinite(closing) &&
      opening > closing
    ) {
      openingAboveClosing += 1;
    }

    if (
      !String(
        row?.institute || ''
      ).trim()
    ) {
      missingInstitute += 1;
    }

    if (
      !String(
        row?.course || ''
      ).trim()
    ) {
      missingCourse += 1;
    }

    if (
      !String(
        row?.category || ''
      ).trim()
    ) {
      missingCategory += 1;
    }

    if (
      !String(
        row?.quota || ''
      ).trim()
    ) {
      missingQuota += 1;
    }


    const course =
      String(
        row?.course || 'NULL'
      ).trim();

    const category =
      String(
        row?.category || 'NULL'
      ).trim();

    const quota =
      String(
        row?.quota || 'NULL'
      ).trim();


    courseCounts[course] =
      (courseCounts[course] || 0) + 1;

    categoryCounts[category] =
      (categoryCounts[category] || 0) + 1;

    quotaCounts[quota] =
      (quotaCounts[quota] || 0) + 1;


    const key =
      [
        row?.year,
        row?.round,
        row?.institute,
        row?.course,
        row?.quota,
        row?.category,
        row?.openingRank,
        row?.closingRank,
      ].join('||');


    duplicateKeys.set(
      key,
      (
        duplicateKeys.get(key) ||
        0
      ) + 1
    );
  }


  const duplicateGroups =
    [
      ...duplicateKeys.values(),
    ].filter(
      count =>
        count > 1
    ).length;


  if (invalidOpening) {
    issues.push(
      `invalid opening ranks: ${invalidOpening}`
    );
  }

  if (invalidClosing) {
    issues.push(
      `invalid closing ranks: ${invalidClosing}`
    );
  }

  if (openingAboveClosing) {
    issues.push(
      `opening > closing: ${openingAboveClosing}`
    );
  }

  if (missingInstitute) {
    issues.push(
      `missing institute: ${missingInstitute}`
    );
  }

  if (missingCourse) {
    issues.push(
      `missing course: ${missingCourse}`
    );
  }

  if (missingCategory) {
    issues.push(
      `missing category: ${missingCategory}`
    );
  }

  if (missingQuota) {
    issues.push(
      `missing quota: ${missingQuota}`
    );
  }

  if (duplicateGroups) {
    issues.push(
      `duplicate ORCR groups: ${duplicateGroups}`
    );
  }


  return {
    file:
      path.relative(
        process.cwd(),
        file
      ),

    rows:
      rows.length,

    sha256:
      sha256(file),

    invalidOpening,

    invalidClosing,

    openingAboveClosing,

    missingInstitute,

    missingCourse,

    missingCategory,

    missingQuota,

    duplicateGroups,

    courses:
      courseCounts,

    categories:
      categoryCounts,

    quotas:
      quotaCounts,

    passed:
      issues.length === 0,

    issues,
  };
}


const report = {
  generatedAt:
    new Date().toISOString(),

  years: {},
};


for (const year of YEARS) {

  const parsedDir =
    path.join(
      ROOT,
      String(year),
      'parsed'
    );


  if (
    !fs.existsSync(
      parsedDir
    )
  ) {
    report.years[year] = {
      status:
        'MISSING',
    };

    continue;
  }


  const files =
    fs.readdirSync(
      parsedDir
    )
      .filter(
        name =>
          /orcr\.json$/i.test(
            name
          )
      )
      .sort();


  const audits =
    files.map(
      name =>
        auditORCRFile(
          path.join(
            parsedDir,
            name
          )
        )
    );


  report.years[year] = {
    files:
      audits,

    totalORCRGroups:
      audits.reduce(
        (sum, item) =>
          sum +
          item.rows,
        0
      ),

    passed:
      audits.length > 0 &&
      audits.every(
        item =>
          item.passed
      ),
  };
}


/*
|--------------------------------------------------------------------------
| KNOWN EXPECTED COUNTS
|--------------------------------------------------------------------------
*/

const expected = {
  2024: {
    'round-1-orcr.json': 2969,
    'round-2-orcr.json': 2617,
    'round-3-orcr.json': 3182,
  },

  2025: {
    'round-1-orcr.json': 3113,
    'round-2-orcr.json': 2838,
    'round-3-orcr.json': 2439,
    'stray-orcr.json': 617,
    'special-stray-orcr.json': 173,
  },

  2026: {
    'round-1-orcr.json': 3296,
    'round-2-orcr.json': 3164,
  },
};


const countChecks = [];


for (
  const [
    year,
    files
  ] of
  Object.entries(expected)
) {

  for (
    const [
      name,
      expectedRows
    ] of
    Object.entries(files)
  ) {

    const item =
      report
        .years[year]
        ?.files
        ?.find(
          row =>
            path.basename(
              row.file
            ) === name
        );


    countChecks.push({
      year:
        Number(year),

      file:
        name,

      expectedRows,

      actualRows:
        item?.rows ??
        null,

      passed:
        item?.rows ===
        expectedRows,
    });
  }
}


report.countChecks =
  countChecks;


report.orcrCountChecksPassed =
  countChecks.every(
    item =>
      item.passed
  );


/*
|--------------------------------------------------------------------------
| 2025 R1 / R2 CONTINUITY STATUS
|--------------------------------------------------------------------------
*/

function loadParsedRows(
  year,
  round
) {
  const file =
    path.join(
      ROOT,
      String(year),
      'parsed',
      `round-${round}-rows.json`
    );


  if (
    !fs.existsSync(file)
  ) {
    return null;
  }


  return normalizeRows(
    readJson(file)
  );
}


function auditSNo(
  rows,
  expectedLast
) {

  if (!rows) {
    return {
      available:
        false,
    };
  }


  const snos =
    rows
      .map(
        row =>
          Number(
            row?.sno ??
            row?.sNo ??
            row?.serialNumber
          )
      )
      .filter(
        Number.isInteger
      );


  const set =
    new Set(snos);


  const missing = [];


  for (
    let i = 1;
    i <= expectedLast;
    i += 1
  ) {
    if (!set.has(i)) {
      missing.push(i);
    }
  }


  return {
    available:
      true,

    rows:
      rows.length,

    uniqueSNo:
      set.size,

    expectedLast,

    missing,

    complete:
      missing.length === 0 &&
      set.size === expectedLast,
  };
}


report.continuity2025 = {
  round1:
    auditSNo(
      loadParsedRows(
        2025,
        1
      ),
      26608
    ),

  round2:
    auditSNo(
      loadParsedRows(
        2025,
        2
      ),
      35551
    ),
};


const out =
  path.join(
    ROOT,
    'neet-3year-verification-report.json'
  );


fs.writeFileSync(
  out,
  JSON.stringify(
    report,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'NEET MCC 3-YEAR DATA VERIFICATION'
);

console.log(
  '========================================\n'
);


for (
  const [
    year,
    info
  ] of
  Object.entries(
    report.years
  )
) {

  console.log(
    `YEAR ${year}`
  );

  console.table(
    info.files?.map(
      item => ({
        file:
          path.basename(
            item.file
          ),

        rows:
          item.rows,

        invalidOpening:
          item.invalidOpening,

        invalidClosing:
          item.invalidClosing,

        openingAboveClosing:
          item.openingAboveClosing,

        missingInstitute:
          item.missingInstitute,

        missingCourse:
          item.missingCourse,

        missingCategory:
          item.missingCategory,

        missingQuota:
          item.missingQuota,

        duplicateGroups:
          item.duplicateGroups,

        passed:
          item.passed,
      })
    ) || []
  );
}


console.log(
  '\nEXPECTED ORCR COUNTS'
);

console.table(
  report.countChecks
);


console.log(
  '\n2025 CONTINUITY'
);

console.log(
  JSON.stringify(
    report.continuity2025,
    null,
    2
  )
);


console.log(
  '\nREPORT:',
  path.relative(
    process.cwd(),
    out
  )
);


console.log(
  '\n========================================'
);

console.log(
  'ORCR COUNT CHECK:',
  report.orcrCountChecksPassed
    ? 'PASS'
    : 'FAIL'
);

console.log(
  '========================================'
);
