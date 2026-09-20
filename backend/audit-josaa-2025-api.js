const BASE =
  'http://localhost:4000/api';

const YEAR =
  2025;

const ROUNDS =
  ['1', '2', '3', '4', '5', '6'];


function extractRows(payload) {

  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [
    payload?.results,
    payload?.data,
    payload?.colleges,
    payload?.options,
    payload?.items,
  ];

  for (
    const candidate
    of candidates
  ) {

    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }
  }

  return [];
}


async function fetchJson(url) {

  const response =
    await fetch(url);

  const text =
    await response.text();

  let payload;

  try {

    payload =
      JSON.parse(text);

  } catch {

    throw new Error(
      `Non-JSON response from ${url}\n${text.slice(0, 500)}`
    );
  }


  if (!response.ok) {

    throw new Error(
      `HTTP ${response.status} from ${url}\n${JSON.stringify(payload, null, 2)}`
    );
  }


  return payload;
}


function pickRank(row, names) {

  for (
    const name
    of names
  ) {

    if (
      row?.[name] !== undefined &&
      row?.[name] !== null
    ) {
      return row[name];
    }
  }

  return null;
}


async function auditExam({
  label,
  examId,
  rank,
}) {

  console.log(
    '\n========================================'
  );

  console.log(
    `${label} — JOSAA 2025`
  );

  console.log(
    '========================================\n'
  );


  const audit =
    [];


  for (
    const round
    of ROUNDS
  ) {

    const params =
      new URLSearchParams({
        examId,
        rank:
          String(rank),
        category:
          'OPEN',
        year:
          String(YEAR),
        round,
      });


    const url =
      `${BASE}/counselling/results?${params.toString()}`;


    const payload =
      await fetchJson(
        url
      );


    const rows =
      extractRows(
        payload
      );


    const first =
      rows[0] ?? null;


    const opening =
      first
        ? pickRank(
            first,
            [
              'opening_rank',
              'openingRank',
              'opening',
            ]
          )
        : null;


    const closing =
      first
        ? pickRank(
            first,
            [
              'closing_rank',
              'closingRank',
              'closing',
            ]
          )
        : null;


    const record = {
      round,
      rows:
        rows.length,
      firstOpening:
        opening,
      firstClosing:
        closing,
    };


    audit.push(
      record
    );


    console.log(
      `Round ${round}:`,
      rows.length,
      'rows'
    );


    if (first) {

      console.log(
        '  First opening/closing:',
        opening,
        '/',
        closing
      );
    }
  }


  console.log(
    '\nSUMMARY'
  );

  console.table(
    audit
  );


  return audit;
}


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2025 API AUDIT'
);

console.log(
  '========================================\n'
);


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

const health =
  await fetchJson(
    `${BASE}/health`
  );


console.log(
  'Backend health:'
);

console.log(
  health
);


/*
|--------------------------------------------------------------------------
| JEE ADVANCED
|--------------------------------------------------------------------------
*/

const advanced =
  await auditExam({
    label:
      'JEE ADVANCED',

    examId:
      'jee-advanced',

    rank:
      10000,
  });


/*
|--------------------------------------------------------------------------
| JEE MAIN
|--------------------------------------------------------------------------
*/

const main =
  await auditExam({
    label:
      'JEE MAIN',

    examId:
      'jee-main',

    rank:
      50000,
  });


const advancedZero =
  advanced.filter(
    row =>
      row.rows === 0
  ).length;


const mainZero =
  main.filter(
    row =>
      row.rows === 0
  ).length;


console.log(
  '\n========================================'
);

console.log(
  'FINAL API AUDIT'
);

console.log(
  '========================================'
);


console.log(
  'JEE Advanced zero-result rounds:',
  advancedZero
);

console.log(
  'JEE Main zero-result rounds:',
  mainZero
);


if (
  advancedZero > 0 ||
  mainZero > 0
) {

  console.log(
    '\nWARNING: one or more 2025 rounds returned zero results.'
  );

  process.exitCode =
    2;

} else {

  console.log(
    '\nJOSAA 2025 API AUDIT PASSED'
  );
}


console.log(
  '\nDATABASE WAS NOT MODIFIED.'
);