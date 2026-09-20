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

/* =========================================================
   NORMALIZATION HELPERS
========================================================= */

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value)
    .replace(/,/g, "")
    .trim();

  const match = text.match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const number = Number(match[0]);

  return Number.isFinite(number)
    ? number
    : null;
}

function toRatingScale(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  const text = String(value)
    .replace(/,/g, "")
    .trim();

  // "out of 5" -> 5
  // "out of 10" -> 10
  const outOfMatch = text.match(
    /out\s+of\s+(\d+(?:\.\d+)?)/i
  );

  if (outOfMatch) {
    return Number(outOfMatch[1]);
  }

  // "4.1/5" -> 5
  const slashMatch = text.match(
    /\/\s*(\d+(?:\.\d+)?)/
  );

  if (slashMatch) {
    return Number(slashMatch[1]);
  }

  return toNumber(value);
}

function toInteger(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value
      : null;
  }

  const text = String(value)
    .replace(/,/g, "")
    .trim();

  // Accept:
  // "165"
  // "165 reviews"
  // "849 published reviews"
  //
  // Reject:
  // "3.7"
  // "4.1/5"
  // "out of 5"

  const match = text.match(
    /^(\d+)(?:\s+[A-Za-z].*)?$/
  );

  if (!match) {
    return null;
  }

  const number = Number(match[1]);

  return Number.isInteger(number)
    ? number
    : null;
}

function toBoolean(value) {
  if (value === true) return true;
  if (value === false) return false;

  if (
    String(value).toLowerCase() === "true"
  ) {
    return true;
  }

  return false;
}

function toDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function toTimestamp(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function safeJson(value, fallback = null) {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return value;
}

/* =========================================================
   JSON SHAPE HELPERS
========================================================= */

function getCollegeObjects(data) {
  if (Array.isArray(data?.colleges)) {
    return data.colleges;
  }

  return [data];
}

function getReviewItems(college, data) {
  return (
    college?.review_items ??
    data?.review_items ??
    []
  );
}

function getAggregateItems(college, data) {
  return (
    college?.platform_aggregate_observations ??
    college?.platform_aggregate_ratings ??
    data?.platform_aggregate_observations ??
    data?.platform_aggregate_ratings ??
    []
  );
}

function getPlatformAspectRatings(
  college,
  data
) {
  return (
    college?.platform_aspect_ratings ??
    data?.platform_aspect_ratings ??
    []
  );
}

/* =========================================================
   SOURCE
========================================================= */

async function ensureSource(
  client,
  name,
  sourceType,
  sourceUrl
) {
  if (!name) {
    return null;
  }

  const existing =
    await client.query(
      `
        SELECT id
        FROM review_sources
        WHERE name = $1
        LIMIT 1
      `,
      [String(name)]
    );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const inserted =
    await client.query(
      `
        INSERT INTO review_sources (
          name,
          source_type,
          base_url
        )
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [
        String(name),
        sourceType
          ? String(sourceType)
          : null,
        sourceUrl
          ? String(sourceUrl)
          : null,
      ]
    );

  return inserted.rows[0].id;
}

/* =========================================================
   REVIEW DEDUPE
========================================================= */

async function reviewAlreadyExists(
  client,
  collegeId,
  sourceId,
  item
) {
  const result =
    await client.query(
      `
        SELECT id
        FROM college_review_items
        WHERE college_id = $1
          AND COALESCE(source_id, 0)
              = COALESCE($2, 0)
          AND COALESCE(source_url, '')
              = COALESCE($3, '')
          AND COALESCE(source_review_id, '')
              = COALESCE($4, '')
          AND COALESCE(author_display_name, '')
              = COALESCE($5, '')
          AND COALESCE(review_title, '')
              = COALESCE($6, '')
          AND COALESCE(review_date::text, '')
              = COALESCE($7, '')
          AND COALESCE(branch_text, '')
              = COALESCE($8, '')
          AND COALESCE(programme_level, '')
              = COALESCE($9, '')
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
        item?.programme_level ?? null,
      ]
    );

  return result.rows[0]?.id ?? null;
}

/* =========================================================
   REVIEW ITEM
========================================================= */

async function insertReviewItem(
  client,
  collegeId,
  item
) {
  const sourceId =
    await ensureSource(
      client,
      item?.source,
      item?.source_type,
      item?.source_url
    );

  const existingId =
    await reviewAlreadyExists(
      client,
      collegeId,
      sourceId,
      item
    );

  if (existingId) {
    return {
      id: existingId,
      skipped: true,
      aspectsInserted: 0,
    };
  }

  const inserted =
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
          $16,$17,$18,$19,$20,
          $21
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
        toTimestamp(item?.observed_at),

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

        toNumber(
          item?.rating
        ),

        toRatingScale(
          item?.rating_scale
        ),

        item?.duplicate_status ??
          "unknown",

        safeJson(item, {}),
      ]
    );

  const reviewItemId =
    inserted.rows[0].id;

  const aspects =
    Array.isArray(
      item?.aspect_evidence
    )
      ? item.aspect_evidence
      : [];

  let aspectsInserted = 0;

  for (const aspect of aspects) {
    if (
      !aspect?.aspect ||
      !aspect?.sentiment
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
        VALUES (
          $1,$2,$3,$4,$5,$6
        )
      `,
      [
        reviewItemId,
        String(aspect.aspect),
        aspect?.target_branch ??
          null,
        aspect?.scope ?? null,
        String(aspect.sentiment),
        aspect?.evidence_summary ??
          null,
      ]
    );

    aspectsInserted++;
  }

  return {
    id: reviewItemId,
    skipped: false,
    aspectsInserted,
  };
}

/* =========================================================
   AGGREGATE SNAPSHOT
========================================================= */

async function insertAggregate(
  client,
  collegeId,
  item
) {
  const sourceId =
    await ensureSource(
      client,
      item?.platform,
      "rating_platform",
      item?.source_url
    );

  const aggregateRating =
    toNumber(
      item?.aggregate_rating
    );

  const ratingScale =
    toRatingScale(
      item?.rating_scale
    );

  const reviewCount =
    toInteger(
      item?.review_count
    );

  const verifiedReviewCount =
    toInteger(
      item?.verified_review_count
    );

  const existing =
    await client.query(
      `
        SELECT id
        FROM review_aggregate_snapshots
        WHERE college_id = $1
          AND COALESCE(source_id, 0)
              = COALESCE($2, 0)
          AND COALESCE(source_url, '')
              = COALESCE($3, '')
          AND COALESCE(
                aggregate_rating,
                -1
              )
              = COALESCE($4, -1)
          AND COALESCE(
                rating_scale,
                -1
              )
              = COALESCE($5, -1)
          AND COALESCE(
                review_count,
                -1
              )
              = COALESCE($6, -1)
          AND COALESCE(
                verified_review_count,
                -1
              )
              = COALESCE($7, -1)
        LIMIT 1
      `,
      [
        collegeId,
        sourceId,
        item?.source_url ?? null,
        aggregateRating,
        ratingScale,
        reviewCount,
        verifiedReviewCount,
      ]
    );

  if (existing.rows[0]) {
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
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,$14
      )
    `,
    [
      collegeId,
      sourceId,
      item?.source_url ?? null,

      aggregateRating,
      ratingScale,
      reviewCount,
      verifiedReviewCount,

      observedValues,

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

      safeJson(item, {}),
    ]
  );

  return false;
}

/* =========================================================
   PLATFORM ASPECT RATINGS
========================================================= */

async function insertPlatformAspect(
  client,
  collegeId,
  item
) {
  if (!item?.aspect) {
    return {
      skipped: true,
      reason: "missing-aspect",
    };
  }

  const sourceId =
    await ensureSource(
      client,
      item?.platform,
      "rating_platform",
      item?.source_url
    );

  const rating =
    toNumber(
      item?.rating
    );

  const ratingScale =
    toRatingScale(
      item?.rating_scale
    );

  const existing =
    await client.query(
      `
        SELECT id
        FROM review_platform_aspect_ratings
        WHERE college_id = $1
          AND COALESCE(source_id, 0)
              = COALESCE($2, 0)
          AND COALESCE(aspect, '')
              = COALESCE($3, '')
          AND COALESCE(rating, -1)
              = COALESCE($4, -1)
          AND COALESCE(rating_scale, -1)
              = COALESCE($5, -1)
          AND COALESCE(source_url, '')
              = COALESCE($6, '')
          AND COALESCE(
                programme_scope,
                ''
              )
              = COALESCE($7, '')
        LIMIT 1
      `,
      [
        collegeId,
        sourceId,
        item?.aspect ?? null,
        rating,
        ratingScale,
        item?.source_url ?? null,
        item?.programme_scope ??
          null,
      ]
    );

  if (existing.rows[0]) {
    return {
      skipped: true,
      reason: "existing",
    };
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
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9
      )
    `,
    [
      collegeId,
      sourceId,
      item?.aspect ?? null,
      rating,
      ratingScale,
      item?.programme_scope ??
        null,
      item?.source_url ?? null,
      toTimestamp(
        item?.observed_at
      ),
      safeJson(item, {}),
    ]
  );

  return {
    skipped: false,
    reason: null,
  };
}

/* =========================================================
   MAIN IMPORT
========================================================= */

async function main() {
  const client =
    await pool.connect();

  let totalFiles = 0;
  let importedFiles = 0;
  let skippedFiles = 0;
  let failedFiles = 0;

  let insertedReviews = 0;
  let skippedReviews = 0;

  let insertedAspects = 0;

  let insertedAggregates = 0;
  let skippedAggregates = 0;

  let insertedPlatformAspects = 0;
  let skippedPlatformAspects = 0;

  try {
    if (
      !fs.existsSync(JSON_DIR)
    ) {
      throw new Error(
        `JSON folder not found: ${JSON_DIR}`
      );
    }

    const files =
      fs
        .readdirSync(JSON_DIR)
        .filter((name) =>
          name
            .toLowerCase()
            .endsWith(".json")
        )
        .sort();

    totalFiles = files.length;

    console.log("");
    console.log(
      "========================================"
    );
    console.log(
      "NIT REVIEW JSON IMPORT"
    );
    console.log(
      "========================================"
    );

    console.log(
      `JSON folder: ${JSON_DIR}`
    );

    console.log(
      `Files found: ${files.length}`
    );

    console.log("");

    for (const file of files) {
      const collegeId =
        REVIEW_COLLEGE_MAP[file];

      if (!collegeId) {
        console.log(
          `⏭️  SKIP ${file} - no verified mapping`
        );

        skippedFiles++;
        continue;
      }

      const collegeCheck =
        await client.query(
          `
            SELECT id, name
            FROM colleges
            WHERE id = $1
            LIMIT 1
          `,
          [collegeId]
        );

      if (
        !collegeCheck.rows[0]
      ) {
        console.log(
          `❌ SKIP ${file} - mapped college ID not found: ${collegeId}`
        );

        skippedFiles++;
        continue;
      }

      const fullPath =
        path.join(
          JSON_DIR,
          file
        );

      let data;

      try {
        const raw =
          fs.readFileSync(
            fullPath,
            "utf8"
          );

        data =
          JSON.parse(raw);
      } catch (error) {
        console.log(
          `❌ FAILED ${file} - invalid JSON`
        );

        console.log(
          error.message
        );

        failedFiles++;
        continue;
      }

      const collegeObjects =
        getCollegeObjects(data);

      console.log(
        "----------------------------------------"
      );

      console.log(
        `FILE: ${file}`
      );

      console.log(
        `COLLEGE: ${collegeCheck.rows[0].name}`
      );

      console.log(
        `DB ID: ${collegeId}`
      );

      await client.query(
        "BEGIN"
      );

      let fileInsertedReviews = 0;
      let fileSkippedReviews = 0;
      let fileInsertedAspects = 0;
      let fileInsertedAggregates = 0;
      let fileSkippedAggregates = 0;
      let fileInsertedPlatformAspects = 0;
      let fileSkippedPlatformAspects = 0;

      try {
        for (
          const college of
          collegeObjects
        ) {
          const reviews =
            getReviewItems(
              college,
              data
            );

          const aggregates =
            getAggregateItems(
              college,
              data
            );

          const platformAspects =
            getPlatformAspectRatings(
              college,
              data
            );

          for (
            const review of
            reviews
          ) {
            const result =
              await insertReviewItem(
                client,
                collegeId,
                review
              );

            if (
              result.skipped
            ) {
              fileSkippedReviews++;
            } else {
              fileInsertedReviews++;
              fileInsertedAspects +=
                result.aspectsInserted;
            }
          }

          for (
            const aggregate of
            aggregates
          ) {
            const skipped =
              await insertAggregate(
                client,
                collegeId,
                aggregate
              );

            if (skipped) {
              fileSkippedAggregates++;
            } else {
              fileInsertedAggregates++;
            }
          }

          for (
            const platformAspect of
            platformAspects
          ) {
            const result =
              await insertPlatformAspect(
                client,
                collegeId,
                platformAspect
              );

            if (
              result.skipped
            ) {
              fileSkippedPlatformAspects++;
            } else {
              fileInsertedPlatformAspects++;
            }
          }
        }

        await client.query(
          "COMMIT"
        );

        importedFiles++;

        insertedReviews +=
          fileInsertedReviews;

        skippedReviews +=
          fileSkippedReviews;

        insertedAspects +=
          fileInsertedAspects;

        insertedAggregates +=
          fileInsertedAggregates;

        skippedAggregates +=
          fileSkippedAggregates;

        insertedPlatformAspects +=
          fileInsertedPlatformAspects;

        skippedPlatformAspects +=
          fileSkippedPlatformAspects;

        console.log(
          "✅ Imported"
        );

        console.log(
          `   Reviews inserted : ${fileInsertedReviews}`
        );

        console.log(
          `   Reviews existing : ${fileSkippedReviews}`
        );

        console.log(
          `   Aspect evidence  : ${fileInsertedAspects}`
        );

        console.log(
          `   Aggregates       : ${fileInsertedAggregates}`
        );

        console.log(
          `   Platform aspects : ${fileInsertedPlatformAspects}`
        );
      } catch (error) {
        await client.query(
          "ROLLBACK"
        );

        console.error(
          `❌ FAILED ${file}`
        );

        console.error(
          error.message
        );

        failedFiles++;
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
      `Files found               : ${totalFiles}`
    );

    console.log(
      `Files imported            : ${importedFiles}`
    );

    console.log(
      `Files skipped mapping     : ${skippedFiles}`
    );

    console.log(
      `Files failed              : ${failedFiles}`
    );

    console.log("");

    console.log(
      `Reviews inserted          : ${insertedReviews}`
    );

    console.log(
      `Reviews skipped existing  : ${skippedReviews}`
    );

    console.log(
      `Aspect evidence inserted  : ${insertedAspects}`
    );

    console.log("");

    console.log(
      `Aggregates inserted       : ${insertedAggregates}`
    );

    console.log(
      `Aggregates skipped        : ${skippedAggregates}`
    );

    console.log("");

    console.log(
      `Platform aspects inserted : ${insertedPlatformAspects}`
    );

    console.log(
      `Platform aspects skipped  : ${skippedPlatformAspects}`
    );
  } catch (error) {
    console.error("");
    console.error(
      "IMPORT FAILED:"
    );
    console.error(error);

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();