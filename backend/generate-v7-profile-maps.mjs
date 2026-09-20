// backend/generate-v7-profile-maps.mjs

import fs from 'fs';
import { pool } from './src/db/pool.js';

import {
  buildQuestionProfileMap,
  buildMeaningfulCombinationKeys,
} from './src/services/career/questionProfileMapper.js';


const { rows } =
  await pool.query(`
    SELECT *
    FROM career_questions
    WHERE version = 7
      AND active = TRUE
    ORDER BY
      CASE
        WHEN stage = 'foundation'
          AND 'class-8' = ANY(classes)
          THEN 1

        WHEN stage = 'foundation'
          AND 'class-9' = ANY(classes)
          THEN 2

        WHEN stage = 'class10'
          THEN 3

        WHEN stage = 'senior-secondary'
          AND 'class-11' = ANY(classes)
          THEN 4

        WHEN stage = 'senior-secondary'
          AND 'class-12' = ANY(classes)
          THEN 5

        WHEN stage = 'college'
          THEN 6

        WHEN stage = 'graduate'
          THEN 7

        ELSE 99
      END,
      id
  `);


const mapped =
  rows.map(
    (
      question,
      index
    ) => {
      const normalized = {
        ...question,

        entranceExams:
          question.entrance_exams,

        targetCourses:
          question.target_courses,

        interestClusters:
          question.interest_clusters,

        careerFamilies:
          question.career_families,
      };


      const profileMap =
        buildQuestionProfileMap(
          normalized
        );


      return {
        serial:
          index + 1,

        id:
          question.id,

        text:
          question.text,

        stage:
          question.stage,

        classes:
          question.classes || [],

        trait:
          question.trait,

        section:
          question.section,

        profileMap,

        combinationKeys:
          buildMeaningfulCombinationKeys(
            profileMap
          ),
      };
    }
  );


if (
  mapped.length !== 3500
) {
  console.warn(
    `WARNING: Expected 3500 active V7 questions, found ${mapped.length}`
  );
}


fs.writeFileSync(
  './v7-question-profile-maps.json',
  JSON.stringify(
    mapped,
    null,
    2
  ),
  'utf8'
);


const header = [
  'serial',
  'id',
  'stage',
  'classes',
  'trait',
  'section',
  'domains',
  'streams',
  'subjects',
  'entranceExams',
  'targetCourses',
  'careerFamilies',
  'interestClusters',
  'skills',
  'combinationKeys',
  'text',
];


function csvCell(value) {
  const text =
    Array.isArray(value)
      ? value.join(' | ')
      : String(
          value ?? ''
        );

  return `"${text.replace(
    /"/g,
    '""'
  )}"`;
}


const csvRows = [
  header.join(','),
];


for (
  const item of
  mapped
) {
  csvRows.push(
    [
      item.serial,
      item.id,
      item.stage,
      item.classes,
      item.trait,
      item.section,
      item.profileMap.domains,
      item.profileMap.streams,
      item.profileMap.subjects,
      item.profileMap.entranceExams,
      item.profileMap.targetCourses,
      item.profileMap.careerFamilies,
      item.profileMap.interestClusters,
      item.profileMap.skills,
      item.combinationKeys,
      item.text,
    ]
      .map(
        csvCell
      )
      .join(',')
  );
}


fs.writeFileSync(
  './v7-question-profile-maps.csv',
  csvRows.join('\n'),
  'utf8'
);


const summary = {};


for (
  const item of
  mapped
) {
  for (
    const domain of
    item.profileMap.domains
  ) {
    summary[domain] =
      (
        summary[domain] ||
        0
      ) + 1;
  }
}


console.log('');
console.log(
  '========================================'
);

console.log(
  'TRUMARG V7 PROFILE MAP GENERATION'
);

console.log(
  '========================================'
);

console.log(
  'Questions mapped:',
  mapped.length
);

console.log(
  'JSON:',
  './v7-question-profile-maps.json'
);

console.log(
  'CSV:',
  './v7-question-profile-maps.csv'
);

console.log('');
console.log(
  'DOMAIN COUNTS'
);

console.table(
  Object.entries(
    summary
  )
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .map(
      ([domain, count]) => ({
        domain,
        count,
      })
    )
);


await pool.end();
