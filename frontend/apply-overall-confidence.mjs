import fs from 'node:fs';

const path =
  './src/components/RecommendationSlide.CWREC10.jsx';

let text =
  fs.readFileSync(
    path,
    'utf8'
  );

if (
  text.includes(
    'function getOverallConfidenceMeta'
  )
) {
  console.log(
    'Overall Confidence already installed.'
  );

  process.exit(0);
}

const marker = `/*
|--------------------------------------------------------------------------
| CW-REC 1.0 MATCH SCORE NORMALIZATION
|--------------------------------------------------------------------------
`;

if (!text.includes(marker)) {
  throw new Error(
    'MATCH SCORE NORMALIZATION marker not found.'
  );
}

const confidenceBlock = `
/*
|--------------------------------------------------------------------------
| CW-REC 1.0 OVERALL CONFIDENCE
|--------------------------------------------------------------------------
|
| Match Score and Confidence Score remain separate.
|--------------------------------------------------------------------------
*/

const OVERALL_CONFIDENCE_WEIGHTS = {
  admission: 40,
  quality: 25,
  reviews: 15,
  budget: 10,
  branch: 5,
  location: 5,
};


function getConfidenceLabel(score) {
  const value =
    num(score);

  if (value === null) {
    return 'Limited Confidence';
  }

  if (value >= 85) {
    return 'High Confidence';
  }

  if (value >= 65) {
    return 'Moderate Confidence';
  }

  return 'Limited Confidence';
}


function normalizeStatus(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const normalized =
    String(value)
      .trim()
      .toUpperCase()
      .replace(
        /[\\\\s-]+/g,
        '_'
      );

  if (
    normalized ===
      'NOT_APPLICABLE' ||
    normalized === 'NA' ||
    normalized === 'N_A'
  ) {
    return 'NOT_APPLICABLE';
  }

  if (
    normalized ===
      'UNAVAILABLE' ||
    normalized ===
      'MISSING' ||
    normalized ===
      'PENDING' ||
    normalized ===
      'DATA_PENDING'
  ) {
    return 'UNAVAILABLE';
  }

  if (
    normalized ===
      'AVAILABLE' ||
    normalized ===
      'VERIFIED' ||
    normalized ===
      'READY'
  ) {
    return 'AVAILABLE';
  }

  return null;
}


function getFirstConfidence(
  ...values
) {
  for (const value of values) {
    const number =
      num(value);

    if (number !== null) {
      return clamp(number);
    }
  }

  return null;
}


function getQualityConfidenceMeta(
  row
) {
  const status =
    normalizeStatus(
      row?.quality?.status ??
      row?.collegeQuality?.status
    );

  if (
    status ===
    'NOT_APPLICABLE'
  ) {
    return {
      status,
      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      row?.quality?.confidence,
      row?.quality
        ?.confidenceScore,
      row?.collegeQuality
        ?.confidence,
      row?.collegeQuality
        ?.confidenceScore
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const score =
    num(
      row?.quality?.score ??
      row?.collegeQuality?.score ??
      row?.premium
        ?.breakdown
        ?.quality
    );

  return {
    status:
      score !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getReviewConfidenceMeta(
  row
) {
  const review =
    row?.reviewIntelligenceV3 ??
    row?.reviews ??
    null;

  const status =
    normalizeStatus(
      review?.status
    );

  if (
    status ===
    'NOT_APPLICABLE'
  ) {
    return {
      status,
      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      review?.confidence,
      review?.confidenceScore,
      review?.reviewConfidence
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const score =
    num(
      review?.score ??
      row?.premium
        ?.breakdown
        ?.reviews
    );

  return {
    status:
      score !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getBudgetConfidenceMeta(
  row
) {
  const budget =
    row?.budget ??
    row?.budgetFit ??
    null;

  const status =
    normalizeStatus(
      budget?.status
    );

  if (
    status ===
    'NOT_APPLICABLE'
  ) {
    return {
      status,
      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      budget?.confidence,
      budget?.confidenceScore
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const score =
    num(
      budget?.score ??
      row?.premium
        ?.breakdown
        ?.budget
    );

  return {
    status:
      score !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getBranchConfidenceMeta(
  row
) {
  const branchFit =
    row?.branchFit ??
    row?.branch_fit ??
    null;

  const status =
    normalizeStatus(
      branchFit?.status
    );

  if (
    status ===
    'NOT_APPLICABLE'
  ) {
    return {
      status,
      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      branchFit?.confidence,
      branchFit?.confidenceScore,
      branchFit
        ?.mappingConfidence
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const structuredScore =
    num(
      branchFit?.score
    );

  if (structuredScore !== null) {
    return {
      status: 'AVAILABLE',
      confidence: 100,
    };
  }

  const legacy =
    num(
      row?.premium
        ?.breakdown
        ?.branch
    );

  return {
    status:
      legacy !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getLocationConfidenceMeta(
  row
) {
  const location =
    row?.locationFit ??
    row?.location ??
    null;

  const mode =
    String(
      location?.mode ??
      row?.locationMode ??
      ''
    )
      .trim()
      .toUpperCase();

  const status =
    normalizeStatus(
      location?.status
    );

  if (
    status ===
      'NOT_APPLICABLE' ||
    mode === 'NONE'
  ) {
    return {
      status:
        'NOT_APPLICABLE',

      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      location?.confidence,
      location?.confidenceScore
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const structuredScore =
    num(
      location?.score
    );

  if (structuredScore !== null) {
    return {
      status: 'AVAILABLE',
      confidence: 100,
    };
  }

  const legacy =
    num(
      row?.premium
        ?.breakdown
        ?.location
    );

  return {
    status:
      legacy !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getOverallConfidenceMeta(
  row
) {
  const backendConfidence =
    getFirstConfidence(
      row?.confidenceScore,
      row?.overallConfidence
        ?.score,
      row?.premium
        ?.overallConfidence
        ?.score
    );

  if (
    backendConfidence !== null
  ) {
    return {
      score:
        backendConfidence,

      label:
        getConfidenceLabel(
          backendConfidence
        ),

      source:
        'backend',
    };
  }

  const admission =
    getAdmissionConfidenceMeta(
      row
    );

  const factors = {
    admission: {
      status: 'AVAILABLE',
      confidence:
        admission.score,
    },

    quality:
      getQualityConfidenceMeta(
        row
      ),

    reviews:
      getReviewConfidenceMeta(
        row
      ),

    budget:
      getBudgetConfidenceMeta(
        row
      ),

    branch:
      getBranchConfidenceMeta(
        row
      ),

    location:
      getLocationConfidenceMeta(
        row
      ),
  };

  let weightedTotal = 0;
  let applicableWeight = 0;

  Object.entries(
    OVERALL_CONFIDENCE_WEIGHTS
  ).forEach(
    ([key, weight]) => {
      const factor =
        factors[key];

      if (
        factor?.status ===
        'NOT_APPLICABLE'
      ) {
        return;
      }

      applicableWeight +=
        weight;

      const confidence =
        factor?.status ===
        'AVAILABLE'
          ? (
              num(
                factor.confidence
              ) ?? 0
            )
          : 0;

      weightedTotal +=
        weight *
        clamp(confidence);
    }
  );

  const score =
    applicableWeight > 0
      ? clamp(
          weightedTotal /
          applicableWeight
        )
      : 0;

  return {
    score,

    label:
      getConfidenceLabel(
        score
      ),

    factors,

    source:
      'frontend-derived',
  };
}


`;

text =
  text.replace(
    marker,
    confidenceBlock +
      marker
  );

const cardAnchor = `  const admissionConfidence =
    getAdmissionConfidenceMeta(row);

`;

if (
  !text.includes(
    cardAnchor
  )
) {
  throw new Error(
    'RecommendationCard admissionConfidence anchor not found.'
  );
}

text =
  text.replace(
    cardAnchor,
    `${cardAnchor}  const overallConfidence =
    getOverallConfidenceMeta(row);

`
  );

const coverageAnchor = `            <b>
              {dataCoverage}%
            </b>
          </span>
`;

if (
  !text.includes(
    coverageAnchor
  )
) {
  throw new Error(
    'Data Coverage UI anchor not found.'
  );
}

text =
  text.replace(
    coverageAnchor,
    `            <b>
              {dataCoverage}%
            </b>
          </span>

          <span
            style={{
              display: 'block',
              marginTop: 4,
              fontSize: 9,
              opacity: 0.82,
            }}
          >
            Confidence:{' '}

            <b>
              {overallConfidence.label}
              {' · '}
              {Math.round(
                overallConfidence.score
              )}
              /100
            </b>
          </span>
`
  );

fs.writeFileSync(
  path,
  text,
  'utf8'
);

console.log(
  '✅ Overall Confidence installed successfully.'
);