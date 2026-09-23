import fs from 'fs';

const file =
  './frontend/src/services/neetRecommendationService.js';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


src =
  src.replace(
`export async function fetchNeetAdmissionHistory({
  collegeName,
  course,
  category,
  quota,
  rank,
}) {`,
`export async function fetchNeetAdmissionHistory({
  collegeName,
  course,
  category,
  quota,
  rank,
  round,
}) {`
  );


const anchor =
`  if (
    rank
  ) {
    params.set(
      'rank',
      String(
        rank
      )
    );
  }`;


const replacement =
`${anchor}


  if (
    round
  ) {
    params.set(
      'round',
      String(
        round
      )
    );
  }`;


if (
  !src.includes(
    anchor
  )
) {
  throw new Error(
    'Frontend NEET history rank anchor not found.'
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
  'Frontend NEET history now sends round.'
);
