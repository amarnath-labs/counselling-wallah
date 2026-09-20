import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool } from './src/db/pool.js';

const TARGET_IDS = [
  'uptac-abss-institute-of-technology-meerut-meerut',
  'uptac-adhunik-college-of-engg-ghaziabad',
  'uptac-ajay-kumar-garg-engg-college-ghaziabad',
  'uptac-allenhouse-institute-of-technology-kanpur',
  'uptac-amani-group-of-institutions-amroha',
  'uptac-bharat-institute-of-technology-meerut',
  'uptac-bharat-ratna-sardar-vallabhbhai-patel-rajkiya-engineering-college-basti',
  'uptac-bundelkhand-institute-of-engineering-technology-jhansi',
  'central-university-of-haryana',
  'uptac-centre-for-advance-studies-lucknow',
  'uptac-chaudhary-beeri-singh-college-of-engineering-management-agra',
  'coep-pune',
  'indian-institute-of-technology-palakkad',
  'national-institute-of-technology-arunachal-pradesh',
  'national-institute-of-technology-goa',
  'punjab-engineering-college-chandigarh'
];

const MIN_ANNUAL = 20000;
const MAX_ANNUAL = 500000;

function cleanNumber(value) {
  if (!value) return null;

  const normalized = String(value)
    .replace(/₹/g, '')
    .replace(/rs\.?/gi, '')
    .replace(/inr/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const match = normalized.match(
    /(?:^|\D)(\d{4,7}(?:\.\d+)?)(?:\D|$)/
  );

  if (!match) return null;

  const num = Number(match[1]);

  return Number.isFinite(num)
    ? num
    : null;
}

function plausibleAnnual(value) {
  return (
    Number.isFinite(value) &&
    value >= MIN_ANNUAL &&
    value <= MAX_ANNUAL
  );
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFeeCandidates(html) {
  const $ = cheerio.load(html);

  const candidates = [];

  $('tr').each((_, tr) => {
    const text =
      normalizeText($(tr).text());

    if (
      !/fee|tuition|semester|annual|year|course/i.test(text)
    ) {
      return;
    }

    const numbers =
      [...text.matchAll(
        /(?:₹|rs\.?|inr)?\s*([\d,]{4,10}(?:\.\d+)?)/gi
      )];

    for (const match of numbers) {
      const value =
        Number(
          match[1].replace(/,/g, '')
        );

      if (
        Number.isFinite(value) &&
        value > 0
      ) {
        candidates.push({
          context: text.slice(0, 300),
          value
        });
      }
    }
  });

  $('p, li, div').each((_, el) => {
    const text =
      normalizeText($(el).text());

    if (
      text.length > 500 ||
      !/fee|tuition|semester|annual|per year|per semester/i.test(text)
    ) {
      return;
    }

    const numbers =
      [...text.matchAll(
        /(?:₹|rs\.?|inr)?\s*([\d,]{4,10}(?:\.\d+)?)/gi
      )];

    for (const match of numbers) {
      const value =
        Number(
          match[1].replace(/,/g, '')
        );

      if (
        Number.isFinite(value) &&
        value > 0
      ) {
        candidates.push({
          context: text.slice(0, 300),
          value
        });
      }
    }
  });

  return candidates;
}

function classifyCandidate(candidate) {
  const text =
    candidate.context.toLowerCase();

  const value =
    candidate.value;

  if (
    /annual|per annum|per year|yearly/.test(text) &&
    plausibleAnnual(value)
  ) {
    return {
      field: 'annual_academic_fee',
      storedValue: value,
      resolvedAnnual: value,
      confidence: 'high'
    };
  }

  if (
    /per semester|semester fee|tuition fee.*semester/.test(text)
  ) {
    const annual =
      value * 2;

    if (
      plausibleAnnual(annual)
    ) {
      return {
        field:
          'tuition_fee_per_semester',
        storedValue:
          value,
        resolvedAnnual:
          annual,
        confidence:
          'high'
      };
    }
  }

  if (
    /first semester|1st semester/.test(text)
  ) {
    const annual =
      value * 2;

    if (
      plausibleAnnual(annual)
    ) {
      return {
        field:
          'first_semester_fee',
        storedValue:
          value,
        resolvedAnnual:
          annual,
        confidence:
          'medium'
      };
    }
  }

  if (
    /total course|course fee|total fee.*4 year|4 year.*fee/.test(text)
  ) {
    const annual =
      value / 4;

    if (
      plausibleAnnual(annual)
    ) {
      return {
        field:
          'total_course_fee',
        storedValue:
          value,
        resolvedAnnual:
          annual,
        confidence:
          'medium'
      };
    }
  }

  return null;
}

function chooseBest(candidates) {
  const classified =
    candidates
      .map(candidate => ({
        candidate,
        classification:
          classifyCandidate(candidate)
      }))
      .filter(
        item =>
          item.classification !== null
      );

  if (!classified.length) {
    return null;
  }

  const priority = {
    annual_academic_fee: 100,
    tuition_fee_per_semester: 90,
    first_semester_fee: 80,
    total_course_fee: 60
  };

  classified.sort(
    (a, b) =>
      priority[
        b.classification.field
      ] -
      priority[
        a.classification.field
      ]
  );

  return classified[0];
}

async function fetchPage(url) {
  if (!url) {
    return null;
  }

  try {
    const response =
      await axios.get(url, {
        timeout: 20000,
        maxRedirects: 5,
        headers: {
          'User-Agent':
            'Mozilla/5.0 CounsellingWallah Fee Verification',
          Accept:
            'text/html,application/xhtml+xml'
        }
      });

    if (
      typeof response.data !==
      'string'
    ) {
      return null;
    }

    return response.data;
  } catch (error) {
    console.log(
      `    fetch failed: ${error.message}`
    );

    return null;
  }
}

async function main() {
  console.log('');
  console.log(
    '========================================'
  );
  console.log(
    'CW-REC TARGETED FEE REPAIR V1'
  );
  console.log(
    '========================================'
  );

  const result =
    await pool.query(`
      SELECT
        fp.*,
        c.name AS college
      FROM college_fee_profiles fp
      INNER JOIN colleges c
        ON c.id = fp.college_id
      WHERE fp.college_id = ANY($1::text[])
      ORDER BY c.name
    `, [TARGET_IDS]);

  console.log(
    `Target profiles found: ${result.rows.length}`
  );

  const summary = [];

  for (
    let index = 0;
    index < result.rows.length;
    index++
  ) {
    const row =
      result.rows[index];

    console.log('');
    console.log(
      `[${index + 1}/${result.rows.length}] ${row.college}`
    );

    console.log(
      `    source: ${row.source_url || 'NONE'}`
    );

    const html =
      await fetchPage(
        row.source_url
      );

    if (!html) {
      summary.push({
        college:
          row.college,
        status:
          'FETCH_FAILED',
        annual_fee:
          null
      });

      continue;
    }

    const candidates =
      extractFeeCandidates(
        html
      );

    console.log(
      `    candidates: ${candidates.length}`
    );

    const best =
      chooseBest(
        candidates
      );

    if (!best) {
      console.log(
        '    ⚠️ no safe numeric fee found'
      );

      summary.push({
        college:
          row.college,
        status:
          'NO_SAFE_VALUE',
        annual_fee:
          null
      });

      continue;
    }

    const {
      field,
      storedValue,
      resolvedAnnual,
      confidence
    } =
      best.classification;

    console.log(
      `    candidate field: ${field}`
    );

    console.log(
      `    stored value: ${storedValue}`
    );

    console.log(
      `    resolved annual: ${resolvedAnnual}`
    );

    console.log(
      `    confidence: ${confidence}`
    );

    /*
     * IMPORTANT:
     * Only one normalized numeric field is updated.
     * Existing profile/source metadata remains intact.
     */

    const allowedFields =
      new Set([
        'annual_academic_fee',
        'tuition_fee_per_semester',
        'first_semester_fee',
        'total_course_fee'
      ]);

    if (
      !allowedFields.has(field)
    ) {
      console.log(
        '    ❌ blocked unknown field'
      );

      continue;
    }

    const updateSql = `
      UPDATE college_fee_profiles
      SET
        ${field} = $1,
        verification_status = $2,
        updated_at = NOW()
      WHERE college_id = $3
        AND fee_year = $4
    `;

    await pool.query(
      updateSql,
      [
        storedValue,
        confidence === 'high'
          ? 'high_confidence'
          : 'review_recommended',
        row.college_id,
        row.fee_year
      ]
    );

    console.log(
      '    ✅ profile repaired'
    );

    summary.push({
      college:
        row.college,

      status:
        'UPDATED',

      field,

      stored_value:
        storedValue,

      annual_fee:
        Math.round(
          resolvedAnnual
        ),

      confidence
    });
  }

  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    'TARGETED REPAIR SUMMARY'
  );

  console.log(
    '========================================'
  );

  console.table(summary);

  console.log('');

  console.log(
    'Updated:',
    summary.filter(
      row =>
        row.status ===
        'UPDATED'
    ).length
  );

  console.log(
    'No safe value:',
    summary.filter(
      row =>
        row.status ===
        'NO_SAFE_VALUE'
    ).length
  );

  console.log(
    'Fetch failed:',
    summary.filter(
      row =>
        row.status ===
        'FETCH_FAILED'
    ).length
  );

  console.log('');
  console.log(
    '✅ TARGETED FEE REPAIR COMPLETE'
  );
}

main()
  .catch(error => {
    console.error(
      '\nTARGETED REPAIR ERROR:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
