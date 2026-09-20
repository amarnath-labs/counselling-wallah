import "dotenv/config";

import {
  pool
} from "./src/db/pool.js";


const COLLEGE_ID =
  "uptac-ajay-kumar-garg-engg-college-ghaziabad";

const ACADEMIC_YEAR =
  2026;

const SOURCE_URL =
  "https://www.akgec.ac.in/hostel/";

const SOURCE_LABEL =
  "AKGEC Official Hostel Fee Structure 2026-27";


/*
|--------------------------------------------------------------------------
| VERIFIED HOSTEL VALUES
|--------------------------------------------------------------------------
|
| Double sharing
| Hostel / mess component = 140000
| Refundable security      = 10000
| Total                    = 150000
|
| Triple sharing
| Hostel / mess component = 130000
| Refundable security      = 10000
| Total                    = 140000
|
|--------------------------------------------------------------------------
*/

const HOSTEL_VARIANTS = [
  {
    room_type:
      "double_sharing",

    hostel_fee:
      140000,

    caution_deposit:
      10000,

    total_fee:
      150000
  },

  {
    room_type:
      "triple_sharing",

    hostel_fee:
      130000,

    caution_deposit:
      10000,

    total_fee:
      140000
  }
];


const STUDENT_CATEGORIES = [
  "GENERAL",
  "FEE_WAIVER"
];


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeConstraintText(
  value
) {
  return String(
    value || ""
  ).toLowerCase();
}


function escapeSqlLiteral(
  value
) {
  return String(
    value
  ).replace(
    /'/g,
    "''"
  );
}


/*
|--------------------------------------------------------------------------
| READ CURRENT ROOM-TYPE CONSTRAINT
|--------------------------------------------------------------------------
*/

async function inspectRoomTypeConstraint(
  client
) {
  const result =
    await client.query(
      `
      SELECT
        conname,
        pg_get_constraintdef(oid)
          AS definition
      FROM pg_constraint
      WHERE conrelid =
        'fee_variants'::regclass
        AND conname =
        'fee_variants_room_type_check'
      `
    );


  if (
    result.rowCount === 0
  ) {
    return {
      found:
        false,

      definition:
        null
    };
  }


  return {
    found:
      true,

    definition:
      result.rows[0]
        .definition
  };
}


/*
|--------------------------------------------------------------------------
| EXTRACT CURRENT ENUM-LIKE VALUES FROM CONSTRAINT
|--------------------------------------------------------------------------
*/

function extractAllowedRoomTypes(
  definition
) {
  const values = [];

  const regex =
    /'([^']+)'::character varying/g;


  let match;


  while (
    (
      match =
        regex.exec(
          definition
        )
    ) !== null
  ) {
    values.push(
      match[1]
    );
  }


  return [
    ...new Set(
      values
    )
  ];
}


/*
|--------------------------------------------------------------------------
| ENSURE REQUIRED ROOM TYPES
|--------------------------------------------------------------------------
|
| This is additive.
|
| Existing supported values are preserved.
| triple_sharing is added only if missing.
|--------------------------------------------------------------------------
*/

async function ensureRequiredRoomTypes(
  client
) {
  let constraint =
    await inspectRoomTypeConstraint(
      client
    );


  console.log(
    "ROOM TYPE CONSTRAINT - BEFORE"
  );


  console.log(
    constraint.definition ||
    "NOT FOUND"
  );


  if (
    !constraint.found
  ) {
    throw new Error(
      "fee_variants_room_type_check constraint not found."
    );
  }


  const currentValues =
    extractAllowedRoomTypes(
      constraint.definition
    );


  console.log("");

  console.log(
    "Current room types:",
    currentValues
  );


  /*
  |--------------------------------------------------------------------------
  | double_sharing must already exist.
  |--------------------------------------------------------------------------
  */

  if (
    !currentValues.includes(
      "double_sharing"
    )
  ) {
    throw new Error(
      "DB constraint does not support double_sharing. Import stopped safely."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Add triple_sharing if needed.
  |--------------------------------------------------------------------------
  */

  if (
    !currentValues.includes(
      "triple_sharing"
    )
  ) {
    console.log("");

    console.log(
      "Adding triple_sharing to room_type constraint..."
    );


    const newValues =
      [
        ...currentValues,
        "triple_sharing"
      ];


    const sqlValues =
      newValues
        .map(
          value =>
            `'${escapeSqlLiteral(value)}'`
        )
        .join(
          ", "
        );


    await client.query(
      `
      ALTER TABLE fee_variants
      DROP CONSTRAINT
      fee_variants_room_type_check
      `
    );


    await client.query(
      `
      ALTER TABLE fee_variants
      ADD CONSTRAINT
      fee_variants_room_type_check
      CHECK (
        room_type IS NULL
        OR room_type IN (
          ${sqlValues}
        )
      )
      `
    );


    constraint =
      await inspectRoomTypeConstraint(
        client
      );


    console.log("");

    console.log(
      "ROOM TYPE CONSTRAINT - AFTER"
    );


    console.log(
      constraint.definition
    );
  }


  const finalValues =
    extractAllowedRoomTypes(
      constraint.definition
    );


  if (
    !finalValues.includes(
      "double_sharing"
    ) ||
    !finalValues.includes(
      "triple_sharing"
    )
  ) {
    throw new Error(
      "Required double_sharing / triple_sharing room types are still unavailable."
    );
  }


  return finalValues;
}


/*
|--------------------------------------------------------------------------
| BUILD FINAL VARIANTS
|--------------------------------------------------------------------------
*/

function buildVariants() {
  const output = [];


  for (
    const category
    of STUDENT_CATEGORIES
  ) {
    for (
      const hostel
      of HOSTEL_VARIANTS
    ) {
      output.push({
        student_category:
          category,

        room_type:
          hostel.room_type,

        hostel_fee:
          hostel.hostel_fee,

        caution_deposit:
          hostel.caution_deposit,

        total_fee:
          hostel.total_fee
      });
    }
  }


  return output;
}


/*
|--------------------------------------------------------------------------
| SAFETY VALIDATION
|--------------------------------------------------------------------------
*/

function validateVariants(
  variants
) {
  const errors = [];


  if (
    variants.length !== 4
  ) {
    errors.push(
      `Expected 4 hostel variants, found ${variants.length}`
    );
  }


  for (
    const row
    of variants
  ) {
    if (
      ![
        "GENERAL",
        "FEE_WAIVER"
      ].includes(
        row.student_category
      )
    ) {
      errors.push(
        `Invalid category: ${row.student_category}`
      );
    }


    if (
      ![
        "double_sharing",
        "triple_sharing"
      ].includes(
        row.room_type
      )
    ) {
      errors.push(
        `Invalid room type: ${row.room_type}`
      );
    }


    if (
      !Number.isFinite(
        row.hostel_fee
      ) ||
      !Number.isFinite(
        row.caution_deposit
      ) ||
      !Number.isFinite(
        row.total_fee
      )
    ) {
      errors.push(
        `Invalid numeric fee for ${row.student_category}/${row.room_type}`
      );

      continue;
    }


    const calculated =
      row.hostel_fee +
      row.caution_deposit;


    if (
      calculated !==
      row.total_fee
    ) {
      errors.push(
        `Arithmetic mismatch ${row.student_category}/${row.room_type}: ${calculated} != ${row.total_fee}`
      );
    }
  }


  return errors;
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "AKGEC 2026 HOSTEL FEE IMPORTER - FINAL"
  );

  console.log(
    "======================================="
  );

  console.log("");


  const client =
    await pool.connect();


  try {
    /*
    |--------------------------------------------------------------------------
    | BEGIN ONE TRANSACTION
    |--------------------------------------------------------------------------
    |
    | Constraint update + hostel import happen together.
    |
    | Any failure => rollback everything.
    |--------------------------------------------------------------------------
    */

    await client.query(
      "BEGIN"
    );


    /*
    |--------------------------------------------------------------------------
    | COLLEGE CHECK
    |--------------------------------------------------------------------------
    */

    const college =
      await client.query(
        `
        SELECT
          id,
          name
        FROM colleges
        WHERE id = $1
        `,
        [
          COLLEGE_ID
        ]
      );


    if (
      college.rowCount === 0
    ) {
      throw new Error(
        `College not found: ${COLLEGE_ID}`
      );
    }


    console.log(
      "College:",
      college.rows[0].name
    );


    console.log("");


    /*
    |--------------------------------------------------------------------------
    | FIX / VALIDATE ROOM TYPES
    |--------------------------------------------------------------------------
    */

    const allowedRoomTypes =
      await ensureRequiredRoomTypes(
        client
      );


    console.log("");

    console.log(
      "Final allowed room types:"
    );


    console.log(
      allowedRoomTypes
    );


    /*
    |--------------------------------------------------------------------------
    | BUILD VARIANTS
    |--------------------------------------------------------------------------
    */

    const variants =
      buildVariants();


    console.log("");

    console.log(
      "HOSTEL IMPORT PREVIEW"
    );


    console.table(
      variants
    );


    /*
    |--------------------------------------------------------------------------
    | SAFETY CHECK
    |--------------------------------------------------------------------------
    */

    const errors =
      validateVariants(
        variants
      );


    if (
      errors.length > 0
    ) {
      console.log("");

      console.log(
        "SAFETY ERRORS:"
      );


      for (
        const error
        of errors
      ) {
        console.log(
          "-",
          error
        );
      }


      throw new Error(
        "Hostel safety validation failed."
      );
    }


    console.log("");

    console.log(
      "HOSTEL SAFETY CHECK: PASS"
    );


    /*
    |--------------------------------------------------------------------------
    | DELETE ONLY EXISTING AKGEC ALL-BTECH HOSTEL MASTER
    |--------------------------------------------------------------------------
    |
    | Branch-specific academic masters are untouched.
    |--------------------------------------------------------------------------
    */

    const existing =
      await client.query(
        `
        SELECT
          id
        FROM branch_fees
        WHERE college_id = $1
          AND branch_id IS NULL
          AND program = 'B.Tech'
          AND fee_scope =
            'all_btech_branches'
          AND academic_year = $2
        `,
        [
          COLLEGE_ID,
          ACADEMIC_YEAR
        ]
      );


    let replaced =
      0;


    for (
      const row
      of existing.rows
    ) {
      await client.query(
        `
        DELETE FROM branch_fees
        WHERE id = $1
        `,
        [
          row.id
        ]
      );


      replaced++;
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE HOSTEL MASTER
    |--------------------------------------------------------------------------
    */

    const master =
      await client.query(
        `
        INSERT INTO branch_fees (
          college_id,
          branch_id,
          program,
          fee_scope,
          academic_year,
          source_label,
          source_url,
          verification_status
        )
        VALUES (
          $1,
          NULL,
          'B.Tech',
          'all_btech_branches',
          $2,
          $3,
          $4,
          'verified'
        )
        RETURNING id
        `,
        [
          COLLEGE_ID,
          ACADEMIC_YEAR,
          SOURCE_LABEL,
          SOURCE_URL
        ]
      );


    const branchFeeId =
      master.rows[0].id;


    /*
    |--------------------------------------------------------------------------
    | INSERT HOSTEL VARIANTS
    |--------------------------------------------------------------------------
    */

    let inserted =
      0;


    for (
      const variant
      of variants
    ) {
      await client.query(
        `
        INSERT INTO fee_variants (
          branch_fee_id,
          semester,
          fee_period,
          student_category,
          income_min,
          income_max,
          residence_type,
          room_type,
          tuition_fee,
          admission_fee,
          institute_fee,
          hostel_fee,
          mess_fee,
          caution_deposit,
          other_fee,
          total_fee,
          is_one_time_included,
          verification_status
        )
        VALUES (
          $1,
          NULL,
          'annual',
          $2,
          NULL,
          NULL,
          'hosteller',
          $3,
          NULL,
          NULL,
          NULL,
          $4,
          NULL,
          $5,
          NULL,
          $6,
          TRUE,
          'verified'
        )
        `,
        [
          branchFeeId,
          variant.student_category,
          variant.room_type,
          variant.hostel_fee,
          variant.caution_deposit,
          variant.total_fee
        ]
      );


      inserted++;
    }


    /*
    |--------------------------------------------------------------------------
    | VERIFY INSIDE TRANSACTION
    |--------------------------------------------------------------------------
    */

    const verify =
      await client.query(
        `
        SELECT
          fv.student_category,
          fv.room_type,
          fv.hostel_fee,
          fv.caution_deposit,
          fv.total_fee
        FROM fee_variants fv

        JOIN branch_fees bf
          ON bf.id =
             fv.branch_fee_id

        WHERE bf.college_id = $1
          AND bf.branch_id IS NULL
          AND bf.program = 'B.Tech'
          AND bf.fee_scope =
            'all_btech_branches'
          AND bf.academic_year = $2

        ORDER BY
          fv.student_category,
          fv.room_type
        `,
        [
          COLLEGE_ID,
          ACADEMIC_YEAR
        ]
      );


    if (
      verify.rowCount !== 4
    ) {
      throw new Error(
        `Post-insert verification expected 4 variants, found ${verify.rowCount}`
      );
    }


    console.log("");

    console.log(
      "POST-INSERT VERIFICATION"
    );


    console.table(
      verify.rows
    );


    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    await client.query(
      "COMMIT"
    );


    console.log("");

    console.log(
      "======================================="
    );

    console.log(
      "HOSTEL IMPORT COMPLETE"
    );

    console.log(
      "======================================="
    );


    console.log(
      "Existing hostel master replaced:",
      replaced
    );


    console.log(
      "Hostel variants inserted:",
      inserted
    );


    console.log("");

    console.log(
      "GENERAL double_sharing:"
    );

    console.log(
      "â‚¹140000 + â‚¹10000 = â‚¹150000"
    );


    console.log(
      "GENERAL triple_sharing:"
    );

    console.log(
      "â‚¹130000 + â‚¹10000 = â‚¹140000"
    );


    console.log(
      "FEE_WAIVER double_sharing:"
    );

    console.log(
      "â‚¹140000 + â‚¹10000 = â‚¹150000"
    );


    console.log(
      "FEE_WAIVER triple_sharing:"
    );

    console.log(
      "â‚¹130000 + â‚¹10000 = â‚¹140000"
    );


    console.log("");

    console.log(
      "AKGEC HOSTEL FEES COMPLETE."
    );


    console.log(
      "AKGEC ACADEMIC FEES REMAIN UNCHANGED."
    );


  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {}


    throw error;

  } finally {
    client.release();

    await pool.end();
  }
}


main().catch(
  error => {
    console.error("");

    console.error(
      "FAILED:",
      error.message
    );


    process.exitCode =
      1;
  }
);

