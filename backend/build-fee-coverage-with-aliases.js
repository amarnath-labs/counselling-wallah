import 'dotenv/config';
import fs from 'node:fs/promises';

import { pool } from './src/db/pool.js';

const OUTPUT =
  './fee-coverage-with-aliases.json';

const MISSING_OUTPUT =
  './true-missing-fee-colleges.json';

const PILOT_OUTPUT =
  './fee-pilot-batch-01-true-missing.json';

/*
|--------------------------------------------------------------------------
| APPROVED ALIASES ONLY
|--------------------------------------------------------------------------
|
| IMPORTANT:
| No fuzzy matching.
| Only manually approved aliases go here.
|--------------------------------------------------------------------------
*/

const COLLEGE_ALIASES = {
  'iiitm-gwalior':
    'atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior'
};

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'FEE COVERAGE WITH APPROVED ALIASES'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const client =
    await pool.connect();

  try {
    const result =
      await client.query(
        `
        SELECT
          c.id,
          c.name,

          COUNT(
            DISTINCT bf.id
          )::int AS fee_masters,

          COUNT(
            DISTINCT fv.id
          )::int AS fee_variants,

          MAX(
            bf.academic_year
          ) AS latest_fee_year,

          BOOL_OR(
            bf.verification_status = 'verified'
          ) AS has_verified_fee

        FROM colleges c

        LEFT JOIN branch_fees bf
          ON bf.college_id = c.id

        LEFT JOIN fee_variants fv
          ON fv.branch_fee_id = bf.id

        GROUP BY
          c.id,
          c.name

        ORDER BY
          c.name
        `
      );

    const rows =
      result.rows.map(
        row => ({
          college_id:
            row.id,

          college_name:
            row.name,

          fee_masters:
            Number(
              row.fee_masters || 0
            ),

          fee_variants:
            Number(
              row.fee_variants || 0
            ),

          latest_fee_year:
            row.latest_fee_year,

          has_verified_fee:
            row.has_verified_fee === true
        })
      );

    const byId =
      new Map(
        rows.map(
          row => [
            row.college_id,
            row
          ]
        )
      );

    const coverage =
      rows.map(
        row => {
          /*
          |--------------------------------------------------------------------------
          | DIRECT COVERAGE
          |--------------------------------------------------------------------------
          */

          if (
            row.fee_variants > 0
          ) {
            return {
              ...row,

              coverage_type:
                'DIRECT',

              canonical_college_id:
                row.college_id,

              canonical_college_name:
                row.college_name,

              inherited_fee_variants:
                row.fee_variants,

              status:
                row.has_verified_fee
                  ? 'COMPLETE_VERIFIED'
                  : 'HAS_FEE_PENDING_REVIEW'
            };
          }

          /*
          |--------------------------------------------------------------------------
          | APPROVED ALIAS COVERAGE
          |--------------------------------------------------------------------------
          */

          const canonicalId =
            COLLEGE_ALIASES[
              row.college_id
            ];

          if (canonicalId) {
            const canonical =
              byId.get(
                canonicalId
              );

            if (
              canonical &&
              canonical.fee_variants > 0
            ) {
              return {
                ...row,

                coverage_type:
                  'APPROVED_ALIAS',

                canonical_college_id:
                  canonical.college_id,

                canonical_college_name:
                  canonical.college_name,

                inherited_fee_variants:
                  canonical.fee_variants,

                latest_fee_year:
                  canonical.latest_fee_year,

                has_verified_fee:
                  canonical.has_verified_fee,

                status:
                  canonical.has_verified_fee
                    ? 'COMPLETE_VIA_ALIAS_VERIFIED'
                    : 'COMPLETE_VIA_ALIAS_PENDING_REVIEW'
              };
            }
          }

          /*
          |--------------------------------------------------------------------------
          | TRUE MISSING
          |--------------------------------------------------------------------------
          */

          return {
            ...row,

            coverage_type:
              'NONE',

            canonical_college_id:
              null,

            canonical_college_name:
              null,

            inherited_fee_variants:
              0,

            status:
              'TRUE_MISSING_FEE'
          };
        }
      );

    const direct =
      coverage.filter(
        row =>
          row.coverage_type ===
          'DIRECT'
      );

    const aliases =
      coverage.filter(
        row =>
          row.coverage_type ===
          'APPROVED_ALIAS'
      );

    const missing =
      coverage.filter(
        row =>
          row.status ===
          'TRUE_MISSING_FEE'
      );

    /*
    |--------------------------------------------------------------------------
    | FIRST 25 TRUE MISSING PILOT
    |--------------------------------------------------------------------------
    */

    const pilot =
      missing
        .slice(
          0,
          25
        )
        .map(
          (
            row,
            index
          ) => ({
            batch_no:
              1,

            batch_index:
              index + 1,

            college_id:
              row.college_id,

            college_name:
              row.college_name,

            discovery_status:
              'PENDING',

            source_url:
              null,

            source_type:
              null,

            source_year:
              null,

            confidence_score:
              0,

            required_program:
              'B.Tech',

            source_policy: {
              official_only:
                true,

              preferred_years: [
                2026,
                2025
              ],

              allow_pdf:
                true,

              allow_html:
                true,

              reject_third_party:
                true,

              reject_foreign_only_fee:
                true
            }
          })
        );

    await fs.writeFile(
      OUTPUT,
      JSON.stringify(
        coverage,
        null,
        2
      ),
      'utf8'
    );

    await fs.writeFile(
      MISSING_OUTPUT,
      JSON.stringify(
        missing,
        null,
        2
      ),
      'utf8'
    );

    await fs.writeFile(
      PILOT_OUTPUT,
      JSON.stringify(
        pilot,
        null,
        2
      ),
      'utf8'
    );

    console.log(
      'COVERAGE SUMMARY'
    );

    console.table([
      {
        status:
          'Total colleges',

        count:
          coverage.length
      },

      {
        status:
          'Direct fee coverage',

        count:
          direct.length
      },

      {
        status:
          'Approved alias coverage',

        count:
          aliases.length
      },

      {
        status:
          'True missing fee',

        count:
          missing.length
      }
    ]);

    console.log('');

    console.log(
      'APPROVED ALIAS COVERAGE'
    );

    console.table(
      aliases.map(
        row => ({
          alias_id:
            row.college_id,

          alias_name:
            row.college_name,

          canonical_id:
            row.canonical_college_id,

          canonical_name:
            row.canonical_college_name,

          variants:
            row.inherited_fee_variants,

          status:
            row.status
        })
      )
    );

    console.log('');

    console.log(
      'FIRST 25 TRUE MISSING'
    );

    console.table(
      pilot.map(
        row => ({
          no:
            row.batch_index,

          college:
            row.college_name,

          id:
            row.college_id
        })
      )
    );

    console.log('');

    console.log(
      'Saved:',
      OUTPUT
    );

    console.log(
      'Saved:',
      MISSING_OUTPUT
    );

    console.log(
      'Saved:',
      PILOT_OUTPUT
    );

    console.log('');

    console.log(
      'DATABASE HAS NOT BEEN MODIFIED.'
    );

  } finally {
    client.release();

    await pool.end();
  }
}

main().catch(
  error => {
    console.error(
      'FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);
