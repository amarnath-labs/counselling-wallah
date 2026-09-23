import fs from 'fs';

const file =
  './frontend/src/components/CollegeCard.jsx';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


/*
|--------------------------------------------------------------------------
| 1. COURSE MATCH LABEL
|--------------------------------------------------------------------------
*/

if (
  !src.includes(
    'const neetMatchLabel ='
  )
) {

  const anchor =
`  const isNeetCard =
    String(
      row?.examId ||
      ''
    )
      .trim()
      .toLowerCase() ===
      'neet' ||
    String(
      row?.sourceExam ||
      ''
    )
      .trim()
      .toLowerCase() ===
      'neet ug' ||
    row?.neetMccAuthoritative ===
      true;`;


  if (
    !src.includes(
      anchor
    )
  ) {
    throw new Error(
      'isNeetCard anchor not found.'
    );
  }


  const replacement =
`${anchor}


  const neetCourseName =
    String(
      row?.course ||
      branch?.name ||
      ''
    ).trim();


  const neetMatchLabel =
    neetCourseName
      ? \`\${neetCourseName} Rank Match\`
      : 'Rank Match';`;


  src =
    src.replace(
      anchor,
      replacement
    );
}


/*
|--------------------------------------------------------------------------
| 2. REPLACE JoSAA LABEL
|--------------------------------------------------------------------------
*/

src =
  src.replaceAll(
    "JoSAA Match:{' '}",
    "{isNeetCard ? neetMatchLabel : 'JoSAA Match'}:{' '}"
  );


src =
  src.replaceAll(
    "{isNeetCard ? 'Rank Match' : 'JoSAA Match'}:{' '}",
    "{isNeetCard ? neetMatchLabel : 'JoSAA Match'}:{' '}"
  );


/*
|--------------------------------------------------------------------------
| 3. NEET HISTORY MUST BYPASS NUMERIC branchId CHECK
|--------------------------------------------------------------------------
*/

const branchAnchor =
`      const branchId =
        Number(
          branch?.id
        );`;


if (
  !src.includes(
    '[NEET MCC HISTORY DIRECT]'
  )
) {

  if (
    !src.includes(
      branchAnchor
    )
  ) {
    throw new Error(
      'branchId validation anchor not found.'
    );
  }


  const block =
`      if (
        isNeetCard
      ) {

        setHistoryLoading(
          true
        );

        setHistoryError(
          ''
        );


        try {

          const response =
            await fetchNeetAdmissionHistory({
              collegeName:
                row?.collegeName ||
                college?.name,

              course:
                row?.course ||
                branch?.name,

              category:
                row?.category ||
                branch?.category ||
                'Open',

              quota:
                row?.quota ||
                branch?.quota ||
                '',

              rank:
                profile?.rank ??
                null,
            });


          console.log(
            '[NEET MCC HISTORY DIRECT]',
            response
          );


          setHistoryData(
            response?.data ??
            null
          );


          setHistoryTab(
            'josaa'
          );

        } catch (
          error
        ) {

          console.error(
            '[NEET MCC HISTORY DIRECT]',
            error
          );


          setHistoryError(
            error?.message ||
            'Unable to load MCC historical cutoff data.'
          );

        } finally {

          setHistoryLoading(
            false
          );
        }


        return;
      }


${branchAnchor}`;


  src =
    src.replace(
      branchAnchor,
      block
    );
}


/*
|--------------------------------------------------------------------------
| 4. NEET HISTORY TITLE
|--------------------------------------------------------------------------
*/

src =
  src.replaceAll(
    'Historical Admission Intelligence',
    `{isNeetCard
                          ? 'MCC Historical Admission Intelligence'
                          : 'Historical Admission Intelligence'}`
  );


/*
|--------------------------------------------------------------------------
| 5. NEET ROUTE LABEL
|--------------------------------------------------------------------------
*/

src =
  src.replace(
    /label:\s*'JoSAA'/,
    `label:
                            isNeetCard
                              ? 'MCC'
                              : 'JoSAA'`
  );


/*
|--------------------------------------------------------------------------
| 6. HIDE JoSAA / CSAB TABS ON NEET
|--------------------------------------------------------------------------
*/

const tabsStart =
  '<div className="admission-history-tabs">';


if (
  src.includes(
    tabsStart
  ) &&
  !src.includes(
    '{!isNeetCard && (\n                      <div className="admission-history-tabs">'
  )
) {

  const regex =
    /<div className="admission-history-tabs">[\s\S]*?<\/div>/m;


  const match =
    src.match(
      regex
    );


  if (
    match
  ) {
    src =
      src.replace(
        regex,
`{!isNeetCard && (
                      ${match[0]}
                    )}`
      );
  }
}


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET course-match + MCC history patch applied.'
);
