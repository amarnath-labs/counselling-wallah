import fs from 'fs';
import pg from 'pg';

const { Client } = pg;

const productionUrl = process.env.PRODUCTION_DATABASE_URL;

if (!productionUrl) {
  console.error('STOPPED: PRODUCTION_DATABASE_URL is not set.');
  process.exit(1);
}

const seed = JSON.parse(
  fs.readFileSync(
    './cwrec-review-v3-seed.json',
    'utf8'
  )
);

const client = new Client({
  connectionString: productionUrl,
  ssl: { rejectUnauthorized: false }
});

const sourceIdMap = new Map();
const reviewItemIdMap = new Map();

function sourceKey(row) {
  return String(row.name || '').trim().toLowerCase();
}

function reviewNaturalKey(row) {
  return JSON.stringify([
    row.college_id || null,
    row.source_review_id || null,
    row.source_url || null,
    row.author_display_name || null,
    row.review_date || null,
    row.review_title || null
  ]);
}

async function getOrCreateSource(row) {
  const key = sourceKey(row);

  const existing = await client.query(
    `
      SELECT id
      FROM review_sources
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
    `,
    [row.name]
  );

  if (existing.rowCount > 0) {
    sourceIdMap.set(row.id, existing.rows[0].id);
    return {
      id: existing.rows[0].id,
      inserted: false
    };
  }

  const inserted = await client.query(
    `
      INSERT INTO review_sources (
        name,
        source_type,
        base_url,
        created_at
      )
      VALUES ($1,$2,$3,COALESCE($4,NOW()))
      RETURNING id
    `,
    [
      row.name,
      row.source_type,
      row.base_url,
      row.created_at
    ]
  );

  sourceIdMap.set(row.id, inserted.rows[0].id);

  return {
    id: inserted.rows[0].id,
    inserted: true
  };
}

async function findExistingReviewItem(row, mappedSourceId) {
  if (row.source_review_id) {
    const result = await client.query(
      `
        SELECT id
        FROM college_review_items
        WHERE college_id = $1
          AND source_id IS NOT DISTINCT FROM $2
          AND source_review_id = $3
        LIMIT 1
      `,
      [
        row.college_id,
        mappedSourceId,
        row.source_review_id
      ]
    );

    if (result.rowCount > 0) {
      return result.rows[0].id;
    }
  }

  const result = await client.query(
    `
      SELECT id
      FROM college_review_items
      WHERE college_id = $1
        AND source_id IS NOT DISTINCT FROM $2
        AND source_url IS NOT DISTINCT FROM $3
        AND author_display_name IS NOT DISTINCT FROM $4
        AND review_date IS NOT DISTINCT FROM $5
        AND review_title IS NOT DISTINCT FROM $6
      LIMIT 1
    `,
    [
      row.college_id,
      mappedSourceId,
      row.source_url,
      row.author_display_name,
      row.review_date,
      row.review_title
    ]
  );

  return result.rowCount > 0
    ? result.rows[0].id
    : null;
}

async function insertReviewItem(row, mappedSourceId) {
  const result = await client.query(
    `
      INSERT INTO college_review_items (
        college_id,
        source_id,
        source_review_id,
        source_url,
        author_display_name,
        review_title,
        review_date,
        observed_at,
        content_type,
        content_access,
        evidence_strength,
        programme_level,
        course,
        course_verified,
        department,
        branch_text,
        branch_verified,
        rating,
        rating_scale,
        duplicate_status,
        duplicate_of,
        raw_payload,
        created_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        NULL,$21,COALESCE($22,NOW())
      )
      RETURNING id
    `,
    [
      row.college_id,
      mappedSourceId,
      row.source_review_id,
      row.source_url,
      row.author_display_name,
      row.review_title,
      row.review_date,
      row.observed_at,
      row.content_type,
      row.content_access,
      row.evidence_strength,
      row.programme_level,
      row.course,
      row.course_verified ?? false,
      row.department,
      row.branch_text,
      row.branch_verified ?? false,
      row.rating,
      row.rating_scale,
      row.duplicate_status || 'unknown',
      row.raw_payload,
      row.created_at
    ]
  );

  return result.rows[0].id;
}

async function aspectExists(row, mappedReviewItemId) {
  const result = await client.query(
    `
      SELECT 1
      FROM review_aspect_sentiments
      WHERE review_item_id = $1
        AND aspect = $2
        AND target_branch IS NOT DISTINCT FROM $3
        AND scope IS NOT DISTINCT FROM $4
        AND sentiment = $5
        AND evidence_summary IS NOT DISTINCT FROM $6
      LIMIT 1
    `,
    [
      mappedReviewItemId,
      row.aspect,
      row.target_branch,
      row.scope,
      row.sentiment,
      row.evidence_summary
    ]
  );

  return result.rowCount > 0;
}

async function aggregateExists(row, mappedSourceId) {
  const result = await client.query(
    `
      SELECT 1
      FROM review_aggregate_snapshots
      WHERE college_id = $1
        AND source_id IS NOT DISTINCT FROM $2
        AND source_url IS NOT DISTINCT FROM $3
        AND aggregate_rating IS NOT DISTINCT FROM $4
        AND review_count IS NOT DISTINCT FROM $5
        AND observed_at IS NOT DISTINCT FROM $6
      LIMIT 1
    `,
    [
      row.college_id,
      mappedSourceId,
      row.source_url,
      row.aggregate_rating,
      row.review_count,
      row.observed_at
    ]
  );

  return result.rowCount > 0;
}

try {
  await client.connect();

  const info = await client.query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      inet_server_addr()::text AS server_ip,
      inet_server_port() AS server_port
  `);

  console.log('');
  console.log('========================================');
  console.log('TARGET DATABASE');
  console.log('========================================');
  console.log(info.rows[0]);

  const ip = String(info.rows[0].server_ip || '');

  if (
    ip === '::1' ||
    ip === '::1/128' ||
    ip === '127.0.0.1'
  ) {
    throw new Error(
      'REFUSED: production importer pointed at localhost.'
    );
  }

  await client.query('BEGIN');

  const stats = {
    sourcesInserted: 0,
    sourcesSkipped: 0,
    itemsInserted: 0,
    itemsSkipped: 0,
    duplicateLinksUpdated: 0,
    aspectsInserted: 0,
    aspectsSkipped: 0,
    aggregatesInserted: 0,
    aggregatesSkipped: 0
  };

  /*
   * 1. SOURCES
   */
  console.log('');
  console.log('Importing review_sources...');

  for (const row of seed.review_sources || []) {
    const result = await getOrCreateSource(row);

    if (result.inserted) {
      stats.sourcesInserted++;
    } else {
      stats.sourcesSkipped++;
    }
  }

  /*
   * 2. REVIEW ITEMS
   * duplicate_of intentionally handled later.
   */
  console.log('Importing college_review_items...');

  for (const row of seed.college_review_items || []) {
    const mappedSourceId =
      row.source_id == null
        ? null
        : sourceIdMap.get(row.source_id);

    if (
      row.source_id != null &&
      mappedSourceId == null
    ) {
      throw new Error(
        `Missing source mapping for local source_id=${row.source_id}`
      );
    }

    let productionId =
      await findExistingReviewItem(
        row,
        mappedSourceId
      );

    if (productionId) {
      stats.itemsSkipped++;
    } else {
      productionId =
        await insertReviewItem(
          row,
          mappedSourceId
        );

      stats.itemsInserted++;
    }

    reviewItemIdMap.set(
      row.id,
      productionId
    );
  }

  /*
   * 3. duplicate_of relationships
   */
  console.log('Restoring duplicate relationships...');

  for (const row of seed.college_review_items || []) {
    if (row.duplicate_of == null) {
      continue;
    }

    const productionItemId =
      reviewItemIdMap.get(row.id);

    const productionDuplicateOf =
      reviewItemIdMap.get(row.duplicate_of);

    if (
      !productionItemId ||
      !productionDuplicateOf
    ) {
      throw new Error(
        `Missing duplicate mapping: item=${row.id}, duplicate_of=${row.duplicate_of}`
      );
    }

    await client.query(
      `
        UPDATE college_review_items
        SET duplicate_of = $1
        WHERE id = $2
          AND duplicate_of IS DISTINCT FROM $1
      `,
      [
        productionDuplicateOf,
        productionItemId
      ]
    );

    stats.duplicateLinksUpdated++;
  }

  /*
   * 4. ASPECT SENTIMENTS
   */
  console.log('Importing review_aspect_sentiments...');

  for (
    const row
    of seed.review_aspect_sentiments || []
  ) {
    const mappedReviewItemId =
      reviewItemIdMap.get(
        row.review_item_id
      );

    if (!mappedReviewItemId) {
      throw new Error(
        `Missing review item mapping for aspect ${row.id}`
      );
    }

    if (
      await aspectExists(
        row,
        mappedReviewItemId
      )
    ) {
      stats.aspectsSkipped++;
      continue;
    }

    await client.query(
      `
        INSERT INTO review_aspect_sentiments (
          review_item_id,
          aspect,
          target_branch,
          scope,
          sentiment,
          evidence_summary,
          created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,COALESCE($7,NOW())
        )
      `,
      [
        mappedReviewItemId,
        row.aspect,
        row.target_branch,
        row.scope,
        row.sentiment,
        row.evidence_summary,
        row.created_at
      ]
    );

    stats.aspectsInserted++;
  }

  /*
   * 5. AGGREGATE SNAPSHOTS
   */
  console.log('Importing review_aggregate_snapshots...');

  for (
    const row
    of seed.review_aggregate_snapshots || []
  ) {
    const mappedSourceId =
      row.source_id == null
        ? null
        : sourceIdMap.get(row.source_id);

    if (
      row.source_id != null &&
      mappedSourceId == null
    ) {
      throw new Error(
        `Missing aggregate source mapping for source_id=${row.source_id}`
      );
    }

    if (
      await aggregateExists(
        row,
        mappedSourceId
      )
    ) {
      stats.aggregatesSkipped++;
      continue;
    }

    await client.query(
      `
        INSERT INTO review_aggregate_snapshots (
          college_id,
          source_id,
          source_url,
          aggregate_rating,
          rating_scale,
          review_count,
          verified_review_count,
          observed_values,
          observation_status,
          programme_scope,
          evidence_strength,
          observed_at,
          notes,
          raw_payload,
          created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,COALESCE($15,NOW())
        )
      `,
      [
        row.college_id,
        mappedSourceId,
        row.source_url,
        row.aggregate_rating,
        row.rating_scale,
        row.review_count,
        row.verified_review_count,
        row.observed_values,
        row.observation_status,
        row.programme_scope,
        row.evidence_strength,
        row.observed_at,
        row.notes,
        row.raw_payload,
        row.created_at
      ]
    );

    stats.aggregatesInserted++;
  }

  await client.query('COMMIT');

  console.log('');
  console.log('========================================');
  console.log('REVIEW V3 IMPORT COMPLETE');
  console.log('========================================');
  console.table(stats);

  console.log('');
  console.log('Production counts:');

  for (const table of [
    'review_sources',
    'college_review_items',
    'review_aspect_sentiments',
    'review_aggregate_snapshots'
  ]) {
    const { rows } = await client.query(
      `SELECT COUNT(*)::int AS count FROM ${table}`
    );

    console.log(
      `${table}: ${rows[0].count}`
    );
  }

} catch (error) {
  try {
    await client.query('ROLLBACK');
  } catch {}

  console.error('');
  console.error(
    'IMPORT FAILED:',
    error.message
  );

  process.exitCode = 1;

} finally {
  await client.end();
}
