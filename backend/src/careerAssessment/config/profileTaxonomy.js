export const INTEREST_DIRECTIONS =
  Object.freeze([
    'not-decided-yet',

    'science',
    'computer-technology',
    'engineering',
    'healthcare-medical',

    'commerce',
    'finance',
    'business-management',
    'entrepreneurship',

    'humanities-social-sciences',
    'law-governance',

    'arts-design',
    'performing-arts',

    'sports',

    'agriculture-environment',

    'vocational-practical-learning',

    'hotel-tourism-hospitality',
  ]);


export const STREAMS =
  Object.freeze([
    'science-pcm',
    'science-pcb',
    'science-pcmb',
    'science-pcm-computer-science',
    'science-pcb-psychology',
    'science-biotechnology',

    'commerce-with-mathematics',
    'commerce-without-mathematics',

    'humanities-arts',
    'humanities-with-mathematics',
    'humanities-with-psychology',
    'humanities-with-legal-studies',

    'fine-arts-visual-arts',
    'performing-arts',
    'agriculture',
    'home-science',
    'vocational-skill-based',
    'sports-physical-education',
    'other',
  ]);


export const ENTRANCE_EXAMS =
  Object.freeze([
    'jee-main',
    'jee-advanced',
    'bitsat',
    'viteee',
    'srmjeee',
    'manipal-entrance',
    'comedk-uget',

    'mht-cet',
    'wbjee',
    'kcet',
    'keam',
    'gujcet',
    'ap-eapcet',
    'tg-eapcet',
    'ojee',
    'uptac-counselling',

    'neet-ug',
    'nursing-entrance',
    'aiims-nursing',
    'paramedical-entrance',
    'pharmacy-admission',

    'cuet-ug',
    'iiser-iat',
    'nest',

    'nata',
    'jee-main-paper-2',
    'uceed',
    'nid-dat',
    'nift-entrance',
    'design-portfolio-entrance',

    'fine-arts-admission',

    'clat',
    'ailet',
    'slat',
    'mh-cet-law',

    'ipmat',
    'jipmat',
    'npat',
    'set-symbiosis',

    'nchm-jee',
    'hotel-management-entrance',

    'journalism-media-entrance',
    'performing-arts-audition',

    'agriculture-university-admission',
    'state-agriculture-counselling',

    'nda-na',
    'technical-entry-scheme-10plus2',

    'imu-cet',
    'merchant-navy-sponsorship',

    'ca-foundation',
    'cseet',
    'cma-foundation',

    'ncet-itep',

    'other',
  ]);

export const DEGREE_FAMILIES =
  Object.freeze([
    'btech',
    'be',
    'bsc',
    'bca',

    'mbbs',
    'bds',
    'bpharm',
    'nursing',
    'allied-health',

    'bcom',
    'bba',
    'ba-economics',

    'ba',
    'llb',
    'design',
    'fine-arts',

    'hotel-management',
    'agriculture',

    'diploma',

    'other',
  ]);


export const STAGE_PROFILE_RULES =
  Object.freeze({

    'class-8': {
      dimensions: [
        'board',
        'interestDirection',
        'subjects',
      ],

      defaultGoals: [
        'explore-careers',
      ],

      allowStream: false,
      allowDegree: false,
      allowSpecialization: false,
    },


    'class-9': {
      dimensions: [
        'board',
        'interestDirection',
        'subjects',
      ],

      defaultGoals: [
        'explore-careers',
        'understand-strengths',
      ],

      allowStream: false,
      allowDegree: false,
      allowSpecialization: false,
    },


    'class-10': {
      dimensions: [
        'board',
        'interestDirection',
        'subjects',
        'targetStream',
      ],

      defaultGoals: [
        'choose-stream',
        'explore-careers',
      ],

      allowStream: true,
      allowDegree: false,
      allowSpecialization: false,
    },


    'class-11': {
      dimensions: [
        'board',
        'stream',
        'interestDirection',
        'subjects',
        'careerFamilies',
      ],

      defaultGoals: [
        'choose-course',
        'entrance-exams',
        'explore-careers',
      ],

      allowStream: true,
      allowDegree: false,
      allowSpecialization: false,
    },


    'class-12': {
      dimensions: [
        'board',
        'stream',
        'interestDirection',
        'subjects',
        'careerFamilies',
        'targetCourses',
      ],

      defaultGoals: [
        'choose-course',
        'entrance-exams',
        'choose-college',
        'explore-careers',
      ],

      allowStream: true,
      allowDegree: true,
      allowSpecialization: false,
    },


    college: {
      dimensions: [
        'degree',
        'specialization',
        'interestDirection',
        'subjects',
        'skills',
        'careerFamilies',
        'goals',
      ],

      defaultGoals: [
        'career-direction',
      ],

      allowStream: false,
      allowDegree: true,
      allowSpecialization: true,
    },


    graduate: {
      dimensions: [
        'degree',
        'specialization',
        'interestDirection',
        'skills',
        'careerFamilies',
        'goals',
      ],

      defaultGoals: [
        'career-direction',
      ],

      allowStream: false,
      allowDegree: true,
      allowSpecialization: true,
    },
  });


export function getStageProfileRule(
  stage
) {
  return (
    STAGE_PROFILE_RULES[
      stage
    ] ||
    null
  );
}


export default STAGE_PROFILE_RULES;




