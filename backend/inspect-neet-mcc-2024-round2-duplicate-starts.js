import fs from 'fs';


const FILE =
  './data/neet/mcc/2024/text/round-2.txt';


const lines =
  fs.readFileSync(
    FILE,
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


const ROW_START =
  /^(\d+)\s+(\d+(?:\.\d+)?)\s+(.+)$/;


const starts = [];


for (
  let i = 0;
  i < lines.length;
  i += 1
) {

  const m =
    lines[i].match(
      ROW_START
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


/*
|--------------------------------------------------------------------------
| Group by SNo
|--------------------------------------------------------------------------
*/

const bySNo =
  new Map();


for (
  const row of
  starts
) {

  if (
    !bySNo.has(
      row.sno
    )
  ) {

    bySNo.set(
      row.sno,
      []
    );
  }


  bySNo
    .get(
      row.sno
    )
    .push(
      row
    );
}


const duplicateGroups =
  [...bySNo.entries()]
    .filter(
      (
        [
          ,
          rows
        ]
      ) =>
        rows.length >
        1
    );


console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-2 DUPLICATE ROW-START AUDIT'
);

console.log(
  '========================================\n'
);


console.log({
  detectedStarts:
    starts.length,

  uniqueSNo:
    bySNo.size,

  duplicateSNoGroups:
    duplicateGroups.length,

  extraStarts:
    starts.length -
    bySNo.size,
});


/*
|--------------------------------------------------------------------------
| Show every duplicate group
|--------------------------------------------------------------------------
*/

for (
  const [
    sno,
    rows
  ] of
  duplicateGroups
) {

  console.log(
    '\n========================================'
  );

  console.log(
    `DUPLICATE SNo: ${sno}`
  );

  console.log(
    '========================================'
  );


  for (
    let occurrence = 0;
    occurrence <
      rows.length;
    occurrence += 1
  ) {

    const row =
      rows[
        occurrence
      ];


    console.log(
      `\n--- OCCURRENCE ${occurrence + 1} ---`
    );


    console.log({
      lineIndex:
        row.lineIndex,

      sno:
        row.sno,

      rankRaw:
        row.rankRaw,

      rest:
        row.rest,
    });


    const from =
      Math.max(
        0,
        row.lineIndex - 8
      );


    const to =
      Math.min(
        lines.length,
        row.lineIndex + 18
      );


    for (
      let i =
        from;
      i <
        to;
      i += 1
    ) {

      const marker =
        i ===
          row.lineIndex
          ? '>>>'
          : '   ';


      console.log(
        `${marker} ${String(i).padStart(7, ' ')}: ${lines[i]}`
      );
    }
  }
}


/*
|--------------------------------------------------------------------------
| Inspect 9743.5 specifically
|--------------------------------------------------------------------------
*/

console.log(
  '\n========================================'
);

console.log(
  'SOURCE RANK 9743.5 AUDIT'
);

console.log(
  '========================================'
);


const anomaly =
  starts.filter(
    row =>
      row.rankRaw ===
      '9743.5'
  );


console.log({
  occurrences:
    anomaly.length,
});


for (
  const row of
  anomaly
) {

  console.log({
    sno:
      row.sno,

    rankRaw:
      row.rankRaw,

    lineIndex:
      row.lineIndex,

    rest:
      row.rest,
  });


  const from =
    Math.max(
      0,
      row.lineIndex - 25
    );


  const to =
    Math.min(
      lines.length,
      row.lineIndex + 45
    );


  for (
    let i =
      from;
    i <
      to;
    i += 1
  ) {

    const marker =
      i ===
        row.lineIndex
        ? '>>>'
        : '   ';


    console.log(
      `${marker} ${String(i).padStart(7, ' ')}: ${lines[i]}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Show neighbouring SNo 6220-6224 starts
|--------------------------------------------------------------------------
*/

console.log(
  '\n========================================'
);

console.log(
  'SNo 6220-6224 CANDIDATES'
);

console.log(
  '========================================'
);


console.table(
  starts
    .filter(
      row =>
        row.sno >=
          6220 &&
        row.sno <=
          6224
    )
    .map(
      row => ({
        lineIndex:
          row.lineIndex,

        sno:
          row.sno,

        rankRaw:
          row.rankRaw,

        rest:
          row.rest.slice(
            0,
            140
          ),
      })
    )
);
