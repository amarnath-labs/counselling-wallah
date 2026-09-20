import { pool } from "./src/db/pool.js";

const indexes = [
  `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS
      idx_capacity_branches_college_id_text
    ON branches ((college_id::text))
  `,

  `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS
      idx_capacity_fee_profiles_college_id_text
    ON college_fee_profiles ((college_id::text))
  `,

  `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS
      idx_capacity_cutoffs_branch_year
    ON cutoffs (
      branch_id,
      year DESC
    )
  `,

  `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS
      idx_capacity_quality_college_id_text_year
    ON college_quality_metrics (
      (college_id::text),
      academic_year DESC
    )
  `,

  `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS
      idx_capacity_reviews_college_id_text
    ON college_reviews (
      (college_id::text)
    )
    WHERE rating IS NOT NULL
  `,

  `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS
      idx_capacity_branch_fees_lookup
    ON branch_fees (
      (college_id::text),
      (branch_id::text),
      academic_year DESC
    )
  `
];

async function main() {
  console.log(
    "Creating capacity indexes..."
  );

  for (
    let i = 0;
    i < indexes.length;
    i++
  ) {
    console.log(
      `[${i + 1}/${indexes.length}] creating index...`
    );

    await pool.query(
      indexes[i]
    );

    console.log(
      `✅ index ${i + 1} ready`
    );
  }

  console.log(
    "\n✅ CAPACITY INDEXES COMPLETE"
  );
}

main()
  .catch(
    (error) => {
      console.error(
        "\n❌ CAPACITY INDEX ERROR"
      );

      console.error(
        error.stack ||
        error.message
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool
        .end()
        .catch(
          () => {}
        );
    }
  );
