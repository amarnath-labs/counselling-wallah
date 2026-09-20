import 'dotenv/config';
import fs from 'node:fs/promises';

import { pool } from './src/db/pool.js';

const OUTPUT =
  './college-duplicate-audit-v3.json';

const HIGH_CONFIDENCE_OUTPUT =
  './college-high-confidence-aliases-v3.json';

const REVIEW_OUTPUT =
  './college-alias-review-v3.json';

const CITY_WORDS = new Set([
  'gwalior',
  'allahabad',
  'prayagraj',
  'lucknow',
  'kanpur',
  'ghaziabad',
  'meerut',
  'mathura',
  'bareilly',
  'aligarh',
  'varanasi',
  'noida',
  'delhi',
  'jaipur',
  'silchar',
  'goa',
  'patna',
  'rourkela',
  'mizoram',
  'sikkim',
  'surathkal',
  'meghalaya',
  'manipur',
  'indore',
  'roorkee',
  'pune',
  'nagpur',
  'ranchi',
  'dharwad',
  'kottayam'
]);

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bengineering\b/g, ' engg ')
    .replace(/\btechnology\b/g, ' tech ')
    .replace(/\binstitute\b/g, ' inst ')
    .replace(/\bcollege\b/g, ' clg ')
    .replace(/\buniversity\b/g, ' univ ')
    .replace(/\bmanagement\b/g, ' mgmt ')
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
    .replace(
      /\bnorthern india\b/g,
      ' ni '
    )
    .replace(/\band\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTokens(value) {
  return normalizeName(value)
    .split(' ')
    .filter(Boolean);
}

function tokenSet(value) {
  return new Set(
    getTokens(value)
  );
}

function jaccard(a, b) {
  const A =
    tokenSet(a);

  const B =
    tokenSet(b);

  if (
    A.size === 0 ||
    B.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  for (const token of A) {
    if (B.has(token)) {
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

function extractCities(value) {
  const toks =
    getTokens(value);

  return [
    ...new Set(
      toks.filter(
        token =>
          CITY_WORDS.has(
            token
          )
      )
    )
  ];
}

function cityRelation(a, b) {
  const A =
    extractCities(a);

  const B =
    extractCities(b);

  if (
    A.length === 0 ||
    B.length === 0
  ) {
    return {
      status:
        'UNKNOWN',

      match:
        false,

      conflict:
        false,

      cities_a:
        A,

      cities_b:
        B
    };
  }

  const match =
    A.some(
      city =>
        B.includes(city)
    );

  return {
    status:
      match
        ? 'MATCH'
        : 'CONFLICT',

    match,

    conflict:
      !match,

    cities_a:
      A,

    cities_b:
      B
  };
}

function normalizeAcronym(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function generateKnownAcronyms(name) {
  const normalized =
    normalizeName(name);

  const acronyms =
    new Set();

  const raw =
    String(name || '');

  const explicit =
    raw.match(
      /\b[A-Z][A-Z0-9.-]{2,}\b/g
    ) || [];

  for (const item of explicit) {
    acronyms.add(
      normalizeAcronym(
        item
      )
    );
  }

  if (
    normalized.includes('iiit')
  ) {
    acronyms.add('IIIT');
  }

  if (
    normalized.includes('iit')
  ) {
    acronyms.add('IIT');
  }

  if (
    normalized.includes('nit')
  ) {
    acronyms.add('NIT');
  }

  if (
    normalized.includes('abv')
  ) {
    acronyms.add('ABV');
  }

  if (
    normalized.includes('iiit') &&
    normalized.includes('mgmt')
  ) {
    acronyms.add('IIITM');
  }

  if (
    normalized.includes('abv') &&
    normalized.includes('iiit') &&
    normalized.includes('mgmt')
  ) {
    acronyms.add('ABVIIITM');
    acronyms.add('IIITMGWALIOR');
  }

  return [
    ...acronyms
  ].filter(
    item =>
      item.length >= 3
  );
}

function acronymRelation(a, b) {
  const A =
    generateKnownAcronyms(
      a
    );

  const B =
    generateKnownAcronyms(
      b
    );

  const common =
    A.filter(
      item =>
        B.includes(item)
    );

  return {
    match:
      common.length > 0,

    common,

    acronyms_a:
      A,

    acronyms_b:
      B
  };
}

function containmentScore(a, b) {
  const ca =
    compact(a);

  const cb =
    compact(b);

  if (
    !ca ||
    !cb
  ) {
    return 0;
  }

  if (
    ca === cb
  ) {
    return 1;
  }

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

    return shorter / longer;
  }

  return 0;
}

function scorePair(a, b) {
  const normalizedA =
    normalizeName(a);

  const normalizedB =
    normalizeName(b);

  const jac =
    jaccard(
      a,
      b
    );

  const containment =
    containmentScore(
      a,
      b
    );

  const city =
    cityRelation(
      a,
      b
    );

  const acronym =
    acronymRelation(
      a,
      b
    );

  let score = 0;

  const reasons = [];

  if (
    normalizedA ===
    normalizedB
  ) {
    score += 70;
    reasons.push(
      'exact_normalized_name'
    );
  }

  if (
    containment >= 0.85
  ) {
    score += 25;
    reasons.push(
      'strong_containment'
    );
  } else if (
    containment >= 0.65
  ) {
    score += 15;
    reasons.push(
      'moderate_containment'
    );
  }

  if (
    jac >= 0.75
  ) {
    score += 25;
    reasons.push(
      'high_token_overlap'
    );
  } else if (
    jac >= 0.5
  ) {
    score += 15;
    reasons.push(
      'medium_token_overlap'
    );
  } else if (
    jac >= 0.35
  ) {
    score += 8;
    reasons.push(
      'some_token_overlap'
    );
  }

  if (
    acronym.match
  ) {
    score += 20;
    reasons.push(
      `acronym_match:${acronym.common.join(',')}`
    );
  }

  if (
    city.match
  ) {
    score += 20;
    reasons.push(
      `city_match:${city.cities_a.join(',')}`
    );
  }

  if (
    city.conflict
  ) {
    score -= 45;
    reasons.push(
      `city_conflict:${city.cities_a.join(',')}!=${city.cities_b.join(',')}`
    );
  }

  score =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    );

  let status;

  if (
    score >= 85 &&
    !city.conflict
  ) {
    status =
      'HIGH_CONFIDENCE_ALIAS';

  } else if (
    score >= 60 &&
    !city.conflict
  ) {
    status =
      'REVIEW';

  } else {
    status =
      'DIFFERENT';
  }

  return {
    score,

    status,

    reasons,

    jaccard:
      Number(
        jac.toFixed(4)
      ),

    containment:
      Number(
        containment.toFixed(4)
      ),

    city,

    acronym
  };
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'COLLEGE DUPLICATE / ALIAS AUDIT V3'
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
            )
        })
      );

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

        const analysis =
          scorePair(
            a.name,
            b.name
          );

        if (
          analysis.status ===
          'DIFFERENT'
        ) {
          continue;
        }

        pairs.push({
          college_a_id:
            a.id,

          college_a_name:
            a.name,

          college_a_fee_variants:
            a.fee_variants,

          college_b_id:
            b.id,

          college_b_name:
            b.name,

          college_b_fee_variants:
            b.fee_variants,

          score:
            analysis.score,

          status:
            analysis.status,

          jaccard:
            analysis.jaccard,

          containment:
            analysis.containment,

          city_status:
            analysis.city.status,

          cities_a:
            analysis.city.cities_a,

          cities_b:
            analysis.city.cities_b,

          acronym_match:
            analysis.acronym.match,

          common_acronyms:
            analysis.acronym.common,

          reasons:
            analysis.reasons
        });
      }
    }

    pairs.sort(
      (a, b) =>
        b.score -
        a.score
    );

    const highConfidence =
      pairs.filter(
        row =>
          row.status ===
          'HIGH_CONFIDENCE_ALIAS'
      );

    const review =
      pairs.filter(
        row =>
          row.status ===
          'REVIEW'
      );

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
      HIGH_CONFIDENCE_OUTPUT,
      JSON.stringify(
        highConfidence,
        null,
        2
      ),
      'utf8'
    );

    await fs.writeFile(
      REVIEW_OUTPUT,
      JSON.stringify(
        review,
        null,
        2
      ),
      'utf8'
    );

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
          'High confidence aliases',

        count:
          highConfidence.length
      },

      {
        status:
          'Review candidates',

        count:
          review.length
      }
    ]);

    console.log('');

    console.log(
      'HIGH CONFIDENCE'
    );

    console.table(
      highConfidence
        .slice(
          0,
          50
        )
        .map(
          row => ({
            score:
              row.score,

            college_a:
              row.college_a_name,

            a_fees:
              row.college_a_fee_variants,

            college_b:
              row.college_b_name,

            b_fees:
              row.college_b_fee_variants,

            city:
              row.city_status,

            acronym:
              row.common_acronyms.join(',')
          })
        )
    );

    console.log('');

    console.log(
      'REVIEW'
    );

    console.table(
      review
        .slice(
          0,
          50
        )
        .map(
          row => ({
            score:
              row.score,

            college_a:
              row.college_a_name,

            college_b:
              row.college_b_name,

            city:
              row.city_status,

            acronym:
              row.common_acronyms.join(',')
          })
        )
    );

    console.log('');

    console.log(
      'GWALIOR CHECK'
    );

    console.table(
      pairs
        .filter(
          row =>
            /gwalior/i.test(
              row.college_a_name
            ) ||
            /gwalior/i.test(
              row.college_b_name
            )
        )
        .map(
          row => ({
            score:
              row.score,

            status:
              row.status,

            college_a:
              row.college_a_name,

            college_b:
              row.college_b_name,

            city:
              row.city_status,

            acronym:
              row.common_acronyms.join(',')
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
      HIGH_CONFIDENCE_OUTPUT
    );

    console.log(
      'Saved:',
      REVIEW_OUTPUT
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
