function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function fuzzyMatch(value, candidates = []) {
  const target = normalize(value);
  if (!target || !candidates?.length) return false;

  return candidates.some((item) => {
    const candidate = normalize(item);
    return (
      candidate === target ||
      candidate.includes(target) ||
      target.includes(candidate)
    );
  });
}

function listOverlap(values = [], candidates = []) {
  return values.some((value) => fuzzyMatch(value, candidates));
}

function profileRelevance(question, profile) {
  let points = 0;
  let possible = 0;

  const checks = [
    [profile.degree, question.degrees],
    [profile.branch || profile.specialization, question.branches],
    [profile.stream, question.streams],
    [profile.goal, question.goals],
  ];

  for (const [value, candidates] of checks) {
    if (candidates?.length) {
      possible += 1;
      if (fuzzyMatch(value, candidates)) points += 1;
    }
  }

  if (question.skills?.length) {
    possible += 1;
    if (listOverlap(profile.skills || [], question.skills)) points += 1;
  }

  if (question.subjects?.length) {
    possible += 1;
    if (listOverlap(profile.subjects || [], question.subjects)) points += 1;
  }

  if (!possible) return 0.65;
  return points / possible;
}

function uncertainty(question, traitEvidence) {
  const evidence = traitEvidence[question.trait];
  if (!evidence) return 1;

  if (evidence.evidenceCount === 1) return 0.72;
  if (evidence.evidenceCount === 2) return 0.45;
  return Math.max(0.1, 1 - evidence.confidence);
}

function discrimination(question, careerMatches) {
  if (question.purpose === 'discriminator') return 1;
  if (careerMatches.length < 2) return 0.55;

  const gap = Math.abs(
    (careerMatches[0]?.score || 0) -
    (careerMatches[1]?.score || 0)
  );

  if (gap <= 3) return 0.95;
  if (gap <= 7) return 0.8;
  if (gap <= 12) return 0.6;
  return 0.35;
}

function previousAnswerRelevance(question, recentTraits) {
  if (!recentTraits.length) return 0.5;
  if (recentTraits.includes(question.trait)) return 0.3;

  const tags = (question.tags || []).map(normalize);
  return recentTraits.some((trait) => tags.includes(normalize(trait)))
    ? 0.9
    : 0.55;
}

function diversity(question, askedQuestions) {
  const recentSections = askedQuestions.slice(-3).map((q) => q.section);
  const recentTraits = askedQuestions.slice(-3).map((q) => q.trait);

  if (recentTraits.includes(question.trait)) return 0.25;
  if (recentSections.includes(question.section)) return 0.6;
  return 1;
}

function priorityScore(question) {
  const priority = Number(question.priority ?? 3);
  return Math.max(0, Math.min(1, (6 - priority) / 5));
}

export function rankQuestionCandidates({
  candidates,
  profile,
  traitEvidence,
  careerMatches,
  askedQuestions,
}) {
  const recentTraits = askedQuestions.slice(-3).map((q) => q.trait);

  return candidates
    .map((question) => {
      const profileScore = profileRelevance(question, profile);
      const uncertaintyScore = uncertainty(question, traitEvidence);
      const discriminationScore = discrimination(question, careerMatches);
      const previousScore = previousAnswerRelevance(question, recentTraits);
      const stageScore = question.stage === profile.stage ? 1 : 0;
      const diversityScore = diversity(question, askedQuestions);
      const priority = priorityScore(question);

      const score =
        profileScore * 0.25 +
        uncertaintyScore * 0.2 +
        discriminationScore * 0.2 +
        previousScore * 0.15 +
        stageScore * 0.1 +
        diversityScore * 0.05 +
        priority * 0.05;

      return {
        ...question,
        retrievalScore: Number(score.toFixed(4)),
      };
    })
    .sort((a, b) => b.retrievalScore - a.retrievalScore);
}
