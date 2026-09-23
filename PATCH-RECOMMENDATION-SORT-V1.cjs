const fs =
  require("fs");

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| Replace sortWithinBucket
|--------------------------------------------------------------------------
*/

const pattern =
  /function\s+sortWithinBucket\s*\([^)]*\)\s*\{[\s\S]*?\n\}/;


const replacement =
`function sortWithinBucket(
  a,
  b
) {
  const number = (
    value
  ) => {
    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  };


  const scoreA =
    number(
      a?.matchScore ??
      a?.premium?.score ??
      a?.overall
    ) ??
    -1;


  const scoreB =
    number(
      b?.matchScore ??
      b?.premium?.score ??
      b?.overall
    ) ??
    -1;


  if (
    scoreB !== scoreA
  ) {
    return (
      scoreB -
      scoreA
    );
  }


  const coverageA =
    number(
      a?.dataCoverage ??
      a?.premium?.dataCoverage
    ) ??
    0;


  const coverageB =
    number(
      b?.dataCoverage ??
      b?.premium?.dataCoverage
    ) ??
    0;


  if (
    coverageB !== coverageA
  ) {
    return (
      coverageB -
      coverageA
    );
  }


  return (
    number(
      b?.admission?.score
    ) ??
    0
  ) -
  (
    number(
      a?.admission?.score
    ) ??
    0
  );
}`;


if (
  !pattern.test(
    text
  )
) {
  throw new Error(
    "sortWithinBucket function not found"
  );
}


text =
  text.replace(
    pattern,
    replacement
  );


/*
|--------------------------------------------------------------------------
| Better bucket order
|--------------------------------------------------------------------------
|
| Target -> Safe -> Dream -> Backup
|
|--------------------------------------------------------------------------
*/

text =
  text.replace(
    /const\s+bucketOrder\s*=\s*\[\s*['"]dream['"]\s*,\s*['"]target['"]\s*,\s*['"]safe['"]\s*,\s*['"]backup['"]\s*,?\s*\]/,
    `const bucketOrder = [
          'target',
          'safe',
          'dream',
          'backup',
        ]`
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: bucket ranking sorted by personalized score"
);
