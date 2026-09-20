import {
  getCollegeReviewIntelligenceV3,
} from "./reviewScoringServiceV3.js";


const V4_ASPECTS = [
  "placements",
  "academics",
  "faculty",
  "infrastructure",
  "hostel",
  "campus_life",
  "administration",
  "location",
  "internships",
  "value_for_money",
];


const SENTIMENT_SCORE = {
  positive: 100,
  mixed: 50,
  neutral: 50,
  negative: 0,
};


function normalize(value) {
  return String(
    value ?? ""
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
}


function round1(value) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return null;
  }

  return (
    Math.round(
      number * 10
    ) / 10
  );
}


function numberOrNull(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}


function canonicalAspect(
  value
) {
  const key =
    normalize(value)
      .replace(
        /\s+/g,
        "_"
      );

  const map = {
    placement:
      "placements",

    placements:
      "placements",

    academic:
      "academics",

    academics:
      "academics",

    faculty:
      "faculty",

    teaching:
      "faculty",

    infrastructure:
      "infrastructure",

    hostel:
      "hostel",

    campus:
      "campus_life",

    campus_life:
      "campus_life",

    administration:
      "administration",

    management:
      "administration",

    location:
      "location",

    internship:
      "internships",

    internships:
      "internships",

    fee:
      "value_for_money",

    fees:
      "value_for_money",

    roi:
      "value_for_money",

    value_for_money:
      "value_for_money",
  };

  return (
    map[key] ||
    null
  );
}


function canonicalSentiment(
  value
) {
  const sentiment =
    normalize(value)
      .replace(
        /\s+/g,
        "_"
      );

  if (
    [
      "positive",
      "negative",
      "mixed",
      "neutral",
    ].includes(
      sentiment
    )
  ) {
    return sentiment;
  }

  return null;
}


function monthsOld(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const now =
    new Date();

  return Math.max(
    0,
    (
      now.getFullYear() -
      date.getFullYear()
    ) *
      12 +
      (
        now.getMonth() -
        date.getMonth()
      )
  );
}


function recencyWeight(
  value
) {
  const months =
    monthsOld(value);

  if (
    months === null
  ) {
    return 0.5;
  }

  if (
    months <= 12
  ) {
    return 1;
  }

  if (
    months <= 24
  ) {
    return 0.85;
  }

  if (
    months <= 48
  ) {
    return 0.65;
  }

  return 0.45;
}


function branchMatches(
  requestedBranch,
  candidate
) {
  const requested =
    normalize(
      requestedBranch
    );

  const evidence =
    normalize(
      candidate
    );

  if (
    !requested ||
    !evidence
  ) {
    return false;
  }

  if (
    requested ===
      evidence ||
    requested.includes(
      evidence
    ) ||
    evidence.includes(
      requested
    )
  ) {
    return true;
  }

  const aliases = [
    [
      "computer science and engineering",
      "cse",
    ],

    [
      "electronics and communication engineering",
      "ece",
    ],

    [
      "electrical engineering",
      "ee",
    ],

    [
      "mechanical engineering",
      "me",
    ],

    [
      "civil engineering",
      "ce",
    ],

    [
      "information technology",
      "it",
    ],
  ];

  for (
    const [
      full,
      short,
    ]
    of aliases
  ) {
    const a =
      requested.includes(
        full
      ) ||
      requested === short;

    const b =
      evidence.includes(
        full
      ) ||
      evidence === short;

    if (
      a &&
      b
    ) {
      return true;
    }
  }

  return false;
}


function resolveScope(
  row,
  requestedBranch
) {
  const rawScope =
    normalize(
      row.scope
    );

  const candidateBranch =
    row.target_branch ||
    row.branch_text ||
    "";

  const branchScoped =
    rawScope.includes(
      "branch"
    ) ||
    row.branch_verified ===
      true;

  if (
    branchScoped
  ) {
    if (
      !requestedBranch
    ) {
      return {
        usable: true,
        scope: "branch",
      };
    }

    return {
      usable:
        branchMatches(
          requestedBranch,
          candidateBranch
        ),

      scope:
        "branch",
    };
  }

  const programmeScoped =
    rawScope.includes(
      "programme"
    ) ||
    rawScope.includes(
      "program"
    ) ||
    row.course_verified ===
      true;

  if (
    programmeScoped
  ) {
    return {
      usable: true,
      scope:
        "programme",
    };
  }

  return {
    usable: true,
    scope:
      "college",
  };
}


function sourceKey(
  row
) {
  if (
    row.source_id
  ) {
    return (
      `id:${row.source_id}`
    );
  }

  const name =
    normalize(
      row.source_name
    );

  return name
    ? `name:${name}`
    : null;
}


function sourceQuality(
  row
) {
  const type =
    normalize(
      row.source_type
    );

  const name =
    normalize(
      row.source_name
    );

  const strength =
    normalize(
      row.evidence_strength
    );

  if (
    strength.includes(
      "strong"
    ) ||
    strength.includes(
      "verified"
    ) ||
    strength.includes(
      "full review"
    )
  ) {
    return "strong";
  }

  if (
    type.includes(
      "review"
    ) ||
    type.includes(
      "platform"
    ) ||
    name.includes(
      "google"
    ) ||
    name.includes(
      "shiksha"
    ) ||
    name.includes(
      "collegedunia"
    ) ||
    name.includes(
      "careers360"
    )
  ) {
    return "structured";
  }

  if (
    type.includes(
      "community"
    ) ||
    type.includes(
      "forum"
    ) ||
    name.includes(
      "reddit"
    ) ||
    name.includes(
      "quora"
    )
  ) {
    return "community";
  }

  return "limited";
}


function distributionFor(
  rows
) {
  const result = {
    positive: 0,
    negative: 0,
    mixed: 0,
    neutral: 0,
  };

  for (
    const row of rows
  ) {
    if (
      Object.prototype
        .hasOwnProperty.call(
          result,
          row.sentiment
        )
    ) {
      result[
        row.sentiment
      ] += 1;
    }
  }

  return result;
}


function sentimentLabel(
  distribution
) {
  const total =
    Object.values(
      distribution
    ).reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    );

  if (!total) {
    return "No evidence";
  }

  const positive =
    distribution.positive /
    total;

  const negative =
    distribution.negative /
    total;

  const mixed =
    distribution.mixed /
    total;

  if (
    positive >= 0.6
  ) {
    return "Positive";
  }

  if (
    negative >= 0.45
  ) {
    return "Concern";
  }

  if (
    mixed >= 0.3 ||
    (
      positive >= 0.25 &&
      negative >= 0.25
    )
  ) {
    return "Mixed";
  }

  return "Neutral / mixed";
}


function consistencyLabel(
  distribution
) {
  const total =
    Object.values(
      distribution
    ).reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    );

  if (
    total < 2
  ) {
    return (
      "Limited evidence"
    );
  }

  const values =
    Object.values(
      distribution
    );

  const largest =
    Math.max(
      ...values
    ) / total;

  const positive =
    distribution.positive /
    total;

  const negative =
    distribution.negative /
    total;

  if (
    total >= 4 &&
    positive >= 0.3 &&
    negative >= 0.3
  ) {
    return (
      "Conflicting evidence"
    );
  }

  if (
    largest >= 0.75
  ) {
    return (
      "Strong agreement"
    );
  }

  if (
    largest >= 0.6
  ) {
    return (
      "Moderate agreement"
    );
  }

  return "Mixed evidence";
}


function averageSentiment(
  rows
) {
  const scores =
    rows
      .map(
        (row) =>
          SENTIMENT_SCORE[
            row.sentiment
          ]
      )
      .filter(
        (value) =>
          Number.isFinite(
            value
          )
      );

  if (
    !scores.length
  ) {
    return null;
  }

  return (
    scores.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    ) /
    scores.length
  );
}


function trendFor(
  rows
) {
  const recent = [];
  const older = [];

  for (
    const row of rows
  ) {
    const months =
      monthsOld(
        row.review_date ||
        row.observed_at
      );

    if (
      months === null
    ) {
      continue;
    }

    if (
      months <= 24
    ) {
      recent.push(row);
    } else {
      older.push(row);
    }
  }

  if (
    recent.length < 2 ||
    older.length < 2
  ) {
    return {
      label:
        "Insufficient dated evidence",

      direction:
        "UNKNOWN",

      change:
        null,

      recentEvidence:
        recent.length,

      olderEvidence:
        older.length,
    };
  }

  const recentScore =
    averageSentiment(
      recent
    );

  const olderScore =
    averageSentiment(
      older
    );

  if (
    recentScore === null ||
    olderScore === null
  ) {
    return {
      label:
        "Insufficient sentiment evidence",

      direction:
        "UNKNOWN",

      change:
        null,

      recentEvidence:
        recent.length,

      olderEvidence:
        older.length,
    };
  }

  const change =
    round1(
      recentScore -
      olderScore
    );

  if (
    change >= 10
  ) {
    return {
      label:
        "Improving",

      direction:
        "IMPROVING",

      change,

      recentEvidence:
        recent.length,

      olderEvidence:
        older.length,
    };
  }

  if (
    change <= -10
  ) {
    return {
      label:
        "Declining",

      direction:
        "DECLINING",

      change,

      recentEvidence:
        recent.length,

      olderEvidence:
        older.length,
    };
  }

  return {
    label:
      "Stable",

    direction:
      "STABLE",

    change,

    recentEvidence:
      recent.length,

    olderEvidence:
      older.length,
  };
}


function representativeEvidence(
  rows,
  limit = 3
) {
  const ranked =
    rows
      .filter(
        (row) =>
          String(
            row.evidence_summary ||
            ""
          ).trim()
      )
      .map(
        (row) => {
          const scopeBonus =
            row.resolved_scope ===
              "branch"
              ? 30
              : row.resolved_scope ===
                  "programme"
                ? 15
                : 0;

          const quality =
            sourceQuality(
              row
            );

          const qualityBonus =
            quality ===
              "strong"
              ? 20
              : quality ===
                  "structured"
                ? 12
                : quality ===
                    "community"
                  ? 6
                  : 2;

          const recentBonus =
            recencyWeight(
              row.review_date ||
              row.observed_at
            ) *
            20;

          return {
            ...row,

            priority:
              scopeBonus +
              qualityBonus +
              recentBonus,
          };
        }
      )
      .sort(
        (a, b) =>
          b.priority -
          a.priority
      );

  const output = [];
  const seen = new Set();

  for (
    const row of ranked
  ) {
    const text =
      String(
        row.evidence_summary
      ).trim();

    const key =
      normalize(text);

    if (
      !key ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    output.push({
      text,

      sentiment:
        row.sentiment,

      scope:
        row.resolved_scope,

      source:
        row.source_name ||
        null,

      sourceType:
        row.source_type ||
        null,

      sourceQuality:
        sourceQuality(
          row
        ),

      evidenceStrength:
        row.evidence_strength ||
        null,

      reviewDate:
        row.review_date ||
        null,

      branch:
        row.target_branch ||
        row.branch_text ||
        null,

      sourceUrl:
        row.source_url ||
        null,
    });

    if (
      output.length >=
      limit
    ) {
      break;
    }
  }

  return output;
}


function confidenceLabel(
  score
) {
  if (
    score >= 75
  ) {
    return "High";
  }

  if (
    score >= 50
  ) {
    return "Medium";
  }

  return "Low";
}


export async function buildReviewIntelligenceV4(
  client,
  {
    collegeId,
    branch = null,
  }
) {
  if (!collegeId) {
    throw new Error(
      "collegeId is required"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Existing V3 remains scoring source-of-truth
  |--------------------------------------------------------------------------
  */

  const reviewV3 =
    await getCollegeReviewIntelligenceV3(
      client,
      {
        collegeId,
        branch,
      }
    );


  /*
  |--------------------------------------------------------------------------
  | Raw source-backed textual evidence
  |--------------------------------------------------------------------------
  */

  const {
    rows: rawRows,
  } =
    await client.query(
      `
      SELECT
        ras.id
          AS evidence_id,

        ras.aspect,
        ras.target_branch,
        ras.scope,
        ras.sentiment,
        ras.evidence_summary,

        cri.id
          AS review_item_id,

        cri.source_url,
        cri.review_date,
        cri.observed_at,
        cri.content_access,
        cri.evidence_strength,
        cri.programme_level,
        cri.course,
        cri.course_verified,
        cri.department,
        cri.branch_text,
        cri.branch_verified,
        cri.duplicate_status,
        cri.rating
          AS review_rating,
        cri.rating_scale
          AS review_rating_scale,

        rs.id
          AS source_id,

        rs.name
          AS source_name,

        rs.source_type

      FROM
        review_aspect_sentiments ras

      JOIN
        college_review_items cri
          ON
            cri.id =
            ras.review_item_id

      LEFT JOIN
        review_sources rs
          ON
            rs.id =
            cri.source_id

      WHERE
        cri.college_id =
        $1

      ORDER BY
        ras.id
      `,
      [
        String(
          collegeId
        ),
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Apply V4 evidence eligibility
  |--------------------------------------------------------------------------
  */

  const usableRows = [];

  for (
    const row of rawRows
  ) {
    const duplicate =
      normalize(
        row.duplicate_status
      )
        .replace(
          /\s+/g,
          "_"
        );

    if (
      duplicate ===
        "confirmed_duplicate" ||
      duplicate ===
        "probable_duplicate"
    ) {
      continue;
    }

    const aspect =
      canonicalAspect(
        row.aspect
      );

    if (!aspect) {
      continue;
    }

    const sentiment =
      canonicalSentiment(
        row.sentiment
      );

    if (!sentiment) {
      continue;
    }

    const resolution =
      resolveScope(
        row,
        branch
      );

    if (
      !resolution.usable
    ) {
      continue;
    }

    usableRows.push({
      ...row,

      aspect,

      sentiment,

      resolved_scope:
        resolution.scope,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | Global evidence metrics
  |--------------------------------------------------------------------------
  */

  const independentSources =
    new Set();

  const sourceQualitySets = {
    strong:
      new Set(),

    structured:
      new Set(),

    community:
      new Set(),

    limited:
      new Set(),
  };

  for (
    const row of usableRows
  ) {
    const key =
      sourceKey(row);

    if (key) {
      independentSources.add(
        key
      );

      sourceQualitySets[
        sourceQuality(
          row
        )
      ].add(
        key
      );
    }
  }


  const datedRows =
    usableRows.filter(
      (row) =>
        monthsOld(
          row.review_date ||
          row.observed_at
        ) !== null
    );


  const recentRows =
    datedRows.filter(
      (row) => {
        const months =
          monthsOld(
            row.review_date ||
            row.observed_at
          );

        return (
          months !== null &&
          months <= 24
        );
      }
    );


  const branchRows =
    usableRows.filter(
      (row) =>
        row.resolved_scope ===
        "branch"
    );


  const programmeRows =
    usableRows.filter(
      (row) =>
        row.resolved_scope ===
        "programme"
    );


  const collegeRows =
    usableRows.filter(
      (row) =>
        row.resolved_scope ===
        "college"
    );


  /*
  |--------------------------------------------------------------------------
  | Available aspects come from V3 score engine
  |--------------------------------------------------------------------------
  */

  const availableAspects =
    Array.isArray(
      reviewV3
        ?.evidence
        ?.availableAspects
    )
      ? reviewV3
          .evidence
          .availableAspects
      : Object.entries(
          reviewV3
            ?.aspects ||
            {}
        )
          .filter(
            (
              [
                ,
                value,
              ]
            ) =>
              numberOrNull(
                value?.score
              ) !== null
          )
          .map(
            (
              [
                aspect,
              ]
            ) =>
              aspect
          );


  const missingAspects =
    V4_ASPECTS.filter(
      (aspect) =>
        !availableAspects.includes(
          aspect
        )
    );


  const coveragePercent =
    round1(
      (
        availableAspects.length /
        V4_ASPECTS.length
      ) *
        100
    );


  const recentPercent =
    datedRows.length
      ? round1(
          (
            recentRows.length /
            datedRows.length
          ) *
            100
        )
      : null;


  const branchPercent =
    usableRows.length
      ? round1(
          (
            branchRows.length /
            usableRows.length
          ) *
            100
        )
      : null;


  const recencyWeightedRelevance =
    usableRows.length
      ? round1(
          (
            usableRows.reduce(
              (
                sum,
                row
              ) =>
                sum +
                recencyWeight(
                  row.review_date ||
                  row.observed_at
                ),
              0
            ) /
            usableRows.length
          ) *
            100
        )
      : null;


  /*
  |--------------------------------------------------------------------------
  | Confidence = reliability only
  |--------------------------------------------------------------------------
  |
  | It never changes premium score.
  |
  */

  const evidenceVolumeScore =
    Math.min(
      20,
      Math.sqrt(
        usableRows.length
      ) *
        3
    );


  const sourceScore =
    Math.min(
      20,
      independentSources.size *
        4
    );


  const coverageScore =
    (
      availableAspects.length /
      V4_ASPECTS.length
    ) *
    35;


  const recencyScore =
    recentPercent ===
      null
      ? 5
      : (
          recentPercent /
          100
        ) *
        15;


  const branchScore =
    branchPercent ===
      null
      ? 0
      : (
          branchPercent /
          100
        ) *
        10;


  const confidenceScore =
    round1(
      Math.min(
        100,
        Math.max(
          0,

          evidenceVolumeScore +
          sourceScore +
          coverageScore +
          recencyScore +
          branchScore
        )
      )
    );


  /*
  |--------------------------------------------------------------------------
  | Deep aspect analysis
  |--------------------------------------------------------------------------
  */

  const aspects = {};


  for (
    const aspect of
    V4_ASPECTS
  ) {
    const rows =
      usableRows.filter(
        (row) =>
          row.aspect ===
          aspect
      );


    const sources =
      new Set(
        rows
          .map(
            (row) =>
              sourceKey(
                row
              )
          )
          .filter(Boolean)
      );


    const dated =
      rows.filter(
        (row) =>
          monthsOld(
            row.review_date ||
            row.observed_at
          ) !== null
      );


    const recent =
      dated.filter(
        (row) => {
          const months =
            monthsOld(
              row.review_date ||
              row.observed_at
            );

          return (
            months !== null &&
            months <= 24
          );
        }
      );


    const branchEvidence =
      rows.filter(
        (row) =>
          row.resolved_scope ===
          "branch"
      );


    const distribution =
      distributionFor(
        rows
      );


    const v3Aspect =
      reviewV3
        ?.aspects
        ?.[aspect] ||
      {};


    aspects[
      aspect
    ] = {
      score:
        numberOrNull(
          v3Aspect.score
        ),

      sentiment:
        sentimentLabel(
          distribution
        ),

      consistency:
        consistencyLabel(
          distribution
        ),

      evidenceCount:
        rows.length,

      sourceCount:
        sources.size,

      branchSpecificEvidence:
        branchEvidence.length,

      branchSpecificPercent:
        rows.length
          ? round1(
              (
                branchEvidence.length /
                rows.length
              ) *
                100
            )
          : null,

      recentEvidence:
        recent.length,

      recentEvidencePercent:
        dated.length
          ? round1(
              (
                recent.length /
                dated.length
              ) *
                100
            )
          : null,

      sentimentDistribution:
        distribution,

      trend:
        trendFor(
          rows
        ),

      channelsUsed:
        Array.isArray(
          v3Aspect
            ?.channelsUsed
        )
          ? v3Aspect
              .channelsUsed
          : [],

      representativeEvidence:
        representativeEvidence(
          rows,
          3
        ),
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Strength / concern summaries
  |--------------------------------------------------------------------------
  */

  const ranked =
    Object.entries(
      aspects
    )
      .filter(
        (
          [
            ,
            value,
          ]
        ) =>
          value.score !==
          null
      )
      .sort(
        (
          a,
          b
        ) =>
          b[1].score -
          a[1].score
      );


  const strengths =
    ranked
      .filter(
        (
          [
            ,
            value,
          ]
        ) =>
          value.score >=
          65
      )
      .slice(
        0,
        4
      )
      .map(
        (
          [
            aspect,
            value,
          ]
        ) => ({
          aspect,

          score:
            value.score,

          sentiment:
            value.sentiment,

          confidence:
            value.consistency,
        })
      );


  const concerns =
    ranked
      .filter(
        (
          [
            ,
            value,
          ]
        ) =>
          value.score <
          55
      )
      .sort(
        (
          a,
          b
        ) =>
          a[1].score -
          b[1].score
      )
      .slice(
        0,
        4
      )
      .map(
        (
          [
            aspect,
            value,
          ]
        ) => ({
          aspect,

          score:
            value.score,

          sentiment:
            value.sentiment,

          confidence:
            value.consistency,
        })
      );


  /*
  |--------------------------------------------------------------------------
  | What would improve confidence
  |--------------------------------------------------------------------------
  */

  const improvementTriggers = [];


  if (
    independentSources.size <
    3
  ) {
    improvementTriggers.push(
      "More independent review sources would increase evidence confidence."
    );
  }


  if (
    recentPercent ===
      null ||
    recentPercent < 50
  ) {
    improvementTriggers.push(
      "More recent dated student evidence would improve recency confidence."
    );
  }


  if (
    branchPercent ===
      null ||
    branchPercent < 25
  ) {
    improvementTriggers.push(
      "More exact branch-specific evidence would make this analysis more personalized."
    );
  }


  if (
    missingAspects.length
  ) {
    improvementTriggers.push(
      `More evidence for ${missingAspects
        .slice(
          0,
          3
        )
        .map(
          (aspect) =>
            aspect.replace(
              /_/g,
              " "
            )
        )
        .join(
          ", "
        )} would improve coverage.`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Final V4 contract
  |--------------------------------------------------------------------------
  */

  return {
    version:
      "4",

    mode:
      "explanation_only",

    scoringPolicy: {
      affectsPremiumScore:
        false,

      affectsRecommendationOrder:
        false,

      existingReviewComponentPreserved:
        true,

      existingReviewScoreVersion:
        "V3",
    },

    collegeId:
      String(
        collegeId
      ),

    requestedBranch:
      branch,

    reviewScore:
      numberOrNull(
        reviewV3
          ?.score
      ),

    existingReviewComponent:
      numberOrNull(
        reviewV3
          ?.component
      ),

    evidenceConfidence: {
      score:
        confidenceScore,

      label:
        confidenceLabel(
          confidenceScore
        ),
    },

    coverage: {
      availableAspects:
        availableAspects.length,

      totalAspects:
        V4_ASPECTS.length,

      percent:
        coveragePercent,

      usableEvidence:
        usableRows.length,

      independentSources:
        independentSources.size,

      missingAspects,
    },

    recency: {
      datedEvidence:
        datedRows.length,

      recentEvidence:
        recentRows.length,

      recentPercent,

      recencyWeightedRelevance,
    },

    scope: {
      branchSpecific:
        branchRows.length,

      programmeSpecific:
        programmeRows.length,

      collegeWide:
        collegeRows.length,

      branchSpecificPercent:
        branchPercent,
    },

    sourceQuality: {
      strong:
        sourceQualitySets
          .strong.size,

      structured:
        sourceQualitySets
          .structured.size,

      community:
        sourceQualitySets
          .community.size,

      limited:
        sourceQualitySets
          .limited.size,
    },

    aspects,

    strengths,

    concerns,

    missingAspects,

    improvementTriggers,

    warnings:
      Array.isArray(
        reviewV3
          ?.warnings
      )
        ? reviewV3
            .warnings
        : [],
  };
}