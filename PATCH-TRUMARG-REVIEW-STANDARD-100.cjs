const fs = require("fs");
const path = require("path");

const root = process.cwd();

const backendServer =
  path.join(
    root,
    "backend/src/server.js"
  );

const backendRoute =
  path.join(
    root,
    "backend/src/routes/reviews.js"
  );

const frontendService =
  path.join(
    root,
    "frontend/src/services/reviewStandard100Service.js"
  );

const frontendPanel =
  path.join(
    root,
    "frontend/src/components/ReviewStandard100Panel.jsx"
  );

const recommendationSlide =
  path.join(
    root,
    "frontend/src/components/RecommendationSlide.jsx"
  );


function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `FILE NOT FOUND: ${file}`
    );
  }

  return fs
    .readFileSync(
      file,
      "utf8"
    )
    .replace(
      /^\uFEFF/,
      ""
    );
}


function write(file, text) {
  fs.mkdirSync(
    path.dirname(file),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    file,
    text,
    "utf8"
  );
}


function backup(file, label) {
  if (!fs.existsSync(file)) {
    return null;
  }

  const target =
    `${file}.before-${label}-${Date.now()}.bak`;

  fs.copyFileSync(
    file,
    target
  );

  console.log(
    "BACKUP:",
    path.relative(
      root,
      target
    )
  );

  return target;
}


/*
|--------------------------------------------------------------------------
| 1. BACKEND REVIEWS API
|--------------------------------------------------------------------------
*/

backup(
  backendRoute,
  "review100"
);

write(
  backendRoute,
`import { Router } from "express";
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
        /\\s+/g,
        " "
      )
      .trim();

  text =
    text.replace(
      /^nit\\s+/,
      "national institute of technology "
    );

  text =
    text.replace(
      /^national institute technology\\s+/,
      "national institute of technology "
    );

  return text
    .replace(
      /\\bthe\\b/g,
      " "
    )
    .replace(
      /\\s+/g,
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
      /\\s+/g,
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
      /\\s+/g,
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
      \`
        SELECT
          id,
          name
        FROM colleges
        WHERE id = $1
        LIMIT 1
      \`,
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
      \`
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
      \`
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
          \`
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
          \`,
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
`
);


/*
|--------------------------------------------------------------------------
| 2. REGISTER BACKEND ROUTE
|--------------------------------------------------------------------------
*/

backup(
  backendServer,
  "review100"
);

let server =
  read(
    backendServer
  );


if (
  !server.includes(
    "reviewsRouter"
  )
) {
  const firstRouteImport =
    server.match(
      /^import\s+\w+Router\s+from\s+['"][^'"]+routes\/[^'"]+['"];\s*$/m
    );

  if (
    !firstRouteImport
  ) {
    throw new Error(
      "Could not locate router imports in backend/src/server.js"
    );
  }

  server =
    server.replace(
      firstRouteImport[0],
      firstRouteImport[0] +
      `\nimport reviewsRouter from './routes/reviews.js';`
    );
}


if (
  !server.includes(
    "'/api/reviews'"
  ) &&
  !server.includes(
    "\"/api/reviews\""
  )
) {
  const notFoundIndex =
    server.search(
      /app\.use\s*\(\s*(?:\(\s*)?(?:req|_req)\s*,\s*(?:res|_res)/m
    );

  if (
    notFoundIndex === -1
  ) {
    throw new Error(
      "Could not locate backend 404 middleware. No server write."
    );
  }

  const mount =
`\napp.use(
  '/api/reviews',
  reviewsRouter
);

`;

  server =
    server.slice(
      0,
      notFoundIndex
    ) +
    mount +
    server.slice(
      notFoundIndex
    );
}


write(
  backendServer,
  server
);


/*
|--------------------------------------------------------------------------
| 3. FRONTEND SERVICE
|--------------------------------------------------------------------------
*/

backup(
  frontendService,
  "review100"
);

write(
  frontendService,
`import {
  API_BASE_URL,
} from './apiClient';


function getApiBase() {
  const value =
    String(
      API_BASE_URL ||
      ''
    )
      .replace(
        /\\/$/,
        ''
      );

  return value;
}


export async function fetchCollegeReviewStandard100(
  collegeId,
  {
    page = 1,
    limit = 10,
  } = {}
) {
  if (!collegeId) {
    throw new Error(
      'collegeId is required'
    );
  }

  const base =
    getApiBase();

  const url =
    base +
    '/reviews/' +
    encodeURIComponent(
      collegeId
    ) +
    '?page=' +
    encodeURIComponent(
      page
    ) +
    '&limit=' +
    encodeURIComponent(
      limit
    );

  const response =
    await fetch(
      url,
      {
        credentials:
          'include',
      }
    );

  const json =
    await response.json();

  if (!response.ok) {
    throw new Error(
      json?.error ||
      'Unable to load student reviews.'
    );
  }

  return json;
}
`
);


/*
|--------------------------------------------------------------------------
| 4. FRONTEND REVIEW PANEL
|--------------------------------------------------------------------------
*/

backup(
  frontendPanel,
  "review100"
);

write(
  frontendPanel,
`import {
  useState,
} from 'react';

import {
  fetchCollegeReviewStandard100,
} from '../services/reviewStandard100Service';


const ASPECT_LABELS = {
  placements:
    'Placements',

  faculty:
    'Faculty',

  academics:
    'Academics',

  infrastructure:
    'Infrastructure',

  hostel:
    'Hostel',

  campus_life:
    'Campus Life',

  administration:
    'Administration',

  internships:
    'Internships',

  value_for_money:
    'Value for Money',

  location:
    'Location',
};


function number(
  value
) {
  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}


function percentText(
  value
) {
  const n =
    number(
      value
    );

  if (n === null) {
    return 'N/A';
  }

  return (
    n.toFixed(
      1
    ) +
    '%'
  );
}


function dateText(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date
    .toLocaleDateString(
      'en-IN',
      {
        year:
          'numeric',

        month:
          'short',

        day:
          'numeric',
      }
    );
}


function Metric({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding:
          '10px 12px',

        border:
          '1px solid #E2E8F0',

        borderRadius:
          12,

        background:
          '#FFFFFF',
      }}
    >
      <div
        style={{
          fontSize:
            10,

          color:
            '#64748B',

          marginBottom:
            4,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          color:
            '#0F172A',

          fontSize:
            14,
        }}
      >
        {value}
      </strong>
    </div>
  );
}


export default function
ReviewStandard100Panel({
  collegeId,
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ''
    );

  const [
    data,
    setData,
  ] =
    useState(
      null
    );

  const [
    reviews,
    setReviews,
  ] =
    useState(
      []
    );

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );


  async function load(
    requestedPage,
    append = false
  ) {
    if (!collegeId) {
      return;
    }

    setLoading(
      true
    );

    setError(
      ''
    );

    try {
      const result =
        await fetchCollegeReviewStandard100(
          collegeId,
          {
            page:
              requestedPage,

            limit:
              10,
          }
        );

      setData(
        result
      );

      setPage(
        result
          ?.pagination
          ?.page ||
        requestedPage
      );

      setReviews(
        previous =>
          append
            ? [
                ...previous,
                ...(
                  result
                    ?.reviews ||
                  []
                ),
              ]
            : (
                result
                  ?.reviews ||
                []
              )
      );
    }
    catch (
      err
    ) {
      setError(
        err?.message ||
        'Unable to load student reviews.'
      );
    }
    finally {
      setLoading(
        false
      );
    }
  }


  async function toggle() {
    const next =
      !open;

    setOpen(
      next
    );

    if (
      next &&
      !data &&
      !loading
    ) {
      await load(
        1,
        false
      );
    }
  }


  const standard =
    data?.standard ||
    null;

  const analysis =
    data?.analysis ||
    null;

  const aspects =
    analysis?.aspects ||
    {};


  return (
    <section
      style={{
        marginTop:
          18,

        border:
          '1px solid #CBD5E1',

        borderRadius:
          16,

        overflow:
          'hidden',

        background:
          '#F8FAFC',
      }}
    >
      <button
        type="button"
        onClick={
          toggle
        }
        style={{
          width:
            '100%',

          border:
            0,

          background:
            'transparent',

          padding:
            '14px 16px',

          display:
            'flex',

          alignItems:
            'center',

          justifyContent:
            'space-between',

          cursor:
            'pointer',

          textAlign:
            'left',
        }}
      >
        <div>
          <strong
            style={{
              display:
                'block',

              color:
                '#0F2454',

              fontSize:
                14,
            }}
          >
            Student Reviews & Analysis
          </strong>

          <span
            style={{
              display:
                'block',

              marginTop:
                3,

              color:
                '#64748B',

              fontSize:
                10.5,
            }}
          >
            TruMarg 100-review evidence standard
          </span>
        </div>

        <strong>
          {open
            ? '−'
            : '+'}
        </strong>
      </button>


      {open && (
        <div
          style={{
            padding:
              '0 16px 16px',
          }}
        >
          {loading &&
            !data && (
            <p>
              Loading student reviews...
            </p>
          )}


          {error && (
            <div
              style={{
                padding:
                  12,

                borderRadius:
                  10,

                background:
                  '#FFF7ED',

                color:
                  '#9A3412',

                fontSize:
                  11,
              }}
            >
              {error}
            </div>
          )}


          {data && (
            <>
              <div
                style={{
                  padding:
                    13,

                  borderRadius:
                    12,

                  background:
                    standard
                      ?.standardMet
                      ? '#ECFDF5'
                      : '#FFF7ED',

                  marginBottom:
                    12,
                }}
              >
                <strong
                  style={{
                    color:
                      '#0F172A',
                  }}
                >
                  {standard
                    ?.usableReviews ??
                    0}
                  {' / 100 '}
                  unique usable reviews
                </strong>

                <div
                  style={{
                    marginTop:
                      5,

                    fontSize:
                      10.5,

                    color:
                      '#475569',
                  }}
                >
                  {
                    standard
                      ?.independentSources ??
                    0
                  } canonical sources
                  {' · '}

                  Max source share:{' '}

                  {standard
                    ?.maxSourceShare ==
                  null
                    ? 'N/A'
                    : percentText(
                        standard
                          .maxSourceShare *
                        100
                      )}
                </div>

                <div
                  style={{
                    marginTop:
                      7,

                    fontSize:
                      11,

                    fontWeight:
                      700,

                    color:
                      standard
                        ?.standardMet
                        ? '#047857'
                        : '#C2410C',
                  }}
                >
                  {standard
                    ?.standardMet
                    ? '✓ 100-review standard met'
                    : (
                        'Evidence building · need ' +
                        (
                          standard
                            ?.reviewsNeeded ??
                          0
                        ) +
                        ' more usable reviews'
                      )}
                </div>
              </div>


              <div
                style={{
                  display:
                    'grid',

                  gridTemplateColumns:
                    'repeat(auto-fit,minmax(120px,1fr))',

                  gap:
                    8,

                  marginBottom:
                    15,
                }}
              >
                <Metric
                  label="Overall Review Score"
                  value={
                    analysis
                      ?.overallScore !=
                    null
                      ? (
                          analysis
                            .overallScore
                            .toFixed(
                              1
                            ) +
                          ' / 100'
                        )
                      : 'N/A'
                  }
                />

                <Metric
                  label="Positive"
                  value={
                    percentText(
                      analysis
                        ?.positivePercent
                    )
                  }
                />

                <Metric
                  label="Neutral"
                  value={
                    percentText(
                      analysis
                        ?.neutralPercent
                    )
                  }
                />

                <Metric
                  label="Negative"
                  value={
                    percentText(
                      analysis
                        ?.negativePercent
                    )
                  }
                />
              </div>


              {!standard
                ?.standardMet &&
                analysis
                  ?.provisionalScore !=
                  null && (
                <div
                  style={{
                    marginBottom:
                      14,

                    padding:
                      10,

                    borderRadius:
                      10,

                    background:
                      '#FFFBEB',

                    color:
                      '#92400E',

                    fontSize:
                      10.5,
                  }}
                >
                  Provisional sentiment score:{' '}

                  <strong>
                    {
                      analysis
                        .provisionalScore
                        .toFixed(
                          1
                        )
                    }
                    /100
                  </strong>

                  . It is not used as the qualified
                  100-review score yet.
                </div>
              )}


              <div
                style={{
                  marginBottom:
                    16,
                }}
              >
                <strong
                  style={{
                    color:
                      '#0F2454',

                    fontSize:
                      12,
                  }}
                >
                  Aspect Analysis
                </strong>

                <div
                  style={{
                    display:
                      'grid',

                    gap:
                      7,

                    marginTop:
                      8,
                  }}
                >
                  {Object.entries(
                    ASPECT_LABELS
                  ).map(
                    ([
                      key,
                      label,
                    ]) => {
                      const item =
                        aspects[
                          key
                        ] ||
                        {};

                      return (
                        <div
                          key={
                            key
                          }
                          style={{
                            display:
                              'grid',

                            gridTemplateColumns:
                              'minmax(120px,1fr) auto auto',

                            gap:
                              8,

                            alignItems:
                              'center',

                            padding:
                              '9px 10px',

                            background:
                              '#FFFFFF',

                            border:
                              '1px solid #E2E8F0',

                            borderRadius:
                              10,
                          }}
                        >
                          <span
                            style={{
                              fontSize:
                                10.5,

                              color:
                                '#334155',
                            }}
                          >
                            {
                              label
                            }
                          </span>

                          <span
                            style={{
                              fontSize:
                                10,

                              color:
                                '#64748B',
                            }}
                          >
                            {
                              item
                                .reviewCount ??
                              0
                            } reviews
                          </span>

                          <strong
                            style={{
                              fontSize:
                                10.5,

                              color:
                                '#0F2454',
                            }}
                          >
                            {
                              item
                                .score ==
                              null
                                ? 'N/A'
                                : (
                                    Number(
                                      item
                                        .score
                                    )
                                      .toFixed(
                                        1
                                      ) +
                                    '/100'
                                  )
                            }
                          </strong>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>


              {Array.isArray(
                analysis
                  ?.strengths
              ) &&
                analysis
                  .strengths
                  .length >
                  0 && (
                <div
                  style={{
                    marginBottom:
                      13,
                  }}
                >
                  <strong
                    style={{
                      fontSize:
                        11,

                      color:
                        '#047857',
                    }}
                  >
                    Strengths
                  </strong>

                  <div
                    style={{
                      marginTop:
                        5,

                      fontSize:
                        10.5,

                      lineHeight:
                        1.55,

                      color:
                        '#334155',
                    }}
                  >
                    {analysis
                      .strengths
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                          >
                            ✓ {
                              typeof item ===
                              'string'
                                ? item
                                : (
                                    item
                                      ?.label ||
                                    item
                                      ?.aspect ||
                                    JSON.stringify(
                                      item
                                    )
                                  )
                            }
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}


              {Array.isArray(
                analysis
                  ?.concerns
              ) &&
                analysis
                  .concerns
                  .length >
                  0 && (
                <div
                  style={{
                    marginBottom:
                      16,
                  }}
                >
                  <strong
                    style={{
                      fontSize:
                        11,

                      color:
                        '#B45309',
                    }}
                  >
                    Concerns
                  </strong>

                  <div
                    style={{
                      marginTop:
                        5,

                      fontSize:
                        10.5,

                      lineHeight:
                        1.55,

                      color:
                        '#334155',
                    }}
                  >
                    {analysis
                      .concerns
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                          >
                            • {
                              typeof item ===
                              'string'
                                ? item
                                : (
                                    item
                                      ?.label ||
                                    item
                                      ?.aspect ||
                                    JSON.stringify(
                                      item
                                    )
                                  )
                            }
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}


              <div>
                <strong
                  style={{
                    color:
                      '#0F2454',

                    fontSize:
                      12,
                  }}
                >
                  Actual Student Reviews
                </strong>

                <div
                  style={{
                    marginTop:
                      8,

                    display:
                      'grid',

                    gap:
                      10,
                  }}
                >
                  {reviews.map(
                    review => (
                      <article
                        key={
                          review.id
                        }
                        style={{
                          padding:
                            12,

                          background:
                            '#FFFFFF',

                          border:
                            '1px solid #E2E8F0',

                          borderRadius:
                            12,
                        }}
                      >
                        <p
                          style={{
                            margin:
                              0,

                            color:
                              '#334155',

                            fontSize:
                              10.5,

                            lineHeight:
                              1.6,
                          }}
                        >
                          {
                            review
                              .text
                          }
                        </p>

                        <div
                          style={{
                            display:
                              'flex',

                            flexWrap:
                              'wrap',

                            gap:
                              6,

                            marginTop:
                              9,

                            fontSize:
                              9.5,

                            color:
                              '#64748B',
                          }}
                        >
                          <strong>
                            Source:{' '}
                            {
                              review
                                .source ||
                              'Unknown'
                            }
                          </strong>

                          {dateText(
                            review
                              .reviewDate
                          ) && (
                            <span>
                              {
                                dateText(
                                  review
                                    .reviewDate
                                )
                              }
                            </span>
                          )}

                          {Array.isArray(
                            review
                              .aspects
                          ) &&
                            review
                              .aspects
                              .length >
                              0 && (
                              <span>
                                {
                                  review
                                    .aspects
                                    .map(
                                      key =>
                                        ASPECT_LABELS[
                                          key
                                        ] ||
                                        key
                                    )
                                    .join(
                                      ', '
                                    )
                                }
                              </span>
                            )}
                        </div>

                        {review
                          .sourceUrl && (
                          <a
                            href={
                              review
                                .sourceUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display:
                                'inline-block',

                              marginTop:
                                7,

                              fontSize:
                                9.5,
                            }}
                          >
                            View source
                          </a>
                        )}
                      </article>
                    )
                  )}
                </div>


                {reviews.length ===
                  0 &&
                  !loading && (
                    <p
                      style={{
                        color:
                          '#64748B',

                        fontSize:
                          10.5,
                      }}
                    >
                      No usable stored review text is available yet.
                    </p>
                  )}


                {data
                  ?.pagination
                  ?.hasMore && (
                  <button
                    type="button"
                    disabled={
                      loading
                    }
                    onClick={
                      () =>
                        load(
                          page +
                            1,
                          true
                        )
                    }
                    style={{
                      marginTop:
                        12,

                      padding:
                        '9px 14px',

                      borderRadius:
                        10,

                      border:
                        '1px solid #CBD5E1',

                      background:
                        '#FFFFFF',

                      cursor:
                        loading
                          ? 'wait'
                          : 'pointer',

                      fontWeight:
                        700,
                    }}
                  >
                    {loading
                      ? 'Loading...'
                      : (
                          'Load More (' +
                          reviews.length +
                          ' of ' +
                          (
                            data
                              ?.pagination
                              ?.total ||
                            0
                          ) +
                          ')'
                        )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
`
);


/*
|--------------------------------------------------------------------------
| 5. PATCH PERSONALIZED RECOMMENDATION UI
|--------------------------------------------------------------------------
*/

backup(
  recommendationSlide,
  "review100"
);

let slide =
  read(
    recommendationSlide
  );


const panelImport =
  `import ReviewStandard100Panel from './ReviewStandard100Panel';`;


if (
  !slide.includes(
    panelImport
  )
) {
  const firstConst =
    slide.search(
      /^const\s+/m
    );

  if (
    firstConst === -1
  ) {
    throw new Error(
      "Could not find first const in RecommendationSlide.jsx"
    );
  }

  slide =
    slide.slice(
      0,
      firstConst
    ) +
    panelImport +
    "\n\n" +
    slide.slice(
      firstConst
    );
}


if (
  !slide.includes(
    "TRUMARG REVIEW STANDARD 100"
  )
) {
  const regex =
    /<ReviewIntelligencePanel\s+reviewV3=\{\s*reviewV3\s*\}\s*\/>/m;

  const match =
    slide.match(
      regex
    );

  if (!match) {
    throw new Error(
      "Existing ReviewIntelligencePanel call not found. No RecommendationSlide write."
    );
  }


  const addition =
`${match[0]}

      {/* ==========================================
          TRUMARG REVIEW STANDARD 100
      ========================================== */}

      <ReviewStandard100Panel
        collegeId={
          row?.collegeId ||
          row?.college_id ||
          row?.college?.id ||
          row?.college?.collegeId ||
          null
        }
      />`;


  slide =
    slide.replace(
      regex,
      addition
    );
}


write(
  recommendationSlide,
  slide
);


console.log("");
console.log("========================================");
console.log("TRUMARG REVIEW STANDARD 100 PATCH DONE");
console.log("========================================");
console.log("");
console.log("Created/updated:");
console.log("backend/src/routes/reviews.js");
console.log("backend/src/server.js");
console.log("frontend/src/services/reviewStandard100Service.js");
console.log("frontend/src/components/ReviewStandard100Panel.jsx");
console.log("frontend/src/components/RecommendationSlide.jsx");
