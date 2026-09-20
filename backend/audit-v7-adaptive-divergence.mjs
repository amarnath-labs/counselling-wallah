import {
  getCandidateQuestions,
} from './src/repositories/careerQuestionRepository.js';

import {
  rankQuestionCandidates,
} from './src/services/career/questionRanker.js';

import {
  finalProfileQuestionScore,
} from './src/services/career/profileCombinationScorer.js';

import {
  buildQuestionProfileMap,
} from './src/services/career/questionProfileMapper.js';

import {
  pool,
} from './src/db/pool.js';


const PROFILE = {
  stage: 'senior-secondary',
  currentClass: 'class-12',
  board: 'cbse',
  stream: 'science pcm',

  subjects: [
    'physics',
    'chemistry',
    'mathematics',
    'computer science',
  ],

  targetExams: [
    'jee main',
    'jee advanced',
  ],

  entranceExams: [
    'jee main',
    'jee advanced',
  ],

  targetCourses: [
    'btech',
    'be',
  ],

  careerFamilies: [
    'engineering',
    'technology',
  ],

  interestClusters: [
    'technology',
    'engineering',
    'problem-solving',
    'quantitative',
  ],
};


const BASE_MEASURED = {
  achievement: {
    evidenceCount: 3,
    score: 0.65,
    confidence: 0.72,
  },

  adaptability: {
    evidenceCount: 3,
    score: 0.66,
    confidence: 0.72,
  },

  analytical: {
    evidenceCount: 3,
    score: 0.65,
    confidence: 0.72,
  },

  collaboration: {
    evidenceCount: 3,
    score: 0.66,
    confidence: 0.72,
  },

  creativity: {
    evidenceCount: 3,
    score: 0.65,
    confidence: 0.72,
  },

  entrepreneurship: {
    evidenceCount: 3,
    score: 0.64,
    confidence: 0.72,
  },

  hands_on: {
    evidenceCount: 3,
    score: 0.66,
    confidence: 0.72,
  },

  independence: {
    evidenceCount: 3,
    score: 0.65,
    confidence: 0.72,
  },

  leadership: {
    evidenceCount: 3,
    score: 0.66,
    confidence: 0.72,
  },

  quantitative: {
    evidenceCount: 3,
    score: 0.65,
    confidence: 0.72,
  },

  scientific_curiosity: {
    evidenceCount: 3,
    score: 0.66,
    confidence: 0.72,
  },

  social_helping: {
    evidenceCount: 3,
    score: 0.65,
    confidence: 0.72,
  },

  stability: {
    evidenceCount: 3,
    score: 0.66,
    confidence: 0.72,
  },

  structure: {
    evidenceCount: 3,
    score: 0.65,
    confidence: 0.72,
  },

  technology: {
    evidenceCount: 3,
    score: 0.66,
    confidence: 0.72,
  },

  verbal: {
    evidenceCount: 3,
    score: 0.65,
    confidence: 0.72,
  },
};


const SCENARIOS = {
  ANALYTICAL_UNCERTAIN: {
    ...BASE_MEASURED,

    analytical: {
      evidenceCount: 3,
      score: 0.82,
      confidence: 0.25,
    },

    quantitative: {
      evidenceCount: 3,
      score: 0.80,
      confidence: 0.28,
    },

    scientific_curiosity: {
      evidenceCount: 3,
      score: 0.78,
      confidence: 0.30,
    },

    creativity: {
      evidenceCount: 3,
      score: 0.55,
      confidence: 0.90,
    },

    leadership: {
      evidenceCount: 3,
      score: 0.54,
      confidence: 0.90,
    },
  },


  CREATIVE_LEADERSHIP_UNCERTAIN: {
    ...BASE_MEASURED,

    creativity: {
      evidenceCount: 3,
      score: 0.82,
      confidence: 0.25,
    },

    leadership: {
      evidenceCount: 3,
      score: 0.80,
      confidence: 0.28,
    },

    collaboration: {
      evidenceCount: 3,
      score: 0.78,
      confidence: 0.30,
    },

    entrepreneurship: {
      evidenceCount: 3,
      score: 0.76,
      confidence: 0.32,
    },

    analytical: {
      evidenceCount: 3,
      score: 0.55,
      confidence: 0.90,
    },

    quantitative: {
      evidenceCount: 3,
      score: 0.54,
      confidence: 0.90,
    },
  },
};

function enrich(question) {
  const profileMap =
    buildQuestionProfileMap(
      question
    );

  return {
    ...question,

    profileMap,

    inferredDomains:
      profileMap.domains,

    streams:
      profileMap.streams,

    subjects:
      profileMap.subjects,

    entranceExams:
      profileMap.entranceExams,

    targetCourses:
      profileMap.targetCourses,

    interestClusters:
      profileMap.interestClusters,

    careerFamilies:
      profileMap.careerFamilies,

    goals:
      profileMap.goals,

    skills:
      profileMap.skills,

    degrees:
      profileMap.degrees,

    branches:
      profileMap.branches,
  };
}


function overlap(left, right) {
  const rightIds =
    new Set(
      right.map(
        item =>
          item.id
      )
    );

  const common =
    left.filter(
      item =>
        rightIds.has(
          item.id
        )
    );

  return {
    count:
      common.length,

    percentage:
      (
        common.length /
        Math.max(
          left.length,
          1
        )
      ) * 100,

    ids:
      common.map(
        item =>
          item.id
      ),
  };
}


function traitCounts(items) {
  const counts = {};

  for (const item of items) {
    const trait =
      item.trait ||
      'unknown';

    counts[trait] =
      (
        counts[trait] ||
        0
      ) + 1;
  }

  return counts;
}


try {
  const raw =
    await getCandidateQuestions({
      stage:
        'senior-secondary',

      currentClass:
        'class-12',

      version:
        7,

      excludeIds: [],

      limit:
        500,
    });


  const candidates =
    raw.map(
      enrich
    );


  console.log(
    'CLASS 12 V7:',
    candidates.length
  );


  const results = {};


  for (
    const [
      scenarioName,
      traitEvidence,
    ] of
    Object.entries(
      SCENARIOS
    )
  ) {
    const adaptive =
      rankQuestionCandidates({
        candidates,

        profile:
          PROFILE,

        traitEvidence,

        careerMatches: [],
      });


    const blended =
      adaptive
        .map(
          (
            item,
            index
          ) => {
            const question =
              item.question ||
              item;

            const adaptiveScore =
              Number(
                item.retrievalScore ??
                0
              );


            const combinationScore =
              finalProfileQuestionScore(
                question,
                PROFILE
              );


            return {
              id:
                question.id,

              trait:
                question.trait,

              domains:
                question.inferredDomains ||
                question.profileMap?.domains ||
                [],

              adaptiveScore,

              combinationScore,

              finalScore:
                adaptiveScore *
                  0.58 +
                combinationScore *
                  0.42,

              originalIndex:
                index,
            };
          }
        )
        .sort(
          (a, b) => {
            const diff =
              b.finalScore -
              a.finalScore;

            if (
              Math.abs(
                diff
              ) >
              0.000001
            ) {
              return diff;
            }

            return (
              a.originalIndex -
              b.originalIndex
            );
          }
        )
        .slice(
          0,
          20
        );


    results[
      scenarioName
    ] = blended;


    console.log('');
    console.log(
      '========================================'
    );

    console.log(
      scenarioName
    );

    console.log(
      '========================================'
    );


    console.table(
      blended.map(
        (
          item,
          index
        ) => ({
          rank:
            index + 1,

          id:
            item.id,

          trait:
            item.trait,

          domains:
            item.domains.join(
              ' | '
            ),

          adaptive:
            Number(
              item.adaptiveScore.toFixed(
                4
              )
            ),

          combination:
            Number(
              item.combinationScore.toFixed(
                4
              )
            ),

          final:
            Number(
              item.finalScore.toFixed(
                4
              )
            ),
        })
      )
    );


    console.log(
      'TRAIT COUNTS:',
      traitCounts(
        blended
      )
    );
  }


  const stats =
    overlap(
      results.ANALYTICAL_UNCERTAIN,
      results.CREATIVE_LEADERSHIP_UNCERTAIN
    );


  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    'ADAPTIVE DIVERGENCE'
  );

  console.log(
    '========================================'
  );


  console.log(
    `TOP-20 OVERLAP: ` +
    `${stats.count}/20 = ` +
    `${stats.percentage.toFixed(1)}%`
  );


  console.log(
    'COMMON IDS:',
    stats.ids
  );
} finally {
  await pool.end();
}


