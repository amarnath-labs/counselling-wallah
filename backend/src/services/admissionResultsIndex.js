import { pool } from '../db/pool.js';

const INDEX_TTL_MS = Number(process.env.ADMISSION_INDEX_TTL_MS || 15 * 60 * 1000);
const INDEX_MAX_BUCKETS = Number(process.env.ADMISSION_INDEX_MAX_BUCKETS || 64);
const bucketCache = new Map();
const bucketInFlight = new Map();

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function isJeeMainInstitute(collegeName, collegeType) {
  const name = normalize(collegeName);
  const type = normalize(collegeType);
  if (
    type === 'iit' ||
    name.includes('indian institute of technology') ||
    name.startsWith('iit ')
  ) return false;
  return (
    type === 'nit' || type === 'iiit' || type === 'gfti' || type === 'gftis' ||
    name.startsWith('national institute of technology') ||
    name.includes('indian institute of information technology')
  );
}

function makeBucketKey(v) {
  return [v.examId, v.year, v.round, v.category, v.requestedQuota || '', v.requestedGender || '', v.homeState || ''].join('|');
}

function touchBucket(key, entry) {
  bucketCache.delete(key);
  bucketCache.set(key, entry);
}

function trimBucketCache() {
  while (bucketCache.size > INDEX_MAX_BUCKETS) {
    const k = bucketCache.keys().next().value;
    if (k === undefined) break;
    bucketCache.delete(k);
  }
}

function lowerBoundByClosingRank(rows, rank) {
  let low = 0, high = rows.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const cr = Number(rows[mid].closingRank);
    if (cr < rank) low = mid + 1;
    else high = mid;
  }
  return low;
}

function dedupeLegacyWindow(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = [row.college_id, row.branch_id, row.year, row.round, row.category, row.quota, row.gender].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function loadBucket(v) {
  const params = [v.year, v.round, v.category];
  let paramIndex = 4;
  let query = `
    SELECT
      c.id AS college_id,
      c.name AS college_name,
      c.city,
      c.state,
      c.type,
      b.id AS branch_id,
      b.name AS branch_name,
      co.year,
      co.round,
      co.category,
      co.quota,
      co.gender,
      co.opening_rank AS "openingRank",
      co.closing_rank AS "closingRank",
      co.source_label AS source,
      co.is_verified AS "isVerified",
      co.verification_status AS "verificationStatus",
      co.source_url AS "sourceUrl",
      co.retrieved_at AS "retrievedAt"
    FROM cutoffs co
    INNER JOIN branches b ON b.id = co.branch_id
    INNER JOIN colleges c ON c.id = b.college_id
    WHERE co.year = $1
      AND co.round = $2
      AND co.category = $3
      AND co.closing_rank IS NOT NULL
  `;

  if (v.examId === 'jee-main') {
    query += `
      AND (
        LOWER(c.type) IN ('nit','iiit','gfti','gftis')
        OR LOWER(c.name) LIKE 'national institute of technology%'
        OR LOWER(c.name) LIKE '%indian institute of information technology%'
      )
      AND LOWER(c.type) <> 'iit'
      AND LOWER(c.name) NOT LIKE 'indian institute of technology%'
      AND LOWER(c.name) NOT LIKE 'iit %'
    `;
  }

  if (v.examId === 'jee-advanced') {
    query += `
      AND (
        LOWER(c.type) = 'iit'
        OR LOWER(c.name) LIKE 'indian institute of technology%'
        OR LOWER(c.name) LIKE 'iit %'
      )
    `;
  }

  if (v.examId === 'uptac') {
    query += `
      AND co.counselling_type = 'UPTAC'
      AND co.verification_status = 'VERIFIED'
      AND co.is_verified = true
    `;
  }

  if (v.requestedGender) {
    const gender = normalize(v.requestedGender);
    if (v.examId === 'uptac') {
      if (gender.includes('female')) {
        query += ` AND (LOWER(co.gender) LIKE '%female%' OR LOWER(co.gender) LIKE '%both male and female%') `;
      } else if (gender.includes('male')) {
        query += ` AND LOWER(TRIM(co.gender)) = 'both male and female seats' `;
      } else {
        query += ` AND (LOWER(TRIM(co.gender)) = 'female' OR LOWER(TRIM(co.gender)) = 'both male and female seats') `;
      }
    } else {
      if (gender.includes('female')) {
        query += ` AND co.gender IN ('Female-only (including Supernumerary)','Gender-Neutral') `;
      } else {
        query += ` AND co.gender = 'Gender-Neutral' `;
      }
    }
  }

  if (v.requestedQuota) {
    params.push(v.requestedQuota);
    const p = `$${paramIndex++}`;
    query += ` AND co.quota = ${p} `;
  } else if (v.examId === 'jee-main' && v.homeState) {
    params.push(v.homeState);
    const p = `$${paramIndex++}`;
    query += `
      AND (
        UPPER(TRIM(co.quota)) = 'AI'
        OR (UPPER(TRIM(co.quota)) = 'HS' AND LOWER(TRIM(c.state)) = LOWER(TRIM(${p})))
        OR (UPPER(TRIM(co.quota)) = 'OS' AND LOWER(TRIM(c.state)) <> LOWER(TRIM(${p})))
      )
    `;
  }

  query += ` ORDER BY co.closing_rank ASC, c.name ASC, b.name ASC `;
  const { rows } = await pool.query(query, params);
  return rows;
}

async function refreshBucket(v, key) {
  const existing = bucketInFlight.get(key);
  if (existing) return existing;
  const promise = (async () => {
    const rows = await loadBucket(v);
    const entry = { rows, createdAt: Date.now() };
    touchBucket(key, entry);
    trimBucketCache();
    return entry;
  })();
  bucketInFlight.set(key, promise);
  try { return await promise; }
  finally { if (bucketInFlight.get(key) === promise) bucketInFlight.delete(key); }
}

async function getBucket(v) {
  const key = makeBucketKey(v);
  const entry = bucketCache.get(key);
  if (entry) {
    touchBucket(key, entry);
    const age = Date.now() - entry.createdAt;
    if (age > INDEX_TTL_MS) {
      void refreshBucket(v, key).catch((e) => console.error('[ADMISSION INDEX REFRESH ERROR]', e));
      return { entry, source: 'STALE-INDEX' };
    }
    return { entry, source: 'INDEX' };
  }
  return { entry: await refreshBucket(v, key), source: 'INDEX-BUILD' };
}

export async function getAdmissionResultsFromIndex({
  examId, rank, year, round, category,
  requestedQuota, requestedGender, homeState, requestedLimit,
}) {
  const values = { examId, year, round, category, requestedQuota, requestedGender, homeState };
  const { entry, source } = await getBucket(values);
  const start = lowerBoundByClosingRank(entry.rows, rank);
  const candidateRows = entry.rows.slice(start, start + 500);
  const uniqueRows = dedupeLegacyWindow(candidateRows);
  let finalRows = uniqueRows;
  if (examId === 'jee-main') {
    finalRows = uniqueRows.filter((row) => isJeeMainInstitute(row.college_name, row.type));
  }
  const totalCount = finalRows.length;
  const responseRows = requestedLimit ? finalRows.slice(0, requestedLimit) : finalRows;
  return {
    source,
    payload: {
      data: responseRows,
      meta: {
        examId, rank, year, round, category,
        quota: requestedQuota,
        gender: requestedGender,
        homeState,
        count: responseRows.length,
        totalCount,
        limit: requestedLimit,
      },
    },
  };
}

export async function prewarmAdmissionResultsIndex() {
  const warmups = [{
    examId: 'uptac', year: 2025, round: '1', category: 'OPEN',
    requestedQuota: null, requestedGender: null, homeState: null,
  }];
  for (const v of warmups) {
    try {
      await refreshBucket(v, makeBucketKey(v));
      console.log('[ADMISSION INDEX WARMED]', makeBucketKey(v));
    } catch (e) {
      console.error('[ADMISSION INDEX WARM ERROR]', e);
    }
  }
}

export function getAdmissionIndexStats() {
  return { buckets: bucketCache.size, inFlight: bucketInFlight.size, maxBuckets: INDEX_MAX_BUCKETS, ttlMs: INDEX_TTL_MS };
}
