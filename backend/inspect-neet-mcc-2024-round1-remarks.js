import fs from 'fs';


const FILE =
  './data/neet/mcc/2024/text/round-1.txt';


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


const rowStartRegex =
  /^(\d+)\s+(\d+(?:\.\d+)?)\s+(.+)$/;


const starts = [];


for (
  let i = 0;
  i < lines.length;
  i += 1
) {

  const m =
    lines[i].match(
      rowStartRegex
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

    firstLineRest:
      m[3],
  });
}


const exceptions = [];


for (
  let index = 0;
  index < starts.length;
  index += 1
) {

  const start =
    starts[index];


  const end =
    index + 1 <
      starts.length
      ? starts[index + 1]
          .lineIndex
      : lines.length;


  const rowLines =
    lines.slice(
      start.lineIndex,
      end
    );


  const joined =
    rowLines.join(
      ' '
    );


  if (
    /\bAllotted$/.test(
      joined
    )
  ) {
    continue;
  }


  exceptions.push({
    sno:
      start.sno,

    rankRaw:
      start.rankRaw,

    lineIndex:
      start.lineIndex,

    rowLines,
  });
}


console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-1 NON-STANDARD REMARKS'
);

console.log(
  '========================================\n'
);


console.log({
  totalRows:
    starts.length,

  exceptionalRows:
    exceptions.length,
});


for (
  const item of
  exceptions
) {

  console.log(
    '\n----------------------------------------'
  );

  console.log(
    `SNo ${item.sno} | Rank ${item.rankRaw}`
  );

  console.log(
    '----------------------------------------'
  );


  item.rowLines
    .forEach(
      (
        line,
        i
      ) => {

        console.log(
          `${String(i).padStart(2, '0')}: ${line}`
        );
      }
    );
}


/*
|--------------------------------------------------------------------------
| Compact suffix frequency
|--------------------------------------------------------------------------
*/

const suffixCounts = {};


for (
  const item of
  exceptions
) {

  const joined =
    item.rowLines.join(
      ' '
    );


  const words =
    joined.split(
      /\s+/
    );


  const suffix =
    words
      .slice(
        -12
      )
      .join(
        ' '
      );


  suffixCounts[
    suffix
  ] =
    (
      suffixCounts[
        suffix
      ] ||
      0
    ) +
    1;
}


console.log(
  '\n========================================'
);

console.log(
  'EXCEPTION SUFFIX COUNTS'
);

console.log(
  '========================================\n'
);


console.log(
  JSON.stringify(
    suffixCounts,
    null,
    2
  )
);
