import { CAREER_PROFILES } from '../../data/careerProfiles.js';

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function containsAny(text, values = []) {
  if (!text || values.length === 0) return false;
  return values.some((value) => {
    const n = normalize(value);
    return n && (text.includes(n) || n.includes(text));
  });
}

function traitAlignment(career, traitScores) {
  const entries = Object.entries(career.traits || {});
  let weighted = 0;
  let weight = 0;
  let measuredWeight = 0;

  for (const [trait, traitWeight] of entries) {
    weight += traitWeight;

    if (Number.isFinite(traitScores[trait])) {
      weighted += traitScores[trait] * traitWeight;
      measuredWeight += traitWeight;
    } else {
      weighted += 50 * traitWeight;
    }
  }

  if (!weight) return { score: 50, coverage: 0 };

  return {
    score: weighted / weight,
    coverage: measuredWeight / weight,
  };
}

function academicFit(career, profile) {
  const degree = normalize(profile.degree);
  const branch = normalize(profile.branch || profile.specialization);

  const degreeList = career.academic?.preferredDegrees || [];
  const branchList = career.academic?.preferredBranches || [];

  let score = 50;
  let signals = 0;

  if (degree && degreeList.length) {
    signals += 1;
    if (containsAny(degree, degreeList)) score += 25;
    else score -= 10;
  }

  if (branch && branchList.length) {
    signals += 1;
    if (containsAny(branch, branchList)) score += 25;
    else score -= 10;
  }

  if (!signals) return 60;
  return Math.max(0, Math.min(100, score));
}

function skillsFit(career, profile) {
  const userSkills = new Set((profile.skills || []).map(normalize));
  const desired = (career.skills || []).map(normalize);

  if (!desired.length) return 60;
  if (!userSkills.size) return 50;

  const matched = desired.filter((skill) =>
    [...userSkills].some(
      (owned) => owned.includes(skill) || skill.includes(owned)
    )
  ).length;

  return Math.round((matched / desired.length) * 100);
}

function goalFit(career, profile) {
  const goal = normalize(profile.goal);
  if (!goal) return 60;

  if (goal.includes('first job') || goal.includes('job')) return 80;
  if (goal.includes('higher')) return career.traits?.research ? 85 : 65;
  if (goal.includes('business') || goal.includes('entre')) {
    return career.traits?.management || career.traits?.business ? 85 : 55;
  }

  return 65;
}

export function rankCareers({ stage, profile, traitScores, limit = 5 }) {
  return CAREER_PROFILES
    .filter((career) => !career.stages?.length || career.stages.includes(stage))
    .map((career) => {
      const trait = traitAlignment(career, traitScores);
      const academic = academicFit(career, profile);
      const skills = skillsFit(career, profile);
      const goal = goalFit(career, profile);

      const score =
        trait.score * 0.55 +
        academic * 0.2 +
        skills * 0.15 +
        goal * 0.1;

      const evidenceConfidence =
        35 +
        trait.coverage * 50 +
        Math.min(15, Object.keys(traitScores).length * 2);

      const strongestTraits = Object.entries(career.traits || {})
        .filter(([traitName]) => Number.isFinite(traitScores[traitName]))
        .map(([traitName, weight]) => ({
          trait: traitName,
          score: traitScores[traitName],
          contribution: traitScores[traitName] * weight,
        }))
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 4);

      const missingSkills = (career.skills || []).filter((skill) => {
        const n = normalize(skill);
        return !(profile.skills || []).some((owned) => {
          const o = normalize(owned);
          return o.includes(n) || n.includes(o);
        });
      });

      return {
        id: career.id,
        name: career.name,
        description: career.description,
        score: Math.round(Math.max(0, Math.min(100, score))),
        confidence: Math.round(Math.max(0, Math.min(100, evidenceConfidence))),
        strongestTraits,
        missingSkills,
        courses: career.courses || [],
        roles: career.roles || [],
        nextSteps: career.nextSteps || [],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
