import fs from 'fs';

const file =
  './src/routes/counselling.js';

const backup =
  './src/routes/counselling.before-branch-fee-fix.js';

let code =
  fs.readFileSync(
    file,
    'utf8'
  );


/*
|--------------------------------------------------------------------------
| BACKUP
|--------------------------------------------------------------------------
*/

if (
  !fs.existsSync(
    backup
  )
) {
  fs.writeFileSync(
    backup,
    code,
    'utf8'
  );

  console.log(
    'Backup created:',
    backup
  );
}


/*
|--------------------------------------------------------------------------
| 1. REPLACE OLD FEE SELECT
|--------------------------------------------------------------------------
*/

const oldFeeSelect = `
          cfp.fee_year AS "feeYear",

          cfp.tuition_fee_per_semester
            AS "tuitionFeePerSemester",

          cfp.academic_fee_per_semester
            AS "academicFeePerSemester",

          cfp.first_semester_fee
            AS "firstSemesterFee",

          cfp.mess_fee_per_semester
            AS "messFeePerSemester",

          cfp.annual_academic_fee
            AS "annualAcademicFee",

          cfp.confidence_score
            AS "feeConfidence",

          cfp.verification_status
            AS "feeVerificationStatus",

          cfp.source_url
            AS "feeSourceUrl",
`;


const newFeeSelect = `
          /*
          |--------------------------------------------------------------------------
          | OFFICIAL / BRANCH FEE
          |--------------------------------------------------------------------------
          |
          | Priority:
          |
          | 1. college_fee_profiles
          | 2. branch_fees
          |
          */

          COALESCE(
            cfp.fee_year,
            bf.academic_year
          ) AS "feeYear",

          COALESCE(
            cfp.tuition_fee_per_semester,
            bf.tuition_fee
          ) AS "tuitionFeePerSemester",

          cfp.academic_fee_per_semester
            AS "academicFeePerSemester",

          cfp.first_semester_fee
            AS "firstSemesterFee",

          COALESCE(
            cfp.mess_fee_per_semester,
            bf.other_fee
          ) AS "messFeePerSemester",

          COALESCE(
            cfp.annual_academic_fee,
            bf.total_annual_fee
          ) AS "annualAcademicFee",

          COALESCE(
            cfp.confidence_score,
            CASE
              WHEN bf.verification_status = 'verified'
                THEN 1
              ELSE NULL
            END
          ) AS "feeConfidence",

          COALESCE(
            cfp.verification_status,
            bf.verification_status
          ) AS "feeVerificationStatus",

          COALESCE(
            cfp.source_url,
            bf.source_url
          ) AS "feeSourceUrl",

          bf.hostel_fee
            AS "hostelFee",

          bf.other_fee
            AS "otherFee",

          bf.total_annual_fee
            AS "totalAnnualFee",

          bf.source_label
            AS "feeSourceLabel",
`;


if (
  code.includes(
    oldFeeSelect
  )
) {
  code =
    code.replace(
      oldFeeSelect,
      newFeeSelect
    );

  console.log(
    'Fee SELECT updated.'
  );
} else if (
  code.includes(
    'bf.total_annual_fee'
  )
) {
  console.log(
    'Fee SELECT appears already patched.'
  );
} else {
  console.error(
    'ERROR: Old fee SELECT block not found.'
  );

  process.exit(
    1
  );
}


/*
|--------------------------------------------------------------------------
| 2. ADD branch_fees LATERAL JOIN
|--------------------------------------------------------------------------
*/

const branchFeeJoin = `

        /*
        |--------------------------------------------------------------------------
        | BRANCH / PROGRAM FEE FALLBACK
        |--------------------------------------------------------------------------
        |
        | Used when college_fee_profiles does
        | not contain a usable official fee.
        |
        | branch_id NULL means the fee applies
        | to all relevant branches/programmes.
        |
        */

        LEFT JOIN LATERAL (

          SELECT
            bf.academic_year,
            bf.tuition_fee,
            bf.hostel_fee,
            bf.other_fee,
            bf.total_annual_fee,

            bf.verification_status,
            bf.source_url,
            bf.source_label,
            bf.fee_scope,

            bf.updated_at

          FROM branch_fees bf

          WHERE
            bf.college_id = c.id::text

            AND (
              bf.branch_id IS NULL

              OR bf.branch_id::text =
                 b.id::text
            )

          ORDER BY

            CASE

              WHEN LOWER(
                COALESCE(
                  bf.verification_status,
                  ''
                )
              ) = 'verified'
                THEN 4

              WHEN LOWER(
                COALESCE(
                  bf.verification_status,
                  ''
                )
              ) = 'high_confidence'
                THEN 3

              WHEN LOWER(
                COALESCE(
                  bf.verification_status,
                  ''
                )
              ) = 'review_recommended'
                THEN 2

              WHEN LOWER(
                COALESCE(
                  bf.verification_status,
                  ''
                )
              ) = 'pending_review'
                THEN 1

              ELSE 0

            END DESC,

            bf.academic_year DESC,

            bf.updated_at DESC

          LIMIT 1

        ) bf ON TRUE
`;


if (
  !code.includes(
    'BRANCH / PROGRAM FEE FALLBACK'
  )
) {

  const marker =
    ') cfp ON TRUE';


  const markerIndex =
    code.indexOf(
      marker
    );


  if (
    markerIndex === -1
  ) {
    console.error(
      'ERROR: cfp lateral join ending not found.'
    );

    process.exit(
      1
    );
  }


  const insertAt =
    markerIndex +
    marker.length;


  code =
    code.slice(
      0,
      insertAt
    ) +
    branchFeeJoin +
    code.slice(
      insertAt
    );


  console.log(
    'branch_fees JOIN added.'
  );

} else {

  console.log(
    'branch_fees JOIN already exists.'
  );

}


/*
|--------------------------------------------------------------------------
| SAVE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  file,
  code,
  'utf8'
);


console.log('');
console.log(
  '========================================'
);

console.log(
  'BRANCH FEE BACKEND PATCH COMPLETE'
);

console.log(
  '========================================'
);

console.log(
  file
);
