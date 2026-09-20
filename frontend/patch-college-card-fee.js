import fs from "node:fs";

const file =
  "./src/components/CollegeCard.jsx";

let code =
  fs.readFileSync(file, "utf8");


function replaceRegex(
  regex,
  replacement,
  label
) {
  if (!regex.test(code)) {
    console.error(
      "FAILED:",
      label
    );

    process.exit(1);
  }

  code =
    code.replace(
      regex,
      replacement
    );

  console.log(
    "PATCHED:",
    label
  );
}


/*
|--------------------------------------------------------------------------
| useState
|--------------------------------------------------------------------------
*/

if (
  !code.includes(
    "import { useState } from 'react';"
  )
) {
  code =
    code.replace(
      "import Button from './Button';",
      "import { useState } from 'react';\nimport Button from './Button';"
    );

  console.log(
    "PATCHED: useState"
  );
}


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

if (
  !code.includes(
    "function formatOfficialFee"
  )
) {

  replaceRegex(
    /function ScoreLine\(\{ label, value, max \}\) \{/,

`function formatOfficialFee(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Not available';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 'Not available';
  }

  return (
    '₹' +
    number.toLocaleString('en-IN')
  );
}

function feeValue(...values) {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }

    const number = Number(value);

    if (
      Number.isFinite(number) &&
      number >= 0
    ) {
      return number;
    }
  }

  return null;
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
        justifyContent: 'space-between',
        gap: 12,
        padding: '5px 0',
      }}
    >
      <span>{label}</span>

      <strong
        style={{
          color: strong
            ? '#142858'
            : 'inherit',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ScoreLine({ label, value, max }) {`,
    "fee helpers"
  );
}


/*
|--------------------------------------------------------------------------
| READ FEE DATA
|--------------------------------------------------------------------------
*/

if (
  !code.includes(
    "showFeeStructure"
  )
) {

  replaceRegex(
    /  const premium = row\?\.premium \|\| null;\s*/,

`  const premium = row?.premium || null;

  const [
    showFeeStructure,
    setShowFeeStructure,
  ] = useState(false);

  const feeYear =
    feeValue(
      row?.fee?.feeYear,
      row?.feeYear
    );

  const tuitionFee =
    feeValue(
      row?.fee?.tuitionFeePerSemester,
      row?.tuitionFeePerSemester
    );

  const academicFee =
    feeValue(
      row?.fee?.academicFeePerSemester,
      row?.academicFeePerSemester
    );

  const firstSemesterFee =
    feeValue(
      row?.fee?.firstSemesterFee,
      row?.firstSemesterFee
    );

  const messFee =
    feeValue(
      row?.fee?.messFeePerSemester,
      row?.messFeePerSemester
    );

  const annualAcademicFee =
    feeValue(
      row?.fee?.annualAcademicFee,
      row?.annualAcademicFee
    );

  const estimatedAnnualFee =
    feeValue(
      row?.fee?.estimatedAnnualBudgetFee,
      row?.estimatedAnnualBudgetFee
    );

  const feeConfidence =
    feeValue(
      row?.fee?.feeConfidence,
      row?.feeConfidence
    );

  const feeVerification =
    row?.fee?.feeVerificationStatus ??
    row?.feeVerificationStatus ??
    null;

  const feeSourceUrl =
    row?.fee?.feeSourceUrl ??
    row?.feeSourceUrl ??
    null;

  const feeCoverage =
    row?.fee?.feeCoverage ??
    row?.feeCoverage ??
    null;

  const hasOfficialFee =
    [
      tuitionFee,
      academicFee,
      firstSemesterFee,
      messFee,
      annualAcademicFee,
      estimatedAnnualFee,
    ].some(
      value => value !== null
    );

`
    ,
    "read fee data"
  );
}


/*
|--------------------------------------------------------------------------
| OLD FEE CHIP -> OFFICIAL FEE CHIP
|--------------------------------------------------------------------------
*/

if (
  !code.includes(
    "Official Annual"
  )
) {

  code =
    code.replace(
      /\{hasFees && \(\s*<span className="meta-chip">\s*Rs\. \{\(fees \/ 100000\)\.toFixed\(1\)\}L\s*<\/span>\s*\)\}/,

`{estimatedAnnualFee !== null && (
            <span className="meta-chip">
              Official Annual{' '}
              {formatOfficialFee(
                estimatedAnnualFee
              )}
            </span>
          )}`
    );

  console.log(
    "PATCHED: official fee chip"
  );
}


/*
|--------------------------------------------------------------------------
| FEE STRUCTURE UI
|--------------------------------------------------------------------------
*/

if (
  !code.includes(
    "View Fee Structure"
  )
) {

  replaceRegex(
    /        <div className="cw-actions">/,

`        <div
          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 12,
            border:
              '1px solid #e3e8f2',
            borderRadius: 12,
            background: '#fafbfe',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  color: '#142858',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Fee Structure
              </div>

              <div
                style={{
                  marginTop: 3,
                  color: '#7d879c',
                  fontSize: 10,
                }}
              >
                {hasOfficialFee
                  ? estimatedAnnualFee !== null
                    ? (
                      'Estimated annual fee: ' +
                      formatOfficialFee(
                        estimatedAnnualFee
                      )
                    )
                    : 'Official fee details available'
                  : 'Fee data not available yet'}
              </div>
            </div>

            {hasOfficialFee && (
              <button
                type="button"
                className=
                  "btn btn-ghost btn-sm"
                onClick={() =>
                  setShowFeeStructure(
                    value => !value
                  )
                }
              >
                {showFeeStructure
                  ? 'Hide Fees'
                  : 'View Fee Structure'}
              </button>
            )}
          </div>


          {hasOfficialFee &&
            showFeeStructure && (

            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop:
                  '1px solid #e3e8f2',
                color: '#56627a',
                fontSize: 11,
              }}
            >

              {tuitionFee !== null && (
                <FeeRow
                  label="Tuition / Semester"
                  value={
                    formatOfficialFee(
                      tuitionFee
                    )
                  }
                />
              )}

              {academicFee !== null && (
                <FeeRow
                  label="Academic / Semester"
                  value={
                    formatOfficialFee(
                      academicFee
                    )
                  }
                />
              )}

              {firstSemesterFee !== null && (
                <FeeRow
                  label="First Semester"
                  value={
                    formatOfficialFee(
                      firstSemesterFee
                    )
                  }
                />
              )}

              {messFee !== null && (
                <FeeRow
                  label="Mess / Semester"
                  value={
                    formatOfficialFee(
                      messFee
                    )
                  }
                />
              )}

              {annualAcademicFee !== null && (
                <FeeRow
                  label="Annual Academic"
                  value={
                    formatOfficialFee(
                      annualAcademicFee
                    )
                  }
                />
              )}

              {estimatedAnnualFee !== null && (
                <FeeRow
                  label="Estimated Annual"
                  value={
                    formatOfficialFee(
                      estimatedAnnualFee
                    )
                  }
                  strong
                />
              )}

              {feeYear !== null && (
                <FeeRow
                  label="Fee Year"
                  value={feeYear}
                />
              )}

              {feeCoverage && (
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

              {feeVerification && (
                <FeeRow
                  label="Status"
                  value={
                    String(
                      feeVerification
                    )
                      .replaceAll(
                        '_',
                        ' '
                      )
                  }
                />
              )}

              {feeConfidence !== null && (
                <FeeRow
                  label="Confidence"
                  value={
                    feeConfidence + '%'
                  }
                />
              )}

              {feeSourceUrl && (
                <div
                  style={{
                    marginTop: 9,
                  }}
                >
                  <a
                    href={feeSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official Fee Source
                  </a>
                </div>
              )}

              <div
                style={{
                  marginTop: 8,
                  color: '#8a94a9',
                  fontSize: 9,
                }}
              >
                Hostel fee is not included unless
                separately verified.
              </div>

            </div>
          )}
        </div>


        <div className="cw-actions">`,
    "fee structure UI"
  );
}


fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log("");
console.log(
  "COLLEGE CARD FEE UI COMPLETE"
);
