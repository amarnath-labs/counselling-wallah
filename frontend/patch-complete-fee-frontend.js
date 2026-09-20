import fs from 'node:fs';

const stateFile =
  './src/hooks/useAppState.jsx';

const detailFile =
  './src/pages/CollegeDetail.jsx';


/*
|--------------------------------------------------------------------------
| BACKUPS
|--------------------------------------------------------------------------
*/

for (const file of [
  stateFile,
  detailFile,
]) {
  const backup =
    file + '.before-complete-fee-fix';

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(
      file,
      backup
    );

    console.log(
      `Backup: ${backup}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| useAppState.jsx
|--------------------------------------------------------------------------
*/

let state =
  fs.readFileSync(
    stateFile,
    'utf8'
  );


const stateMarker = `          feeSourceUrl:
            row?.fee
              ?.feeSourceUrl ??
            row?.feeSourceUrl ??
            null,`;


const stateReplacement = `          feeSourceUrl:
            row?.fee
              ?.feeSourceUrl ??
            row?.feeSourceUrl ??
            null,

          /*
          |--------------------------------------------------------------------------
          | COMPLETE FEE BREAKDOWN
          |--------------------------------------------------------------------------
          */

          hostelFee:
            row?.fee?.hostelFee ??
            row?.hostelFee ??
            null,

          otherFee:
            row?.fee?.otherFee ??
            row?.otherFee ??
            null,

          totalAnnualFee:
            row?.fee?.totalAnnualFee ??
            row?.totalAnnualFee ??
            null,

          feeSourceLabel:
            row?.fee?.feeSourceLabel ??
            row?.feeSourceLabel ??
            null,`;


if (
  state.includes(
    stateMarker
  ) &&
  !state.includes(
    'COMPLETE FEE BREAKDOWN'
  )
) {
  state =
    state.replace(
      stateMarker,
      stateReplacement
    );

  console.log(
    'useAppState fee mapping updated.'
  );
} else if (
  state.includes(
    'COMPLETE FEE BREAKDOWN'
  )
) {
  console.log(
    'useAppState already patched.'
  );
} else {
  console.error(
    'useAppState marker not found.'
  );

  process.exit(1);
}


fs.writeFileSync(
  stateFile,
  state,
  'utf8'
);


/*
|--------------------------------------------------------------------------
| CollegeDetail.jsx
|--------------------------------------------------------------------------
*/

let detail =
  fs.readFileSync(
    detailFile,
    'utf8'
  );


/*
|--------------------------------------------------------------------------
| ADD hostelFee ETC. TO getFeeData()
|--------------------------------------------------------------------------
*/

const feeSourceMarker = `  const feeSourceUrl =
    fee?.feeSourceUrl ??
    branch?.feeSourceUrl ??
    null;`;


const feeSourceReplacement = `  const feeSourceUrl =
    fee?.feeSourceUrl ??
    branch?.feeSourceUrl ??
    null;


  const hostelFee =
    toNumber(
      fee?.hostelFee ??
      branch?.hostelFee ??
      0
    );


  const otherFee =
    toNumber(
      fee?.otherFee ??
      branch?.otherFee ??
      0
    );


  const totalAnnualFee =
    toNumber(
      fee?.totalAnnualFee ??
      branch?.totalAnnualFee ??
      0
    );


  const feeSourceLabel =
    fee?.feeSourceLabel ??
    branch?.feeSourceLabel ??
    null;`;


if (
  detail.includes(
    feeSourceMarker
  ) &&
  !detail.includes(
    'const hostelFee ='
  )
) {

  detail =
    detail.replace(
      feeSourceMarker,
      feeSourceReplacement
    );

  console.log(
    'CollegeDetail fee extraction updated.'
  );

}


/*
|--------------------------------------------------------------------------
| INCLUDE HOSTEL IN hasFeeData
|--------------------------------------------------------------------------
*/

const hasFeeOld = `    firstSemesterFee > 0 ||
    messFeePerSemester > 0;`;

const hasFeeNew = `    firstSemesterFee > 0 ||
    messFeePerSemester > 0 ||
    hostelFee > 0 ||
    otherFee > 0 ||
    totalAnnualFee > 0;`;


if (
  detail.includes(
    hasFeeOld
  )
) {
  detail =
    detail.replace(
      hasFeeOld,
      hasFeeNew
    );

  console.log(
    'hasFeeData updated.'
  );
}


/*
|--------------------------------------------------------------------------
| RETURN NEW FIELDS
|--------------------------------------------------------------------------
*/

const returnMarker = `    feeVerificationStatus,
    feeSourceUrl,

    hasFeeData,`;

const returnReplacement = `    feeVerificationStatus,
    feeSourceUrl,

    hostelFee,
    otherFee,
    totalAnnualFee,
    feeSourceLabel,

    hasFeeData,`;


if (
  detail.includes(
    returnMarker
  )
) {
  detail =
    detail.replace(
      returnMarker,
      returnReplacement
    );

  console.log(
    'getFeeData return updated.'
  );
}


/*
|--------------------------------------------------------------------------
| DESTRUCTURE NEW FIELDS IN Fees()
|--------------------------------------------------------------------------
*/

const destructureMarker = `    feeVerificationStatus,
    feeSourceUrl,

    hasFeeData,`;

const destructureReplacement = `    feeVerificationStatus,
    feeSourceUrl,

    hostelFee,
    otherFee,
    totalAnnualFee,
    feeSourceLabel,

    hasFeeData,`;


/*
 * It may occur twice:
 * getFeeData return + Fees destructuring.
 * The first one was already replaced above.
 */

if (
  detail.includes(
    destructureMarker
  )
) {
  detail =
    detail.replace(
      destructureMarker,
      destructureReplacement
    );

  console.log(
    'Fees destructuring updated.'
  );
}


/*
|--------------------------------------------------------------------------
| ADD HOSTEL + SOURCE INFO BEFORE METADATA
|--------------------------------------------------------------------------
*/

const metadataMarker = `          {(feeYear ||
            feeCoverage ||
            feeConfidence ||
            feeVerificationStatus) && (`;


const breakdownBlock = `          {hostelFee > 0 && (
            <p>
              Hostel fee / semester:{' '}
              <strong>
                ₹
                {formatMoney(
                  hostelFee
                )}
              </strong>
            </p>
          )}


          {messFeePerSemester > 0 && (
            <p>
              Mess fee / semester:{' '}
              <strong>
                ₹
                {formatMoney(
                  messFeePerSemester
                )}
              </strong>
            </p>
          )}


          {otherFee > 0 &&
            otherFee !==
              messFeePerSemester && (
            <p>
              Other fee:{' '}
              <strong>
                ₹
                {formatMoney(
                  otherFee
                )}
              </strong>
            </p>
          )}


          {totalAnnualFee > 0 &&
            totalAnnualFee !==
              annualAcademicFee && (
            <p>
              Estimated annual total:{' '}
              <strong>
                ₹
                {formatMoney(
                  totalAnnualFee
                )}
              </strong>
            </p>
          )}


          {feeSourceLabel && (
            <p
              style={{
                fontSize: 13,
                opacity: 0.78,
              }}
            >
              Source:{' '}
              <strong>
                {feeSourceLabel}
              </strong>
            </p>
          )}


${metadataMarker}`;


if (
  detail.includes(
    metadataMarker
  ) &&
  !detail.includes(
    'Hostel fee / semester:'
  )
) {

  detail =
    detail.replace(
      metadataMarker,
      breakdownBlock
    );

  console.log(
    'Fees UI breakdown added.'
  );

}


fs.writeFileSync(
  detailFile,
  detail,
  'utf8'
);


console.log('');
console.log(
  '========================================'
);

console.log(
  'COMPLETE FEE FRONTEND PATCH DONE'
);

console.log(
  '========================================'
);
