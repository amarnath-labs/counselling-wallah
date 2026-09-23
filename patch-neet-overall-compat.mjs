import fs from 'fs';

const file =
  './backend/src/services/neetRecommendationService.js';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


const anchor =
`    overallScore:
      admissionScore,

    score:
      admissionScore,

    recommendationScore:
      admissionScore,`;


const replacement =
`    /*
     * Existing CollegeCard percentage meter reads row.overall.
     * Keep NEET compatibility without changing JEE/UPTAC.
     */

    overall:
      admissionScore,

    overallScore:
      admissionScore,

    score:
      admissionScore,

    recommendationScore:
      admissionScore,`;


if (
  !src.includes(
    anchor
  )
) {
  throw new Error(
    'NEET score output anchor not found.'
  );
}


src =
  src.replace(
    anchor,
    replacement
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET backend row.overall compatibility added.'
);
