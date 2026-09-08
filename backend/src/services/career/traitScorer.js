export function likertToScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 50;
  const clamped = Math.min(5, Math.max(1, numeric));
  return (clamped - 1) * 25;
}

export function buildTraitEvidence(questionById, answers = []) {
  const grouped = new Map();

  for (const answer of answers) {
    const question = questionById.get(answer.questionId);
    if (!question?.trait) continue;

    const score = likertToScore(answer.value);
    const current = grouped.get(question.trait) || [];

    current.push({
      questionId: answer.questionId,
      score,
      value: Number(answer.value),
      weight: Number(question.weight || 1),
    });

    grouped.set(question.trait, current);
  }

  const result = {};

  for (const [trait, evidence] of grouped.entries()) {
    const totalWeight = evidence.reduce((sum, item) => sum + item.weight, 0) || 1;
    const weightedScore = evidence.reduce(
      (sum, item) => sum + item.score * item.weight,
      0
    ) / totalWeight;

    const evidenceCount = evidence.length;
    const confidence = Math.min(1, 0.32 + evidenceCount * 0.18);

    result[trait] = {
      score: Math.round(weightedScore),
      evidenceCount,
      confidence: Number(confidence.toFixed(2)),
      evidence,
    };
  }

  return result;
}

export function flatTraitScores(traitEvidence = {}) {
  return Object.fromEntries(
    Object.entries(traitEvidence).map(([trait, item]) => [
      trait,
      item.score,
    ])
  );
}
