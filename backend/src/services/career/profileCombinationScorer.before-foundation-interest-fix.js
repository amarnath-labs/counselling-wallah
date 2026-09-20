function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map(normalize)
        .filter(Boolean)
    ),
  ];
}

function fuzzyEqual(left, right) {
  const a = normalize(left);
  const b = normalize(right);

  if (!a || !b) {
    return false;
  }

  return (
    a === b ||
    a.includes(b) ||
    b.includes(a)
  );
}

function oneMatchesAny(value, candidates) {
  if (
    !value ||
    !Array.isArray(candidates) ||
    !candidates.length
  ) {
    return false;
  }

  return candidates.some(
    candidate =>
      fuzzyEqual(
        value,
        candidate
      )
  );
}

function listOverlapCount(values, candidates) {
  const source = normalizeArray(values);
  const target = normalizeArray(candidates);

  if (!source.length || !target.length) {
    return 0;
  }

  let count = 0;

  for (const value of source) {
    if (
      target.some(
        candidate =>
          fuzzyEqual(
            value,
            candidate
          )
      )
    ) {
      count += 1;
    }
  }

  return count;
}

function listMatchRatio(values, candidates) {
  const source = normalizeArray(values);
  const target = normalizeArray(candidates);

  if (!target.length) {
    return null;
  }

  if (!source.length) {
    return 0;
  }

  const overlap =
    listOverlapCount(
      source,
      target
    );

  return Math.min(
    1,
    overlap /
      Math.max(
        1,
        Math.min(
          source.length,
          target.length
        )
      )
  );
}

export function profileClassKey(profile = {}) {
  const value =
    normalize(
      profile.currentClass
    );

  const match =
    value.match(
      /(?:class )?(\d{1,2})/
    );

  if (!match) {
    return null;
  }

  const classNumber =
    Number(
      match[1]
    );

  if (
    !Number.isInteger(classNumber) ||
    classNumber < 1 ||
    classNumber > 12
  ) {
    return null;
  }

  return `class-${classNumber}`;
}

export function buildProfileFingerprint(profile = {}) {
  const parts = [
    profile.stage,
    profile.currentClass,
    profile.board,
    profile.stream,
    profile.targetStream,
    profile.degree,
    profile.branch,
    profile.specialization,
    profile.goal,
    profile.currentStatus,
    ...normalizeArray(profile.subjects),
    ...normalizeArray(profile.targetExams),
    ...normalizeArray(profile.entranceExams),
    ...normalizeArray(profile.targetCourses),
    ...normalizeArray(profile.skills),
    ...normalizeArray(profile.interestClusters),
    ...normalizeArray(profile.careerInterests),
    ...normalizeArray(profile.careerFamilies),
    ...normalizeArray(profile.experience),
    ...normalizeArray(profile.experiences),
  ];

  return parts
    .map(normalize)
    .filter(Boolean)
    .join('|');
}

function hash32(value) {
  let hash = 2166136261;
  const text = String(value ?? '');

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    hash ^=
      text.charCodeAt(index);

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
}

export function profileVariationScore(question, profile) {
  const fingerprint =
    buildProfileFingerprint(profile);

  if (!fingerprint) {
    return 0.5;
  }

  const hash =
    hash32(
      `${fingerprint}|${question.id}`
    );

  return hash / 4294967295;
}

export function profileCombinationScore(question, profile) {
  let earned = 0;
  let possible = 0;

  if (question.classes?.length) {
    possible += 18;

    const classKey =
      profileClassKey(profile);

    if (
      classKey &&
      oneMatchesAny(
        classKey,
        question.classes
      )
    ) {
      earned += 18;
    }
  }

  if (question.boards?.length) {
    possible += 3;

    if (
      oneMatchesAny(
        profile.board,
        question.boards
      )
    ) {
      earned += 3;
    }
  }

  if (question.streams?.length) {
    possible += 14;

    if (
      oneMatchesAny(
        profile.stream ||
          profile.targetStream,
        question.streams
      )
    ) {
      earned += 14;
    }
  }

  if (question.subjects?.length) {
    possible += 15;

    earned +=
      15 *
      (listMatchRatio(
        profile.subjects,
        question.subjects
      ) || 0);
  }

  if (question.entranceExams?.length) {
    possible += 15;

    const selectedExams = [
      ...(profile.targetExams || []),
      ...(profile.entranceExams || []),
    ];

    earned +=
      15 *
      (listMatchRatio(
        selectedExams,
        question.entranceExams
      ) || 0);
  }

  if (question.targetCourses?.length) {
    possible += 11;

    earned +=
      11 *
      (listMatchRatio(
        profile.targetCourses,
        question.targetCourses
      ) || 0);
  }

  if (question.interestClusters?.length) {
    possible += 13;

    const interests = [
      ...(profile.interestClusters || []),
      ...(profile.careerInterests || []),
    ];

    earned +=
      13 *
      (listMatchRatio(
        interests,
        question.interestClusters
      ) || 0);
  }

  if (question.careerFamilies?.length) {
    possible += 13;

    earned +=
      13 *
      (listMatchRatio(
        profile.careerFamilies,
        question.careerFamilies
      ) || 0);
  }

  if (question.goals?.length) {
    possible += 10;

    if (
      oneMatchesAny(
        profile.goal,
        question.goals
      )
    ) {
      earned += 10;
    }
  }

  if (question.degrees?.length) {
    possible += 15;

    if (
      oneMatchesAny(
        profile.degree,
        question.degrees
      )
    ) {
      earned += 15;
    }
  }

  if (question.branches?.length) {
    possible += 16;

    if (
      oneMatchesAny(
        profile.branch ||
          profile.specialization,
        question.branches
      )
    ) {
      earned += 16;
    }
  }

  if (question.skills?.length) {
    possible += 10;

    earned +=
      10 *
      (listMatchRatio(
        profile.skills,
        question.skills
      ) || 0);
  }

  if (!possible) {
    return 0.55;
  }

  return Math.max(
    0,
    Math.min(
      1,
      earned / possible
    )
  );
}

export function questionSpecificityScore(question) {
  const dimensions = [
    question.classes,
    question.boards,
    question.streams,
    question.subjects,
    question.entranceExams,
    question.targetCourses,
    question.interestClusters,
    question.careerFamilies,
    question.degrees,
    question.branches,
    question.skills,
    question.goals,
  ];

  const populated =
    dimensions.filter(
      value =>
        Array.isArray(value) &&
        value.length
    ).length;

  return Math.min(
    1,
    populated / 5
  );
}

export function finalProfileQuestionScore(question, profile) {
  const relevance =
    profileCombinationScore(
      question,
      profile
    );

  const specificity =
    questionSpecificityScore(question);

  const variation =
    profileVariationScore(
      question,
      profile
    );

  return (
    relevance * 0.72 +
    specificity * 0.18 +
    variation * 0.10
  );
}

export function rankByProfileCombination({
  questions = [],
  profile = {},
}) {
  return questions
    .map(
      (question, index) => ({
        question,
        index,
        combinationScore:
          finalProfileQuestionScore(
            question,
            profile
          ),
      })
    )
    .sort(
      (left, right) => {
        const scoreDifference =
          right.combinationScore -
          left.combinationScore;

        if (
          Math.abs(scoreDifference) >
          0.000001
        ) {
          return scoreDifference;
        }

        return left.index - right.index;
      }
    )
    .map(item => item.question);
}

export default {
  profileClassKey,
  buildProfileFingerprint,
  profileVariationScore,
  profileCombinationScore,
  questionSpecificityScore,
  finalProfileQuestionScore,
  rankByProfileCombination,
};
