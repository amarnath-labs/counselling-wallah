import fs from "node:fs";

const serviceFile =
  "./src/services/counsellingService.js";

const cardFile =
  "./src/components/CollegeCard.jsx";


function read(file) {
  return fs.readFileSync(
    file,
    "utf8"
  );
}

function write(file, code) {
  fs.writeFileSync(
    file,
    code,
    "utf8"
  );
}

function fail(message) {
  console.error(
    `PATCH FAILED: ${message}`
  );

  process.exit(1);
}

function insertBefore(
  code,
  marker,
  content,
  label
) {
  if (
    code.includes(
      content.trim()
    )
  ) {
    console.log(
      `SKIPPED: ${label} already present`
    );

    return code;
  }

  const index =
    code.indexOf(marker);

  if (index === -1) {
    fail(label);
  }

  console.log(
    `PATCHED: ${label}`
  );

  return (
    code.slice(0, index) +
    content +
    code.slice(index)
  );
}

function replaceOnce(
  code,
  search,
  replacement,
  label
) {
  if (
    code.includes(replacement)
  ) {
    console.log(
      `SKIPPED: ${label} already present`
    );

    return code;
  }

  if (
    !code.includes(search)
  ) {
    fail(label);
  }

  console.log(
    `PATCHED: ${label}`
  );

  return code.replace(
    search,
    replacement
  );
}


/*
|--------------------------------------------------------------------------
| 1. COUNSELLING SERVICE
|--------------------------------------------------------------------------
*/

let service =
  read(serviceFile);


/*
|--------------------------------------------------------------------------
| SEND ANNUAL BUDGET
|--------------------------------------------------------------------------
*/

const uptacMarker =
`  /*
  |--------------------------------------------------------------------------
  | UPTAC
  |--------------------------------------------------------------------------
  |`;

service =
  insertBefore(
    service,
    uptacMarker,
`
  /*
  |--------------------------------------------------------------------------
  | OFFICIAL FEE / BUDGET
  |--------------------------------------------------------------------------
  */

  const annualBudget =
    Number(
      profile?.annualBudget ??
      profile?.budget ??
      0
    );

  if (
    Number.isFinite(annualBudget) &&
    annualBudget > 0
  ) {
    params.set(
      'annualBudget',
      String(
        Math.round(annualBudget)
      )
    );
  }


`,
    "send annual budget to backend"
  );


/*
|--------------------------------------------------------------------------
| PRESERVE FEE DATA FOR UPTAC
|--------------------------------------------------------------------------
*/

const counsellingMarker =
`    counselling: {

      year:`;

service =
  insertBefore(
    service,
    counsellingMarker,
`
    /*
    |--------------------------------------------------------------------------
    | OFFICIAL FEE DATA
    |--------------------------------------------------------------------------
    */

    fee: {

      feeYear:
        row.feeYear ?? null,

      tuitionFeePerSemester:
        row.tuitionFeePerSemester ??
        null,

      academicFeePerSemester:
        row.academicFeePerSemester ??
        null,

      firstSemesterFee:
        row.firstSemesterFee ??
        null,

      messFeePerSemester:
        row.messFeePerSemester ??
        null,

      annualAcademicFee:
        row.annualAcademicFee ??
        null,

      estimatedAnnualBudgetFee:
        row.estimatedAnnualBudgetFee ??
        null,

      feeCoverage:
        row.feeCoverage ??
        null,

      feeConfidence:
        row.feeConfidence ??
        null,

      feeVerificationStatus:
        row.feeVerificationStatus ??
        null,

      feeSourceUrl:
        row.feeSourceUrl ??
        null,

      studentAnnualBudget:
        row.studentAnnualBudget ??
        null,

      budgetScore:
        row.budgetScore ??
        null,

      weightedBudgetScore:
        row.weightedBudgetScore ??
        null,

      budgetStatus:
        row.budgetStatus ??
        null,
    },


`,
    "preserve UPTAC fee fields"
  );

write(
  serviceFile,
  service
);


/*
|--------------------------------------------------------------------------
| 2. COLLEGE CARD
|--------------------------------------------------------------------------
*/

let card =
  read(cardFile);


/*
|--------------------------------------------------------------------------
| ADD useState
|--------------------------------------------------------------------------
*/

card =
  replaceOnce(
    card,
`import Button from './Button';`,
`import { useState } from 'react';
import Button from './Button';`,
    "add useState"
  );


/*
|--------------------------------------------------------------------------
| ADD HELPERS
|--------------------------------------------------------------------------
*/

const scoreLineMarker =
`function ScoreLine({ label, value, max }) {`;

card =
  insertBefore(
    card,
    scoreLineMarker,
`
function feeNumber(...values) {

  for (
    const value of values
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }

    const number =
      Number(value);

    if (
      Number.isFinite(number) &&
      number >= 0
    ) {
      return number;
    }
  }

  return null;
}


function formatMoney(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return 'Not available';
  }

  return (
    '₹' +
    Number(value)
      .toLocaleString(
        'en-IN'
      )
  );
}


function verificationLabel(
  value
) {

  const status =
    String(value || '')
      .toLowerCase();

  if (
    status === 'verified'
  ) {
    return 'Verified';
  }

  if (
    status ===
    'high_confidence'
  ) {
    return 'High confidence';
  }

  if (
    status ===
    'review_recommended'
  ) {
    return 'Review recommended';
  }

  return 'Source available';
}


function FeeRow({
  label,
  value,
  strong = false,
}) {

  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        gap: 16,
        padding: '5px 0',
      }}
    >

      <span>
        {label}
      </span>

      <strong
        style={{
          color:
            strong
              ? '#142858'
              : 'inherit',
        }}
      >
        {value}
      </strong>

    </div>
  );
}


`,
    "add fee helpers"
  );


/*
|--------------------------------------------------------------------------
| READ FEE DATA
|--------------------------------------------------------------------------
*/

card =
  replaceOnce(
    card,
`  const premium = row?.premium || null;

  const currentMatch =`,
`  const premium = row?.premium || null;

  const [
    showFeeStructure,
    setShowFeeStructure,
  ] = useState(false);

  const fee =
    row?.fee ||
    row?.officialFee ||
    row?.feeProfile ||
    {};

  const feeYear =
    feeNumber(
      fee?.feeYear,
      row?.feeYear
    );

  const tuitionFeePerSemester =
    feeNumber(
      fee?.tuitionFeePerSemester,
      row?.tuitionFeePerSemester
    );

  const academicFeePerSemester =
    feeNumber(
      fee?.academicFeePerSemester,
      row?.academicFeePerSemester
    );

  const firstSemesterFee =
    feeNumber(
      fee?.firstSemesterFee,
      row?.firstSemesterFee
    );

  const messFeePerSemester =
    feeNumber(
      fee?.messFeePerSemester,
      row?.messFeePerSemester
    );

  const annualAcademicFee =
    feeNumber(
      fee?.annualAcademicFee,
      row?.annualAcademicFee
    );

  const estimatedAnnualBudgetFee =
    feeNumber(
      fee?.estimatedAnnualBudgetFee,
      row?.estimatedAnnualBudgetFee
    );

  const feeConfidence =
    feeNumber(
      fee?.feeConfidence,
      row?.feeConfidence
    );

  const feeVerificationStatus =
    fee?.feeVerificationStatus ??
    row?.feeVerificationStatus ??
    null;

  const feeSourceUrl =
    fee?.feeSourceUrl ??
    row?.feeSourceUrl ??
    null;

  const feeCoverage =
    fee?.feeCoverage ??
    row?.feeCoverage ??
    null;

  const budgetStatus =
    fee?.budgetStatus ??
    row?.budgetStatus ??
    null;

  const hasOfficialFeeData =
    [
      tuitionFeePerSemester,
      academicFeePerSemester,
      firstSemesterFee,
      messFeePerSemester,
      annualAcademicFee,
      estimatedAnnualBudgetFee,
    ].some(
      (value) =>
        value !== null
    );

  const currentMatch =`,
    "read official fee data"
  );


/*
|--------------------------------------------------------------------------
| REPLACE OLD STATIC FEE CHIP
|--------------------------------------------------------------------------
*/

card =
  replaceOnce(
    card,
`          {hasFees && (
            <span className="meta-chip">
              Rs. {(fees / 100000).toFixed(1)}L
            </span>
          )}`,
`          {estimatedAnnualBudgetFee !== null && (
            <span className="meta-chip">
              Annual Fee{' '}
              {formatMoney(
                estimatedAnnualBudgetFee
              )}
            </span>
          )}`,
    "replace old fee chip"
  );


/*
|--------------------------------------------------------------------------
| ADD FEE UI
|--------------------------------------------------------------------------
*/

const actionsMarker =
`        <div className="cw-actions">
          <Button size="sm" onClick={openDetails}>`;

card =
  insertBefore(
    card,
    actionsMarker,
`
        <div
          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 12,
            border:
              '1px solid #e3e8f2',
            borderRadius: 12,
            background:
              '#fafbfe',
          }}
        >

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center',
              gap: 12,
            }}
          >

            <div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#142858',
                }}
              >
                💰 Fee Structure
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 10,
                  color: '#7d879c',
                }}
              >

                {
                  hasOfficialFeeData
                    ? (
                      estimatedAnnualBudgetFee !==
                      null
                        ? (
                          'Estimated annual fee: ' +
                          formatMoney(
                            estimatedAnnualBudgetFee
                          )
                        )
                        : 'Official fee details available'
                    )
                    : 'Fee data not available yet'
                }

              </div>

            </div>


            {hasOfficialFeeData && (

              <button
                type="button"
                className=
                  "btn btn-ghost btn-sm"
                onClick={() =>
                  setShowFeeStructure(
                    current =>
                      !current
                  )
                }
              >

                {
                  showFeeStructure
                    ? 'Hide Fees'
                    : 'View Fee Structure'
                }

              </button>

            )}

          </div>


          {hasOfficialFeeData &&
            showFeeStructure && (

            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop:
                  '1px solid #e3e8f2',
                fontSize: 11,
                color: '#56627a',
              }}
            >

              {
                tuitionFeePerSemester !==
                null && (

                <FeeRow
                  label=
                    "Tuition / Semester"
                  value={
                    formatMoney(
                      tuitionFeePerSemester
                    )
                  }
                />

              )}


              {
                academicFeePerSemester !==
                null && (

                <FeeRow
                  label=
                    "Academic / Semester"
                  value={
                    formatMoney(
                      academicFeePerSemester
                    )
                  }
                />

              )}


              {
                firstSemesterFee !==
                null && (

                <FeeRow
                  label=
                    "First Semester Fee"
                  value={
                    formatMoney(
                      firstSemesterFee
                    )
                  }
                />

              )}


              {
                messFeePerSemester !==
                null && (

                <FeeRow
                  label=
                    "Mess / Semester"
                  value={
                    formatMoney(
                      messFeePerSemester
                    )
                  }
                />

              )}


              {
                annualAcademicFee !==
                null && (

                <FeeRow
                  label=
                    "Annual Academic Fee"
                  value={
                    formatMoney(
                      annualAcademicFee
                    )
                  }
                />

              )}


              {
                estimatedAnnualBudgetFee !==
                null && (

                <FeeRow
                  label=
                    "Estimated Annual Fee"
                  value={
                    formatMoney(
                      estimatedAnnualBudgetFee
                    )
                  }
                  strong
                />

              )}


              {
                feeYear !== null && (

                <FeeRow
                  label="Fee Year"
                  value={feeYear}
                />

              )}


              {
                feeCoverage && (

                <FeeRow
                  label="Coverage"
                  value={
                    feeCoverage ===
                    'academic_plus_mess'
                      ? 'Academic + Mess'
                      : 'Academic only'
                  }
                />

              )}


              <FeeRow
                label="Verification"
                value={
                  verificationLabel(
                    feeVerificationStatus
                  )
                }
              />


              {
                feeConfidence !==
                null && (

                <FeeRow
                  label="Confidence"
                  value={
                    feeConfidence + '%'
                  }
                />

              )}


              {
                budgetStatus && (

                <FeeRow
                  label="Budget Status"
                  value={
                    String(
                      budgetStatus
                    )
                      .replaceAll(
                        '_',
                        ' '
                      )
                  }
                />

              )}


              {
                feeSourceUrl && (

                <div
                  style={{
                    marginTop: 10,
                  }}
                >

                  <a
                    href={
                      feeSourceUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontWeight: 700,
                      fontSize: 10.5,
                    }}
                  >

                    View Official Fee Source ↗

                  </a>

                </div>

              )}


              <div
                style={{
                  marginTop: 9,
                  color: '#8a94a9',
                  fontSize: 9.5,
                  lineHeight: 1.4,
                }}
              >
                Hostel charges are excluded
                unless separately verified.
              </div>

            </div>

          )}

        </div>


`,
    "add fee structure UI"
  );


write(
  cardFile,
  card
);


console.log("");
console.log(
  "FEE UI PATCH V2 COMPLETE"
);
