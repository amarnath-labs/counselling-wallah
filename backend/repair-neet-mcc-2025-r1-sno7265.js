import fs from 'fs';

const rowsFile =
  './data/neet/mcc/2025/parsed/round-1-rows.json';

const orcrFile =
  './data/neet/mcc/2025/parsed/round-1-orcr.json';


const rows =
  JSON.parse(
    fs.readFileSync(
      rowsFile,
      'utf8'
    )
  );


const orcr =
  JSON.parse(
    fs.readFileSync(
      orcrFile,
      'utf8'
    )
  );


/*
|--------------------------------------------------------------------------
| 1. VERIFY SOURCE-CORRUPTION SIGNATURE
|--------------------------------------------------------------------------
*/

const row7264 =
  rows.find(
    row =>
      Number(
        row?.sno
      ) === 7264
  );


const row7265Existing =
  rows.find(
    row =>
      Number(
        row?.sno
      ) === 7265
  );


if (!row7264) {
  throw new Error(
    'SNo 7264 not found.'
  );
}


if (
  !row7265Existing &&
  !String(
    row7264?.remarks || ''
  ).includes(
    '7265 13767.5'
  )
) {
  throw new Error(
    'Expected swallowed SNo 7265 signature not found in SNo 7264 remarks.'
  );
}


/*
|--------------------------------------------------------------------------
| 2. REPAIR SNo 7264 REMARK
|--------------------------------------------------------------------------
*/

row7264.remarks =
  'Allotted';


/*
|--------------------------------------------------------------------------
| 3. INSERT EXACT MISSING SOURCE ROW
|--------------------------------------------------------------------------
*/

if (
  !row7265Existing
) {

  rows.push({
    exam:
      'NEET UG',

    authority:
      'MCC',

    year:
      2025,

    round:
      'Round 1',

    sno:
      7265,

    rank:
      13767.5,

    quota:
      'All India',

    institute:
      'Govt Medical college Shivpuri,Near Katha Mill, Gwalior Bypass Highway, Shivpuri, Madhya Pradesh, 473638',

    course:
      'MBBS',

    allottedCategory:
      'EWS',

    candidateCategory:
      'EWS',

    remarks:
      'Allotted',

    nriPriority:
      null,
  });

}


rows.sort(
  (
    a,
    b
  ) =>
    Number(a.sno) -
    Number(b.sno)
);


/*
|--------------------------------------------------------------------------
| 4. VERIFY FULL SNo CONTINUITY
|--------------------------------------------------------------------------
*/

const snos =
  rows.map(
    row =>
      Number(
        row?.sno
      )
  );


const unique =
  new Set(
    snos
  );


const missing = [];


for (
  let sno = 1;
  sno <= 26608;
  sno += 1
) {
  if (
    !unique.has(
      sno
    )
  ) {
    missing.push(
      sno
    );
  }
}


if (
  rows.length !== 26608 ||
  unique.size !== 26608 ||
  missing.length
) {
  throw new Error(
    `Continuity failed after repair: rows=${rows.length}, unique=${unique.size}, missing=${JSON.stringify(missing)}`
  );
}


/*
|--------------------------------------------------------------------------
| 5. REBUILD ONLY THE AFFECTED SHIVPURI EWS ORCR GROUP
|--------------------------------------------------------------------------
*/

const targetInstitute =
  'Govt Medical college Shivpuri,Near Katha Mill, Gwalior Bypass Highway, Shivpuri, Madhya Pradesh, 473638';


const matchingRows =
  rows.filter(
    row =>
      row?.institute ===
        targetInstitute &&
      row?.course ===
        'MBBS' &&
      row?.quota ===
        'All India' &&
      row?.allottedCategory ===
        'EWS'
  );


if (
  !matchingRows.length
) {
  throw new Error(
    'No repaired Shivpuri MBBS / All India / EWS rows found.'
  );
}


const ranks =
  matchingRows
    .map(
      row =>
        Number(
          row.rank
        )
    )
    .filter(
      Number.isFinite
    );


const openingRank =
  Math.min(
    ...ranks
  );


const closingRank =
  Math.max(
    ...ranks
  );


let targetGroup =
  orcr.find(
    row =>
      row?.institute ===
        targetInstitute &&
      row?.course ===
        'MBBS' &&
      row?.quota ===
        'All India' &&
      row?.category ===
        'EWS'
  );


if (
  targetGroup
) {

  targetGroup.openingRank =
    openingRank;

  targetGroup.closingRank =
    closingRank;

  targetGroup.allotmentCount =
    matchingRows.length;

} else {

  targetGroup = {
    exam:
      'NEET UG',

    authority:
      'MCC',

    year:
      2025,

    round:
      'Round 1',

    institute:
      targetInstitute,

    course:
      'MBBS',

    quota:
      'All India',

    category:
      'EWS',

    openingRank,

    closingRank,

    allotmentCount:
      matchingRows.length,
  };


  orcr.push(
    targetGroup
  );

}


/*
|--------------------------------------------------------------------------
| 6. SORT ORCR
|--------------------------------------------------------------------------
*/

orcr.sort(
  (
    a,
    b
  ) => {

    const openingDiff =
      Number(
        a?.openingRank
      ) -
      Number(
        b?.openingRank
      );


    if (
      openingDiff !== 0
    ) {
      return openingDiff;
    }


    return (
      Number(
        a?.closingRank
      ) -
      Number(
        b?.closingRank
      )
    );
  }
);


/*
|--------------------------------------------------------------------------
| 7. WRITE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  rowsFile,
  JSON.stringify(
    rows,
    null,
    2
  ),
  'utf8'
);


fs.writeFileSync(
  orcrFile,
  JSON.stringify(
    orcr,
    null,
    2
  ),
  'utf8'
);


/*
|--------------------------------------------------------------------------
| 8. FINAL LOCAL ASSERTIONS
|--------------------------------------------------------------------------
*/

const repaired =
  rows.find(
    row =>
      Number(
        row?.sno
      ) === 7265
  );


console.log(
  '\n========================================'
);

console.log(
  '2025 R1 SNo 7265 REPAIRED'
);

console.log(
  '========================================'
);


console.log(
  JSON.stringify(
    {
      rows:
        rows.length,

      uniqueSNo:
        unique.size,

      missing,

      row7264Remarks:
        row7264.remarks,

      repairedRow:
        repaired,

      affectedORCR:
        targetGroup,

      totalORCRGroups:
        orcr.length,
    },
    null,
    2
  )
);
