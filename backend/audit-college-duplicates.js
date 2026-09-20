import 'dotenv/config';
import fs from 'node:fs/promises';

import { pool } from './src/db/pool.js';

const OUTPUT =
  './college-duplicate-audit.json';

const LIKELY_OUTPUT =
  './college-likely-duplicates.json';

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')

    /*
    |--------------------------------------------------------------------------
    | COMMON ABBREVIATION NORMALIZATION
    |--------------------------------------------------------------------------
    */

    .replace(/\bengineering\b/g, ' engg ')
    .replace(/\btechnology\b/g, ' tech ')
    .replace(/\binstitute\b/g, ' inst ')
    .replace(/\bcollege\b/g, ' clg ')
    .replace(/\buniversity\b/g, ' univ ')
    .replace(/\bmanagement\b/g, ' mgmt ')

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT INSTITUTE NAME NORMALIZATION
    |--------------------------------------------------------------------------
    */

    .replace(
      /\bindian institute of technology\b/g,
      ' iit '
    )

    .replace(
      /\bnational institute of technology\b/g,
      ' nit '
    )

    .replace(
      /\bindian institute of information technology\b/g,
      ' iiit '
    )

    .replace(
      /\binformation technology\b/g,
      ' it '
    )

    /*
    |--------------------------------------------------------------------------
    | ABV / ATAL BIHARI VAJPAYEE
    |--------------------------------------------------------------------------
    */

    .replace(
      /\batal bihari vajpayee\b/g,
      ' abv '
    )

    .replace(
      /\bat al bihari vajpayee\b/g,
      ' abv '
    )

    .replace(
      /\bat-al-bihari-vajpayee\b/g,
      ' abv '
    )

    /*
    |--------------------------------------------------------------------------
    | OTHER COMMON EXPRESSIONS
    |--------------------------------------------------------------------------
    */

    .replace(
      /\bnorthern india\b/g,
      ' ni '
    )

    .replace(
      /\band\b/g,
      ' '
    )

    /*
    |--------------------------------------------------------------------------
    | CLEANUP
    |--------------------------------------------------------------------------
    */

    .replace(
      /[^a-z0-9]+/g,
      ' '
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}

function tokens(value) {
  return new Set(
    normalizeName(value)
      .split(' ')
      .filter(Boolean)
  );
}

function jaccard(a, b) {
  const A =
    tokens(a);

  const B =
    tokens(b);

  if (
    A.size === 0 ||
    B.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  for (const item of A) {
    if (B.has(item)) {
      intersection++;
    }
  }

  const union =
    new Set([
      ...A,
      ...B
    ]).size;

  return union
    ? intersection / union
    : 0;
}

function compact(value) {
  return normalizeName(value)
    .replace(/\s+/g, '');
}

function similarity(a, b) {
  const na =
    normalizeName(a);

  const nb =
    normalizeName(b);

  if (
    !na ||
    !nb
  ) {
    return 0;
  }

  /*
  |--------------------------------------------------------------------------
  | EXACT NORMALIZED MATCH
  |--------------------------------------------------------------------------
  */

  if (
    na === nb
  ) {
    return 1;
  }

  const ca =
    compact(a);

  const cb =
    compact(b);

  /*
  |--------------------------------------------------------------------------
  | EXACT COMPACT MATCH
  |--------------------------------------------------------------------------
  */

  if (
    ca === cb
  ) {
    return 0.99;
  }

  /*
  |--------------------------------------------------------------------------
  | STRONG CONTAINMENT
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | "ABV IIITM Gwalior"
  |
  | vs
  |
  | "Atal Bihari Vajpayee Indian Institute of Information
  | Technology and Management Gwalior"
  |
  |--------------------------------------------------------------------------
  */

  if (
    ca.includes(cb) ||
    cb.includes(ca)
  ) {
    const shorter =
      Math.min(
        ca.length,
        cb.length
      );

    const longer =
      Math.max(
        ca.length,
        cb.length
      );

    const ratio =
      shorter / longer;

    if (
      ratio >= 0.85
    ) {
      return Math.max(
        0.92,
        ratio
      );
    }

    if (
      ratio >= 0.7
    ) {
      return Math.max(
        0.82,
        ratio
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | TOKEN SIMILARITY
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | No manual / special college boost is applied here.
  |
  | This prevents one college keyword from boosting every unrelated
  | college in the same city or containing similar institute words.
  |--------------------------------------------------------------------------
  */

  return jaccard(
    a,
    b
  );
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'COLLEGE DUPLICATE / ALIAS AUDIT V2'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const client =
    await pool.connect();

  try {
    /*
    |--------------------------------------------------------------------------
    | LOAD COLLEGES + FEE COVERAGE
    |--------------------------------------------------------------------------
    */

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
          )::int AS fee_variants

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

    const colleges =
      result.rows.map(
        row => ({
          id:
            row.id,

          name:
            row.name,

          fee_masters:
            Number(
              row.fee_masters || 0
            ),

          fee_variants:
            Number(
              row.fee_variants || 0
            ),

          normalized_name:
            normalizeName(
              row.name
            )
        })
      );

    /*
    |--------------------------------------------------------------------------
    | PAIRWISE COMPARISON
    |--------------------------------------------------------------------------
    */

    const pairs = [];

    for (
      let i = 0;
      i < colleges.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < colleges.length;
        j++
      ) {
        const a =
          colleges[i];

        const b =
          colleges[j];

        const score =
          similarity(
            a.name,
            b.name
          );

        /*
        |--------------------------------------------------------------------------
        | ONLY KEEP REASONABLY CLOSE PAIRS
        |--------------------------------------------------------------------------
        */

        if (
          score < 0.72
        ) {
          continue;
        }

        let status;

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        if (
          score >= 0.95
        ) {
          status =
            'VERY_LIKELY_DUPLICATE';

        } else if (
          score >= 0.85
        ) {
          status =
            'LIKELY_DUPLICATE';

        } else {
          status =
            'REVIEW';
        }

        pairs.push({
          college_a_id:
            a.id,

          college_a_name:
            a.name,

          college_a_normalized:
            a.normalized_name,

          college_a_fee_variants:
            a.fee_variants,

          college_b_id:
            b.id,

          college_b_name:
            b.name,

          college_b_normalized:
            b.normalized_name,

          college_b_fee_variants:
            b.fee_variants,

          similarity:
            Number(
              score.toFixed(4)
            ),

          status
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | SORT
    |--------------------------------------------------------------------------
    */

    pairs.sort(
      (a, b) =>
        b.similarity -
        a.similarity
    );

    /*
    |--------------------------------------------------------------------------
    | LIKELY ONLY
    |--------------------------------------------------------------------------
    */

    const likely =
      pairs.filter(
        row =>
          row.status ===
            'VERY_LIKELY_DUPLICATE' ||
          row.status ===
            'LIKELY_DUPLICATE'
      );

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    await fs.writeFile(
      OUTPUT,
      JSON.stringify(
        pairs,
        null,
        2
      ),
      'utf8'
    );

    await fs.writeFile(
      LIKELY_OUTPUT,
      JSON.stringify(
        likely,
        null,
        2
      ),
      'utf8'
    );

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    console.log(
      'AUDIT SUMMARY'
    );

    console.table([
      {
        status:
          'Total colleges',

        count:
          colleges.length
      },

      {
        status:
          'Potential duplicate pairs',

        count:
          pairs.length
      },

      {
        status:
          'Likely / very likely',

        count:
          likely.length
      }
    ]);

    console.log('');

    /*
    |--------------------------------------------------------------------------
    | TOP DUPLICATES
    |--------------------------------------------------------------------------
    */

    console.log(
      'TOP DUPLICATE CANDIDATES'
    );

    console.table(
      likely
        .slice(
          0,
          50
        )
        .map(
          row => ({
            similarity:
              row.similarity,

            status:
              row.status,

            college_a:
              row.college_a_name,

            a_fees:
              row.college_a_fee_variants,

            college_b:
              row.college_b_name,

            b_fees:
              row.college_b_fee_variants
          })
        )
    );

    /*
    |--------------------------------------------------------------------------
    | ABV GWL SPECIAL DISPLAY ONLY
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This does NOT change similarity.
    | It only prints Gwalior pairs for inspection.
    |--------------------------------------------------------------------------
    */

    const gwaliorPairs =
      pairs.filter(
        row =>
          /gwalior/i.test(
            row.college_a_name
          ) ||
          /gwalior/i.test(
            row.college_b_name
          )
      );

    console.log('');

    console.log(
      'GWALIOR PAIRS FOR REVIEW'
    );

    console.table(
      gwaliorPairs.map(
        row => ({
          similarity:
            row.similarity,

          status:
            row.status,

          college_a:
            row.college_a_name,

          a_fees:
            row.college_a_fee_variants,

          college_b:
            row.college_b_name,

          b_fees:
            row.college_b_fee_variants
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
      LIKELY_OUTPUT
    );

    console.log('');

    console.log(
      'IMPORTANT:'
    );

    console.log(
      'This audit does NOT merge or modify any college.'
    );

    console.log(
      'Duplicate candidates still require review before canonical mapping.'
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