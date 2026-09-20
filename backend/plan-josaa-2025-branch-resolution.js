import fs from 'node:fs';

const INPUT =
  './josaa-2025-import-map.json';

const source =
  JSON.parse(
    fs.readFileSync(
      INPUT,
      'utf8'
    )
  );

const missing =
  source.missingBranches ?? [];


function key(
  collegeId,
  program
) {
  return (
    `${collegeId}|${program}`
  );
}


/*
|--------------------------------------------------------------------------
| HIGH-CONFIDENCE ALIASES
|--------------------------------------------------------------------------
|
| Only semantic / wording equivalents.
|
*/

const aliases =
  new Map([
    [
      key(
        'indian-institute-of-technology-dhanbad',
        'B.Tech Mining Engineering and MBA in Logistic and Supply Chain Management (IIM Mumbai) (5 Years, Integrated B. Tech. and MBA)'
      ),
      {
        branchId: '284',
        dbBranch:
          'B.Tech Mining Engineering and MBA in Logistic and Supply Chain Management (IIM Mumbai) (5 Years, Bachelor of Technology and MBA (Dual Degree))',
      },
    ],

    [
      key(
        'maulana-azad-national-institute-of-technology-bhopal',
        'Materials Science and Metallurgical Engineering (4 Years, Bachelor of Technology)'
      ),
      {
        branchId: '424',
        dbBranch:
          'Materials and Metallurgical Engineering (4 Years, Bachelor of Technology)',
      },
    ],

    [
      key(
        'sardar-vallabhbhai-national-institute-of-technology-surat',
        'Chemistry (5 Years, Integrated Master of Science)'
      ),
      {
        branchId: '689',
        dbBranch:
          'Chemistry (5 Years, Integrated Bachelor of Science-Master of Science)',
      },
    ],

    [
      key(
        'sardar-vallabhbhai-national-institute-of-technology-surat',
        'Mathematics (5 Years, Integrated Master of Science)'
      ),
      {
        branchId: '697',
        dbBranch:
          'Mathematics (5 Years, Integrated Bachelor of Science-Master of Science)',
      },
    ],

    [
      key(
        'sardar-vallabhbhai-national-institute-of-technology-surat',
        'Physics (5 Years, Integrated Master of Science)'
      ),
      {
        branchId: '700',
        dbBranch:
          'Physics (5 Years, Integrated Bachelor of Science-Master of Science)',
      },
    ],

    [
      key(
        'indian-institute-of-information-technology-kilohrad-sonepat-haryana',
        'CSE ( Data Science & Analytics) (4 Years, Bachelor of Technology)'
      ),
      {
        branchId: '752',
        dbBranch:
          'Computer Science & Engineering (Data Science and Analytics) (4 Years, Bachelor of Technology)',
      },
    ],

    [
      key(
        'national-institute-of-advanced-manufacturing-technology-ranchi',
        'Metallurgy and Materials Engineering (4 Years, Bachelor of Technology)'
      ),
      {
        branchId: '906',
        dbBranch:
          'Metallurgical and Materials Engineering (4 Years, Bachelor of Technology)',
      },
    ],

    [
      key(
        'university-of-hyderabad',
        'Computer Science and Engineering (5 Years, Bachelor and Master of Technology (Dual Degree))'
      ),
      {
        branchId: '963',
        dbBranch:
          'Computer Science and Engineering (5 Years, Integrated Master of Technology)',
      },
    ],

    [
      key(
        'birla-institute-of-technology-mesra-ranchi',
        'Artificial Intelligence and Machine Learning (4 Years, Bachelor of Technology)'
      ),
      {
        branchId: '871',
        dbBranch:
          'Computer Science and Engineering (Artificial Intelligence and Machine Learning) (4 Years, Bachelor of Technology)',
      },
    ],

    [
      key(
        'birla-institute-of-technology-patna-off-campus',
        'Artificial Intelligence and Machine Learning (4 Years, Bachelor of Technology)'
      ),
      {
        branchId: '1047',
        dbBranch:
          'Computer Science and Engineering (Artificial Intelligence and Machine Learning) (4 Years, Bachelor of Technology)',
      },
    ],
  ]);


/*
|--------------------------------------------------------------------------
| BUILD PLAN
|--------------------------------------------------------------------------
*/

const plan = [];

let aliasRows =
  0;

let createRows =
  0;


for (
  const item
  of missing
) {

  const lookup =
    key(
      item.collegeId,
      item.academicProgram
    );

  const alias =
    aliases.get(
      lookup
    );


  if (alias) {

    aliasRows +=
      item.rows;

    plan.push({
      action:
        'ALIAS',

      collegeId:
        item.collegeId,

      college:
        item.dbCollegeName,

      officialProgram:
        item.academicProgram,

      affectedRows:
        item.rows,

      existingBranchId:
        alias.branchId,

      existingBranch:
        alias.dbBranch,
    });

  } else {

    createRows +=
      item.rows;

    plan.push({
      action:
        'CREATE_BRANCH',

      collegeId:
        item.collegeId,

      college:
        item.dbCollegeName,

      officialProgram:
        item.academicProgram,

      affectedRows:
        item.rows,

      reason:
        'No safe semantic alias approved; preserve 2025 historical program identity.',
    });
  }
}


const summary = {
  totalMissingMappings:
    missing.length,

  totalAffectedRows:
    missing.reduce(
      (sum, row) =>
        sum + row.rows,
      0
    ),

  aliasMappings:
    plan.filter(
      row =>
        row.action ===
        'ALIAS'
    ).length,

  createBranchMappings:
    plan.filter(
      row =>
        row.action ===
        'CREATE_BRANCH'
    ).length,

  rowsResolvedByAlias:
    aliasRows,

  rowsResolvedByNewBranch:
    createRows,
};


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2025 BRANCH RESOLUTION PLAN'
);

console.log(
  '========================================\n'
);

console.table(
  summary
);


console.log(
  '\nALIASES'
);

console.table(
  plan.filter(
    row =>
      row.action ===
      'ALIAS'
  )
);


console.log(
  '\nNEW HISTORICAL BRANCHES'
);

console.table(
  plan.filter(
    row =>
      row.action ===
      'CREATE_BRANCH'
  )
);


fs.writeFileSync(
  './josaa-2025-branch-resolution-plan.json',
  JSON.stringify(
    {
      generatedAt:
        new Date()
          .toISOString(),

      readOnly:
        true,

      summary,

      plan,
    },
    null,
    2
  ),
  'utf8'
);


console.log(
  '\nSaved:'
);

console.log(
  './josaa-2025-branch-resolution-plan.json'
);

console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);