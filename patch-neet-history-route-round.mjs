import fs from 'fs';

const file =
  './backend/src/routes/neetRecommendations.js';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


const old =
`          rank:
            req.query.rank,
        });`;


const replacement =
`          rank:
            req.query.rank,

          round:
            req.query.round ??
            1,
        });`;


if (
  !src.includes(
    old
  )
) {
  throw new Error(
    'NEET history route rank anchor not found.'
  );
}


src =
  src.replace(
    old,
    replacement
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET history route now forwards round.'
);
