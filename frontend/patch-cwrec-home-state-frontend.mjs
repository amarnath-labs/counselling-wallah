import fs from "node:fs";

const file =
  "./src/services/cwRecRecommendationService.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  source.includes(
    "params.set(\n      'homeState'"
  )
) {
  console.log(
    "Frontend homeState already present."
  );

  process.exit(0);
}

const marker =
`  if (profile.gender) {
    params.set(
      'gender',
      String(profile.gender)
    );
  }
`;

if (
  !source.includes(marker)
) {
  throw new Error(
    "Could not find active gender request block."
  );
}

const replacement =
`${marker}

  /*
  |--------------------------------------------------------------------------
  | HOME STATE
  |--------------------------------------------------------------------------
  |
  | Hard eligibility input.
  | This does NOT add score or bonus points.
  |
  */

  if (profile.homeState) {
    params.set(
      'homeState',
      String(profile.homeState)
    );
  }
`;

source =
  source.replace(
    marker,
    replacement
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "CW frontend homeState wiring complete."
);
