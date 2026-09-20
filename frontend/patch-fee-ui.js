import fs from "node:fs";

function patchFile(file, patches) {
  let code = fs.readFileSync(file, "utf8");

  for (const patch of patches) {
    if (!code.includes(patch.search)) {
      console.error(`PATCH FAILED: ${patch.label}`);
      process.exit(1);
    }

    code = code.replace(
      patch.search,
      patch.replacement
    );

    console.log(`PATCHED: ${patch.label}`);
  }

  fs.writeFileSync(file, code, "utf8");
}

/*
|--------------------------------------------------------------------------
| COUNSELLING SERVICE
|--------------------------------------------------------------------------
*/

patchFile(
  "./src/services/counsellingService.js",
  [
    {
      label: "send annual budget to backend",

      search:
`  params.set(
    'round',
    String(round)
  );


  /*
  |--------------------------------------------------------------------------
  | UPTAC`,

      replacement:
`  params.set(
    'round',
    String(round)
  );


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


  /*
  |--------------------------------------------------------------------------
  | UPTAC`
    },

    {
      label: "preserve official fee fields for UPTAC",

      search:
`    /*
    |--------------------------------------------------------------------------
    | ORIGINAL COUNSELLING DATA
    |--------------------------------------------------------------------------
    */

    counselling: {`,

      replacement:
`    /*
    |--------------------------------------------------------------------------
    | OFFICIAL FEE DATA
    |--------------------------------------------------------------------------
    */

    fee: {
      feeYear:
        row.feeYear ?? null,

      tuitionFeePerSemester:
        row.tuitionFeePerSemester ?? null,

      academicFeePerSemester:
        row.academicFeePerSemester ?? null,

      firstSemesterFee:
        row.firstSemesterFee ?? null,

      messFeePerSemester:
        row.messFeePerSemester ?? null,

      annualAcademicFee:
        row.annualAcademicFee ?? null,

      estimatedAnnualBudgetFee:
        row.estimatedAnnualBudgetFee ?? null,

      feeCoverage:
        row.feeCoverage ?? null,

      feeConfidence:
        row.feeConfidence ?? null,

      feeVerificationStatus:
        row.feeVerificationStatus ?? null,

      feeSourceUrl:
        row.feeSourceUrl ?? null,

      studentAnnualBudget:
        row.studentAnnualBudget ?? null,

      budgetScore:
        row.budgetScore ?? null,

      weightedBudgetScore:
        row.weightedBudgetScore ?? null,

      budgetStatus:
        row.budgetStatus ?? null,
    },


    /*
    |--------------------------------------------------------------------------
    | ORIGINAL COUNSELLING DATA
    |--------------------------------------------------------------------------
    */

    counselling: {`
    }
  ]
);


/*
|--------------------------------------------------------------------------
| COLLEGE CARD
|--------------------------------------------------------------------------
*/

patchFile(
  "./src/components/CollegeCard.jsx",
  [
    {
      label: "add useState",

      search:
`import Button from './Button';`,

      replacement:
`import { useState } from 'react';
import Button from './Button';`
    },

    {
      label: "add fee helpers",

      search:
`const meta = {
  dream: { label: 'Dream', color: 'var(--red)' },
  target: { label: 'Target', color: 'var(--amber)' },
  safe: { label: 'Safe', color: 'var(--green)' },
  backup: { label: 'Backup', color: 'var(--blue)' },
};`,

      replacement:
`const meta = {
  dream: { label: 'Dream', color: 'var(--red)' },
  target: { label: 'Target', color: 'var(--amber)' },
  safe: { label: 'Safe', color: 'var(--green)' },
  backup: { label: 'Backup', color: 'var(--blue)' },
};

function feeNumber(...values) {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ''
    ) {
      const number = Number(value);

      if (
        Number.isFinite(number) &&
        number >= 0
      ) {
        return number;
      }
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

  return \`₹\${Number(value).toLocaleString('en-IN')}\`;
}

function verificationLabel(value) {
  const status =
    String(value || '')
      .toLowerCase();

  if (status === 'verified') {
    return 'Verified';
  }

  if (status === 'high_confidence') {
    return 'High confidence';
  }

  if (status === 'review_recommended') {
    return 'Review recommended';
  }

  return 'Source available';
}`
    },

    {
      label: "read official fee data",

      search:
`  const premium = row?.premium || null;

  const currentMatch =`,

      replacement:
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
        value !== null &&
        value !== undefined
    );

  const currentMatch =`
    },

    {
      label: "replace old static fee chip",

      search:
`          {hasFees && (
            <span className="meta-chip">
              Rs. {(fees / 100000).toFixed(1)}L
            </span>
          )}`,

      replacement:
`          {estimatedAnnualBudgetFee !== null && (
            <span className="meta-chip">
              Annual fee {formatMoney(estimatedAnnualBudgetFee)}
            </span>
          )}`
    },

    {
      label: "add fee structure UI",

      search:
`        <div className="cw-actions">
          <Button size="sm" onClick={openDetails}>`,

      replacement:
`        <div
          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 12,
            border: '1px solid #e3e8f2',
            borderRadius: 12,
            background: '#fafbfe',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
                {hasOfficialFeeData
                  ? estimatedAnnualBudgetFee !== null
                    ? \`Estimated annual fee: \${formatMoney(
                        estimatedAnnualBudgetFee
                      )}\`
                    : 'Official fee details available'
                  : 'Fee data not available yet'}
              </div>
            </div>

            {hasOfficialFeeData && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  setShowFeeStructure(
                    (current) => !current
                  )
                }
              >
                {showFeeStructure
                  ? 'Hide Fees'
                  : 'View Fee Structure'}
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
                {tuitionFeePerSemester !== null && (
                  <FeeRow
                    label="Tuition / Semester"
                    value={formatMoney(
                      tuitionFeePerSemester
                    )}
                  />
                )}

                {academicFeePerSemester !== null && (
                  <FeeRow
                    label="Academic / Semester"
                    value={formatMoney(
                      academicFeePerSemester
                    )}
                  />
                )}

                {firstSemesterFee !== null && (
                  <FeeRow
                    label="First Semester Fee"
                    value={formatMoney(
                      firstSemesterFee
                    )}
                  />
                )}

                {messFeePerSemester !== null && (
                  <FeeRow
                    label="Mess / Semester"
                    value={formatMoney(
                      messFeePerSemester
                    )}
                  />
                )}

                {annualAcademicFee !== null && (
                  <FeeRow
                    label="Annual Academic Fee"
                    value={formatMoney(
                      annualAcademicFee
                    )}
                  />
                )}

                {estimatedAnnualBudgetFee !== null && (
                  <FeeRow
                    label="Estimated Annual Fee"
                    value={formatMoney(
                      estimatedAnnualBudgetFee
                    )}
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

                <FeeRow
                  label="Verification"
                  value={
                    verificationLabel(
                      feeVerificationStatus
                    )
                  }
                />

                {feeConfidence !== null && (
                  <FeeRow
                    label="Confidence"
                    value={\`\${feeConfidence}%\`}
                  />
                )}

                {budgetStatus && (
                  <FeeRow
                    label="Budget Status"
                    value={
                      budgetStatus
                        .replaceAll('_', ' ')
                    }
                  />
                )}

                {feeSourceUrl && (
                  <div
                    style={{
                      marginTop: 10,
                    }}
                  >
                    <a
                      href={feeSourceUrl}
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
                  Hostel charges are excluded unless
                  separately verified.
                </div>
              </div>
            )}
        </div>

        <div className="cw-actions">
          <Button size="sm" onClick={openDetails}>`
    },

    {
      label: "add FeeRow component",

      search:
`function ScoreLine({ label, value, max }) {`,

      replacement:
`function FeeRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
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

function ScoreLine({ label, value, max }) {`
    }
  ]
);

console.log("");
console.log("FEE UI PATCH COMPLETE");
