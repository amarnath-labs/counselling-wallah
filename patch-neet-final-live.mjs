import fs from 'fs';

const file =
  './frontend/src/components/CollegeCard.jsx';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


/* ============================================================
   1. ENSURE NEET HISTORY IMPORT
============================================================ */

const counsellingImport =
`import {
  fetchCutoffHistory,
} from '../services/counsellingService';`;


if (
  !src.includes(
    "fetchNeetAdmissionHistory"
  )
) {

  if (
    !src.includes(
      counsellingImport
    )
  ) {
    throw new Error(
      'Counselling import anchor not found.'
    );
  }


  src =
    src.replace(
      counsellingImport,
`${counsellingImport}

import {
  fetchNeetAdmissionHistory,
} from '../services/neetRecommendationService';`
    );
}


/* ============================================================
   2. REPLACE THE ACTUAL LIVE MATCH LABEL BLOCK
============================================================ */

const oldMatch =
`  const counsellingMatchLabel =
    counsellingType ===
      'CSAB_SPECIAL'
      ? 'CSAB Match'
      : 'JoSAA Match';`;


const newMatch =
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
    String(
      row?.counsellingType ||
      ''
    )
      .trim()
      .toUpperCase() ===
      'MCC' ||
    row?.neetMccAuthoritative ===
      true;


  const neetCourseName =
    String(
      row?.course ||
      row?.branchName ||
      row?.branch?.name ||
      'NEET'
    ).trim();


  const counsellingMatchLabel =
    isNeetCard
      ? \`\${neetCourseName} Rank Match\`
      : counsellingType ===
          'CSAB_SPECIAL'
        ? 'CSAB Match'
        : 'JoSAA Match';`;


if (
  !src.includes(
    oldMatch
  )
) {
  throw new Error(
    'LIVE counsellingMatchLabel block not found.'
  );
}


src =
  src.replace(
    oldMatch,
    newMatch
  );


/* ============================================================
   3. INSERT NEET HISTORY BEFORE NUMERIC BRANCH-ID CHECK
============================================================ */

const branchAnchor =
`      const branchId =
        Number(
          branch?.id
        );`;


if (
  !src.includes(
    branchAnchor
  )
) {
  throw new Error(
    'LIVE branchId anchor not found.'
  );
}


const neetHistory =
`      /*
       * NEET uses MCC OR-CR data.
       * Do this BEFORE engineering numeric branchId validation.
       */
      if (
        isNeetCard
      ) {

        setHistoryLoading(true);
        setHistoryError('');

        try {

          const response =
            await fetchNeetAdmissionHistory({
              collegeName:
                row?.collegeName ||
                college?.name ||
                '',

              course:
                row?.course ||
                row?.branchName ||
                branch?.name ||
                '',

              category:
                row?.category ||
                branch?.category ||
                profile?.category ||
                'Open',

              quota:
                row?.quota ||
                branch?.quota ||
                '',

              rank:
                profile?.rank ??
                row?.admission?.studentRank ??
                null,
            });


          console.log(
            '[NEET MCC HISTORY SUCCESS]',
            response
          );


          setHistoryData(
            response?.data ??
            null
          );


          setHistoryTab(
            'josaa'
          );

        } catch (error) {

          console.error(
            '[NEET MCC HISTORY ERROR]',
            error
          );


          setHistoryError(
            error?.message ||
            'Unable to load MCC historical admission data.'
          );

        } finally {

          setHistoryLoading(false);
        }


        return;
      }


${branchAnchor}`;


src =
  src.replace(
    branchAnchor,
    neetHistory
  );


/* ============================================================
   4. HISTORY TITLE
============================================================ */

src =
  src.replace(
`                        Historical Admission Intelligence`,
`                        {isNeetCard
                          ? 'MCC Historical Admission Intelligence'
                          : 'Historical Admission Intelligence'}`
  );


/* ============================================================
   5. HISTORY SOURCE JoSAA -> MCC
============================================================ */

src =
  src.replace(
`                            ? 'CSAB Special'
                            : 'JoSAA'`,
`                            ? 'CSAB Special'
                            : isNeetCard
                              ? 'MCC'
                              : 'JoSAA'`
  );


/* ============================================================
   6. ROUTE LABEL JoSAA -> MCC
============================================================ */

src =
  src.replace(
`                          label: 'JoSAA',`,
`                          label:
                            isNeetCard
                              ? 'MCC'
                              : 'JoSAA',`
  );


/* ============================================================
   7. HISTORY ERROR TEXT
============================================================ */

src =
  src.replace(
`                                  : 'JoSAA historical data unavailable.'}`,
`                                  : isNeetCard
                                    ? 'MCC historical data unavailable.'
                                    : 'JoSAA historical data unavailable.'}`
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'FINAL LIVE NEET CollegeCard patch applied.'
);
