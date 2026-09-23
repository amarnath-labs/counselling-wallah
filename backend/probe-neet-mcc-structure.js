import fs from 'fs';
import path from 'path';

const ROOT =
  path.resolve(
    './data/neet/mcc/2026/text'
  );

const FILES = [
  {
    round: 'round-1',
    file:
      path.join(
        ROOT,
        'round-1.txt'
      ),
  },
  {
    round: 'round-2',
    file:
      path.join(
        ROOT,
        'round-2.txt'
      ),
  },
];


function cleanLines(
  text
) {
  return String(
    text || ''
  )
    .replace(
      /\r\n/g,
      '\n'
    )
    .replace(
      /\r/g,
      '\n'
    )
    .split(
      '\n'
    )
    .map(
      line =>
        line.trim()
    )
    .filter(
      Boolean
    );
}


function printWindow(
  lines,
  start,
  before,
  after
) {
  const from =
    Math.max(
      0,
      start -
      before
    );

  const to =
    Math.min(
      lines.length,
      start +
      after +
      1
    );


  for (
    let i =
      from;
    i <
      to;
    i += 1
  ) {
    const marker =
      i === start
        ? '>>>'
        : '   ';

    console.log(
      `${marker} ${String(
        i + 1
      ).padStart(
        7,
        ' '
      )}: ${lines[i]}`
    );
  }
}


function findMatches(
  lines,
  regex,
  limit = 5
) {
  const results = [];


  for (
    let i = 0;
    i <
      lines.length;
    i += 1
  ) {
    if (
      regex.test(
        lines[i]
      )
    ) {
      results.push(
        i
      );

      if (
        results.length >=
        limit
      ) {
        break;
      }
    }
  }


  return results;
}


function inspectRound(
  item
) {
  console.log(
    '\n\n========================================'
  );

  console.log(
    `STRUCTURE PROBE: ${item.round}`
  );

  console.log(
    '========================================'
  );


  const text =
    fs.readFileSync(
      item.file,
      'utf8'
    );


  const lines =
    cleanLines(
      text
    );


  console.log(
    `Lines: ${lines.length}`
  );


  const probes = [
    {
      name:
        'possible table headers',
      regex:
        /rank|roll|quota|institute|college|course|allotted category|candidate/i,
    },

    {
      name:
        'first Allotted rows',
      regex:
        /^Allotted\.?$/i,
    },

    {
      name:
        'Reported status',
      regex:
        /^Reported\.?$/i,
    },

    {
      name:
        'Not Allotted status',
      regex:
        /^Not Allotted\.?$/i,
    },
  ];


  for (
    const probe of probes
  ) {
    console.log(
      `\n\n===== ${probe.name.toUpperCase()} =====`
    );


    const matches =
      findMatches(
        lines,
        probe.regex,
        6
      );


    if (
      matches.length ===
      0
    ) {
      console.log(
        'No match'
      );

      continue;
    }


    matches.forEach(
      (
        index,
        matchIndex
      ) => {
        console.log(
          `\n--- MATCH ${matchIndex + 1} ---`
        );

        printWindow(
          lines,
          index,
          20,
          20
        );
      }
    );
  }
}


for (
  const item of FILES
) {
  inspectRound(
    item
  );
}
