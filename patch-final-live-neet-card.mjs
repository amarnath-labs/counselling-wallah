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
| A. IMPORT NEET HISTORY SERVICE
|--------------------------------------------------------------------------
*/

if (
  !src.includes(
    "from '../services/neetRecommendationService'"
  )
) {

  const anchor =
`import {
  fetchCutoffHistory,
} from '../services/counsellingService';`;


  if (
    !src.includes(anchor)
  ) {
    throw new Error(
      'fetchCutoffHistory import anchor not found.'
    );
  }


  src =
    src.replace(
      anchor,
`${anchor}

import {
  fetchNeetAdmissionHistory,
} from '../services/neetRecommendationService';`
    );
}


/*
|--------------------------------------------------------------------------
| B. ADD NEET IDENTIFICATION BEFORE MATCH LABEL
|--------------------------------------------------------------------------
*/

if (
  !src.includes(
    'const isNeetCard ='
  )
) {

  const anchor =
`  const counsellingMatchLabel =
    counsellingType ===
      'CSAB_SPECIAL'
      ? 'CSAB Match'
      : 'JoSAA Match';`;


  if (
    !src.includes(anchor)
  ) {
    throw new Error(
      'Current counsellingMatchLabel anchor not found.'
    );
  }


  const replacement =
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


  src =
    src.replace(
      anchor,
      replacement
    );
}


/*
|--------------------------------------------------------------------------
| C. NEET HISTORY BEFORE NUMERIC branchId VALIDATION
|--------------------------------------------------------------------------
*/

if (
  !src.includes(
    '[NEET MCC ADMISSION HISTORY]'
  )
) {

  const anchor =
`      const branchId =
        Number(
          branch?.id
        );`;


  if (
    !src.includes(anchor)
  ) {
    throw new Error(
      'Live branchId anchor not found.'
    );
  }


  const replacement =
`      /*
      |--------------------------------------------------------------------------
      | NEET MCC ADMISSION HISTORY
      |--------------------------------------------------------------------------
      |
      | NEET branch IDs are strings, not engineering DB IDs.
      | Therefore NEET must be handled before numeric branchId validation.
      |
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
                row?.admission
                  ?.studentRank ??
                null,
            });


          console.log(
            '[NEET MCC ADMISSION HISTORY]',
            response
          );


          setHistoryData(
            response?.data ??
            null
          );


          /*
           * Current history renderer uses its
           * JoSAA slot as the primary route slot.
           * NEET backend maps MCC history there
           * for UI compatibility.
           */

          setHistoryTab(
            'josaa'
          );

        } catch (error) {

          console.error(
            '[NEET MCC ADMISSION HISTORY]',
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


${anchor}`;


  src =
    src.replace(
      anchor,
      replacement
    );
}


/*
|--------------------------------------------------------------------------
| D. HISTORY TITLE
|--------------------------------------------------------------------------
*/

const title =
  `                        Historical Admission Intelligence`;

if (
  src.includes(title)
) {
  src =
    src.replace(
      title,
`                        {isNeetCard
                          ? 'MCC Historical Admission Intelligence'
                          : 'Historical Admission Intelligence'}`
    );
}


/*
|--------------------------------------------------------------------------
| E. SOURCE LABEL JoSAA -> MCC FOR NEET
|--------------------------------------------------------------------------
*/

const sourceLabelPattern =
/\{\s*activeCounsellingSource\s*===\s*'csab'\s*\?\s*'CSAB Special'\s*:\s*'JoSAA'\s*\}/m;

if (
  sourceLabelPattern.test(src)
) {
  src =
    src.replace(
      sourceLabelPattern,
`{
                          isNeetCard
                            ? 'MCC'
                            : activeCounsellingSource ===
                                'csab'
                              ? 'CSAB Special'
                              : 'JoSAA'
                        }`
    );
}


/*
|--------------------------------------------------------------------------
| F. ROUTE LABEL JoSAA -> MCC FOR NEET
|--------------------------------------------------------------------------
*/

src =
  src.replace(
    /key:\s*'josaa',\s*label:\s*'JoSAA',/m,
`key: 'josaa',
                          label:
                            isNeetCard
                              ? 'MCC'
                              : 'JoSAA',`
  );


/*
|--------------------------------------------------------------------------
| G. UNAVAILABLE TEXT
|--------------------------------------------------------------------------
*/

src =
  src.replace(
    "'JoSAA historical data unavailable.'",
`isNeetCard
                                    ? 'MCC historical data unavailable for this option.'
                                    : 'JoSAA historical data unavailable.'`
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'LIVE CollegeCard NEET patch completed.'
);
