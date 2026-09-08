import class8Questions from './class8.js';
import class8Batch02Questions from './class8Batch02.js';

import class9Questions from './class9.js';
import class9Batch01Questions from './class9Batch01.js';

import class10Questions from './class10.js';
import class10Batch01Questions from './class10Batch01.js';

import class11Questions from './class11.js';
import class11Batch01Questions from './class11Batch01.js';

import class12Questions from './class12.js';
import class12Batch01Questions from './class12Batch01.js';

import collegeQuestions from './college.js';
import collegeBatch01Questions from './collegeBatch01.js';

import graduateQuestions from './graduate.js';
import graduateBatch01Questions from './graduateBatch01.js';


export const CAREER_QUESTION_BANK_V7 = [
  ...class8Questions,
  ...class8Batch02Questions,

  ...class9Questions,
  ...class9Batch01Questions,

  ...class10Questions,
  ...class10Batch01Questions,

  ...class11Questions,
  ...class11Batch01Questions,

  ...class12Questions,
  ...class12Batch01Questions,

  ...collegeQuestions,
  ...collegeBatch01Questions,

  ...graduateQuestions,
  ...graduateBatch01Questions,
];


export function getV7QuestionStats() {
  const byClass = {};


  for (
    const question of
    CAREER_QUESTION_BANK_V7
  ) {
    const classKey =
      question.classes?.[0] ||
      question.stage;


    byClass[
      classKey
    ] =
      (
        byClass[
          classKey
        ] ||
        0
      ) + 1;
  }


  return {
    total:
      CAREER_QUESTION_BANK_V7.length,

    byClass,
  };
}


export default CAREER_QUESTION_BANK_V7;

