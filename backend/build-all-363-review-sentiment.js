import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

const INPUT_COLLEGES =
  "./all-colleges-fee-source-family.json";

const OUTPUT =
  "./all-363-review-sentiment-preview.json";

const LOCAL_REVIEW_FILES = {
  GOOGLE: "./google-reviews.json",
  REDDIT: "./reddit-reviews.json",
  QUORA: "./quora-reviews.json"
};

const client = new Client({
  connectionString:
    process.env.DATABASE_URL ||
    process.env.DB_URL,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false
});

/* =========================================================
   SENTIMENT DICTIONARIES
   English + common Hinglish
========================================================= */

const POSITIVE_WORDS = [
  "good",
  "great",
  "excellent",
  "best",
  "amazing",
  "awesome",
  "nice",
  "decent",
  "helpful",
  "supportive",
  "friendly",
  "beautiful",
  "clean",
  "strong",
  "impressive",
  "recommended",
  "recommend",
  "worth",
  "satisfied",
  "excellent placement",
  "good placement",

  // Hinglish
  "acha",
  "accha",
  "achha",
  "acchi",
  "achhi",
  "badhiya",
  "badiya",
  "mast",
  "sahi",
  "bahut acha",
  "kaafi acha",
  "kaafi accha",
  "value for money"
];

const NEGATIVE_WORDS = [
  "bad",
  "worst",
  "poor",
  "terrible",
  "horrible",
  "pathetic",
  "useless",
  "avoid",
  "fraud",
  "scam",
  "dirty",
  "weak",
  "expensive",
  "overpriced",
  "problem",
  "problems",
  "issue",
  "issues",
  "disappointed",
  "waste",
  "toxic",

  // Hinglish
  "bekar",
  "bekaar",
  "kharab",
  "ghatiya",
  "bakwas",
  "bakwaas",
  "paisa waste",
  "mat lena",
  "mat jana",
  "bahut kharab",
  "not worth"
];

const NEGATIONS = [
  "not",
  "no",
  "never",
  "nahi",
  "nhi",
  "mat"
];

const TOPICS = {
  placement: [
    "placement",
    "placements",
    "package",
    "packages",
    "company",
    "companies",
    "recruiter",
    "recruiters",
    "job",
    "jobs",
    "internship",
    "internships",
    "ctc",
    "salary"
  ],

  faculty: [
    "faculty",
    "teacher",
    "teachers",
    "professor",
    "professors",
    "teaching",
    "mentor",
    "mentors"
  ],

  campus: [
    "campus",
    "college life",
    "environment",
    "fest",
    "fests",
    "culture",
    "crowd",
    "student life"
  ],

  hostel: [
    "hostel",
    "hostels",
    "mess",
    "warden",
    "room",
    "rooms",
    "food"
  ],

  infrastructure: [
    "infrastructure",
    "lab",
    "labs",
    "library",
    "classroom",
    "classrooms",
    "wifi",
    "building",
    "facilities"
  ],

  fee_roi: [
    "fee",
    "fees",
    "cost",
    "expensive",
    "money",
    "roi",
    "worth",
    "value for money",
    "scholarship"
  ]
};

/* ========================================================= */

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function calculateSentiment(text) {
  const normalized =
    normalizeText(text);

  if (!normalized) {
    return {
      label: "NEUTRAL",
      score: 0,
      positive_hits: 0,
      negative_hits: 0
    };
  }

  let positive = 0;
  let negative = 0;

  for (const phrase of POSITIVE_WORDS) {
    if (normalized.includes(phrase)) {
      positive++;
    }
  }

  for (const phrase of NEGATIVE_WORDS) {
    if (normalized.includes(phrase)) {
      negative++;
    }
  }

  /*
    Basic negation handling.
    Example:
    "not good"
    "placement acha nahi hai"
  */

  for (const word of NEGATIONS) {
    for (const positiveWord of POSITIVE_WORDS) {
      if (
        normalized.includes(
          `${word} ${positiveWord}`
        )
      ) {
        positive =
          Math.max(0, positive - 1);

        negative++;
      }

      if (
        normalized.includes(
          `${positiveWord} ${word}`
        )
      ) {
        positive =
          Math.max(0, positive - 1);

        negative++;
      }
    }
  }

  const hits =
    positive + negative;

  let score = 0;

  if (hits > 0) {
    score =
      (positive - negative) /
      hits;
  }

  /*
    Add star-rating-like textual signals
  */

  score =
    clamp(score, -1, 1);

  let label = "NEUTRAL";

  if (score >= 0.20) {
    label = "POSITIVE";
  } else if (score <= -0.20) {
    label = "NEGATIVE";
  }

  return {
    label,
    score,
    positive_hits: positive,
    negative_hits: negative
  };
}

function topicSentiment(
  text,
  keywords
) {
  const normalized =
    normalizeText(text);

  const relevant =
    keywords.some(
      keyword =>
        normalized.includes(keyword)
    );

  if (!relevant) {
    return null;
  }

  return calculateSentiment(text).score;
}

function mean(values) {
  const valid =
    values.filter(
      value =>
        value !== null &&
        value !== undefined &&
        Number.isFinite(Number(value))
    );

  if (!valid.length) {
    return null;
  }

  return (
    valid.reduce(
      (sum, value) =>
        sum + Number(value),
      0
    ) / valid.length
  );
}

function sentimentTo100(score) {
  if (
    score === null ||
    score === undefined
  ) {
    return null;
  }

  return Number(
    (((Number(score) + 1) / 2) * 100)
      .toFixed(2)
  );
}

/* =========================================================
   LOCAL REVIEW IMPORT
========================================================= */

function readOptionalJson(file) {
  if (!fs.existsSync(file)) {
    return [];
  }

  try {
    const raw =
      fs.readFileSync(
        file,
        "utf8"
      );

    const parsed =
      JSON.parse(
        raw.replace(/^\uFEFF/, "")
      );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.log(
      `WARNING: Could not parse ${file}:`,
      error.message
    );

    return [];
  }
}

async function importLocalReviews() {
  let imported = 0;

  for (
    const [source, file]
    of Object.entries(
      LOCAL_REVIEW_FILES
    )
  ) {
    const rows =
      readOptionalJson(file);

    if (!rows.length) {
      continue;
    }

    console.log(
      `${source} local reviews found:`,
      rows.length
    );

    for (
      let i = 0;
      i < rows.length;
      i++
    ) {
      const row = rows[i];

      if (
        !row.college_id ||
        !row.review_text
      ) {
        continue;
      }

      const externalId =
        row.external_review_id ||
        `${source}-${row.college_id}-${i}`;

      await client.query(
        `
        INSERT INTO college_reviews (
          college_id,
          source,
          external_review_id,
          author_name,
          rating,
          review_text,
          review_date,
          source_url,
          language,
          created_at
        )

        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()
        )

        ON CONFLICT DO NOTHING
        `,
        [
          row.college_id,
          source,
          externalId,
          row.author_name || null,
          row.rating ?? null,
          row.review_text,
          row.review_date || null,
          row.source_url || null,
          row.language || null
        ]
      );

      imported++;
    }
  }

  return imported;
}

/* =========================================================
   SOURCE STATUS FOR ALL 363
========================================================= */

async function ensureSource(
  collegeId,
  source,
  status
) {
  await client.query(
    `
    INSERT INTO college_review_sources (
      college_id,
      source,
      source_status,
      updated_at
    )

    VALUES ($1,$2,$3,NOW())

    ON CONFLICT (
      college_id,
      source
    )

    DO UPDATE SET
      source_status =
        CASE

          WHEN college_review_sources.source_status
            IN (
              'ACTIVE',
              'IMPORTED',
              'VERIFIED'
            )
          THEN
            college_review_sources.source_status

          ELSE
            EXCLUDED.source_status

        END,

      updated_at = NOW()
    `,
    [
      collegeId,
      source,
      status
    ]
  );
}

/* =========================================================
   ANALYZE REVIEWS
========================================================= */

async function analyzeAllReviews() {
  const result =
    await client.query(
      `
      SELECT
        id,
        college_id,
        source,
        rating,
        review_text

      FROM college_reviews

      WHERE review_text IS NOT NULL
        AND TRIM(review_text) <> ''
      `
    );

  console.log(
    "Reviews available for sentiment:",
    result.rows.length
  );

  let processed = 0;

  for (const row of result.rows) {
    const base =
      calculateSentiment(
        row.review_text
      );

    /*
      Rating helps only when source actually
      supplies rating.

      5 star => +1
      3 star => 0
      1 star => -1
    */

    let finalScore =
      base.score;

    if (
      row.rating !== null &&
      row.rating !== undefined
    ) {
      const ratingScore =
        clamp(
          (Number(row.rating) - 3) / 2,
          -1,
          1
        );

      /*
        Text is more important than stars.
      */

      finalScore =
        (base.score * 0.70) +
        (ratingScore * 0.30);
    }

    finalScore =
      clamp(finalScore, -1, 1);

    let label = "NEUTRAL";

    if (finalScore >= 0.20) {
      label = "POSITIVE";
    } else if (
      finalScore <= -0.20
    ) {
      label = "NEGATIVE";
    }

    await client.query(
      `
      UPDATE college_reviews

      SET
        sentiment_label = $1,
        sentiment_score = $2,

        placement_sentiment = $3,
        faculty_sentiment = $4,
        campus_sentiment = $5,
        hostel_sentiment = $6,
        infrastructure_sentiment = $7,
        fee_roi_sentiment = $8,

        processed_at = NOW()

      WHERE id = $9
      `,
      [
        label,
        finalScore,

        topicSentiment(
          row.review_text,
          TOPICS.placement
        ),

        topicSentiment(
          row.review_text,
          TOPICS.faculty
        ),

        topicSentiment(
          row.review_text,
          TOPICS.campus
        ),

        topicSentiment(
          row.review_text,
          TOPICS.hostel
        ),

        topicSentiment(
          row.review_text,
          TOPICS.infrastructure
        ),

        topicSentiment(
          row.review_text,
          TOPICS.fee_roi
        ),

        row.id
      ]
    );

    processed++;

    if (processed % 100 === 0) {
      console.log(
        `Sentiment processed: ${processed}/${result.rows.length}`
      );
    }
  }

  return processed;
}

/* =========================================================
   BUILD COLLEGE SUMMARY
========================================================= */

async function buildCollegeSummary(
  college
) {
  const result =
    await client.query(
      `
      SELECT
        source,
        rating,
        sentiment_score,

        placement_sentiment,
        faculty_sentiment,
        campus_sentiment,
        hostel_sentiment,
        infrastructure_sentiment,
        fee_roi_sentiment

      FROM college_reviews

      WHERE college_id = $1
        AND sentiment_score IS NOT NULL
      `,
      [college.college_id]
    );

  const reviews =
    result.rows;

  const googleReviews =
    reviews.filter(
      row =>
        String(row.source)
          .toUpperCase() ===
        "GOOGLE"
    );

  const redditReviews =
    reviews.filter(
      row =>
        String(row.source)
          .toUpperCase() ===
        "REDDIT"
    );

  const quoraReviews =
    reviews.filter(
      row =>
        String(row.source)
          .toUpperCase() ===
        "QUORA"
    );

  const googleSentiment =
    sentimentTo100(
      mean(
        googleReviews.map(
          r => r.sentiment_score
        )
      )
    );

  const redditSentiment =
    sentimentTo100(
      mean(
        redditReviews.map(
          r => r.sentiment_score
        )
      )
    );

  const quoraSentiment =
    sentimentTo100(
      mean(
        quoraReviews.map(
          r => r.sentiment_score
        )
      )
    );

  const overallSentiment =
    sentimentTo100(
      mean(
        reviews.map(
          r => r.sentiment_score
        )
      )
    );

  const topic = key =>
    sentimentTo100(
      mean(
        reviews.map(
          r => r[key]
        )
      )
    );

  const sourceResult =
    await client.query(
      `
      SELECT
        rating,
        review_count

      FROM college_review_sources

      WHERE college_id = $1
        AND source = 'GOOGLE'

      LIMIT 1
      `,
      [college.college_id]
    );

  const googleRating =
    sourceResult.rows[0]
      ?.rating ?? null;

  const googleReviewCount =
    sourceResult.rows[0]
      ?.review_count ?? null;

  /*
    Final Student Review Score

    Sentiment        70%
    Google rating    20%
    Volume/confidence 10%

    Missing sources DO NOT become zero.
  */

  let scoreParts = [];
  let scoreWeights = [];

  if (overallSentiment !== null) {
    scoreParts.push(
      overallSentiment
    );

    scoreWeights.push(0.70);
  }

  if (googleRating !== null) {
    scoreParts.push(
      (
        Number(googleRating) / 5
      ) * 100
    );

    scoreWeights.push(0.20);
  }

  const analyzed =
    reviews.length;

  const confidence =
    analyzed === 0
      ? 0
      : Math.min(
          100,
          20 +
          Math.log10(
            analyzed + 1
          ) * 35
        );

  if (analyzed > 0) {
    scoreParts.push(
      confidence
    );

    scoreWeights.push(0.10);
  }

  let reviewScore = null;

  if (scoreParts.length) {
    let weighted = 0;
    let weightTotal = 0;

    for (
      let i = 0;
      i < scoreParts.length;
      i++
    ) {
      weighted +=
        scoreParts[i] *
        scoreWeights[i];

      weightTotal +=
        scoreWeights[i];
    }

    reviewScore =
      weightTotal > 0
        ? Number(
            (
              weighted /
              weightTotal
            ).toFixed(2)
          )
        : null;
  }

  const summary = {
    college_id:
      college.college_id,

    college_name:
      college.college_name,

    google_rating:
      googleRating !== null
        ? Number(googleRating)
        : null,

    google_review_count:
      googleReviewCount !== null
        ? Number(googleReviewCount)
        : null,

    google_sentiment:
      googleSentiment,

    reddit_sentiment:
      redditSentiment,

    quora_sentiment:
      quoraSentiment,

    placement_sentiment:
      topic(
        "placement_sentiment"
      ),

    faculty_sentiment:
      topic(
        "faculty_sentiment"
      ),

    campus_sentiment:
      topic(
        "campus_sentiment"
      ),

    hostel_sentiment:
      topic(
        "hostel_sentiment"
      ),

    infrastructure_sentiment:
      topic(
        "infrastructure_sentiment"
      ),

    fee_roi_sentiment:
      topic(
        "fee_roi_sentiment"
      ),

    overall_sentiment:
      overallSentiment,

    review_score:
      reviewScore,

    analyzed_reviews:
      analyzed,

    confidence_score:
      Number(
        confidence.toFixed(2)
      )
  };

  await client.query(
    `
    INSERT INTO college_sentiment_summary (
      college_id,

      google_rating,
      google_review_count,

      google_sentiment,
      reddit_sentiment,
      quora_sentiment,

      placement_sentiment,
      faculty_sentiment,
      campus_sentiment,
      hostel_sentiment,
      infrastructure_sentiment,
      fee_roi_sentiment,

      overall_sentiment,
      review_score,

      analyzed_reviews,
      confidence_score,

      updated_at
    )

    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,
      $10,$11,$12,$13,$14,$15,$16,
      NOW()
    )

    ON CONFLICT (college_id)

    DO UPDATE SET

      google_rating =
        EXCLUDED.google_rating,

      google_review_count =
        EXCLUDED.google_review_count,

      google_sentiment =
        EXCLUDED.google_sentiment,

      reddit_sentiment =
        EXCLUDED.reddit_sentiment,

      quora_sentiment =
        EXCLUDED.quora_sentiment,

      placement_sentiment =
        EXCLUDED.placement_sentiment,

      faculty_sentiment =
        EXCLUDED.faculty_sentiment,

      campus_sentiment =
        EXCLUDED.campus_sentiment,

      hostel_sentiment =
        EXCLUDED.hostel_sentiment,

      infrastructure_sentiment =
        EXCLUDED.infrastructure_sentiment,

      fee_roi_sentiment =
        EXCLUDED.fee_roi_sentiment,

      overall_sentiment =
        EXCLUDED.overall_sentiment,

      review_score =
        EXCLUDED.review_score,

      analyzed_reviews =
        EXCLUDED.analyzed_reviews,

      confidence_score =
        EXCLUDED.confidence_score,

      updated_at =
        NOW()
    `,
    [
      summary.college_id,

      summary.google_rating,
      summary.google_review_count,

      summary.google_sentiment,
      summary.reddit_sentiment,
      summary.quora_sentiment,

      summary.placement_sentiment,
      summary.faculty_sentiment,
      summary.campus_sentiment,
      summary.hostel_sentiment,
      summary.infrastructure_sentiment,
      summary.fee_roi_sentiment,

      summary.overall_sentiment,
      summary.review_score,

      summary.analyzed_reviews,
      summary.confidence_score
    ]
  );

  return summary;
}

/* =========================================================
   MAIN
========================================================= */

async function main() {
  console.log(
    "==============================================="
  );

  console.log(
    "ALL 363 COLLEGE REVIEW + SENTIMENT PIPELINE"
  );

  console.log(
    "==============================================="
  );

  if (
    !fs.existsSync(
      INPUT_COLLEGES
    )
  ) {
    throw new Error(
      `Input file missing: ${INPUT_COLLEGES}`
    );
  }

  const colleges =
    JSON.parse(
      fs
        .readFileSync(
          INPUT_COLLEGES,
          "utf8"
        )
        .replace(
          /^\uFEFF/,
          ""
        )
    );

  console.log(
    "Total colleges:",
    colleges.length
  );

  await client.connect();

  console.log(
    "Database connected."
  );

  /*
    Source status:
    We do NOT scrape Google Maps,
    Reddit, or Quora blindly.

    Google becomes ready automatically
    when API key/approved importer exists.

    Reddit / Quora can be fed via
    approved/API/manual/licensed datasets.
  */

  const googleStatus =
    process.env.GOOGLE_PLACES_API_KEY
      ? "API_CONFIGURED"
      : "API_KEY_REQUIRED";

  for (
    let i = 0;
    i < colleges.length;
    i++
  ) {
    const college =
      colleges[i];

    await ensureSource(
      college.college_id,
      "GOOGLE",
      googleStatus
    );

    await ensureSource(
      college.college_id,
      "REDDIT",
      "AUTHORIZED_SOURCE_REQUIRED"
    );

    await ensureSource(
      college.college_id,
      "QUORA",
      "AUTHORIZED_OR_MANUAL_SOURCE_REQUIRED"
    );

    if (
      (i + 1) % 50 === 0
    ) {
      console.log(
        `Source setup: ${i + 1}/${colleges.length}`
      );
    }
  }

  console.log(
    "Source registry ready."
  );

  const localImported =
    await importLocalReviews();

  console.log(
    "Local review rows processed:",
    localImported
  );

  const processed =
    await analyzeAllReviews();

  console.log(
    "Sentiment analyzed:",
    processed
  );

  const summaries = [];

  for (
    let i = 0;
    i < colleges.length;
    i++
  ) {
    const summary =
      await buildCollegeSummary(
        colleges[i]
      );

    summaries.push(
      summary
    );

    if (
      (i + 1) % 25 === 0
    ) {
      console.log(
        `Summary built: ${i + 1}/${colleges.length}`
      );
    }
  }

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      summaries,
      null,
      2
    ),
    "utf8"
  );

  const collegesWithReviews =
    summaries.filter(
      row =>
        row.analyzed_reviews > 0
    ).length;

  const googleAvailable =
    summaries.filter(
      row =>
        row.google_sentiment !== null ||
        row.google_rating !== null
    ).length;

  const redditAvailable =
    summaries.filter(
      row =>
        row.reddit_sentiment !== null
    ).length;

  const quoraAvailable =
    summaries.filter(
      row =>
        row.quora_sentiment !== null
    ).length;

  console.log("");
  console.log(
    "==============================================="
  );

  console.log(
    "FINAL REVIEW + SENTIMENT SUMMARY"
  );

  console.log(
    "==============================================="
  );

  console.log(
    "TOTAL COLLEGES:",
    summaries.length
  );

  console.log(
    "COLLEGES WITH REVIEWS:",
    collegesWithReviews
  );

  console.log(
    "GOOGLE DATA AVAILABLE:",
    googleAvailable
  );

  console.log(
    "REDDIT DATA AVAILABLE:",
    redditAvailable
  );

  console.log(
    "QUORA DATA AVAILABLE:",
    quoraAvailable
  );

  console.log(
    "PREVIEW SAVED:",
    OUTPUT
  );

  console.log("");
  console.log(
    "Google API:",
    googleStatus
  );

  console.log(
    "Reddit:",
    "AUTHORIZED SOURCE REQUIRED"
  );

  console.log(
    "Quora:",
    "AUTHORIZED / MANUAL SOURCE REQUIRED"
  );

  console.log("");
  console.log(
    "REVIEW + SENTIMENT PIPELINE COMPLETE"
  );
}

main()
  .catch(error => {
    console.error(
      "FAILED:",
      error.stack ||
      error.message
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.end();
    } catch {}
  });