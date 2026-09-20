const BASE =
  'http://localhost:4000/api/counselling/results';


async function request(params) {

  const url =
    new URL(BASE);

  for (
    const [key, value]
    of Object.entries(params)
  ) {
    url.searchParams.set(
      key,
      String(value)
    );
  }


  const response =
    await fetch(url);


  const text =
    await response.text();


  let body;

  try {
    body =
      JSON.parse(text);
  } catch {
    throw new Error(
      `Non-JSON response from ${url}\n` +
      text.slice(0, 500)
    );
  }


  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} from ${url}\n` +
      JSON.stringify(
        body,
        null,
        2
      )
    );
  }


  const rows =
    Array.isArray(body)
      ? body
      : Array.isArray(body.data)
        ? body.data
        : Array.isArray(body.results)
          ? body.results
          : [];


  return {
    url:
      url.toString(),

    body,

    rows,
  };
}


function valueOf(
  row,
  ...keys
) {

  for (
    const key
    of keys
  ) {

    if (
      row?.[key] !==
      undefined
    ) {
      return row[key];
    }
  }

  return null;
}


function summarizeRow(row) {

  return {
    college:
      valueOf(
        row,
        'collegeName',
        'college_name',
        'name'
      ),

    branch:
      valueOf(
        row,
        'branchName',
        'branch_name',
        'branch'
      ),

    round:
      valueOf(
        row,
        'round'
      ),

    category:
      valueOf(
        row,
        'category'
      ),

    quota:
      valueOf(
        row,
        'quota'
      ),

    gender:
      valueOf(
        row,
        'gender'
      ),

    openingRank:
      valueOf(
        row,
        'openingRank',
        'opening_rank'
      ),

    closingRank:
      valueOf(
        row,
        'closingRank',
        'closing_rank'
      ),

    counsellingType:
      valueOf(
        row,
        'counsellingType',
        'counselling_type'
      ),
  };
}


console.log(
  '\n========================================'
);

console.log(
  'TRUMARG JOSAA 2026 API AUDIT'
);

console.log(
  '========================================\n'
);


/*
|--------------------------------------------------------------------------
| JEE ADVANCED — IIT / AI quota
|--------------------------------------------------------------------------
*/

const advancedSummary =
  [];


for (
  const round
  of ['1','2','3','4','5']
) {

  const result =
    await request({
      examId:
        'jee-advanced',

      rank:
        10000,

      category:
        'OPEN',

      year:
        2026,

      round,

      quota:
        'AI',

      gender:
        'Gender-Neutral',
    });


  advancedSummary.push({
    round,
    rows:
      result.rows.length,

    firstOpening:
      result.rows.length
        ? valueOf(
            result.rows[0],
            'openingRank',
            'opening_rank'
          )
        : null,

    firstClosing:
      result.rows.length
        ? valueOf(
            result.rows[0],
            'closingRank',
            'closing_rank'
          )
        : null,
  });


  console.log(
    `JEE Advanced Round ${round}:`,
    result.rows.length,
    'rows'
  );


  if (
    result.rows.length >
    0
  ) {

    console.table(
      result.rows
        .slice(
          0,
          3
        )
        .map(
          summarizeRow
        )
    );
  }
}


console.log(
  '\nJEE ADVANCED ROUND SUMMARY'
);

console.table(
  advancedSummary
);


/*
|--------------------------------------------------------------------------
| JEE MAIN — NIT/IIIT/GFTI style / OS quota
|--------------------------------------------------------------------------
*/

const mainSummary =
  [];


for (
  const round
  of ['1','2','3','4','5']
) {

  const result =
    await request({
      examId:
        'jee-main',

      rank:
        50000,

      category:
        'OPEN',

      year:
        2026,

      round,

      quota:
        'OS',

      gender:
        'Gender-Neutral',
    });


  mainSummary.push({
    round,
    rows:
      result.rows.length,

    firstOpening:
      result.rows.length
        ? valueOf(
            result.rows[0],
            'openingRank',
            'opening_rank'
          )
        : null,

    firstClosing:
      result.rows.length
        ? valueOf(
            result.rows[0],
            'closingRank',
            'closing_rank'
          )
        : null,
  });


  console.log(
    `JEE Main Round ${round}:`,
    result.rows.length,
    'rows'
  );


  if (
    result.rows.length >
    0
  ) {

    console.table(
      result.rows
        .slice(
          0,
          3
        )
        .map(
          summarizeRow
        )
    );
  }
}


console.log(
  '\nJEE MAIN ROUND SUMMARY'
);

console.table(
  mainSummary
);


/*
|--------------------------------------------------------------------------
| ASSERT BASIC ROUND AVAILABILITY
|--------------------------------------------------------------------------
*/

const advancedMissing =
  advancedSummary.filter(
    row =>
      row.rows === 0
  );

const mainMissing =
  mainSummary.filter(
    row =>
      row.rows === 0
  );


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
  'JEE Advanced rounds with zero results:',
  advancedMissing.length
);

console.log(
  'JEE Main rounds with zero results:',
  mainMissing.length
);


if (
  advancedMissing.length >
  0
) {

  console.log(
    'Advanced zero-result rounds:',
    advancedMissing.map(
      row => row.round
    )
  );
}


if (
  mainMissing.length >
  0
) {

  console.log(
    'Main zero-result rounds:',
    mainMissing.map(
      row => row.round
    )
  );
}


console.log(
  '\nAPI AUDIT COMPLETE.'
);

console.log(
  'DATABASE WAS NOT MODIFIED.'
);