/*
|--------------------------------------------------------------------------
| TruMarg Career Profile Fingerprint
|--------------------------------------------------------------------------
|
| Converts student basics into one deterministic adaptive profile.
|
|--------------------------------------------------------------------------
*/


function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}


function normalizeArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map(normalize)
        .filter(Boolean)
    ),
  ].sort();
}


export function buildCareerProfileFingerprint(
  profile = {}
) {
  const stage =
    normalize(
      profile.stage ||
      profile.classStage ||
      profile.class ||
      profile.currentClass
    );

  const board =
    normalize(
      profile.board
    );

  const interest =
    normalize(
      profile.interestDirection ||
      profile.interest ||
      profile.currentInterestDirection
    );

  const subjects =
    normalizeArray(
      profile.subjects ||
      profile.selectedSubjects ||
      []
    );


  const keyParts = [
    `stage:${stage || 'unknown'}`,
    `board:${board || 'unknown'}`,
    `interest:${interest || 'not-decided'}`,
    `subjects:${subjects.join(',') || 'none'}`,
  ];


  return {
    stage,
    board,
    interest,
    subjects,

    key:
      keyParts.join('|'),

    dimensions: {
      stage,
      board,
      interest,
      subjects,
    },
  };
}


export default buildCareerProfileFingerprint;
