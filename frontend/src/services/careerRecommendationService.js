import {
  CAREER_ASSESSMENT_QUESTIONS,
  CAREER_FAMILIES,
  TRAIT_LABELS,
  VALIDATION_PAIRS,
} from '../data/careerData';

/*
|--------------------------------------------------------------------------
| Component weights
|--------------------------------------------------------------------------
*/

export const CAREER_SCORE_WEIGHTS = {
  interest: 0.30,
  strength: 0.20,
  academic: 0.20,
  work: 0.10,
  values: 0.10,
  practical: 0.10,
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function clamp(
  value,
  min = 0,
  max = 100
) {
  return Math.min(
    max,
    Math.max(
      min,
      Number(value) || 0
    )
  );
}

function average(values) {
  const valid =
    values.filter(
      (value) =>
        Number.isFinite(
          Number(value)
        )
    );

  if (!valid.length) {
    return 0;
  }

  return (
    valid.reduce(
      (
        sum,
        value
      ) =>
        sum +
        Number(value),
      0
    ) /
    valid.length
  );
}

function answerToScore(
  answer
) {
  const numeric =
    Number(answer);

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return 0;
  }

  /*
  | 1 => 0
  | 2 => 25
  | 3 => 50
  | 4 => 75
  | 5 => 100
  */

  return clamp(
    (
      numeric -
      1
    ) *
      25
  );
}

function unique(
  values
) {
  return [
    ...new Set(
      values.filter(Boolean)
    ),
  ];
}

/*
|--------------------------------------------------------------------------
| Build trait scores
|--------------------------------------------------------------------------
*/

export function buildTraitScores(
  answers = {}
) {
  const grouped = {};

  CAREER_ASSESSMENT_QUESTIONS.forEach(
    (
      question
    ) => {
      const raw =
        answers[
          question.id
        ];

      if (
        raw === undefined ||
        raw === null
      ) {
        return;
      }

      const score =
        answerToScore(
          raw
        );

      const trait =
        question.trait;

      if (!grouped[trait]) {
        grouped[trait] =
          [];
      }

      grouped[
        trait
      ].push(
        score
      );
    }
  );

  const result = {};

  Object.entries(
    grouped
  ).forEach(
    (
      [
        trait,
        values,
      ]
    ) => {
      result[
        trait
      ] =
        Math.round(
          average(
            values
          )
        );
    }
  );

  return result;
}

/*
|--------------------------------------------------------------------------
| Dimension scores for a career
|--------------------------------------------------------------------------
*/

function calculateTraitGroupScore(
  requiredTraits,
  traitScores
) {
  const traits =
    Array.isArray(
      requiredTraits
    )
      ? requiredTraits
      : [];

  if (!traits.length) {
    return 50;
  }

  const scores =
    traits.map(
      (trait) => {
        const value =
          traitScores[
            trait
          ];

        if (
          value ===
          undefined
        ) {
          return 50;
        }

        return value;
      }
    );

  return Math.round(
    average(scores)
  );
}

/*
|--------------------------------------------------------------------------
| Academic subject compatibility
|--------------------------------------------------------------------------
*/

function calculateSubjectCompatibility(
  career,
  profile
) {
  const currentClass =
    String(
      profile?.currentClass ||
        ''
    );

  /*
  | Before Class 11 we do not penalize
  | students because stream selection
  | may not have happened yet.
  */

  if (
    currentClass ===
      'Class 8' ||
    currentClass ===
      'Class 9' ||
    currentClass ===
      'Class 10'
  ) {
    return 100;
  }

  const selected =
    Array.isArray(
      profile?.subjects
    )
      ? profile.subjects
      : [];

  if (!selected.length) {
    return 75;
  }

  const needed =
    Array.isArray(
      career.subjects
    )
      ? career.subjects
      : [];

  if (!needed.length) {
    return 100;
  }

  const selectedSet =
    new Set(
      selected.map(
        (subject) =>
          subject.toLowerCase()
      )
    );

  const matched =
    needed.filter(
      (subject) =>
        selectedSet.has(
          subject.toLowerCase()
        )
    ).length;

  return Math.round(
    (
      matched /
      needed.length
    ) *
      100
  );
}

/*
|--------------------------------------------------------------------------
| Stream compatibility
|--------------------------------------------------------------------------
*/

function calculateStreamCompatibility(
  career,
  profile
) {
  const selectedStream =
    String(
      profile?.stream ||
        ''
    ).trim();

  if (
    !selectedStream ||
    selectedStream ===
      'Not selected yet'
  ) {
    return 100;
  }

  const careerStreams =
    Array.isArray(
      career.streams
    )
      ? career.streams
      : [];

  const normalized =
    selectedStream.toLowerCase();

  const anyStream =
    careerStreams.some(
      (item) =>
        item
          .toLowerCase()
          .includes(
            'any stream'
          )
    );

  if (anyStream) {
    return 100;
  }

  const exact =
    careerStreams.some(
      (item) => {
        const lower =
          item.toLowerCase();

        if (
          normalized.includes(
            'pcm'
          ) &&
          lower.includes(
            'pcm'
          )
        ) {
          return true;
        }

        if (
          normalized.includes(
            'pcb'
          ) &&
          lower.includes(
            'pcb'
          )
        ) {
          return true;
        }

        if (
          normalized.includes(
            'pcmb'
          ) &&
          (
            lower.includes(
              'pcm'
            ) ||
            lower.includes(
              'pcb'
            ) ||
            lower.includes(
              'pcmb'
            )
          )
        ) {
          return true;
        }

        if (
          normalized.includes(
            'commerce'
          ) &&
          lower.includes(
            'commerce'
          )
        ) {
          return true;
        }

        if (
          (
            normalized.includes(
              'humanities'
            ) ||
            normalized.includes(
              'arts'
            )
          ) &&
          (
            lower.includes(
              'humanities'
            ) ||
            lower.includes(
              'arts'
            )
          )
        ) {
          return true;
        }

        if (
          normalized.includes(
            'vocational'
          ) &&
          (
            lower.includes(
              'vocational'
            ) ||
            lower.includes(
              'diploma'
            )
          )
        ) {
          return true;
        }

        return false;
      }
    );

  if (exact) {
    return 100;
  }

  /*
  | Not zero because alternative
  | pathways can exist.
  */

  return 45;
}

/*
|--------------------------------------------------------------------------
| Practical compatibility
|--------------------------------------------------------------------------
*/

function calculatePracticalScore(
  career,
  practical
) {
  const requirements =
    career.practical ||
    {};

  const keys = [
    'studyCommitment',
    'budgetFlexibility',
    'locationFlexibility',
    'competitiveExam',
  ];

  const values =
    keys.map(
      (key) => {
        const studentValue =
          practical?.[
            key
          ];

        if (
          !studentValue
        ) {
          return 70;
        }

        const allowed =
          requirements[
            key
          ] || [];

        if (
          !allowed.length
        ) {
          return 100;
        }

        if (
          allowed.includes(
            studentValue
          )
        ) {
          return 100;
        }

        /*
        | Partial compatibility.
        */

        if (
          key ===
          'studyCommitment'
        ) {
          if (
            studentValue ===
              'medium' &&
            allowed.includes(
              'long'
            )
          ) {
            return 60;
          }

          if (
            studentValue ===
              'long' &&
            allowed.includes(
              'medium'
            )
          ) {
            return 90;
          }
        }

        if (
          key ===
          'budgetFlexibility'
        ) {
          if (
            studentValue ===
              'moderate'
          ) {
            return 70;
          }

          if (
            studentValue ===
              'limited'
          ) {
            return 50;
          }
        }

        if (
          key ===
          'locationFlexibility'
        ) {
          if (
            studentValue ===
              'state' &&
            allowed.includes(
              'anywhere'
            )
          ) {
            return 70;
          }

          if (
            studentValue ===
              'local'
          ) {
            return 45;
          }
        }

        if (
          key ===
          'competitiveExam'
        ) {
          if (
            studentValue ===
              'maybe'
          ) {
            return 70;
          }

          if (
            studentValue ===
              'avoid'
          ) {
            return 40;
          }
        }

        return 55;
      }
    );

  return Math.round(
    average(values)
  );
}

/*
|--------------------------------------------------------------------------
| Weighted score
|--------------------------------------------------------------------------
*/

function calculateOverall(
  components
) {
  const weighted =
    components.interest *
      CAREER_SCORE_WEIGHTS.interest +
    components.strength *
      CAREER_SCORE_WEIGHTS.strength +
    components.academic *
      CAREER_SCORE_WEIGHTS.academic +
    components.work *
      CAREER_SCORE_WEIGHTS.work +
    components.values *
      CAREER_SCORE_WEIGHTS.values +
    components.practical *
      CAREER_SCORE_WEIGHTS.practical;

  return Math.round(
    clamp(weighted)
  );
}

/*
|--------------------------------------------------------------------------
| Match label
|--------------------------------------------------------------------------
*/

export function getMatchLabel(
  score
) {
  if (score >= 85) {
    return 'Strong Match';
  }

  if (score >= 72) {
    return 'Good Match';
  }

  if (score >= 60) {
    return 'Worth Exploring';
  }

  return 'Low Current Alignment';
}

/*
|--------------------------------------------------------------------------
| Why reasons
|--------------------------------------------------------------------------
*/

function buildReasons(
  career,
  traitScores,
  components
) {
  const candidateTraits =
    unique([
      ...(
        career.profile
          ?.interest ||
        []
      ),

      ...(
        career.profile
          ?.strength ||
        []
      ),

      ...(
        career.profile
          ?.academic ||
        []
      ),

      ...(
        career.profile
          ?.work ||
        []
      ),

      ...(
        career.profile
          ?.values ||
        []
      ),
    ]);

  const strongestTraits =
    candidateTraits
      .map(
        (trait) => ({
          trait,
          score:
            traitScores[
              trait
            ] ?? 50,
        })
      )
      .filter(
        (item) =>
          item.score >= 65
      )
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      )
      .slice(
        0,
        4
      );

  const reasons =
    strongestTraits.map(
      (item) =>
        `Your responses show relatively strong ${(
          TRAIT_LABELS[
            item.trait
          ] ||
          item.trait
        ).toLowerCase()}.`
    );

  if (
    components.academic >=
    75
  ) {
    reasons.push(
      'Your current academic profile is broadly compatible with this direction.'
    );
  }

  if (
    components.practical >=
    80
  ) {
    reasons.push(
      'Your practical preferences are compatible with the typical education and career pathway.'
    );
  }

  return unique(
    reasons
  ).slice(
    0,
    5
  );
}

/*
|--------------------------------------------------------------------------
| Cautions
|--------------------------------------------------------------------------
*/

function buildCautions(
  career,
  components
) {
  const cautions = [
    ...(
      career.cautions ||
      []
    ),
  ];

  if (
    components.academic <
    55
  ) {
    cautions.unshift(
      'Your current academic alignment with this pathway is weaker, so subject preparation or an alternative route may be needed.'
    );
  }

  if (
    components.practical <
    55
  ) {
    cautions.unshift(
      'Some education or lifestyle requirements of this career may not currently match your stated preferences.'
    );
  }

  return unique(
    cautions
  ).slice(
    0,
    3
  );
}

/*
|--------------------------------------------------------------------------
| Confidence
|--------------------------------------------------------------------------
*/

export function calculateAssessmentConfidence(
  answers = {}
) {
  const total =
    CAREER_ASSESSMENT_QUESTIONS.length;

  const answered =
    CAREER_ASSESSMENT_QUESTIONS.filter(
      (question) =>
        answers[
          question.id
        ] !==
          undefined &&
        answers[
          question.id
        ] !== null
    ).length;

  const completion =
    total
      ? answered /
        total
      : 0;

  const consistencyValues =
    VALIDATION_PAIRS.map(
      (
        [
          first,
          second,
        ]
      ) => {
        const a =
          Number(
            answers[first]
          );

        const b =
          Number(
            answers[second]
          );

        if (
          !a ||
          !b
        ) {
          return null;
        }

        const difference =
          Math.abs(
            a -
            b
          );

        return clamp(
          100 -
            difference *
              25
        );
      }
    ).filter(
      (
        value
      ) =>
        value !==
        null
    );

  const consistency =
    consistencyValues.length
      ? average(
          consistencyValues
        )
      : 70;

  const confidenceScore =
    Math.round(
      completion *
        70 +
        (
          consistency /
          100
        ) *
          30
    );

  let label =
    'Low';

  if (
    confidenceScore >=
    85
  ) {
    label =
      'High';
  } else if (
    confidenceScore >=
    68
  ) {
    label =
      'Moderate';
  }

  return {
    score:
      confidenceScore,

    label,

    completion:
      Math.round(
        completion *
          100
      ),

    consistency:
      Math.round(
        consistency
      ),
  };
}

/*
|--------------------------------------------------------------------------
| Main career match function
|--------------------------------------------------------------------------
*/

export function calculateCareerMatches({
  answers = {},
  profile = {},
  practical = {},
} = {}) {
  const traitScores =
    buildTraitScores(
      answers
    );

  const results =
    CAREER_FAMILIES.map(
      (career) => {
        const interest =
          calculateTraitGroupScore(
            career.profile
              ?.interest,
            traitScores
          );

        const strength =
          calculateTraitGroupScore(
            career.profile
              ?.strength,
            traitScores
          );

        const academicTrait =
          calculateTraitGroupScore(
            career.profile
              ?.academic,
            traitScores
          );

        const subjectCompatibility =
          calculateSubjectCompatibility(
            career,
            profile
          );

        const streamCompatibility =
          calculateStreamCompatibility(
            career,
            profile
          );

        const academic =
          Math.round(
            academicTrait *
              0.70 +
              subjectCompatibility *
                0.15 +
              streamCompatibility *
                0.15
          );

        const work =
          calculateTraitGroupScore(
            career.profile
              ?.work,
            traitScores
          );

        const values =
          calculateTraitGroupScore(
            career.profile
              ?.values,
            traitScores
          );

        const practicalScore =
          calculatePracticalScore(
            career,
            practical
          );

        const components = {
          interest,
          strength,
          academic,
          work,
          values,
          practical:
            practicalScore,
        };

        const overallScore =
          calculateOverall(
            components
          );

        return {
          ...career,

          overallScore,

          matchLabel:
            getMatchLabel(
              overallScore
            ),

          components,

          reasons:
            buildReasons(
              career,
              traitScores,
              components
            ),

          cautions:
            buildCautions(
              career,
              components
            ),

          streamCompatibility,

          subjectCompatibility,
        };
      }
    );

  return {
    traitScores,

    confidence:
      calculateAssessmentConfidence(
        answers
      ),

    matches:
      results.sort(
        (
          a,
          b
        ) =>
          b.overallScore -
          a.overallScore
      ),
  };
}

/*
|--------------------------------------------------------------------------
| Student summary
|--------------------------------------------------------------------------
*/

export function buildStudentSummary(
  traitScores
) {
  const strengthTraits = [
    'logicalReasoning',
    'numerical',
    'problemSolving',
    'creativity',
    'communication',
    'leadership',
    'empathy',
    'observation',
  ];

  const orientationTraits = [
    'technology',
    'science',
    'business',
    'creative',
    'socialHelping',
    'lawGovernance',
    'research',
    'practical',
    'communication',
    'outdoor',
    'entrepreneurship',
  ];

  const topStrengths =
    strengthTraits
      .map(
        (trait) => ({
          trait,
          label:
            TRAIT_LABELS[
              trait
            ] ||
            trait,

          score:
            traitScores[
              trait
            ] ?? 0,
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      )
      .slice(
        0,
        4
      );

  const topOrientations =
    orientationTraits
      .map(
        (trait) => ({
          trait,

          label:
            TRAIT_LABELS[
              trait
            ] ||
            trait,

          score:
            traitScores[
              trait
            ] ?? 0,
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      )
      .slice(
        0,
        2
      );

  return {
    topStrengths,
    topOrientations,
  };
}