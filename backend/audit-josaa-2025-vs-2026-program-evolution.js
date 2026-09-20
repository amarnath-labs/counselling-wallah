import fs from 'node:fs';

const MISSING_INPUT =
  './josaa-2025-import-map.json';

const YEAR2026_INPUT =
  './josaa-2026-all-rounds-normalized.json';


function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function canonicalCollege(value) {

  const text =
    normalizeText(value);

  if (
    text ===
    'indian institute of technology gandhinagar'
  ) {
    return 'iit gandhinagar';
  }

  return text;
}


function tokenSet(value) {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter(
        token =>
          token.length > 1
      )
  );
}


function similarity(a, b) {

  const left =
    tokenSet(a);

  const right =
    tokenSet(b);

  if (
    left.size === 0 ||
    right.size === 0
  ) {
    return 0;
  }

  let common =
    0;

  for (
    const token
    of left
  ) {
    if (
      right.has(token)
    ) {
      common += 1;
    }
  }

  const union =
    new Set([
      ...left,
      ...right,
    ]).size;

  return Number(
    (
      common /
      union
    ).toFixed(4)
  );
}


const missingSource =
  JSON.parse(
    fs.readFileSync(
      MISSING_INPUT,
      'utf8'
    )
  );


const source2026 =
  JSON.parse(
    fs.readFileSync(
      YEAR2026_INPUT,
      'utf8'
    )
  );


const missing =
  missingSource.missingBranches ?? [];


const rows2026 =
  source2026.rows.filter(
    row =>
      row.rankRecordType ===
        'STANDARD'
  );


const programs2026 =
  new Map();


for (
  const row
  of rows2026
) {

  const collegeKey =
    canonicalCollege(
      row.institute
    );

  if (
    !programs2026.has(
      collegeKey
    )
  ) {
    programs2026.set(
      collegeKey,
      new Map()
    );
  }

  programs2026
    .get(collegeKey)
    .set(
      normalizeText(
        row.academicProgram
      ),
      row.academicProgram
    );
}


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2025 -> 2026 PROGRAM EVOLUTION AUDIT'
);

console.log(
  '========================================\n'
);


const output = [];


for (
  const item
  of missing
) {

  const collegeKey =
    canonicalCollege(
      item.officialCollege
    );

  const currentPrograms =
    [
      ...(
        programs2026.get(
          collegeKey
        )?.values() ??
        []
      ),
    ];


  const candidates =
    currentPrograms
      .map(
        program => ({
          program,
          similarity:
            similarity(
              item.academicProgram,
              program
            ),
        })
      )
      .sort(
        (a, b) =>
          b.similarity -
          a.similarity
      );


  const exactSameName =
    currentPrograms.find(
      program =>
        normalizeText(program) ===
        normalizeText(
          item.academicProgram
        )
    ) ?? null;


  const record = {
    collegeId:
      item.collegeId,

    college:
      item.dbCollegeName,

    program2025:
      item.academicProgram,

    affectedRows:
      item.rows,

    exactSameNameIn2026:
      exactSameName,

    top2026Candidates:
      candidates.slice(
        0,
        8
      ),
  };


  output.push(
    record
  );


  console.log(
    '\n----------------------------------------'
  );

  console.log(
    'College:',
    item.dbCollegeName
  );

  console.log(
    '2025 program:',
    item.academicProgram
  );

  console.log(
    'Affected rows:',
    item.rows
  );

  console.log(
    'Exact same name in 2026:',
    exactSameName ??
    'NO'
  );

  console.log(
    '2026 programs found:',
    currentPrograms.length
  );

  console.table(
    candidates.slice(
      0,
      8
    )
  );
}


fs.writeFileSync(
  './josaa-2025-vs-2026-program-evolution.json',
  JSON.stringify(
    {
      generatedAt:
        new Date()
          .toISOString(),

      readOnly:
        true,

      missingMappings:
        missing.length,

      results:
        output,
    },
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'AUDIT COMPLETE'
);

console.log(
  '========================================'
);

console.log(
  'Mappings checked:',
  missing.length
);

console.log(
  'Saved:'
);

console.log(
  './josaa-2025-vs-2026-program-evolution.json'
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);