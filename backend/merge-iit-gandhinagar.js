import { pool } from "./src/db/pool.js";

const OLD_COLLEGE =
  "indian-institute-of-technology-gandhinagar";

const NEW_COLLEGE =
  "iit-gandhinagar";

const BRANCH_MAP = {
  "Computer Science and Engineering (4 Years, Bachelor of Technology)": 45,
  "Mechanical Engineering (4 Years, Bachelor of Technology)": 46,
  "Electrical Engineering (4 Years, Bachelor of Technology)": 47,
};

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("========================================");
    console.log("MERGING IIT GANDHINAGAR");
    console.log("========================================");

    /*
    -----------------------------------------------------
    1. Make sure canonical college exists
    -----------------------------------------------------
    */

    const canonical = await client.query(
      `
      SELECT id, name, city, state, type
      FROM colleges
      WHERE id = $1
      `,
      [NEW_COLLEGE]
    );

    if (!canonical.rows.length) {
      throw new Error(
        "Canonical IIT Gandhinagar college not found."
      );
    }

    console.table(canonical.rows);


    /*
    -----------------------------------------------------
    2. Get all duplicate branches
    -----------------------------------------------------
    */

    const branches = await client.query(
      `
      SELECT id, name
      FROM branches
      WHERE college_id = $1
      ORDER BY id
      `,
      [OLD_COLLEGE]
    );

    console.log(
      `\nDuplicate branches found: ${branches.rows.length}`
    );

    console.table(branches.rows);


    /*
    -----------------------------------------------------
    3. Move branches
    -----------------------------------------------------
    */

    let movedBranches = 0;
    let mergedBranches = 0;

    for (const branch of branches.rows) {

      /*
       * For the existing 3 branches:
       *
       * CSE
       * Mechanical
       * Electrical
       *
       * keep the canonical branch IDs.
       */

      const canonicalBranchId =
        BRANCH_MAP[branch.name];

      if (canonicalBranchId) {

        console.log(
          `\nMerging branch: ${branch.name}`
        );

        /*
         * Move official cutoff rows from duplicate
         * branch to canonical branch.
         *
         * Existing cutoff records are preserved.
         */

        const cutoffResult =
          await client.query(
            `
            UPDATE cutoffs
            SET branch_id = $1
            WHERE branch_id = $2
            `,
            [
              canonicalBranchId,
              branch.id
            ]
          );

        console.log(
          `Moved cutoffs: ${cutoffResult.rowCount}`
        );

        /*
         * Delete now-empty duplicate branch.
         */

        await client.query(
          `
          DELETE FROM branches
          WHERE id = $1
          `,
          [branch.id]
        );

        mergedBranches++;

      } else {

        /*
         * New JoSAA branches:
         *
         * AI
         * Chemical
         * Civil
         * ICDT
         * Materials
         *
         * Attach them directly to canonical college.
         */

        const result =
          await client.query(
            `
            UPDATE branches
            SET college_id = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING id, name
            `,
            [
              NEW_COLLEGE,
              branch.id
            ]
          );

        console.log(
          `Moved branch: ${result.rows[0].name}`
        );

        movedBranches++;
      }
    }


    /*
    -----------------------------------------------------
    4. Remove duplicate college
    -----------------------------------------------------
    */

    const remaining =
      await client.query(
        `
        SELECT COUNT(*)::int AS count
        FROM branches
        WHERE college_id = $1
        `,
        [OLD_COLLEGE]
      );

    if (
      remaining.rows[0].count !== 0
    ) {
      throw new Error(
        `Duplicate college still has ${remaining.rows[0].count} branches.`
      );
    }

    await client.query(
      `
      DELETE FROM colleges
      WHERE id = $1
      `,
      [OLD_COLLEGE]
    );


    /*
    -----------------------------------------------------
    5. Verify canonical college
    -----------------------------------------------------
    */

    const verify =
      await client.query(
        `
        SELECT
          c.id,
          c.name,
          c.city,
          c.state,
          c.type,
          COUNT(DISTINCT b.id)::int AS branches,
          COUNT(DISTINCT co.id)::int AS cutoffs
        FROM colleges c
        LEFT JOIN branches b
          ON b.college_id = c.id
        LEFT JOIN cutoffs co
          ON co.branch_id = b.id
        WHERE c.id = $1
        GROUP BY
          c.id,
          c.name,
          c.city,
          c.state,
          c.type
        `,
        [NEW_COLLEGE]
      );

    console.log(
      "\nFINAL IIT GANDHINAGAR:"
    );

    console.table(
      verify.rows
    );


    /*
    -----------------------------------------------------
    6. Commit
    -----------------------------------------------------
    */

    await client.query("COMMIT");

    console.log(
      "\n========================================"
    );

    console.log(
      "MERGE SUCCESSFUL"
    );

    console.log(
      "========================================"
    );

    console.log(
      "Merged branches:",
      mergedBranches
    );

    console.log(
      "Moved new branches:",
      movedBranches
    );

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(
      "\n========================================"
    );

    console.error(
      "MERGE FAILED — ROLLED BACK"
    );

    console.error(
      "========================================"
    );

    console.error(
      error.stack || error.message
    );

    process.exitCode = 1;

  } finally {
    client.release();
    await pool.end();
  }
}

main();
