import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  source.includes(
    "TRUMARG ZERO ADMISSION FIT GATE"
  )
) {
  console.log(
    "Zero Admission Fit ranking gate already present."
  );

  process.exit(0);
}

const functionIndex =
  source.indexOf(
    "function comparePremiumRows("
  );

if (
  functionIndex === -1
) {
  throw new Error(
    "comparePremiumRows function not found."
  );
}

const bodyStart =
  source.indexOf(
    "{",
    functionIndex
  );

if (
  bodyStart === -1
) {
  throw new Error(
    "comparePremiumRows body not found."
  );
}

const addition =
`
  /*
  |--------------------------------------------------------------------------
  | TRUMARG ZERO ADMISSION FIT GATE
  |--------------------------------------------------------------------------
  |
  | A verified 0 admission-fit option cannot outrank
  | another option with non-zero admission fit.
  |
  | Existing score / bucket / cutoff logic remains unchanged.
  |--------------------------------------------------------------------------
  */

  const admissionFitA =
    num(
      a?.premium
        ?.breakdown
        ?.rank
    );

  const admissionFitB =
    num(
      b?.premium
        ?.breakdown
        ?.rank
    );

  const zeroAdmissionA =
    admissionFitA !== null &&
    admissionFitA <= 0;

  const zeroAdmissionB =
    admissionFitB !== null &&
    admissionFitB <= 0;

  if (
    zeroAdmissionA !==
    zeroAdmissionB
  ) {
    return zeroAdmissionA
      ? 1
      : -1;
  }

`;

source =
  source.slice(
    0,
    bodyStart + 1
  ) +
  addition +
  source.slice(
    bodyStart + 1
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Zero Admission Fit ranking gate added."
);
