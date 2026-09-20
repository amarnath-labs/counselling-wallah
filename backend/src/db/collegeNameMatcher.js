/*
|--------------------------------------------------------------------------
| COLLEGE NAME MATCHER
|--------------------------------------------------------------------------
|
| SAFE MATCHING ORDER:
|
| 1. Exact normalized name
| 2. Verified alias
| 3. Conservative fuzzy match
|
| IMPORTANT:
| - Does NOT modify recommendation logic
| - Does NOT modify cutoff logic
| - Does NOT create colleges
| - Does NOT modify frontend
|
*/
/*
|--------------------------------------------------------------------------
| NORMALIZE
|--------------------------------------------------------------------------
*/

function normalizeCollegeName(value) {
  return String(value || '')
    .toLowerCase()

    .replace(/&/g, 'and')

    .replace(
      /\btechnological\b/g,
      'technology'
    )

    .replace(
      /\bmanufacturing\b/g,
      'manufacture'
    )

    .replace(
      /\bpandit\b/g,
      'pt'
    )

    .replace(
      /[^a-z0-9\s]/g,
      ' '
    )

    .replace(
      /\bthe\b/g,
      ' '
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


/*
|--------------------------------------------------------------------------
| VERIFIED NIRF ALIASES
|--------------------------------------------------------------------------
|
| LEFT  = NIRF official name
| RIGHT = existing database college name
|
| IMPORTANT:
| Only manually verified aliases belong here.
|
*/

const VERIFIED_ALIASES = new Map([
  /*
  |--------------------------------------------------------------------------
  | IIT BHU
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'Indian Institute of Technology (Banaras Hindu University) Varanasi'
    ),
    normalizeCollegeName(
      'Indian Institute of Technology (BHU) Varanasi'
    ),
  ],


  /*
  |--------------------------------------------------------------------------
  | MNIT JAIPUR
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'Malaviya National Institute of Technology'
    ),
    normalizeCollegeName(
      'Malaviya National Institute of Technology Jaipur'
    ),
  ],


  /*
  |--------------------------------------------------------------------------
  | BIT MESRA
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'Birla Institute of Technology'
    ),
    normalizeCollegeName(
      'Birla Institute of Technology, Mesra, Ranchi'
    ),
  ],


  /*
  |--------------------------------------------------------------------------
  | COEP
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'COEP Technological University'
    ),
    normalizeCollegeName(
      'COEP Technological University, Pune'
    ),
  ],


  /*
  |--------------------------------------------------------------------------
  | IIITDM JABALPUR
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'Pandit Dwarka Prasad Mishra Indian Institute of Information Technology, Design and Manufacturing (IIITDM) Jabalpur'
    ),
    normalizeCollegeName(
      'Pt. Dwarka Prasad Mishra Indian Institute of Information Technology, Design & Manufacture Jabalpur'
    ),
  ],


  /*
  |--------------------------------------------------------------------------
  | SHRI MATA VAISHNO DEVI UNIVERSITY
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'Shri Mata Vaishno Devi University'
    ),
    normalizeCollegeName(
      'Shri Mata Vaishno Devi University, Katra, Jammu & Kashmir'
    ),
  ],


  /*
  |--------------------------------------------------------------------------
  | IIIT NAYA RAIPUR
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'Dr. Shyama Prasad Mukherjee International Institute of Information Technology, Naya Raipur'
    ),
    normalizeCollegeName(
      'International Institute of Information Technology, Naya Raipur'
    ),
  ],


  /*
  |--------------------------------------------------------------------------
  | NIFTEM KUNDLI
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'National Institute of Food Technology, Enterprenurship & Management'
    ),
    normalizeCollegeName(
      'National Institute of Food Technology Entrepreneurship and Management, Kundli'
    ),
  ],


  /*
  |--------------------------------------------------------------------------
  | ISLAMIC UNIVERSITY OF SCIENCE & TECHNOLOGY
  |--------------------------------------------------------------------------
  |
  | NIRF location: Pulwama, Jammu and Kashmir
  | DB name: Islamic University of Science and Technology Kashmir
  |
  | Explicit alias only.
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'Islamic University of Science & Technology, Pulwama'
    ),
    normalizeCollegeName(
      'Islamic University of Science and Technology Kashmir'
    ),
  ],


  /*
  |--------------------------------------------------------------------------
  | NORTH EASTERN REGIONAL INSTITUTE
  |--------------------------------------------------------------------------
  */

  [
    normalizeCollegeName(
      'North Eastern Regional Institute of Science & Technology'
    ),
    normalizeCollegeName(
      'North Eastern Regional Institute of Science and Technology, Nirjuli-791109 (Itanagar),Arunachal Pradesh'
    ),
  ],
]);


/*
|--------------------------------------------------------------------------
| TOKENIZE
|--------------------------------------------------------------------------
*/

function tokenize(value) {
  return new Set(
    normalizeCollegeName(value)
      .split(' ')
      .filter(Boolean)
  );
}


/*
|--------------------------------------------------------------------------
| TOKEN SIMILARITY
|--------------------------------------------------------------------------
*/

function similarity(a, b) {
  const first =
    tokenize(a);

  const second =
    tokenize(b);

  if (
    first.size === 0 ||
    second.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  for (const token of first) {
    if (second.has(token)) {
      intersection++;
    }
  }

  const union =
    new Set([
      ...first,
      ...second,
    ]).size;

  return union > 0
    ? intersection / union
    : 0;
}


/*
|--------------------------------------------------------------------------
| EXACT MATCH
|--------------------------------------------------------------------------
*/

function findExactMatch(
  externalName,
  colleges
) {
  const target =
    normalizeCollegeName(
      externalName
    );

  return (
    colleges.find(
      (college) =>
        normalizeCollegeName(
          college.name
        ) === target
    ) || null
  );
}


/*
|--------------------------------------------------------------------------
| VERIFIED ALIAS MATCH
|--------------------------------------------------------------------------
*/

function findAliasMatch(
  externalName,
  colleges
) {
  const externalNormalized =
    normalizeCollegeName(
      externalName
    );

  const aliasTarget =
    VERIFIED_ALIASES.get(
      externalNormalized
    );

  if (!aliasTarget) {
    return null;
  }

  return (
    colleges.find(
      (college) =>
        normalizeCollegeName(
          college.name
        ) === aliasTarget
    ) || null
  );
}


/*
|--------------------------------------------------------------------------
| MAIN MATCHER
|--------------------------------------------------------------------------
*/

export function findCollegeMatch(
  externalName,
  colleges
) {
  /*
  |--------------------------------------------------------------------------
  | STEP 1 â€” EXACT
  |--------------------------------------------------------------------------
  */

  const exact =
    findExactMatch(
      externalName,
      colleges
    );

  if (exact) {
    return {
      college: exact,
      score: 1,
      matchType: 'exact',
    };
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 2 â€” VERIFIED ALIAS
  |--------------------------------------------------------------------------
  */

  const alias =
    findAliasMatch(
      externalName,
      colleges
    );

  if (alias) {
    return {
      college: alias,
      score: 1,
      matchType: 'verified_alias',
    };
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 3 â€” CONSERVATIVE FUZZY
  |--------------------------------------------------------------------------
  */

  let bestCollege = null;
  let bestScore = 0;

  for (const college of colleges) {
    const score =
      similarity(
        externalName,
        college.name
      );

    if (score > bestScore) {
      bestScore = score;
      bestCollege = college;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | SAFETY THRESHOLD
  |--------------------------------------------------------------------------
  |
  | DO NOT LOWER THIS.
  |
  | Earlier loose matching produced:
  |
  | VIT
  | -> Kanpur Institute of Technology
  |
  | SRM
  | -> S.R. Institute Lucknow
  |
  | IIT Gandhinagar
  | -> another IIT
  |
  |--------------------------------------------------------------------------
  */

  const SAFE_FUZZY_THRESHOLD =
    0.85;


  if (
    !bestCollege ||
    bestScore <
      SAFE_FUZZY_THRESHOLD
  ) {
    return {
      college: null,
      score: bestScore,
      matchType: 'unmatched',
    };
  }


  /*
  |--------------------------------------------------------------------------
  | HIGH CONFIDENCE FUZZY MATCH
  |--------------------------------------------------------------------------
  */

  return {
    college: bestCollege,
    score: bestScore,
    matchType: 'fuzzy',
  };
}


/*
|--------------------------------------------------------------------------
| EXPORT HELPERS
|--------------------------------------------------------------------------
*/

export {
  normalizeCollegeName,
};