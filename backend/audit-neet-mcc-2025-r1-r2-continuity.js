import fs from 'fs';


const BASE =
  './data/neet/mcc/2025';


function loadJson(
  file
) {

  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    )
  );
}


function loadLines(
  file
) {

  return fs
    .readFileSync(
      file,
      'utf8'
    )
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(
      line =>
        String(line || '')
          .replace(/\s+/g, ' ')
          .trim()
    )
    .filter(Boolean);
}


/*
|--------------------------------------------------------------------------
| Generic parsed-row SNo audit
|--------------------------------------------------------------------------
*/

function auditParsedSNo(
  rows,
  label
) {

  const snoValues =
    rows
      .map(
        row =>
          Number(
            row.sno
          )
      )
      .filter(
        Number.isInteger
      );


  const set =
    new Set();

  const duplicates =
    [];


  for (
    const sno of
    snoValues
  ) {

    if (
      set.has(
        sno
      )
    ) {

      duplicates.push(
        sno
      );

    } else {

      set.add(
        sno
      );
    }
  }


  const min =
    snoValues.length
      ? Math.min(
          ...snoValues
        )
      : null;


  const max =
    snoValues.length
      ? Math.max(
          ...snoValues
        )
      : null;


  const missing =
    [];


  if (
    Number.isInteger(
      min
    ) &&
    Number.isInteger(
      max
    )
  ) {

    for (
      let sno = min;
      sno <= max;
      sno += 1
    ) {

      if (
        !set.has(
          sno
        )
      ) {

        missing.push(
          sno
        );
      }
    }
  }


  return {
    label,

    rowCount:
      rows.length,

    snoCount:
      snoValues.length,

    minSNo:
      min,

    maxSNo:
      max,

    duplicateSNoCount:
      duplicates.length,

    duplicateSNo:
      duplicates,

    missingSNoCount:
      missing.length,

    missingSNo:
      missing,
  };
}


/*
|--------------------------------------------------------------------------
| Source-side SNo detector
|--------------------------------------------------------------------------
|
| We only count lines that look like:
|
| SNo Rank ...
|
| Then continuity is checked independently from parsed JSON.
|
*/

function detectSourceStarts(
  lines
) {

  const starts =
    [];


  for (
    let i = 0;
    i < lines.length;
    i += 1
  ) {

    const m =
      lines[i].match(
        /^(\d+)\s+(\d+(?:\.\d+)?)\s+(.+)$/
      );


    if (
      !m
    ) {
      continue;
    }


    starts.push({
      lineIndex:
        i,

      sno:
        Number(
          m[1]
        ),

      rankRaw:
        m[2],

      rest:
        m[3],
    });
  }


  return starts;
}


/*
|--------------------------------------------------------------------------
| Continuity-aware source starts
|--------------------------------------------------------------------------
|
| PDF institute/address text can also begin with numbers.
|
| Keep the first genuine row, then only accept the next row if its
| SNo is exactly previous + 1.
|
*/

function continuityFilter(
  candidates
) {

  if (
    !candidates.length
  ) {
    return [];
  }


  const first =
    candidates.find(
      item =>
        item.sno ===
        1
    );


  if (
    !first
  ) {
    return [];
  }


  const result = [
    first,
  ];


  let expected =
    2;


  for (
    const item of
    candidates
  ) {

    if (
      item.lineIndex <=
      first.lineIndex
    ) {
      continue;
    }


    if (
      item.sno ===
      expected
    ) {

      result.push(
        item
      );

      expected +=
        1;
    }
  }


  return result;
}


/*
|--------------------------------------------------------------------------
| Round 1
|--------------------------------------------------------------------------
*/

const r1Rows =
  loadJson(
    `${BASE}/parsed/round-1-rows.json`
  );


const r1Text =
  loadLines(
    `${BASE}/text/round-1.txt`
  );


const r1ParsedAudit =
  auditParsedSNo(
    r1Rows,
    '2025 Round 1 parsed JSON'
  );


const r1RawCandidates =
  detectSourceStarts(
    r1Text
  );


const r1Continuity =
  continuityFilter(
    r1RawCandidates
  );


/*
|--------------------------------------------------------------------------
| Round 2
|--------------------------------------------------------------------------
*/

const r2Rows =
  loadJson(
    `${BASE}/parsed/round-2-rows.json`
  );


const r2Text =
  loadLines(
    `${BASE}/text/round-2.txt`
  );


const r2ParsedAudit =
  auditParsedSNo(
    r2Rows,
    '2025 Round 2 parsed JSON'
  );


const r2RawCandidates =
  detectSourceStarts(
    r2Text
  );


const r2Continuity =
  continuityFilter(
    r2RawCandidates
  );


/*
|--------------------------------------------------------------------------
| Compare parsed SNo against source continuity
|--------------------------------------------------------------------------
*/

function compare(
  parsedRows,
  sourceRows
) {

  const parsedSet =
    new Set(
      parsedRows.map(
        row =>
          Number(
            row.sno
          )
      )
    );


  const sourceSet =
    new Set(
      sourceRows.map(
        row =>
          row.sno
      )
    );


  const missingFromParsed =
    [...sourceSet]
      .filter(
        sno =>
          !parsedSet.has(
            sno
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          a - b
      );


  const extraInParsed =
    [...parsedSet]
      .filter(
        sno =>
          !sourceSet.has(
            sno
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          a - b
      );


  return {
    sourceRows:
      sourceRows.length,

    sourceFirstSNo:
      sourceRows[0]
        ?.sno ??
      null,

    sourceLastSNo:
      sourceRows.at(
        -1
      )
        ?.sno ??
      null,

    parsedRows:
      parsedRows.length,

    missingFromParsed,

    extraInParsed,
  };
}


const r1Compare =
  compare(
    r1Rows,
    r1Continuity
  );


const r2Compare =
  compare(
    r2Rows,
    r2Continuity
  );


/*
|--------------------------------------------------------------------------
| Source context for missing rows
|--------------------------------------------------------------------------
*/

function contextForMissing(
  missing,
  sourceRows,
  lines
) {

  const out = [];


  for (
    const sno of
    missing
  ) {

    const row =
      sourceRows.find(
        item =>
          item.sno ===
          sno
      );


    if (
      !row
    ) {
      continue;
    }


    const from =
      Math.max(
        0,
        row.lineIndex - 3
      );


    const to =
      Math.min(
        lines.length,
        row.lineIndex + 20
      );


    out.push({
      sno,

      rankRaw:
        row.rankRaw,

      lineIndex:
        row.lineIndex,

      context:
        lines.slice(
          from,
          to
        ),
    });
  }


  return out;
}


const r1MissingContext =
  contextForMissing(
    r1Compare.missingFromParsed,
    r1Continuity,
    r1Text
  );


const r2MissingContext =
  contextForMissing(
    r2Compare.missingFromParsed,
    r2Continuity,
    r2Text
  );


/*
|--------------------------------------------------------------------------
| Report
|--------------------------------------------------------------------------
*/

console.log(
  '\n========================================'
);

console.log(
  'NEET MCC 2025 R1 + R2 CONTINUITY AUDIT'
);

console.log(
  '========================================\n'
);


console.log(
  'ROUND 1 PARSED AUDIT'
);

console.log(
  JSON.stringify(
    r1ParsedAudit,
    null,
    2
  )
);


console.log(
  '\nROUND 1 SOURCE COMPARISON'
);

console.log(
  JSON.stringify(
    r1Compare,
    null,
    2
  )
);


console.log(
  '\nROUND 2 PARSED AUDIT'
);

console.log(
  JSON.stringify(
    r2ParsedAudit,
    null,
    2
  )
);


console.log(
  '\nROUND 2 SOURCE COMPARISON'
);

console.log(
  JSON.stringify(
    r2Compare,
    null,
    2
  )
);


console.log(
  '\n========================================'
);

console.log(
  'ROUND 1 MISSING SOURCE ROW CONTEXT'
);

console.log(
  '========================================'
);


for (
  const item of
  r1MissingContext
) {

  console.log(
    `\nSNo ${item.sno} | Rank ${item.rankRaw}`
  );


  for (
    const line of
    item.context
  ) {

    console.log(
      line
    );
  }
}


console.log(
  '\n========================================'
);

console.log(
  'ROUND 2 MISSING SOURCE ROW CONTEXT'
);

console.log(
  '========================================'
);


for (
  const item of
  r2MissingContext
) {

  console.log(
    `\nSNo ${item.sno} | Rank ${item.rankRaw}`
  );


  for (
    const line of
    item.context
  ) {

    console.log(
      line
    );
  }
}


/*
|--------------------------------------------------------------------------
| Save machine-readable report
|--------------------------------------------------------------------------
*/

const report = {
  round1: {
    parsedAudit:
      r1ParsedAudit,

    comparison:
      r1Compare,

    missingContext:
      r1MissingContext,
  },

  round2: {
    parsedAudit:
      r2ParsedAudit,

    comparison:
      r2Compare,

    missingContext:
      r2MissingContext,
  },
};


fs.writeFileSync(
  `${BASE}/neet-mcc-2025-r1-r2-continuity-audit.json`,
  JSON.stringify(
    report,
    null,
    2
  ),
  'utf8'
);
