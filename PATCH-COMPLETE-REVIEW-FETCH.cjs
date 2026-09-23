const fs = require("fs");
const path = require("path");

const root =
  process.cwd();

const files = {
  analyzer:
    path.join(
      root,
      "backend/src/services/reviewEnrichment/reviewTextAnalyzer.js"
    ),

  reddit:
    path.join(
      root,
      "backend/src/services/reviewEnrichment/redditCollector.js"
    ),

  service:
    path.join(
      root,
      "backend/src/services/reviewEnrichment/reviewEnrichmentService.js"
    ),

  route:
    path.join(
      root,
      "backend/src/routes/reviewEnrichment.js"
    ),

  server:
    path.join(
      root,
      "backend/src/server.js"
    ),
};


function ensureDir(
  file
) {
  fs.mkdirSync(
    path.dirname(
      file
    ),
    {
      recursive: true,
    }
  );
}


function write(
  file,
  content
) {
  ensureDir(
    file
  );

  fs.writeFileSync(
    file,
    content,
    "utf8"
  );

  console.log(
    "WRITE:",
    path.relative(
      root,
      file
    )
  );
}


function read(
  file
) {
  if (
    !fs.existsSync(
      file
    )
  ) {
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


function backup(
  file
) {
  if (
    !fs.existsSync(
      file
    )
  ) {
    return;
  }

  const target =
    `${file}.before-review-fetch-${Date.now()}.bak`;

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
}


/* =========================================================
   1. TEXT ANALYZER
========================================================= */

write(
  files.analyzer,
`const ASPECT_RULES = {
  placements: [
    "placement",
    "placements",
    "package",
    "salary",
    "lpa",
    "recruiter",
    "recruiters",
    "company",
    "companies",
    "job offer",
    "job offers",
  ],

  faculty: [
    "faculty",
    "professor",
    "professors",
    "teacher",
    "teachers",
    "teaching",
    "lecturer",
  ],

  academics: [
    "academic",
    "academics",
    "curriculum",
    "syllabus",
    "coursework",
    "exam",
    "exams",
    "grading",
    "study",
  ],

  infrastructure: [
    "infrastructure",
    "laboratory",
    "laboratories",
    "lab ",
    "labs",
    "library",
    "classroom",
    "classrooms",
    "wifi",
    "campus facilities",
  ],

  hostel: [
    "hostel",
    "hostels",
    "mess",
    "room",
    "rooms",
    "warden",
    "accommodation",
  ],

  campus_life: [
    "campus life",
    "fest",
    "festival",
    "club",
    "clubs",
    "society",
    "societies",
    "student life",
    "sports",
    "cultural",
  ],

  administration: [
    "administration",
    "admin",
    "management",
    "office",
    "registration",
    "ragging",
    "bureaucracy",
    "permission",
  ],

  internships: [
    "internship",
    "internships",
    "intern",
    "industrial training",
    "training opportunity",
  ],

  value_for_money: [
    "fees",
    "fee",
    "cost",
    "expensive",
    "affordable",
    "worth",
    "value for money",
    "roi",
    "return on investment",
  ],

  location: [
    "location",
    "city",
    "transport",
    "railway",
    "airport",
    "metro",
    "nearby",
    "connectivity",
    "distance",
  ],
};


const POSITIVE_WORDS =
  new Set([
    "good",
    "great",
    "excellent",
    "amazing",
    "best",
    "strong",
    "helpful",
    "supportive",
    "friendly",
    "beautiful",
    "clean",
    "active",
    "decent",
    "impressive",
    "awesome",
    "positive",
    "affordable",
    "worth",
    "high",
    "better",
    "easy",
    "comfortable",
    "outstanding",
    "reputed",
  ]);


const NEGATIVE_WORDS =
  new Set([
    "bad",
    "poor",
    "worst",
    "terrible",
    "weak",
    "expensive",
    "dirty",
    "toxic",
    "negative",
    "problem",
    "problems",
    "issue",
    "issues",
    "difficult",
    "low",
    "worse",
    "crowded",
    "strict",
    "outdated",
    "slow",
    "ragging",
    "disappointing",
    "average",
  ]);


function clean(
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


function tokenize(
  text
) {
  return clean(
    text
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9\\s]/g,
      " "
    )
    .split(
      /\\s+/
    )
    .filter(
      Boolean
    );
}


export function
detectAspects(
  text
) {
  const normalized =
    clean(
      text
    )
      .toLowerCase();

  const result =
    [];

  for (
    const [
      aspect,
      keywords,
    ]
    of Object.entries(
      ASPECT_RULES
    )
  ) {
    const matched =
      keywords.some(
        keyword =>
          normalized.includes(
            keyword
          )
      );

    if (
      matched
    ) {
      result.push(
        aspect
      );
    }
  }

  return result;
}


export function
detectSentiment(
  text
) {
  const tokens =
    tokenize(
      text
    );

  let positive = 0;
  let negative = 0;

  for (
    const token
    of tokens
  ) {
    if (
      POSITIVE_WORDS.has(
        token
      )
    ) {
      positive++;
    }

    if (
      NEGATIVE_WORDS.has(
        token
      )
    ) {
      negative++;
    }
  }

  if (
    positive > 0 &&
    negative > 0 &&
    Math.abs(
      positive -
      negative
    ) <= 1
  ) {
    return "mixed";
  }

  if (
    positive >
    negative
  ) {
    return "positive";
  }

  if (
    negative >
    positive
  ) {
    return "negative";
  }

  return "neutral";
}


export function
analyzeReviewText(
  text
) {
  const cleaned =
    clean(
      text
    );

  return {
    text:
      cleaned,

    aspects:
      detectAspects(
        cleaned
      ),

    sentiment:
      detectSentiment(
        cleaned
      ),
  };
}
`
);


/* =========================================================
   2. REDDIT COLLECTOR
========================================================= */

write(
  files.reddit,
`let cachedToken = null;
let cachedTokenExpiresAt = 0;


function required(
  name
) {
  const value =
    String(
      process.env[
        name
      ] || ""
    ).trim();

  if (
    !value
  ) {
    throw new Error(
      \`Missing environment variable: \${name}\`
    );
  }

  return value;
}


async function
getAccessToken() {
  const now =
    Date.now();

  if (
    cachedToken &&
    now <
      cachedTokenExpiresAt -
        60_000
  ) {
    return cachedToken;
  }


  const clientId =
    required(
      "REDDIT_CLIENT_ID"
    );

  const clientSecret =
    required(
      "REDDIT_CLIENT_SECRET"
    );


  const auth =
    Buffer
      .from(
        \`\${clientId}:\${clientSecret}\`
      )
      .toString(
        "base64"
      );


  const body =
    new URLSearchParams({
      grant_type:
        "client_credentials",
    });


  const response =
    await fetch(
      "https://www.reddit.com/api/v1/access_token",
      {
        method:
          "POST",

        headers: {
          Authorization:
            \`Basic \${auth}\`,

          "Content-Type":
            "application/x-www-form-urlencoded",

          "User-Agent":
            process.env
              .REDDIT_USER_AGENT ||
            "TruMargReviewCollector/1.0",
        },

        body,
      }
    );


  if (
    !response.ok
  ) {
    const text =
      await response.text();

    throw new Error(
      \`Reddit OAuth failed: \${response.status} \${text}\`
    );
  }


  const json =
    await response.json();


  cachedToken =
    json.access_token;


  cachedTokenExpiresAt =
    now +
    Number(
      json.expires_in ||
      3600
    ) *
      1000;


  return cachedToken;
}


async function
redditGet(
  pathname,
  params = {}
) {
  const token =
    await getAccessToken();


  const url =
    new URL(
      \`https://oauth.reddit.com\${pathname}\`
    );


  for (
    const [
      key,
      value,
    ]
    of Object.entries(
      params
    )
  ) {
    if (
      value !==
      undefined &&
      value !==
      null
    ) {
      url.searchParams.set(
        key,
        String(
          value
        )
      );
    }
  }


  const response =
    await fetch(
      url,
      {
        headers: {
          Authorization:
            \`Bearer \${token}\`,

          "User-Agent":
            process.env
              .REDDIT_USER_AGENT ||
            "TruMargReviewCollector/1.0",
        },
      }
    );


  if (
    !response.ok
  ) {
    const text =
      await response.text();

    throw new Error(
      \`Reddit API failed: \${response.status} \${text}\`
    );
  }


  return response.json();
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


function postToReview(
  post
) {
  const data =
    post?.data ||
    {};

  const title =
    cleanText(
      data.title
    );

  const selftext =
    cleanText(
      data.selftext
    );

  const text =
    cleanText(
      [
        title,
        selftext,
      ]
        .filter(
          Boolean
        )
        .join(
          ". "
        )
    );


  if (
    text.length <
    40
  ) {
    return null;
  }


  return {
    sourceReviewId:
      data.name ||
      (
        data.id
          ? \`t3_\${data.id}\`
          : null
      ),

    url:
      data.permalink
        ? \`https://www.reddit.com\${data.permalink}\`
        : null,

    author:
      data.author ||
      null,

    title:
      title ||
      null,

    text,

    reviewDate:
      data.created_utc
        ? new Date(
            Number(
              data.created_utc
            ) *
              1000
          )
            .toISOString()
        : null,

    subreddit:
      data.subreddit ||
      null,

    redditType:
      "post",

    raw:
      data,
  };
}


function flattenComments(
  children,
  output = []
) {
  for (
    const child
    of children ||
    []
  ) {
    if (
      child?.kind !==
      "t1"
    ) {
      continue;
    }

    const data =
      child.data ||
      {};


    const body =
      cleanText(
        data.body
      );


    if (
      body.length >=
      40 &&
      body !==
      "[deleted]" &&
      body !==
      "[removed]"
    ) {
      output.push({
        sourceReviewId:
          data.name ||
          (
            data.id
              ? \`t1_\${data.id}\`
              : null
          ),

        url:
          data.permalink
            ? \`https://www.reddit.com\${data.permalink}\`
            : null,

        author:
          data.author ||
          null,

        title:
          null,

        text:
          body,

        reviewDate:
          data.created_utc
            ? new Date(
                Number(
                  data.created_utc
                ) *
                  1000
              )
                .toISOString()
            : null,

        subreddit:
          data.subreddit ||
          null,

        redditType:
          "comment",

        raw:
          data,
      });
    }


    const replies =
      data?.replies
        ?.data
        ?.children;

    if (
      Array.isArray(
        replies
      )
    ) {
      flattenComments(
        replies,
        output
      );
    }
  }

  return output;
}


async function
loadComments(
  postId
) {
  if (
    !postId
  ) {
    return [];
  }

  const json =
    await redditGet(
      \`/comments/\${postId}\`,
      {
        limit:
          100,

        depth:
          6,

        raw_json:
          1,
      }
    );


  const commentListing =
    Array.isArray(
      json
    )
      ? json[1]
      : null;


  return flattenComments(
    commentListing
      ?.data
      ?.children ||
    []
  );
}


function uniqueById(
  rows
) {
  const seen =
    new Set();

  const output =
    [];

  for (
    const row
    of rows
  ) {
    const key =
      row
        ?.sourceReviewId ||
      row
        ?.url ||
      row
        ?.text;

    if (
      !key ||
      seen.has(
        key
      )
    ) {
      continue;
    }

    seen.add(
      key
    );

    output.push(
      row
    );
  }

  return output;
}


export async function
collectRedditReviews({
  collegeName,
  aliases = [],
  maxPosts = 40,
  maxReviews = 60,
}) {
  if (
    !collegeName
  ) {
    throw new Error(
      "collegeName is required"
    );
  }


  const queries =
    [
      collegeName,
      ...aliases,
      \`\${collegeName} review\`,
      \`\${collegeName} placements\`,
      \`\${collegeName} hostel\`,
      \`\${collegeName} campus\`,
      \`\${collegeName} faculty\`,
    ]
      .filter(
        Boolean
      );


  const postMap =
    new Map();


  for (
    const query
    of queries
  ) {
    const search =
      await redditGet(
        "/search",
        {
          q:
            query,

          sort:
            "relevance",

          t:
            "all",

          limit:
            100,

          type:
            "link",

          raw_json:
            1,
        }
      );


    const children =
      search
        ?.data
        ?.children ||
      [];


    for (
      const post
      of children
    ) {
      const id =
        post
          ?.data
          ?.id;

      if (
        !id
      ) {
        continue;
      }

      if (
        !postMap.has(
          id
        )
      ) {
        postMap.set(
          id,
          post
        );
      }

      if (
        postMap.size >=
        maxPosts
      ) {
        break;
      }
    }


    if (
      postMap.size >=
      maxPosts
    ) {
      break;
    }
  }


  const collected =
    [];


  for (
    const [
      postId,
      post
    ]
    of postMap
  ) {
    const review =
      postToReview(
        post
      );

    if (
      review
    ) {
      collected.push(
        review
      );
    }


    if (
      collected.length <
      maxReviews
    ) {
      try {
        const comments =
          await loadComments(
            postId
          );

        collected.push(
          ...comments
        );
      }
      catch (
        error
      ) {
        console.warn(
          "[REDDIT COMMENTS]",
          postId,
          error?.message
        );
      }
    }


    if (
      collected.length >=
      maxReviews *
        2
    ) {
      break;
    }
  }


  return uniqueById(
    collected
  )
    .slice(
      0,
      maxReviews
    );
}
`
);


/* =========================================================
   3. ENRICHMENT SERVICE
========================================================= */

write(
  files.service,
`import {
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
        /\\s+/g,
        " "
      )
      .trim();


  s =
    s.replace(
      /^nit\\s+/,
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
      \`
        SELECT
          id,
          name
        FROM colleges
        WHERE id = $1
        LIMIT 1
      \`,
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
      \`
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
      \`
        SELECT id
        FROM review_sources
        WHERE LOWER(name)
          = LOWER($1)
        LIMIT 1
      \`,
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
      \`
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
      \`,
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
      \`
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
      \`,
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
      \`
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
      \`,
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
      \`
        SELECT 1
        FROM
          review_aspect_sentiments

        WHERE
          review_item_id = $1
          AND aspect = $2
          AND sentiment = $3

        LIMIT 1
      \`,
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
    \`
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
    \`,
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
            /\\s+/g,
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
      \`
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
      \`,
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
`
);


/* =========================================================
   4. ROUTES
========================================================= */

write(
  files.route,
`import {
  Router,
} from "express";

import {
  fetchAndIngestReddit,
  ingestReviews,
  getReviewEnrichmentStatus,
} from "../services/reviewEnrichment/reviewEnrichmentService.js";


const router =
  Router();


router.get(
  "/:collegeId/status",
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await getReviewEnrichmentStatus(
          req.params
            .collegeId
        );

      res.json({
        ok: true,
        ...result,
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


router.post(
  "/:collegeId/reddit",
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await fetchAndIngestReddit({
          collegeId:
            req.params
              .collegeId,

          maxReviews:
            req.body
              ?.maxReviews ||
            60,
        });


      res.json({
        ok: true,
        ...result,
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


/*
|--------------------------------------------------------------------------
| Authorized/licensed/manual source import
|--------------------------------------------------------------------------
|
| Use this for:
| - Quora export/data you are authorized to use
| - Shiksha licensed/exported data
| - Collegedunia licensed/exported data
| - Careers360 licensed/exported data
| - GetMyUni
| - CollegeBatch
| - CollegeDekho
| - Zollege
|
| Do NOT fabricate reviews.
|
*/

router.post(
  "/:collegeId/import",
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        source,
        sourceType =
          "rating_platform",

        baseUrl =
          null,

        reviews =
          [],
      } =
        req.body ||
        {};


      if (
        !source
      ) {
        return res
          .status(
            400
          )
          .json({
            error:
              "source is required",
          });
      }


      if (
        !Array.isArray(
          reviews
        )
      ) {
        return res
          .status(
            400
          )
          .json({
            error:
              "reviews must be an array",
          });
      }


      const result =
        await ingestReviews({
          collegeId:
            req.params
              .collegeId,

          source,

          sourceType,

          baseUrl,

          reviews,
        });


      res.json({
        ok: true,
        ...result,
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


/* =========================================================
   5. REGISTER ROUTE
========================================================= */

backup(
  files.server
);

let server =
  read(
    files.server
  );


const importLine =
  `import reviewEnrichmentRouter from './routes/reviewEnrichment.js';`;


if (
  !server.includes(
    importLine
  )
) {
  const matches =
    [
      ...server.matchAll(
        /^import .*? from ['"].*?routes\/.*?['"];\s*$/gm
      ),
    ];


  if (
    matches.length ===
    0
  ) {
    throw new Error(
      "Could not locate route imports in server.js"
    );
  }


  const last =
    matches[
      matches.length -
      1
    ];


  const end =
    last.index +
    last[0].length;


  server =
    server.slice(
      0,
      end
    ) +
    "\n" +
    importLine +
    server.slice(
      end
    );
}


if (
  !server.includes(
    "'/api/review-enrichment'"
  ) &&
  !server.includes(
    "\"/api/review-enrichment\""
  )
) {
  const errorHandlerIndex =
    server.search(
      /app\.use\s*\(\s*\(\s*(?:req|_req)\s*,\s*(?:res|_res)/m
    );


  const generic404 =
    server.search(
      /app\.use\s*\(\s*\(\s*req\s*,\s*res\s*\)\s*=>/m
    );


  const insertAt =
    errorHandlerIndex !==
    -1
      ? errorHandlerIndex
      : generic404;


  if (
    insertAt ===
    -1
  ) {
    throw new Error(
      "Could not locate server 404 middleware."
    );
  }


  const mount =
`
app.use(
  '/api/review-enrichment',
  reviewEnrichmentRouter
);

`;


  server =
    server.slice(
      0,
      insertAt
    ) +
    mount +
    server.slice(
      insertAt
    );
}


write(
  files.server,
  server
);


console.log("");
console.log("======================================");
console.log("TRUMARG COMPLETE REVIEW FETCH CREATED");
console.log("======================================");
