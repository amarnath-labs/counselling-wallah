import { CORE_TRAITS_BY_STAGE } from '../../data/careerTraitDefinitions.js';

const MIN_QUESTIONS = 12;
const TYPICAL_TARGET = 16;
const MAX_QUESTIONS = 30;

function measuredCoreTraitRatio(stage, traitEvidence) {
  const core = CORE_TRAITS_BY_STAGE[stage] || [];
  if (!core.length) return 1;

  const measured = core.filter(
    (trait) => (traitEvidence[trait]?.evidenceCount || 0) > 0
  ).length;

  return measured / core.length;
}

function contradictionCount(traitEvidence) {
  let contradictions = 0;

  for (const item of Object.values(traitEvidence)) {
    const evidence = item.evidence || [];
    if (evidence.length < 2) continue;

    const scores = evidence.map((e) => e.score);
    const spread = Math.max(...scores) - Math.min(...scores);

    if (spread >= 75) contradictions += 1;
  }

  return contradictions;
}

export function evaluateAssessmentState({
  stage,
  answers,
  traitEvidence,
  careerMatches = [],
}) {
  const answered = answers.length;
  const coverage = measuredCoreTraitRatio(stage, traitEvidence);
  const contradictions = contradictionCount(traitEvidence);

  const first = careerMatches[0]?.score ?? 0;
  const second = careerMatches[1]?.score ?? 0;
  const separation = first - second;

  const enoughMinimum = answered >= MIN_QUESTIONS;
  const strongCoverage = coverage >= 0.7;
  const strongSeparation = separation >= 10;
  const stableEnough =
    enoughMinimum &&
    strongCoverage &&
    contradictions === 0 &&
    (answered >= TYPICAL_TARGET || strongSeparation);

  const completed = stableEnough || answered >= MAX_QUESTIONS;

  let score =
    Math.min(50, answered * 2.5) +
    coverage * 30 +
    Math.min(20, Math.max(0, separation) * 1.5) -
    contradictions * 8;

  score = Math.round(Math.max(0, Math.min(100, score)));

  let label = 'Developing';
  if (score >= 80) label = 'High';
  else if (score >= 65) label = 'Good';
  else if (score >= 45) label = 'Moderate';

  return {
    completed,
    score,
    label,
    answered,
    minimum: MIN_QUESTIONS,
    typicalTarget: TYPICAL_TARGET,
    maximum: MAX_QUESTIONS,
    coreTraitCoverage: Number(coverage.toFixed(2)),
    topCareerSeparation: separation,
    contradictions,
  };
}
