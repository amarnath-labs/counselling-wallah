import {
  getCandidateQuestions,
  getQuestionByIds,
} from '../../repositories/careerQuestionRepository.js';

import {
  rankQuestionCandidates,
} from './questionRanker.js';

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function matchesAny(value, allowed = []) {
  if (!allowed?.length) return true;
  const target = normalize(value);
  if (!target) return false;

  return allowed.some((item) => {
    const n = normalize(item);
    return n === target || n.includes(target) || target.includes(n);
  });
}

function listMatchesAny(values = [], allowed = []) {
  if (!allowed?.length) return true;
  if (!values?.length) return false;

  return values.some((value) => matchesAny(value, allowed));
}

function validForProfile(question, profile) {
  if (question.stage !== profile.stage) return false;
  if (!matchesAny(profile.degree, question.degrees)) return false;
  if (!matchesAny(profile.branch || profile.specialization, question.branches)) return false;
  if (!matchesAny(profile.stream, question.streams)) return false;
  if (!matchesAny(profile.goal, question.goals)) return false;
  if (!listMatchesAny(profile.skills, question.skills)) return false;
  if (!listMatchesAny(profile.subjects, question.subjects)) return false;
  return true;
}

export async function retrieveNextQuestion({
  profile,
  answers,
  traitEvidence,
  careerMatches,
}) {
  const askedIds = answers.map((answer) => answer.questionId);

  const [candidates, askedQuestions] = await Promise.all([
    getCandidateQuestions({
      stage: profile.stage,
      excludeIds: askedIds,
    }),
    getQuestionByIds(askedIds),
  ]);

  const strict = candidates.filter((question) =>
    validForProfile(question, profile)
  );

  // If strict metadata filters become too narrow, fall back only to same-stage
  // unseen questions. This keeps the assessment moving without cross-stage noise.
  const pool = strict.length >= 3 ? strict : candidates;

  const ranked = rankQuestionCandidates({
    candidates: pool,
    profile,
    traitEvidence,
    careerMatches,
    askedQuestions,
  });

  return ranked[0] || null;
}
