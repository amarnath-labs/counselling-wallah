import {
  buildCareerProfileFingerprint,
} from './profileFingerprint.js';


function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}


function normalizeList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map(normalize)
    .filter(Boolean);
}


function intersectionCount(
  left = [],
  right = []
) {
  const rightSet =
    new Set(
      normalizeList(right)
    );

  return normalizeList(left)
    .filter(
      value =>
        rightSet.has(value)
    )
    .length;
}


export function scoreQuestionForProfile(
  question,
  profile
) {
  const fingerprint =
    buildCareerProfileFingerprint(
      profile
    );


  let score = 0;


  /*
  |--------------------------------------------------------------------------
  | Stage — strongest hard context
  |--------------------------------------------------------------------------
  */

  const questionStages =
    normalizeList(
      question.stages
    );

  if (
    questionStages.length === 0
  ) {
    score += 4;
  }
  else if (
    questionStages.includes(
      fingerprint.stage
    )
  ) {
    score += 25;
  }
  else {
    return {
      eligible: false,
      score: -1000,
      reasons: [
        'stage-mismatch',
      ],
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Interest direction
  |--------------------------------------------------------------------------
  */

  const questionInterests =
    normalizeList(
      question.interests
    );

  if (
    questionInterests.length === 0
  ) {
    score += 3;
  }
  else if (
    questionInterests.includes(
      fingerprint.interest
    )
  ) {
    score += 22;
  }


  /*
  |--------------------------------------------------------------------------
  | Subjects
  |--------------------------------------------------------------------------
  */

  const subjectMatches =
    intersectionCount(
      fingerprint.subjects,
      question.subjects
    );

  score +=
    subjectMatches * 12;


  /*
  |--------------------------------------------------------------------------
  | Board
  |--------------------------------------------------------------------------
  |
  | Board should normally have low weight.
  | Career questions should not become overly board-dependent.
  |
  */

  const boards =
    normalizeList(
      question.boards
    );

  if (
    boards.length > 0 &&
    boards.includes(
      fingerprint.board
    )
  ) {
    score += 4;
  }


  /*
  |--------------------------------------------------------------------------
  | Universal / exploration question
  |--------------------------------------------------------------------------
  */

  if (
    question.universal === true
  ) {
    score += 6;
  }


  /*
  |--------------------------------------------------------------------------
  | Undecided students
  |--------------------------------------------------------------------------
  */

  const undecided =
    new Set([
      '',
      'not decided yet',
      'not sure',
      'undecided',
    ]);

  if (
    undecided.has(
      fingerprint.interest
    )
  ) {
    if (
      question.exploration === true
    ) {
      score += 18;
    }

    /*
     * Avoid aggressively specialized questions
     * when student has not chosen an interest.
     */
    if (
      question.specialized === true
    ) {
      score -= 10;
    }
  }


  return {
    eligible: true,
    score,

    reasons: {
      stage:
        fingerprint.stage,

      interest:
        fingerprint.interest,

      subjectMatches,

      board:
        fingerprint.board,
    },
  };
}


export default scoreQuestionForProfile;
