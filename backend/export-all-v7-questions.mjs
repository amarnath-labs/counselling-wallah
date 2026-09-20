import { pool } from './src/db/pool.js';
import fs from 'fs';


const { rows } = await pool.query(`
  SELECT
    id,
    stage,
    classes,
    trait,
    section,
    text
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


console.log(
  'TOTAL V7 QUESTIONS:',
  rows.length
);


let output = '';

rows.forEach(
  (question, index) => {
    const serial =
      index + 1;

    const classText =
      Array.isArray(
        question.classes
      )
        ? question.classes.join(', ')
        : '';


    output +=
      `============================================================\n`;

    output +=
      `SERIAL: ${serial}\n`;

    output +=
      `ID: ${question.id}\n`;

    output +=
      `STAGE: ${question.stage}\n`;

    output +=
      `CLASS: ${classText || '-'}\n`;

    output +=
      `TRAIT: ${question.trait || '-'}\n`;

    output +=
      `SECTION: ${question.section || '-'}\n`;

    output +=
      `QUESTION: ${question.text}\n`;

    output +=
      `============================================================\n\n`;
  }
);


fs.writeFileSync(
  './all-v7-questions-serial-wise.txt',
  output,
  'utf8'
);


console.log(
  'Saved:',
  './all-v7-questions-serial-wise.txt'
);


await pool.end();
