import {
  buildPsychometricBlueprint,
} from './src/services/career/psychometricBlueprint.js';


const profiles = {
  PCM_JEE: {
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
    targetCourses: [
      'btech',
    ],
    careerFamilies: [
      'engineering',
      'technology',
    ],
  },

  PCB_NEET: {
    stage: 'senior-secondary',
    currentClass: 'class-12',
    board: 'cbse',
    stream: 'science pcb',
    subjects: [
      'physics',
      'chemistry',
      'biology',
    ],
    targetExams: [
      'neet ug',
    ],
    targetCourses: [
      'mbbs',
    ],
    careerFamilies: [
      'healthcare',
      'medicine',
    ],
  },

  COMMERCE_IPMAT: {
    stage: 'senior-secondary',
    currentClass: 'class-12',
    board: 'cbse',
    stream: 'commerce with mathematics',
    subjects: [
      'accountancy',
      'economics',
      'business studies',
      'mathematics',
    ],
    targetExams: [
      'ipmat',
      'jipmat',
    ],
    targetCourses: [
      'bba',
      'ipm',
    ],
    careerFamilies: [
      'management',
      'business',
      'finance',
    ],
  },
};


for (
  const [
    name,
    profile,
  ] of
  Object.entries(
    profiles
  )
) {
  console.log(
    name,
    '=>',
    buildPsychometricBlueprint(
      profile
    ).families
  );
}
