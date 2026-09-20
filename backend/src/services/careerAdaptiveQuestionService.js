import {
  CAREER_QUESTION_BANK,
} from '../data/careerQuestionBank.js';


const normalize =
  (value) =>
    String(
      value || ''
    )
      .trim()
      .toLowerCase();


const normalizeList =
  (values) =>
    Array.isArray(values)
      ? values
          .map(normalize)
          .filter(Boolean)
      : [];


/*
|--------------------------------------------------------------------------
| GOAL NORMALIZATION
|--------------------------------------------------------------------------
*/

const GOAL_MAP = {
  'explore career options':
    'explore-careers',

  'choose a stream':
    'choose-stream',

  'choose a course':
    'choose-course',

  'prepare for entrance exams':
    'entrance-exams',

  'find an internship':
    'internship',

  'prepare for placements':
    'placement',

  'get first job':
    'first-job',

  'get a better job':
    'better-job',

  'switch career':
    'career-switch',

  'government job':
    'government-job',

  'civil services':
    'civil-services',

  'defence career':
    'defence',

  'start a business':
    'entrepreneurship',

  'freelance career':
    'freelance',

  'higher studies in india':
    'higher-studies',

  'study abroad':
    'study-abroad',

  'mba':
    'mba',

  'm.tech / m.e.':
    'mtech',

  'ms / msc':
    'ms',

  'law':
    'law',

  'research / phd':
    'research',

  'creative / acting career':
    'creative-career',

  'media / content career':
    'creative-career',

  'design career':
    'creative-career',
};


function normalizeGoal(
  value
) {
  const normalized =
    normalize(value);

  return (
    GOAL_MAP[
      normalized
    ] ||
    normalized
  );
}


/*
|--------------------------------------------------------------------------
| MATCH HELPERS
|--------------------------------------------------------------------------
*/

function fuzzyContains(
  list,
  value
) {
  const target =
    normalize(value);

  if (!target) {
    return false;
  }

  return list.some(
    (item) => {
      const candidate =
        normalize(item);

      return (
        candidate ===
          target ||
        candidate.includes(
          target
        ) ||
        target.includes(
          candidate
        )
      );
    }
  );
}


function hasOverlap(
  first,
  second
) {
  const a =
    normalizeList(first);

  const b =
    normalizeList(second);

  return a.some(
    (value) =>
      b.some(
        (candidate) =>
          candidate ===
            value ||
          candidate.includes(
            value
          ) ||
          value.includes(
            candidate
          )
      )
  );
}


/*
|--------------------------------------------------------------------------
| QUESTION RELEVANCE
|--------------------------------------------------------------------------
*/

export function scoreQuestionRelevance({
  question,
  profile,
  askedQuestionIds = [],
  traitScores = {},
}) {
  if (
    askedQuestionIds.includes(
      question.id
    )
  ) {
    return -Infinity;
  }

  if (
    question.stage !==
    profile.stage
  ) {
    return -Infinity;
  }

  let score =
    Number(
      question.priority ||
      0.5
    ) * 20;


  /*
  |--------------------------------------------------------------------------
  | DEGREE
  |--------------------------------------------------------------------------
  */

  if (
    question.degrees?.length
  ) {
    if (
      fuzzyContains(
        question.degrees,
        profile.degree
      )
    ) {
      score += 24;
    } else {
      score -= 10;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | BRANCH
  |--------------------------------------------------------------------------
  */

  if (
    question.branches?.length
  ) {
    if (
      fuzzyContains(
        question.branches,
        profile.branch ||
          profile.specialization
      )
    ) {
      score += 28;
    } else {
      score -= 18;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | STREAM
  |--------------------------------------------------------------------------
  */

  if (
    question.streams?.length &&
    profile.stream
  ) {
    if (
      fuzzyContains(
        question.streams,
        profile.stream
      )
    ) {
      score += 18;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | GOAL
  |--------------------------------------------------------------------------
  */

  const normalizedGoal =
    normalizeGoal(
      profile.goal
    );

  if (
    question.goals?.length &&
    normalizedGoal
  ) {
    if (
      fuzzyContains(
        question.goals,
        normalizedGoal
      )
    ) {
      score += 22;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | SKILLS
  |--------------------------------------------------------------------------
  */

  if (
    hasOverlap(
      question.skills,
      profile.skills
    )
  ) {
    score += 22;
  }


  /*
  |--------------------------------------------------------------------------
  | TARGET EXAMS
  |--------------------------------------------------------------------------
  */

  if (
    hasOverlap(
      question.exams,
      profile.targetExams
    )
  ) {
    score += 20;
  }


  /*
  |--------------------------------------------------------------------------
  | PROFILE TAGS
  |--------------------------------------------------------------------------
  */

  const profileTerms = [
    profile.degree,
    profile.branch,
    profile.specialization,
    profile.stream,
    profile.goal,

    ...(
      profile.skills ||
      []
    ),

    ...(
      profile.subjects ||
      []
    ),

    ...(
      profile.targetExams ||
      []
    ),
  ]
    .map(normalize)
    .filter(Boolean);

  const tags =
    normalizeList(
      question.tags
    );

  const matchingTags =
    tags.filter(
      (tag) =>
        profileTerms.some(
          (term) =>
            term.includes(
              tag
            ) ||
            tag.includes(
              term
            )
        )
    );

  score +=
    Math.min(
      18,
      matchingTags.length *
        6
    );


  /*
  |--------------------------------------------------------------------------
  | UNCERTAINTY BONUS
  |--------------------------------------------------------------------------
  |
  | Prefer traits that have little/no evidence yet.
  |
  */

  const trait =
    question.trait;

  if (
    trait &&
    !Number.isFinite(
      traitScores[
        trait
      ]
    )
  ) {
    score += 12;
  }


  /*
  |--------------------------------------------------------------------------
  | DISCRIMINATOR BONUS
  |--------------------------------------------------------------------------
  */

  if (
    question.purpose ===
    'discriminator'
  ) {
    score += 8;
  }

  return score;
}


/*
|--------------------------------------------------------------------------
| RETRIEVE CANDIDATES
|--------------------------------------------------------------------------
*/

export function retrieveQuestionCandidates({
  profile,
  askedQuestionIds = [],
  traitScores = {},
  limit = 10,
}) {
  return CAREER_QUESTION_BANK
    .map(
      (question) => ({
        question,

        retrievalScore:
          scoreQuestionRelevance({
            question,
            profile,
            askedQuestionIds,
            traitScores,
          }),
      })
    )
    .filter(
      (item) =>
        Number.isFinite(
          item.retrievalScore
        ) &&
        item.retrievalScore >
          0
    )
    .sort(
      (a, b) =>
        b.retrievalScore -
        a.retrievalScore
    )
    .slice(
      0,
      limit
    );
}


/*
|--------------------------------------------------------------------------
| NEXT QUESTION
|--------------------------------------------------------------------------
*/

export function selectNextAdaptiveQuestion({
  profile,
  askedQuestionIds = [],
  traitScores = {},
}) {
  const candidates =
    retrieveQuestionCandidates({
      profile,
      askedQuestionIds,
      traitScores,
      limit: 10,
    });

  if (
    candidates.length ===
    0
  ) {
    return null;
  }

  return {
    ...candidates[0]
      .question,

    retrievalScore:
      Math.round(
        candidates[0]
          .retrievalScore *
          100
      ) / 100,
  };
}


/*
|--------------------------------------------------------------------------
| ANSWER → TRAIT SCORE
|--------------------------------------------------------------------------
*/

export function likertToScore(
  value
) {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return null;
  }

  const clamped =
    Math.max(
      1,
      Math.min(
        5,
        numeric
      )
    );

  return (
    (
      clamped -
      1
    ) /
    4
  ) * 100;
}


export function buildTraitScores(
  answers
) {
  const buckets = {};

  for (
    const answer of
    answers || []
  ) {
    const question =
      CAREER_QUESTION_BANK.find(
        (item) =>
          item.id ===
          answer.questionId
      );

    if (
      !question?.trait
    ) {
      continue;
    }

    const score =
      likertToScore(
        answer.value
      );

    if (
      score === null
    ) {
      continue;
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
    ].push(
      score
    );
  }

  const result = {};

  for (
    const [
      trait,
      values,
    ] of Object.entries(
      buckets
    )
  ) {
    result[
      trait
    ] =
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

  return result;
}


/*
|--------------------------------------------------------------------------
| SHOULD CONTINUE
|--------------------------------------------------------------------------
*/

export function shouldContinueAssessment({
  answers,
  minimumQuestions = 12,
  maximumQuestions = 30,
}) {
  const count =
    Array.isArray(
      answers
    )
      ? answers.length
      : 0;

  if (
    count <
    minimumQuestions
  ) {
    return true;
  }

  if (
    count >=
    maximumQuestions
  ) {
    return false;
  }

  return true;
}