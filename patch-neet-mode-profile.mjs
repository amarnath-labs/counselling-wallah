import fs from 'fs';

const file =
  './frontend/src/pages/Profile.jsx';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


/*
 * Replace NEET MCC chip condition:
 *
 * old concept:
 *   (p?.counsellingMode || 'mcc') === 'mcc'
 *
 * new:
 *   p?.counsellingMode !== 'state'
 */

const pattern =
  /\(\s*p\?\.counsellingMode\s*\|\|\s*['"]mcc['"]\s*\)\s*===\s*['"]mcc['"]/g;


const count =
  (
    src.match(
      pattern
    ) ||
    []
  ).length;


console.log(
  'MCC default-condition anchors:',
  count
);


if (
  count < 1
) {
  throw new Error(
    'NEET MCC button condition anchor not found.'
  );
}


src =
  src.replace(
    pattern,
    "p?.counsellingMode !== 'state'"
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'Profile NEET MCC default fixed.'
);
