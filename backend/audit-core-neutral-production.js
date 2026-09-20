import "dotenv/config";

import {
  getCandidateQuestions
} from "./src/repositories/careerQuestionRepository.js";

const CORE_TRAITS = [
  "analytical",
  "quantitative",
  "verbal",
  "creativity",
  "technology",
  "hands_on",
  "scientific_curiosity",
  "social_helping",
  "leadership",
  "collaboration",
  "independence",
  "structure",
  "adaptability",
  "achievement",
  "stability",
  "entrepreneurship",
];

function hasValues(value) {
  return (
    Array.isArray(value) &&
    value.length > 0
  );
}

function isNeutral(q) {
  return !(
    hasValues(q.streams) ||
    hasValues(q.subjects) ||
    hasValues(q.interestClusters) ||
    hasValues(q.careerFamilies) ||
    hasValues(q.entranceExams) ||
    hasValues(q.targetCourses) ||
    hasValues(q.boards)
  );
}

try {
  const candidates =
    await getCandidateQuestions({
      stage: "foundation",
      excludeIds: [],
      limit: 2000,
      version: 7,
      currentClass: "class-8",
    });

  console.log(
    "TOTAL CANDIDATES:",
    candidates.length
  );

  console.log("");

  console.log(
    "DISTINCT TRAITS:"
  );

  const traitCounts = {};

  for (const q of candidates) {
    traitCounts[q.trait] =
      (traitCounts[q.trait] || 0) + 1;
  }

  console.table(
    Object.entries(traitCounts)
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .map(([trait, count]) => ({
        trait,
        count
      }))
  );

  console.log("");
  console.log(
    "CORE NEUTRAL COUNTS:"
  );

  console.table(
    CORE_TRAITS.map(trait => {
      const all =
        candidates.filter(
          q => q.trait === trait
        );

      const neutral =
        all.filter(isNeutral);

      return {
        trait,
        all: all.length,
        neutral: neutral.length
      };
    })
  );

  console.log("");
  console.log(
    "TOTAL CORE NEUTRAL:",
    candidates.filter(
      q =>
        CORE_TRAITS.includes(q.trait) &&
        isNeutral(q)
    ).length
  );
}
catch (error) {
  console.error(error);
}

process.exit();
