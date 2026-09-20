import {
  CAREER_FAMILIES,
  INDIA_EXAM_CATALOG,
  TRAIT_LABELS,
} from '../data/careerAdaptiveData';


/*
|--------------------------------------------------------------------------
| SCORE NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeLikert(value) {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(numeric)
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      (
        (numeric - 1) /
        4
      ) * 100
    )
  );
}


/*
|--------------------------------------------------------------------------
| BUILD TRAIT SCORES
|--------------------------------------------------------------------------
*/

export function buildTraitScores(
  questions,
  answers
) {
  const buckets = {};

  questions.forEach(
    (question) => {
      const raw =
        answers[
          question.id
        ];

      const score =
        normalizeLikert(raw);

      if (score === null) {
        return;
      }

      if (
        !buckets[
          question.trait
        ]
      ) {
        buckets[
          question.trait
        ] = [];
      }

      buckets[
        question.trait
      ].push(score);
    }
  );

  const result = {};

  Object.entries(
    buckets
  ).forEach(
    ([
      trait,
      values,
    ]) => {
      result[trait] =
        values.reduce(
          (
            total,
            value
          ) =>
            total + value,
          0
        ) /
        values.length;
    }
  );

  return result;
}


/*
|--------------------------------------------------------------------------
| SUBJECT COMPATIBILITY
|--------------------------------------------------------------------------
*/

function normalizeText(value) {
  return String(
    value || ''
  )
    .trim()
    .toLowerCase();
}


function calculateSubjectBonus(
  family,
  basics
) {
  const subjects =
    (
      basics?.subjects ||
      []
    )
      .map(
        normalizeText
      );

  if (
    subjects.length === 0
  ) {
    return 0;
  }

  const name =
    normalizeText(
      family.name
    );

  let bonus = 0;

  if (
    name.includes(
      'computer'
    ) &&
    subjects.some(
      (subject) =>
        subject.includes(
          'computer'
        ) ||
        subject.includes(
          'artificial'
        )
    )
  ) {
    bonus += 4;
  }

  if (
    (
      name.includes(
        'engineering'
      ) ||
      name.includes(
        'architecture'
      ) ||
      name.includes(
        'merchant'
      )
    ) &&
    subjects.includes(
      'mathematics'
    )
  ) {
    bonus += 4;
  }

  if (
    (
      name.includes(
        'medicine'
      ) ||
      name.includes(
        'health'
      )
    ) &&
    subjects.some(
      (subject) =>
        subject.includes(
          'biology'
        )
    )
  ) {
    bonus += 4;
  }

  if (
    (
      name.includes(
        'finance'
      ) ||
      name.includes(
        'business'
      )
    ) &&
    subjects.some(
      (subject) =>
        subject.includes(
          'account'
        ) ||
        subject.includes(
          'business'
        ) ||
        subject.includes(
          'economics'
        )
    )
  ) {
    bonus += 4;
  }

  if (
    (
      name.includes(
        'acting'
      ) ||
      name.includes(
        'film'
      )
    ) &&
    subjects.some(
      (subject) =>
        subject.includes(
          'theatre'
        ) ||
        subject.includes(
          'music'
        ) ||
        subject.includes(
          'dance'
        ) ||
        subject.includes(
          'media'
        )
    )
  ) {
    bonus += 4;
  }

  if (
    (
      name.includes(
        'fine arts'
      ) ||
      name.includes(
        'design'
      ) ||
      name.includes(
        'fashion'
      )
    ) &&
    subjects.some(
      (subject) =>
        subject.includes(
          'art'
        ) ||
        subject.includes(
          'design'
        )
    )
  ) {
    bonus += 4;
  }

  if (
    name.includes(
      'sports'
    ) &&
    subjects.some(
      (subject) =>
        subject.includes(
          'physical'
        )
    )
  ) {
    bonus += 4;
  }

  if (
    name.includes(
      'agriculture'
    ) &&
    subjects.some(
      (subject) =>
        subject.includes(
          'agriculture'
        ) ||
        subject.includes(
          'biology'
        )
    )
  ) {
    bonus += 4;
  }

  return Math.min(
    5,
    bonus
  );
}


/*
|--------------------------------------------------------------------------
| STREAM COMPATIBILITY
|--------------------------------------------------------------------------
*/

function calculateStreamBonus(
  family,
  basics
) {
  const selectedStream =
    normalizeText(
      basics?.stream
    );

  if (
    !selectedStream ||
    selectedStream.includes(
      'not'
    )
  ) {
    return 0;
  }

  const compatible =
    family.streams.some(
      (stream) => {
        const candidate =
          normalizeText(
            stream
          );

        if (
          candidate.includes(
            'any stream'
          )
        ) {
          return true;
        }

        return (
          selectedStream.includes(
            candidate
          ) ||
          candidate.includes(
            selectedStream
          )
        );
      }
    );

  return compatible
    ? 5
    : 0;
}


/*
|--------------------------------------------------------------------------
| FAMILY SCORE
|--------------------------------------------------------------------------
*/

function scoreFamily(
  family,
  traitScores,
  basics
) {
  const available =
    family.traits
      .map(
        (trait) => ({
          trait,
          score:
            traitScores[
              trait
            ],
        })
      )
      .filter(
        (item) =>
          Number.isFinite(
            item.score
          )
      );

  const base =
    available.length > 0
      ? (
          available.reduce(
            (
              total,
              item
            ) =>
              total +
              item.score,
            0
          ) /
          available.length
        )
      : 0;

  const subjectBonus =
    calculateSubjectBonus(
      family,
      basics
    );

  const streamBonus =
    calculateStreamBonus(
      family,
      basics
    );

  const finalScore =
    Math.max(
      0,
      Math.min(
        100,
        base +
          subjectBonus +
          streamBonus
      )
    );

  const strongestTraits =
    available
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        4
      )
      .map(
        (item) => ({
          trait:
            item.trait,

          label:
            TRAIT_LABELS[
              item.trait
            ] ||
            item.trait,

          score:
            Math.round(
              item.score
            ),
        })
      );

  return {
    ...family,

    score:
      Math.round(
        finalScore
      ),

    strongestTraits,

    subjectBonus,

    streamBonus,
  };
}


/*
|--------------------------------------------------------------------------
| CONFIDENCE
|--------------------------------------------------------------------------
*/

function calculateConfidence(
  questions,
  answers
) {
  const answered =
    questions.filter(
      (question) =>
        answers[
          question.id
        ] !==
        undefined
    ).length;

  const completion =
    questions.length > 0
      ? (
          answered /
          questions.length
        ) * 100
      : 0;

  let label =
    'Developing';

  if (completion >= 95) {
    label = 'High';
  } else if (
    completion >= 80
  ) {
    label = 'Moderate';
  }

  return {
    score:
      Math.round(
        completion
      ),

    label,

    explanation:
      'Confidence reflects assessment completion and answer coverage, not scientific certainty.',
  };
}


/*
|--------------------------------------------------------------------------
| EXAMS FOR MATCH
|--------------------------------------------------------------------------
*/

function getFamilyExams(
  family,
  stage
) {
  return (
    INDIA_EXAM_CATALOG
      .filter(
        (exam) =>
          exam.stages.includes(
            stage
          ) &&
          family.examCategories.includes(
            exam.category
          )
      )
      .slice(
        0,
        10
      )
  );
}


/*
|--------------------------------------------------------------------------
| TOP TRAITS
|--------------------------------------------------------------------------
*/

function getTopTraits(
  traitScores
) {
  return Object.entries(
    traitScores
  )
    .map(
      ([
        trait,
        score,
      ]) => ({
        trait,

        label:
          TRAIT_LABELS[
            trait
          ] ||
          trait,

        score:
          Math.round(
            score
          ),
      })
    )
    .sort(
      (a, b) =>
        b.score -
        a.score
    )
    .slice(
      0,
      6
    );
}


/*
|--------------------------------------------------------------------------
| BUILD REPORT
|--------------------------------------------------------------------------
*/

export function buildCareerReport({
  stage,
  basics,
  questions,
  answers,
}) {
  const traitScores =
    buildTraitScores(
      questions,
      answers
    );

  const matches =
    CAREER_FAMILIES
      .map(
        (family) =>
          scoreFamily(
            family,
            traitScores,
            basics
          )
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        5
      )
      .map(
        (family) => ({
          ...family,

          exams:
            getFamilyExams(
              family,
              stage
            ),
        })
      );

  const topMatch =
    matches[0] ||
    null;

  const suggestedStreams =
    (
      topMatch?.streams ||
      []
    )
      .filter(
        (stream) =>
          !stream
            .toLowerCase()
            .includes(
              'any stream'
            )
      )
      .slice(
        0,
        4
      );

  return {
    stage,

    traitScores,

    topTraits:
      getTopTraits(
        traitScores
      ),

    confidence:
      calculateConfidence(
        questions,
        answers
      ),

    matches,

    suggestedStreams,

    generatedAt:
      new Date()
        .toISOString(),
  };
}