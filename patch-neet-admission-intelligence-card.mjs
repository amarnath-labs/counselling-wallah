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
| IMPORT
|--------------------------------------------------------------------------
*/

if (
  !src.includes(
    "fetchNeetAdmissionHistory"
  )
) {

  const importAnchor =
    "import {\n  fetchCutoffHistory,\n} from '../services/counsellingService';";


  if (
    !src.includes(
      importAnchor
    )
  ) {
    throw new Error(
      'CollegeCard counselling import anchor not found.'
    );
  }


  src =
    src.replace(
      importAnchor,
`${importAnchor}

import {
  fetchNeetAdmissionHistory,
} from '../services/neetRecommendationService';`
    );
}


/*
|--------------------------------------------------------------------------
| INSERT NEET PATH BEFORE NUMERIC BRANCH-ID VALIDATION
|--------------------------------------------------------------------------
*/

if (
  !src.includes(
    '[NEET ADMISSION HISTORY]'
  )
) {

  const anchor =
`      const branchId =
        Number(
          branch?.id
        );`;


  if (
    !src.includes(
      anchor
    )
  ) {
    throw new Error(
      'branchId history anchor not found.'
    );
  }


  const neetBlock =
`      /*
      |--------------------------------------------------------------------------
      | NEET MCC HISTORY
      |--------------------------------------------------------------------------
      */

      if (
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
            '[NEET ADMISSION HISTORY]',
            response
          );


          setHistoryData(
            response?.data ??
            null
          );


          /*
           * Existing history renderer uses the
           * "josaa" compatibility slot.
           * For NEET it is displayed as MCC.
           */

          setHistoryTab(
            'josaa'
          );

        } catch (
          error
        ) {

          console.error(
            '[NEET ADMISSION HISTORY]',
            error
          );


          setHistoryError(
            error?.message ||
            'Unable to load MCC admission history.'
          );

        } finally {

          setHistoryLoading(
            false
          );
        }


        return;
      }


${anchor}`;


  src =
    src.replace(
      anchor,
      neetBlock
    );
}


/*
|--------------------------------------------------------------------------
| HIDE JoSAA / CSAB TABS FOR NEET
|--------------------------------------------------------------------------
*/

if (
  !src.includes(
    '{!isNeetCard && (\n                      <div className="admission-history-tabs">'
  )
) {

  const tabsRegex =
    /<div className="admission-history-tabs">[\s\S]*?<\/div>/m;


  const match =
    src.match(
      tabsRegex
    );


  if (
    !match
  ) {
    throw new Error(
      'Admission history tabs block not found.'
    );
  }


  src =
    src.replace(
      tabsRegex,
`{!isNeetCard && (
                      ${match[0]}
                    )}`
    );
}


/*
|--------------------------------------------------------------------------
| HISTORY ROUTE LABEL: JoSAA -> MCC FOR NEET
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
| TITLE
|--------------------------------------------------------------------------
*/

src =
  src.replace(
    'Historical Admission Intelligence',
    `{isNeetCard
                          ? 'MCC Historical Admission Intelligence'
                          : 'Historical Admission Intelligence'}`
  );


/*
|--------------------------------------------------------------------------
| UNAVAILABLE MESSAGE
|--------------------------------------------------------------------------
*/

src =
  src.replace(
    "'JoSAA historical data unavailable.'",
    `isNeetCard
                                    ? 'MCC historical data unavailable.'
                                    : 'JoSAA historical data unavailable.'`
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'CollegeCard NEET MCC Admission Intelligence patched.'
);
