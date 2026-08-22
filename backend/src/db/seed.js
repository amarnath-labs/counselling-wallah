import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(__dirname, '../../../database/seed/demo-data.json');

const seed = JSON.parse(await fs.readFile(seedPath, 'utf8'));

async function upsertExam(client, exam) {
  await client.query(
    `INSERT INTO exams (id, name, description, active)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, active = EXCLUDED.active, updated_at = NOW()`,
    [exam.id, exam.name, exam.desc, exam.active]
  );
}

async function upsertCollege(client, college) {
  await client.query(
    `INSERT INTO colleges (id, name, city, state, type, established, website, portal)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city, state=EXCLUDED.state,
       type=EXCLUDED.type, established=EXCLUDED.established, website=EXCLUDED.website, portal=EXCLUDED.portal, updated_at=NOW()`,
    [college.id, college.name, college.city, college.state, college.type, college.established, college.website, college.portal]
  );
}

async function upsertBranch(client, college, branch) {
  const branchResult = await client.query(
    `INSERT INTO branches (college_id, name, fees, median_package, average_package, highest_package, placement_rate)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (college_id, name) DO UPDATE SET fees=EXCLUDED.fees,
       median_package=EXCLUDED.median_package, average_package=EXCLUDED.average_package,
       highest_package=EXCLUDED.highest_package, placement_rate=EXCLUDED.placement_rate, updated_at=NOW()
     RETURNING id`,
    [college.id, branch.name, branch.fees ?? null, branch.median ?? null, branch.average ?? null, branch.highest ?? null, branch.placement ?? null]
  );
  const branchId = branchResult.rows[0].id;

  const sourceLabel = branch.source ?? (branch.sourced === false ? 'Prototype trend-based estimate' : 'Prototype demo data');
  const sourceResult = await client.query(
    `INSERT INTO data_sources (label, source_type, is_verified)
     VALUES ($1, 'demo', FALSE)
     RETURNING id`,
    [sourceLabel]
  );
  const sourceId = sourceResult.rows[0].id;

  const cutoff2025 = {
    year: 2025,
    round: branch.round ?? 'Round 6 (final)',
    closingRank: branch.closingRank,
  };
  await upsertCutoff(client, branchId, cutoff2025, sourceLabel, sourceId, branch.sourced === true);

  if (typeof branch.closingRank2026 === 'number') {
    await upsertCutoff(client, branchId, {
      year: 2026,
      round: branch.round2026 ?? 'Round (see note)',
      closingRank: branch.closingRank2026,
    }, sourceLabel, sourceId, branch.sourced !== false);
  }
}

async function upsertCutoff(client, branchId, cutoff, sourceLabel, sourceId, isVerified) {
  await client.query(
    `INSERT INTO cutoffs (branch_id, year, round, category, quota, gender, closing_rank, source_label, is_verified, data_source_id)
     VALUES ($1,$2,$3,'OPEN','OS','Gender-Neutral',$4,$5,$6,$7)
     ON CONFLICT (branch_id, year, round, category, quota, gender) DO UPDATE SET
       closing_rank=EXCLUDED.closing_rank, source_label=EXCLUDED.source_label,
       is_verified=EXCLUDED.is_verified, data_source_id=EXCLUDED.data_source_id`,
    [branchId, cutoff.year, cutoff.round, cutoff.closingRank, sourceLabel, isVerified, sourceId]
  );
}

async function upsertEvents(client) {
  await client.query('DELETE FROM counselling_events');
  const examId = 'jee-main';
  for (const event of seed.counsellingEvents) {
    await client.query(
      `INSERT INTO counselling_events (name, event_date_text, status, exam_id, is_demo)
       VALUES ($1,$2,$3,$4,TRUE)`,
      [event.name, event.date, event.status, examId]
    );
  }
}

const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const exam of seed.exams) await upsertExam(client, exam);
  for (const college of seed.colleges) {
    await upsertCollege(client, college);
    for (const branch of college.branches) await upsertBranch(client, college, branch);
  }
  await upsertEvents(client);
  await client.query('COMMIT');
  console.log(`Seed completed: ${seed.exams.length} exams, ${seed.colleges.length} colleges.`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
