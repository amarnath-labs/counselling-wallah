import fs from 'fs';

const file =
  './frontend/src/components/CollegeCard.jsx';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


/*
|--------------------------------------------------------------------------
| Add NEET identification close to row data
|--------------------------------------------------------------------------
*/

if (
  !src.includes(
    'const isNeetCard ='
  )
) {

  const anchor =
`  const premium =
    row?.premium || null;`;


  const replacement =
`  const premium =
    row?.premium || null;


  const isNeetCard =
    String(
      row?.examId ||
      ''
    )
      .trim()
      .toLowerCase() ===
      'neet' ||
    String(
      row?.sourceExam ||
      ''
    )
      .trim()
      .toLowerCase() ===
      'neet ug' ||
    row?.neetMccAuthoritative ===
      true;`;


  if (
    !src.includes(
      anchor
    )
  ) {
    throw new Error(
      'CollegeCard premium anchor not found.'
    );
  }


  src =
    src.replace(
      anchor,
      replacement
    );
}


/*
|--------------------------------------------------------------------------
| Replace static JoSAA label
|--------------------------------------------------------------------------
*/

const oldLabel =
  "JoSAA Match:{' '}";


const labelCount =
  src.split(
    oldLabel
  ).length - 1;


console.log(
  'Static JoSAA label count:',
  labelCount
);


if (
  labelCount < 1
) {
  throw new Error(
    'Static JoSAA Match label not found.'
  );
}


src =
  src.replaceAll(
    oldLabel,
    "{isNeetCard ? 'Rank Match' : 'JoSAA Match'}:{' '}"
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET Rank Match label patched.'
);
