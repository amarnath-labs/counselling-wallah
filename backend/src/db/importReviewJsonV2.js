import fs from "fs";
import path from "path";
import pg from "pg";
import "dotenv/config";
import { REVIEW_COLLEGE_MAP } from "./reviewCollegeMap.js";

const { Pool } = pg;

const JSON_DIR = path.resolve(process.cwd(), "..", "json");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

/* =========================
   NORMALIZERS
========================= */

function blank(v) {
  return v === null || v === undefined || v === "";
}

function toNumber(v) {
  if (blank(v)) return null;

  if (typeof v === "number") {
    return Number.isFinite(v) ? v : null;
  }

  const text = String(v)
    .replace(/,/g, "")
    .trim();

  const m = text.match(/-?\d+(?:\.\d+)?/);

  if (!m) return null;

  const n = Number(m[0]);

  return Number.isFinite(n)
    ? n
    : null;
}

function toRatingScale(v) {
  if (blank(v)) return null;

  if (typeof v === "number") {
    return Number.isFinite(v)
      ? v
      : null;
  }

  const text = String(v).trim();

  const outOf =
    text.match(
      /out\s+of\s+(\d+(?:\.\d+)?)/i
    );

  if (outOf) {
    return Number(outOf[1]);
  }

  const slash =
    text.match(
      /\/\s*(\d+(?:\.\d+)?)/
    );

  if (slash) {
    return Number(slash[1]);
  }

  const n = Number(text);

  return Number.isFinite(n)
    ? n
    : null;
}

function toInteger(v) {
  if (blank(v)) return null;

  if (typeof v === "number") {
    return Number.isInteger(v)
      ? v
      : null;
  }

  const text = String(v)
    .replace(/,/g, "")
    .trim();

  // Rating/decimal ko count mat banao
  if (
    /^-?\d+\.\d+$/.test(text) ||
    /out\s+of/i.test(text) ||
    /\d+\s*\/\s*\d+/.test(text)
  ) {
    return null;
  }

  // 165
  // 165 reviews
  // 849 published reviews
  const m =
    text.match(/^(\d+)(?:\s+.*)?$/);

  if (!m) return null;

  const n = Number(m[1]);

  return Number.isInteger(n)
    ? n
    : null;
}

function toBoolean(v) {
  if (v === true) return true;
  if (v === false) return false;

  return ["true", "yes", "1"].includes(
    String(v ?? "")
      .trim()
      .toLowerCase()
  );
}

function toDate(v) {
  if (blank(v)) return null;

  const d = new Date(v);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d
    .toISOString()
    .slice(0, 10);
}

function toTimestamp(v) {
  if (blank(v)) return null;

  const d = new Date(v);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d.toISOString();
}

function jsonb(v) {
  return JSON.stringify(
    v ?? null
  );
}

function sourceName(item) {
  return (
    item?.platform ??
    item?.source ??
    null
  );
}

/* =========================
   JSON SHAPE
========================= */

function getCollegeObjects(data) {
  if (Array.isArray(data?.colleges)) {
    return data.colleges;
  }

  return [data];
}

function getReviews(college, data) {
  const rows =
    college?.review_items ??
    data?.review_items ??
    [];

  return Array.isArray(rows)
    ? rows
    : [];
}

function getAggregates(
  college,
  data
) {
  const rows =
    college
      ?.platform_aggregate_observations ??
    college
      ?.platform_aggregate_ratings ??
    data
      ?.platform_aggregate_observations ??
    data
      ?.platform_aggregate_ratings ??
    [];

  return Array.isArray(rows)
    ? rows
    : [];
}

function getPlatformAspects(
  college,
  data
) {
  const rows =
    college
      ?.platform_aspect_ratings ??
    data
      ?.platform_aspect_ratings ??
    [];

  return Array.isArray(rows)
    ? rows
    : [];
}

/* =========================
   SOURCE
========================= */

async function ensureSource(
  client,
  name,
  type,
  url
) {
  if (!name) return null;

  const source =
    String(name).trim();

  const found =
    await client.query(
      `
      SELECT id
      FROM review_sources
      WHERE name = $1
      LIMIT 1
      `,
      [source]
    );

  if (found.rows[0]) {
    return found.rows[0].id;
  }

  const inserted =
    await client.query(
      `
      INSERT INTO review_sources (
        name,
        source_type,
        base_url
      )
      VALUES ($1,$2,$3)
      RETURNING id
      `,
      [
        source,
        type ?? null,
        url ?? null,
      ]
    );

  return inserted.rows[0].id;
}

/* =========================
   REVIEW
========================= */

async function findReview(
  client,
  collegeId,
  sourceId,
  item
) {
  const r =
    await client.query(
      `
      SELECT id
      FROM college_review_items
      WHERE college_id = $1
        AND source_id
            IS NOT DISTINCT FROM $2
        AND COALESCE(source_url,'')
            = COALESCE($3,'')
        AND COALESCE(source_review_id,'')
            = COALESCE($4,'')
        AND COALESCE(author_display_name,'')
            = COALESCE($5,'')
        AND COALESCE(review_title,'')
            = COALESCE($6,'')
        AND COALESCE(review_date::text,'')
            = COALESCE($7,'')
        AND COALESCE(branch_text,'')
            = COALESCE($8,'')
      LIMIT 1
      `,
      [
        collegeId,
        sourceId,
        item?.source_url ?? null,
        item?.source_review_id ?? null,
        item?.author_display_name ?? null,
        item?.review_title ?? null,
        toDate(item?.review_date),
        item?.branch ?? null,
      ]
    );

  return r.rows[0]?.id ?? null;
}

async function insertReview(
  client,
  collegeId,
  item
) {
  const sourceId =
    await ensureSource(
      client,
      sourceName(item),
      item?.source_type,
      item?.source_url
    );

  const oldId =
    await findReview(
      client,
      collegeId,
      sourceId,
      item
    );

  if (oldId) {
    return {
      skipped: true,
      aspects: 0,
    };
  }

  const rating =
    toNumber(item?.rating);

  const ratingScale =
    toRatingScale(
      item?.rating_scale
    );

  const r =
    await client.query(
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
        raw_payload
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,
        $16,$17,$18::numeric,
        $19::numeric,$20,$21::jsonb
      )
      RETURNING id
      `,
      [
        collegeId,
        sourceId,
        item?.source_review_id ?? null,
        item?.source_url ?? null,
        item?.author_display_name ?? null,
        item?.review_title ?? null,
        toDate(item?.review_date),
        toTimestamp(
          item?.observed_at
        ),
        item?.content_type ?? null,
        item?.content_access ?? null,
        item?.evidence_strength ?? null,
        item?.programme_level ?? null,
        item?.course ?? null,
        toBoolean(
          item?.course_verified
        ),
        item?.department ?? null,
        item?.branch ?? null,
        toBoolean(
          item?.branch_verified
        ),
        rating,
        ratingScale,
        item?.duplicate_status ??
          "unknown",
        jsonb(item),
      ]
    );

  const reviewId =
    r.rows[0].id;

  const aspects =
    Array.isArray(
      item?.aspect_evidence
    )
      ? item.aspect_evidence
      : [];

  let insertedAspects = 0;

  for (const a of aspects) {
    if (
      !a?.aspect ||
      !a?.sentiment
    ) {
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
        evidence_summary
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [
        reviewId,
        a.aspect,
        a?.target_branch ?? null,
        a?.scope ?? null,
        a.sentiment,
        a?.evidence_summary ??
          null,
      ]
    );

    insertedAspects++;
  }

  return {
    skipped: false,
    aspects: insertedAspects,
  };
}

/* =========================
   AGGREGATE
========================= */

async function insertAggregate(
  client,
  collegeId,
  item
) {
  const sourceId =
    await ensureSource(
      client,
      sourceName(item),
      "rating_platform",
      item?.source_url
    );

  const aggregateRating =
    toNumber(
      item?.aggregate_rating ??
      item?.rating
    );

  const ratingScale =
    toRatingScale(
      item?.rating_scale ??
      item?.scale
    );

  const reviewCount =
    toInteger(
      item?.review_count ??
      item?.reviews_count ??
      item?.total_reviews
    );

  const verifiedCount =
    toInteger(
      item?.verified_review_count ??
      item?.verified_reviews
    );

  // Safety output
  if (
    item?.review_count != null &&
    reviewCount === null
  ) {
    console.log(
      `   ⚠️ ignored invalid review_count: ${JSON.stringify(
        item.review_count
      )}`
    );
  }

  if (
    item?.verified_review_count != null &&
    verifiedCount === null
  ) {
    console.log(
      `   ⚠️ ignored invalid verified_review_count: ${JSON.stringify(
        item.verified_review_count
      )}`
    );
  }

  const old =
    await client.query(
      `
      SELECT id
      FROM review_aggregate_snapshots
      WHERE college_id = $1
        AND source_id
            IS NOT DISTINCT FROM $2
        AND COALESCE(source_url,'')
            = COALESCE($3,'')
        AND aggregate_rating
            IS NOT DISTINCT FROM $4::numeric
        AND rating_scale
            IS NOT DISTINCT FROM $5::numeric
        AND review_count
            IS NOT DISTINCT FROM $6::integer
        AND verified_review_count
            IS NOT DISTINCT FROM $7::integer
      LIMIT 1
      `,
      [
        collegeId,
        sourceId,
        item?.source_url ?? null,
        aggregateRating,
        ratingScale,
        reviewCount,
        verifiedCount,
      ]
    );

  if (old.rows[0]) {
    return true;
  }

  const observedValues =
    Array.isArray(
      item?.observed_values
    )
      ? item.observed_values
      : [];

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
      raw_payload
    )
    VALUES (
      $1,$2,$3,
      $4::numeric,
      $5::numeric,
      $6::integer,
      $7::integer,
      $8::jsonb,
      $9,$10,$11,$12,$13,
      $14::jsonb
    )
    `,
    [
      collegeId,
      sourceId,
      item?.source_url ?? null,
      aggregateRating,
      ratingScale,
      reviewCount,
      verifiedCount,
      jsonb(observedValues),
      item?.observation_status ??
        null,
      item?.programme_scope ??
        null,
      item?.evidence_strength ??
        null,
      toTimestamp(
        item?.observed_at
      ),
      item?.notes ?? null,
      jsonb(item),
    ]
  );

  return false;
}

/* =========================
   PLATFORM ASPECT
========================= */

async function insertPlatformAspect(
  client,
  collegeId,
  item
) {
  if (!item?.aspect) {
    return true;
  }

  const sourceId =
    await ensureSource(
      client,
      sourceName(item),
      "rating_platform",
      item?.source_url
    );

  const rating =
    toNumber(item?.rating);

  const scale =
    toRatingScale(
      item?.rating_scale
    );

  const old =
    await client.query(
      `
      SELECT id
      FROM review_platform_aspect_ratings
      WHERE college_id = $1
        AND source_id
            IS NOT DISTINCT FROM $2
        AND aspect = $3
        AND rating
            IS NOT DISTINCT FROM $4::numeric
        AND rating_scale
            IS NOT DISTINCT FROM $5::numeric
        AND COALESCE(source_url,'')
            = COALESCE($6,'')
      LIMIT 1
      `,
      [
        collegeId,
        sourceId,
        item.aspect,
        rating,
        scale,
        item?.source_url ?? null,
      ]
    );

  if (old.rows[0]) {
    return true;
  }

  await client.query(
    `
    INSERT INTO review_platform_aspect_ratings (
      college_id,
      source_id,
      aspect,
      rating,
      rating_scale,
      programme_scope,
      source_url,
      observed_at,
      raw_payload
    )
    VALUES (
      $1,$2,$3,
      $4::numeric,
      $5::numeric,
      $6,$7,$8,
      $9::jsonb
    )
    `,
    [
      collegeId,
      sourceId,
      item.aspect,
      rating,
      scale,
      item?.programme_scope ??
        null,
      item?.source_url ?? null,
      toTimestamp(
        item?.observed_at
      ),
      jsonb(item),
    ]
  );

  return false;
}

/* =========================
   MAIN
========================= */

async function main() {
  const client =
    await pool.connect();

  let found = 0;
  let imported = 0;
  let skippedMapping = 0;
  let failed = 0;

  let reviewsInserted = 0;
  let reviewsExisting = 0;
  let aspectsInserted = 0;

  let aggregatesInserted = 0;
  let aggregatesExisting = 0;

  let platformInserted = 0;
  let platformExisting = 0;

  try {
    const files =
      fs.readdirSync(JSON_DIR)
        .filter(
          (x) =>
            x
              .toLowerCase()
              .endsWith(".json")
        )
        .sort();

    found = files.length;

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "NIT REVIEW IMPORT V2"
    );
    console.log(
      "========================================"
    );
    console.log(
      `Files found: ${found}`
    );
    console.log("");

    for (const file of files) {
      const collegeId =
        REVIEW_COLLEGE_MAP[file];

      if (!collegeId) {
        console.log(
          `⏭️ SKIP ${file} - no mapping`
        );

        skippedMapping++;
        continue;
      }

      const dbCollege =
        await client.query(
          `
          SELECT id,name
          FROM colleges
          WHERE id=$1
          LIMIT 1
          `,
          [collegeId]
        );

      if (!dbCollege.rows[0]) {
        console.log(
          `❌ ${file} - college ID missing`
        );

        failed++;
        continue;
      }

      let data;

      try {
        data = JSON.parse(
          fs.readFileSync(
            path.join(
              JSON_DIR,
              file
            ),
            "utf8"
          )
        );
      } catch (e) {
        console.log(
          `❌ ${file} invalid JSON`
        );

        failed++;
        continue;
      }

      console.log(
        "----------------------------------------"
      );
      console.log(
        `FILE: ${file}`
      );
      console.log(
        `COLLEGE: ${dbCollege.rows[0].name}`
      );

      await client.query("BEGIN");

      let fr = 0;
      let fre = 0;
      let fa = 0;
      let fg = 0;
      let fge = 0;
      let fp = 0;
      let fpe = 0;

      try {
        const colleges =
          getCollegeObjects(data);

        for (
          const college of colleges
        ) {
          const reviews =
            getReviews(
              college,
              data
            );

          const aggregates =
            getAggregates(
              college,
              data
            );

          const platforms =
            getPlatformAspects(
              college,
              data
            );

          for (
            let i = 0;
            i < reviews.length;
            i++
          ) {
            try {
              const result =
                await insertReview(
                  client,
                  collegeId,
                  reviews[i]
                );

              if (result.skipped) {
                fre++;
              } else {
                fr++;
                fa +=
                  result.aspects;
              }
            } catch (e) {
              throw new Error(
                `review_items[${i}] -> ${e.message}`
              );
            }
          }

          for (
            let i = 0;
            i < aggregates.length;
            i++
          ) {
            try {
              const exists =
                await insertAggregate(
                  client,
                  collegeId,
                  aggregates[i]
                );

              if (exists) {
                fge++;
              } else {
                fg++;
              }
            } catch (e) {
              console.log(
                "OFFENDING AGGREGATE:"
              );

              console.log(
                JSON.stringify(
                  aggregates[i],
                  null,
                  2
                )
              );

              throw new Error(
                `aggregate[${i}] -> ${e.message}`
              );
            }
          }

          for (
            let i = 0;
            i < platforms.length;
            i++
          ) {
            try {
              const exists =
                await insertPlatformAspect(
                  client,
                  collegeId,
                  platforms[i]
                );

              if (exists) {
                fpe++;
              } else {
                fp++;
              }
            } catch (e) {
              throw new Error(
                `platform_aspect[${i}] -> ${e.message}`
              );
            }
          }
        }

        await client.query(
          "COMMIT"
        );

        imported++;

        reviewsInserted += fr;
        reviewsExisting += fre;
        aspectsInserted += fa;

        aggregatesInserted += fg;
        aggregatesExisting += fge;

        platformInserted += fp;
        platformExisting += fpe;

        console.log(
          "✅ Imported"
        );
        console.log(
          `   Reviews inserted : ${fr}`
        );
        console.log(
          `   Reviews existing : ${fre}`
        );
        console.log(
          `   Aspects inserted : ${fa}`
        );
        console.log(
          `   Aggregates       : ${fg}`
        );
        console.log(
          `   Platform aspects : ${fp}`
        );
      } catch (e) {
        await client.query(
          "ROLLBACK"
        );

        console.log(
          `❌ FAILED ${file}`
        );

        console.log(
          `   ${e.message}`
        );

        failed++;
      }
    }

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "IMPORT COMPLETE"
    );
    console.log(
      "========================================"
    );

    console.log(
      `Files found               : ${found}`
    );
    console.log(
      `Files imported            : ${imported}`
    );
    console.log(
      `Files skipped mapping     : ${skippedMapping}`
    );
    console.log(
      `Files failed              : ${failed}`
    );

    console.log("");

    console.log(
      `Reviews inserted          : ${reviewsInserted}`
    );
    console.log(
      `Reviews existing          : ${reviewsExisting}`
    );
    console.log(
      `Aspect evidence inserted  : ${aspectsInserted}`
    );

    console.log("");

    console.log(
      `Aggregates inserted       : ${aggregatesInserted}`
    );
    console.log(
      `Aggregates existing       : ${aggregatesExisting}`
    );

    console.log("");

    console.log(
      `Platform aspects inserted : ${platformInserted}`
    );
    console.log(
      `Platform aspects existing : ${platformExisting}`
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main();
