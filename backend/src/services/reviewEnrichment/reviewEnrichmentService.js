import {
  pool,
} from "../../db/pool.js";

import {
  collectRedditReviews,
} from "./redditCollector.js";

import {
  analyzeReviewText,
} from "./reviewTextAnalyzer.js";


const TARGET_REVIEWS =
  100;

const MIN_SOURCES =
  3;

const MAX_SOURCE_SHARE =
  0.60;


function normalizeCollegeName(
  value
) {
  let s =
    String(
      value || ""
    )
      .toLowerCase()
      .replace(
        /&/g,
        " and "
      )
      .replace(
        /[^a-z0-9]+/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();


  s =
    s.replace(
      /^nit\s+/,
      "national institute of technology "
    );


  return s;
}


function canonicalSourceFamily(
  value
) {
  const name =
    String(
      value || ""
    )
      .trim();

  const s =
    name
      .toLowerCase();


  if (
    s.includes(
      "reddit"
    )
  ) {
    return "Reddit";
  }

  if (
    s.includes(
      "quora"
    )
  ) {
    return "Quora";
  }

  if (
    s.includes(
      "shiksha"
    )
  ) {
    return "Shiksha";
  }

  if (
    s.includes(
      "collegedunia"
    )
  ) {
    return "Collegedunia";
  }

  if (
    s.includes(
      "careers360"
    )
  ) {
    return "Careers360";
  }

  if (
    s.includes(
      "getmyuni"
    )
  ) {
    return "GetMyUni";
  }

  if (
    s.includes(
      "zollege"
    )
  ) {
    return "Zollege";
  }

  if (
    s.includes(
      "collegebatch"
    )
  ) {
    return "CollegeBatch";
  }

  if (
    s.includes(
      "collegedekho"
    )
  ) {
    return "CollegeDekho";
  }


  return (
    name ||
    "Unknown"
  );
}


async function
resolveCollege(
  collegeId
) {
  const requested =
    await pool.query(
      `
        SELECT
          id,
          name
        FROM colleges
        WHERE id = $1
        LIMIT 1
      `,
      [
        collegeId,
      ]
    );


  if (
    !requested.rows[0]
  ) {
    throw new Error(
      "College not found"
    );
  }


  const base =
    requested.rows[0];


  const normalized =
    normalizeCollegeName(
      base.name
    );


  const candidates =
    await pool.query(
      `
        SELECT
          c.id,
          c.name,
          COUNT(
            cri.id
          )::int
            AS review_count
        FROM colleges c
        LEFT JOIN
          college_review_items cri
          ON cri.college_id =
             c.id
        GROUP BY
          c.id,
          c.name
      `
    );


  const matches =
    candidates.rows
      .filter(
        row =>
          normalizeCollegeName(
            row.name
          ) ===
          normalized
      )
      .sort(
        (a, b) =>
          Number(
            b.review_count ||
            0
          ) -
          Number(
            a.review_count ||
            0
          )
      );


  return (
    matches[0] ||
    base
  );
}


async function
getOrCreateSource(
  client,
  {
    name,
    sourceType,
    baseUrl,
  }
) {
  const family =
    canonicalSourceFamily(
      name
    );


  const existing =
    await client.query(
      `
        SELECT id
        FROM review_sources
        WHERE LOWER(name)
          = LOWER($1)
        LIMIT 1
      `,
      [
        family,
      ]
    );


  if (
    existing.rows[0]
  ) {
    return existing
      .rows[0]
      .id;
  }


  const inserted =
    await client.query(
      `
        INSERT INTO
          review_sources (
            name,
            source_type,
            base_url
          )
        VALUES (
          $1,
          $2,
          $3
        )
        RETURNING id
      `,
      [
        family,
        sourceType ||
          "discussion",
        baseUrl ||
          null,
      ]
    );


  return inserted
    .rows[0]
    .id;
}


async function
reviewExists(
  client,
  {
    collegeId,
    sourceId,
    sourceReviewId,
    sourceUrl,
  }
) {
  const result =
    await client.query(
      `
        SELECT id
        FROM college_review_items

        WHERE
          college_id = $1

          AND source_id
            IS NOT DISTINCT
            FROM $2

          AND (
            source_review_id
              IS NOT DISTINCT
              FROM $3

            OR (
              $3 IS NULL
              AND
              source_url
                IS NOT DISTINCT
                FROM $4
            )
          )

        LIMIT 1
      `,
      [
        collegeId,
        sourceId,
        sourceReviewId ||
          null,
        sourceUrl ||
          null,
      ]
    );


  return (
    result.rows[0]
      ?.id ||
    null
  );
}


async function
insertReview(
  client,
  {
    collegeId,
    sourceId,
    sourceReviewId,
    sourceUrl,
    author,
    title,
    reviewDate,
    text,
    raw,
    sourceName,
  }
) {
  const existing =
    await reviewExists(
      client,
      {
        collegeId,
        sourceId,
        sourceReviewId,
        sourceUrl,
      }
    );


  if (
    existing
  ) {
    return {
      id:
        existing,

      inserted:
        false,
    };
  }


  const payload =
    JSON.stringify({
      text,
      source:
        sourceName,
      original:
        raw ||
        null,
    });


  const result =
    await client.query(
      `
        INSERT INTO
          college_review_items (
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
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          NOW(),
          'discussion',
          'full_review',
          'full_review',
          NULL,
          NULL,
          FALSE,
          NULL,
          NULL,
          FALSE,
          NULL,
          NULL,
          'unique',
          NULL,
          $8,
          NOW()
        )

        RETURNING id
      `,
      [
        collegeId,
        sourceId,
        sourceReviewId ||
          null,
        sourceUrl ||
          null,
        author ||
          null,
        title ||
          null,
        reviewDate ||
          null,
        payload,
      ]
    );


  return {
    id:
      result.rows[0]
        .id,

    inserted:
      true,
  };
}


async function
insertAspectEvidence(
  client,
  {
    reviewItemId,
    aspect,
    sentiment,
    text,
  }
) {
  const exists =
    await client.query(
      `
        SELECT 1
        FROM
          review_aspect_sentiments

        WHERE
          review_item_id = $1
          AND aspect = $2
          AND sentiment = $3

        LIMIT 1
      `,
      [
        reviewItemId,
        aspect,
        sentiment,
      ]
    );


  if (
    exists.rowCount >
    0
  ) {
    return false;
  }


  await client.query(
    `
      INSERT INTO
        review_aspect_sentiments (
          review_item_id,
          aspect,
          target_branch,
          scope,
          sentiment,
          evidence_summary,
          created_at
        )

      VALUES (
        $1,
        $2,
        NULL,
        'college',
        $3,
        $4,
        NOW()
      )
    `,
    [
      reviewItemId,
      aspect,
      sentiment,
      String(
        text ||
        ""
      )
        .slice(
          0,
          1500
        ),
    ]
  );


  return true;
}


export async function
ingestReviews({
  collegeId,
  source,
  sourceType,
  baseUrl,
  reviews,
}) {
  const canonical =
    await resolveCollege(
      collegeId
    );


  const client =
    await pool.connect();


  const stats = {
    received:
      Array.isArray(
        reviews
      )
        ? reviews.length
        : 0,

    inserted:
      0,

    skipped:
      0,

    aspectRows:
      0,

    noAspect:
      0,
  };


  try {
    await client.query(
      "BEGIN"
    );


    const sourceId =
      await getOrCreateSource(
        client,
        {
          name:
            source,

          sourceType,

          baseUrl,
        }
      );


    for (
      const review
      of reviews ||
      []
    ) {
      const text =
        String(
          review
            ?.text ||
          ""
        )
          .replace(
            /\s+/g,
            " "
          )
          .trim();


      if (
        text.length <
        40
      ) {
        stats.skipped++;
        continue;
      }


      const analysis =
        analyzeReviewText(
          text
        );


      const inserted =
        await insertReview(
          client,
          {
            collegeId:
              canonical.id,

            sourceId,

            sourceReviewId:
              review
                ?.sourceReviewId ||
              review
                ?.id ||
              null,

            sourceUrl:
              review
                ?.url ||
              review
                ?.sourceUrl ||
              null,

            author:
              review
                ?.author ||
              null,

            title:
              review
                ?.title ||
              null,

            reviewDate:
              review
                ?.reviewDate ||
              review
                ?.date ||
              null,

            text,

            raw:
              review
                ?.raw ||
              review,

            sourceName:
              source,
          }
        );


      if (
        inserted
          .inserted
      ) {
        stats.inserted++;
      }
      else {
        stats.skipped++;
      }


      if (
        analysis
          .aspects
          .length ===
        0
      ) {
        stats.noAspect++;
      }


      for (
        const aspect
        of analysis
          .aspects
      ) {
        const didInsert =
          await insertAspectEvidence(
            client,
            {
              reviewItemId:
                inserted.id,

              aspect,

              sentiment:
                analysis
                  .sentiment,

              text:
                analysis
                  .text,
            }
          );


        if (
          didInsert
        ) {
          stats.aspectRows++;
        }
      }
    }


    await client.query(
      "COMMIT"
    );


    return {
      college: {
        requestedId:
          collegeId,

        canonicalId:
          canonical.id,

        name:
          canonical.name,
      },

      source:
        canonicalSourceFamily(
          source
        ),

      stats,
    };
  }
  catch (
    error
  ) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  }
  finally {
    client.release();
  }
}


export async function
fetchAndIngestReddit({
  collegeId,
  maxReviews = 60,
}) {
  const college =
    await resolveCollege(
      collegeId
    );


  const reviews =
    await collectRedditReviews({
      collegeName:
        college.name,

      aliases: [],

      maxReviews:
        Math.min(
          60,
          Math.max(
            1,
            Number(
              maxReviews ||
              60
            )
          )
        ),
    });


  const result =
    await ingestReviews({
      collegeId:
        college.id,

      source:
        "Reddit",

      sourceType:
        "discussion",

      baseUrl:
        "https://www.reddit.com",

      reviews,
    });


  return {
    fetched:
      reviews.length,

    ...result,
  };
}


export async function
getReviewEnrichmentStatus(
  collegeId
) {
  const college =
    await resolveCollege(
      collegeId
    );


  const result =
    await pool.query(
      `
        SELECT
          cri.id,
          cri.duplicate_status,
          cri.duplicate_of,
          rs.name
            AS source_name

        FROM
          college_review_items cri

        LEFT JOIN
          review_sources rs
          ON rs.id =
             cri.source_id

        WHERE
          cri.college_id = $1
      `,
      [
        college.id,
      ]
    );


  const usable =
    result.rows.filter(
      row => {
        if (
          row.duplicate_of !=
          null
        ) {
          return false;
        }

        const status =
          String(
            row.duplicate_status ||
            ""
          )
            .toLowerCase();

        return ![
          "duplicate",
          "confirmed_duplicate",
          "probable_duplicate",
        ].includes(
          status
        );
      }
    );


  const sourceCounts =
    new Map();


  for (
    const row
    of usable
  ) {
    const source =
      canonicalSourceFamily(
        row.source_name
      );

    if (
      source ===
      "Unknown"
    ) {
      continue;
    }

    sourceCounts.set(
      source,
      (
        sourceCounts.get(
          source
        ) ||
        0
      ) +
      1
    );
  }


  const distribution =
    [...sourceCounts.entries()]
      .map(
        ([
          source,
          count,
        ]) => ({
          source,
          count,
        })
      )
      .sort(
        (a, b) =>
          b.count -
          a.count
      );


  const count =
    usable.length;


  const largest =
    distribution[0] ||
    null;


  const maxShare =
    count > 0 &&
    largest
      ? largest.count /
        count
      : null;


  const sourceCount =
    distribution.length;


  return {
    college: {
      id:
        college.id,

      name:
        college.name,
    },

    standard: {
      targetReviews:
        TARGET_REVIEWS,

      minimumSources:
        MIN_SOURCES,

      maximumSingleSourceShare:
        MAX_SOURCE_SHARE,

      usableReviews:
        count,

      reviewsNeeded:
        Math.max(
          0,
          TARGET_REVIEWS -
            count
        ),

      independentSources:
        sourceCount,

      sourcesNeeded:
        Math.max(
          0,
          MIN_SOURCES -
            sourceCount
        ),

      maxSourceShare:
        maxShare,

      dominantSource:
        largest
          ?.source ||
        null,

      sourceDistribution:
        distribution,

      ready:
        count >=
          TARGET_REVIEWS &&
        sourceCount >=
          MIN_SOURCES &&
        maxShare !==
          null &&
        maxShare <=
          MAX_SOURCE_SHARE,
    },
  };
}
