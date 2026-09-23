import { Router } from "express";
import { pool } from "../db/pool.js";

import {
  getCollegeReviewIntelligenceV3,
} from "../services/reviewScoringServiceV3.js";

const router =
  Router();


const REVIEW_STANDARD = {
  minimumReviews: 100,
  minimumSources: 3,
  maximumSingleSourceShare: 0.60,
};


const ASPECTS = [
  "placements",
  "faculty",
  "academics",
  "infrastructure",
  "hostel",
  "campus_life",
  "administration",
  "internships",
  "value_for_money",
  "location",
];


function normalizeCollegeName(
  value
) {
  let text =
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

  text =
    text.replace(
      /^nit\s+/,
      "national institute of technology "
    );

  text =
    text.replace(
      /^national institute technology\s+/,
      "national institute of technology "
    );

  return text
    .replace(
      /\bthe\b/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
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
    name.toLowerCase();

  if (!s) {
    return "Unknown";
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
      "quora"
    )
  ) {
    return "Quora";
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

  if (
    s.includes(
      "universitykart"
    )
  ) {
    return "UniversityKart";
  }

  if (
    s.includes(
      "collegesearch"
    )
  ) {
    return "CollegeSearch";
  }

  if (
    s.includes(
      "findmycollege"
    )
  ) {
    return "FindMyCollege";
  }

  if (
    s.includes(
      "glassdoor"
    )
  ) {
    return "Glassdoor";
  }

  if (
    s.includes(
      "justdial"
    )
  ) {
    return "JustDial";
  }

  if (
    s.includes(
      "worldorgs"
    )
  ) {
    return "WorldOrgs";
  }

  return name;
}


function cleanText(
  value
) {
  return String(
    value || ""
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function normalizeTextKey(
  value
) {
  return cleanText(
    value
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function parseRawPayload(
  raw
) {
  if (!raw) {
    return null;
  }

  if (
    typeof raw ===
    "object"
  ) {
    return raw;
  }

  try {
    return JSON.parse(
      raw
    );
  }
  catch {
    return null;
  }
}


function findPayloadText(
  payload
) {
  if (!payload) {
    return null;
  }

  const candidates = [
    payload.review_text,
    payload.reviewText,
    payload.text,
    payload.content,
    payload.body,
    payload.snippet,
    payload.review,
    payload.description,
  ];

  for (
    const value
    of candidates
  ) {
    const text =
      cleanText(
        value
      );

    if (
      text.length >= 20
    ) {
      return text;
    }
  }

  return null;
}


function usableReviewRow(
  row
) {
  if (
    row.duplicate_of != null
  ) {
    return false;
  }

  const status =
    String(
      row.duplicate_status || ""
    )
      .trim()
      .toLowerCase();

  return ![
    "duplicate",
    "confirmed_duplicate",
    "probable_duplicate",
  ].includes(
    status
  );
}


function sentimentLabel(
  value
) {
  const s =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  if (
    s === "positive"
  ) {
    return "Positive";
  }

  if (
    s === "negative"
  ) {
    return "Negative";
  }

  if (
    s === "mixed"
  ) {
    return "Mixed";
  }

  if (
    s === "neutral"
  ) {
    return "Neutral";
  }

  return null;
}


async function resolveCollege(
  requestedId
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
        requestedId,
      ]
    );

  if (
    requested.rowCount ===
    0
  ) {
    return null;
  }

  const requestedCollege =
    requested.rows[0];

  const normalized =
    normalizeCollegeName(
      requestedCollege.name
    );

  const candidates =
    await pool.query(
      `
        SELECT
          c.id,
          c.name,

          COUNT(
            DISTINCT cri.id
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
    {
      ...requestedCollege,
      review_count: 0,
    }
  );
}


router.get(
  "/:collegeId",
  async (
    req,
    res,
    next
  ) => {
    try {
      const requestedId =
        String(
          req.params
            .collegeId ||
          ""
        ).trim();

      if (!requestedId) {
        return res
          .status(
            400
          )
          .json({
            error:
              "collegeId is required",
          });
      }


      const page =
        Math.max(
          1,
          Number(
            req.query.page ||
            1
          )
        );


      const limit =
        Math.min(
          25,
          Math.max(
            5,
            Number(
              req.query.limit ||
              10
            )
          )
        );


      const canonical =
        await resolveCollege(
          requestedId
        );


      if (!canonical) {
        return res
          .status(
            404
          )
          .json({
            error:
              "College not found",
          });
      }


      /*
      |--------------------------------------------------------------------------
      | Review items + source-backed aspect evidence
      |--------------------------------------------------------------------------
      */

      const {
        rows,
      } =
        await pool.query(
          `
            SELECT
              cri.id
                AS review_item_id,

              cri.college_id,
              cri.source_review_id,
              cri.source_url,
              cri.author_display_name,
              cri.review_title,
              cri.review_date,
              cri.observed_at,
              cri.content_type,
              cri.content_access,
              cri.evidence_strength,
              cri.programme_level,
              cri.course,
              cri.course_verified,
              cri.department,
              cri.branch_text,
              cri.branch_verified,
              cri.rating,
              cri.rating_scale,
              cri.duplicate_status,
              cri.duplicate_of,
              cri.raw_payload,

              rs.name
                AS source_name,

              rs.source_type,

              ras.aspect,
              ras.sentiment,
              ras.evidence_summary,
              ras.target_branch,
              ras.scope

            FROM
              college_review_items cri

            LEFT JOIN
              review_sources rs
              ON rs.id =
                 cri.source_id

            LEFT JOIN
              review_aspect_sentiments ras
              ON ras.review_item_id =
                 cri.id

            WHERE
              cri.college_id = $1

            ORDER BY
              cri.review_date DESC
                NULLS LAST,
              cri.id DESC,
              ras.id
          `,
          [
            canonical.id,
          ]
        );


      /*
      |--------------------------------------------------------------------------
      | Build one object per real review item
      |--------------------------------------------------------------------------
      */

      const byReview =
        new Map();


      for (
        const row
        of rows
      ) {
        if (
          !usableReviewRow(
            row
          )
        ) {
          continue;
        }


        const id =
          String(
            row.review_item_id
          );


        if (
          !byReview.has(
            id
          )
        ) {
          byReview.set(
            id,
            {
              id:
                row.review_item_id,

              source:
                canonicalSourceFamily(
                  row.source_name
                ),

              originalSource:
                row.source_name ||
                null,

              sourceType:
                row.source_type ||
                null,

              sourceUrl:
                row.source_url ||
                null,

              author:
                row.author_display_name ||
                null,

              title:
                row.review_title ||
                null,

              reviewDate:
                row.review_date ||
                null,

              observedAt:
                row.observed_at ||
                null,

              branch:
                row.branch_text ||
                null,

              branchVerified:
                Boolean(
                  row.branch_verified
                ),

              rating:
                row.rating ??
                null,

              ratingScale:
                row.rating_scale ??
                null,

              evidenceStrength:
                row.evidence_strength ||
                null,

              rawPayload:
                row.raw_payload,

              evidence: [],
            }
          );
        }


        const review =
          byReview.get(
            id
          );


        if (
          row.aspect &&
          row.evidence_summary
        ) {
          review.evidence.push({
            aspect:
              row.aspect,

            sentiment:
              sentimentLabel(
                row.sentiment
              ),

            text:
              cleanText(
                row.evidence_summary
              ),

            scope:
              row.scope ||
              null,

            targetBranch:
              row.target_branch ||
              null,
          });
        }
      }


      /*
      |--------------------------------------------------------------------------
      | Recover actual text.
      |
      | Full stored review text from raw_payload is preferred.
      | If unavailable, source-backed stored evidence text is shown.
      |--------------------------------------------------------------------------
      */

      let reviews =
        [...byReview.values()]
          .map(
            review => {
              const payload =
                parseRawPayload(
                  review.rawPayload
                );

              const payloadText =
                findPayloadText(
                  payload
                );

              const evidenceTexts =
                review.evidence
                  .map(
                    item =>
                      item.text
                  )
                  .filter(
                    Boolean
                  );

              const text =
                payloadText ||
                cleanText(
                  [
                    ...new Set(
                      evidenceTexts
                    ),
                  ].join(
                    " "
                  )
                ) ||
                null;


              return {
                ...review,
                rawPayload:
                  undefined,

                text,

                aspects:
                  [
                    ...new Set(
                      review.evidence
                        .map(
                          item =>
                            item.aspect
                        )
                        .filter(
                          Boolean
                        )
                    ),
                  ],

                sentiments:
                  [
                    ...new Set(
                      review.evidence
                        .map(
                          item =>
                            item.sentiment
                        )
                        .filter(
                          Boolean
                        )
                    ),
                  ],
              };
            }
          )
          .filter(
            review =>
              review.text &&
              review.text.length >=
                20
          );


      /*
      |--------------------------------------------------------------------------
      | Cross-source text dedupe.
      |
      | Exact/near-identical stored mirrors must not inflate 100-review count.
      |--------------------------------------------------------------------------
      */

      const seenText =
        new Set();

      reviews =
        reviews.filter(
          review => {
            const key =
              normalizeTextKey(
                review.text
              );

            if (
              key.length <
              20
            ) {
              return false;
            }

            if (
              seenText.has(
                key
              )
            ) {
              return false;
            }

            seenText.add(
              key
            );

            return true;
          }
        );


      /*
      |--------------------------------------------------------------------------
      | Canonical source distribution
      |--------------------------------------------------------------------------
      */

      const sourceCounts =
        new Map();


      for (
        const review
        of reviews
      ) {
        if (
          !review.source ||
          review.source ===
            "Unknown"
        ) {
          continue;
        }

        sourceCounts.set(
          review.source,
          (
            sourceCounts.get(
              review.source
            ) ||
            0
          ) +
          1
        );
      }


      const sourceDistribution =
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


      const usableReviews =
        reviews.length;


      const independentSources =
        sourceDistribution.length;


      const largestSource =
        sourceDistribution[0] ||
        null;


      const maxSourceShare =
        usableReviews > 0 &&
        largestSource
          ? (
              largestSource.count /
              usableReviews
            )
          : null;


      const standardMet =
        usableReviews >=
          REVIEW_STANDARD
            .minimumReviews &&
        independentSources >=
          REVIEW_STANDARD
            .minimumSources &&
        maxSourceShare !==
          null &&
        maxSourceShare <=
          REVIEW_STANDARD
            .maximumSingleSourceShare;


      /*
      |--------------------------------------------------------------------------
      | Existing authoritative Review V3 analysis
      |--------------------------------------------------------------------------
      */

      let intelligence =
        null;

      try {
        intelligence =
          await getCollegeReviewIntelligenceV3(
            pool,
            {
              collegeId:
                canonical.id,

              branch:
                null,
            }
          );
      }
      catch (
        error
      ) {
        console.warn(
          "[REVIEWS-100] Review V3 analysis unavailable:",
          error?.message
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Aspect presentation
      |--------------------------------------------------------------------------
      */

      const aspectAnalysis =
        {};


      for (
        const aspect
        of ASPECTS
      ) {
        const evidence =
          rows.filter(
            row =>
              row.aspect ===
                aspect &&
              usableReviewRow(
                row
              )
          );


        const distinctIds =
          new Set(
            evidence.map(
              row =>
                String(
                  row.review_item_id
                )
            )
          );


        const distribution = {
          positive: 0,
          neutral: 0,
          mixed: 0,
          negative: 0,
        };


        for (
          const row
          of evidence
        ) {
          const sentiment =
            String(
              row.sentiment ||
              ""
            )
              .trim()
              .toLowerCase();

          if (
            Object.prototype
              .hasOwnProperty.call(
                distribution,
                sentiment
              )
          ) {
            distribution[
              sentiment
            ]++;
          }
        }


        const v3Aspect =
          intelligence
            ?.aspects
            ?.[aspect] ||
          null;


        aspectAnalysis[
          aspect
        ] = {
          score:
            v3Aspect?.score ??
            null,

          sentiment:
            v3Aspect?.sentiment ??
            null,

          reviewCount:
            distinctIds.size,

          sourceCount:
            v3Aspect?.sourceCount ??
            null,

          positive:
            distribution
              .positive,

          neutral:
            distribution
              .neutral,

          mixed:
            distribution
              .mixed,

          negative:
            distribution
              .negative,
        };
      }


      /*
      |--------------------------------------------------------------------------
      | Overall sentiment evidence distribution
      |--------------------------------------------------------------------------
      */

      const overallDistribution = {
        positive: 0,
        neutral: 0,
        mixed: 0,
        negative: 0,
      };


      for (
        const row
        of rows
      ) {
        if (
          !usableReviewRow(
            row
          )
        ) {
          continue;
        }

        const sentiment =
          String(
            row.sentiment ||
            ""
          )
            .trim()
            .toLowerCase();

        if (
          Object.prototype
            .hasOwnProperty.call(
              overallDistribution,
              sentiment
            )
        ) {
          overallDistribution[
            sentiment
          ]++;
        }
      }


      const totalSentiments =
        Object.values(
          overallDistribution
        )
          .reduce(
            (
              total,
              count
            ) =>
              total +
              count,
            0
          );


      const pct =
        count =>
          totalSentiments > 0
            ? Number(
                (
                  (
                    count /
                    totalSentiments
                  ) *
                  100
                ).toFixed(
                  1
                )
              )
            : null;


      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const total =
        reviews.length;

      const totalPages =
        Math.max(
          1,
          Math.ceil(
            total /
            limit
          )
        );


      const safePage =
        Math.min(
          page,
          totalPages
        );


      const start =
        (
          safePage -
          1
        ) *
        limit;


      const pageReviews =
        reviews
          .slice(
            start,
            start +
              limit
          )
          .map(
            review => ({
              id:
                review.id,

              text:
                review.text,

              title:
                review.title,

              source:
                review.source,

              originalSource:
                review.originalSource,

              sourceUrl:
                review.sourceUrl,

              author:
                review.author,

              reviewDate:
                review.reviewDate,

              branch:
                review.branch,

              branchVerified:
                review.branchVerified,

              rating:
                review.rating,

              ratingScale:
                review.ratingScale,

              aspects:
                review.aspects,

              sentiments:
                review.sentiments,
            })
          );


      return res.json({
        ok: true,

        college: {
          requestedId,
          canonicalId:
            canonical.id,

          name:
            canonical.name,

          aliasResolved:
            canonical.id !==
            requestedId,
        },

        standard: {
          ...REVIEW_STANDARD,

          usableReviews,
          independentSources,

          maxSourceShare:
            maxSourceShare ===
            null
              ? null
              : Number(
                  maxSourceShare
                    .toFixed(
                      4
                    )
                ),

          standardMet,

          reviewsNeeded:
            Math.max(
              0,
              REVIEW_STANDARD
                .minimumReviews -
                usableReviews
            ),

          sourcesNeeded:
            Math.max(
              0,
              REVIEW_STANDARD
                .minimumSources -
                independentSources
            ),

          dominantSource:
            largestSource
              ?.source ||
            null,

          sourceDistribution,
        },

        analysis: {
          overallScore:
            standardMet
              ? (
                  intelligence
                    ?.score ??
                  null
                )
              : null,

          provisionalScore:
            intelligence
              ?.score ??
            null,

          status:
            standardMet
              ? "READY"
              : "EVIDENCE_BUILDING",

          positivePercent:
            pct(
              overallDistribution
                .positive
            ),

          neutralPercent:
            pct(
              overallDistribution
                .neutral
            ),

          mixedPercent:
            pct(
              overallDistribution
                .mixed
            ),

          negativePercent:
            pct(
              overallDistribution
                .negative
            ),

          strengths:
            intelligence
              ?.strengths ||
            [],

          concerns:
            intelligence
              ?.concerns ||
            [],

          aspects:
            aspectAnalysis,
        },

        pagination: {
          page:
            safePage,

          limit,

          total,

          totalPages,

          hasMore:
            safePage <
            totalPages,
        },

        reviews:
          pageReviews,
      });
    }
    catch (
      error
    ) {
      next(
        error
      );
    }
  }
);


export default router;
