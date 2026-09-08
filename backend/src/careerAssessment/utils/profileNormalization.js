import {
  getStageProfileRule,
} from '../config/profileTaxonomy.js';


export function slugify(
  value
) {
  return String(
    value || ''
  )
    .trim()
    .toLowerCase()
    .replace(
      /&/g,
      ' and '
    )
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );
}


function normalizeArray(
  values
) {
  if (!Array.isArray(values)) {
    return [];
  }


  return [
    ...new Set(
      values
        .map(
          slugify
        )
        .filter(
          Boolean
        )
    ),
  ];
}


function normalizeInterest(
  value
) {
  const interest =
    slugify(
      value
    );


  if (
    !interest ||
    interest ===
      'not-decided-yet' ||
    interest ===
      'not-sure' ||
    interest ===
      'undecided'
  ) {
    return null;
  }


  return interest;
}


export function normalizeProfile(
  profile = {}
) {
  const stage =
    slugify(
      profile.stage ||
      profile.currentClass ||
      profile.class
    );


  const rule =
    getStageProfileRule(
      stage
    );


  const explicitGoals =
    normalizeArray(
      profile.goals
    );


  const defaultGoals =
    rule?.defaultGoals ||
    [];


  return {

    /*
    |--------------------------------------------------------------------------
    | Identity / stage
    |--------------------------------------------------------------------------
    */

    stage,

    board:
      slugify(
        profile.board
      ) ||
      null,


    /*
    |--------------------------------------------------------------------------
    | School profile
    |--------------------------------------------------------------------------
    */

    stream:
      slugify(
        profile.stream
      ) ||
      null,

    targetStream:
      slugify(
        profile.targetStream
      ) ||
      null,

    subjects:
      normalizeArray(
        profile.subjects
      ),


    /*
    |--------------------------------------------------------------------------
    | Interest profile
    |--------------------------------------------------------------------------
    */

    interestDirection:
      normalizeInterest(
        profile.interestDirection ||
        profile.interest
      ),


    /*
    |--------------------------------------------------------------------------
    | Higher education profile
    |--------------------------------------------------------------------------
    */

    degree:
      slugify(
        profile.degree ||
        profile.currentDegree
      ) ||
      null,

    specialization:
      slugify(
        profile.specialization ||
        profile.branch ||
        profile.major
      ) ||
      null,

    targetCourses:
      normalizeArray(
        profile.targetCourses ||
        profile.courses
      ),


    /*
    |--------------------------------------------------------------------------
    | Career profile
    |--------------------------------------------------------------------------
    */

    careerFamilies:
      normalizeArray(
        profile.careerFamilies
      ),

    skills:
      normalizeArray(
        profile.skills
      ),

    goals:
      explicitGoals.length > 0
        ? explicitGoals
        : [
            ...defaultGoals,
          ],


    /*
    |--------------------------------------------------------------------------
    | Stable personalized selection
    |--------------------------------------------------------------------------
    */

    seed:
      String(
        profile.seed ||
        'trumarg-default'
      ),
  };
}


export default normalizeProfile;
