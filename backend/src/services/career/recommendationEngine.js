import { TRAIT_DEFINITIONS } from '../../data/careerTraitDefinitions.js';

export function buildCareerRecommendationReport({
  profile,
  stage,
  traitEvidence,
  careerMatches,
  confidence,
}) {
  const topTraits = Object.entries(traitEvidence)
    .map(([trait, item]) => ({
      trait,
      label: TRAIT_DEFINITIONS[trait]?.label || trait,
      score: item.score,
      confidence: Math.round(item.confidence * 100),
      evidenceCount: item.evidenceCount,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const matches = careerMatches.map((match) => ({
    ...match,
    why: match.strongestTraits.map((item) => {
      const label =
        TRAIT_DEFINITIONS[item.trait]?.label ||
        item.trait;

      return `${label}: ${item.score}%`;
    }),
    gaps: match.missingSkills.length
      ? match.missingSkills.map((skill) => `Build stronger evidence in ${skill}`)
      : [],
  }));

  return {
    stage,
    profile,
    confidence: {
      score: confidence.score,
      label: confidence.label,
      explanation:
        confidence.completed
          ? 'TruMarg has enough evidence to produce a stable initial career-direction report.'
          : 'The assessment is still gathering evidence and may ask more discriminator questions.',
    },
    topTraits,
    matches,
    generatedAt: new Date().toISOString(),
  };
}
