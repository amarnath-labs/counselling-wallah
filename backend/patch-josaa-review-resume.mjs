import fs from "node:fs";

const file =
  "./collect-josaa-college-reviews.js";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  "./collect-josaa-college-reviews.before-resume-fix.js"
);

const oldSkip =
`    if (
      state.completed[
        college.id
      ] &&
      !options.force
    ) {`;

const newSkip =
`    if (
      state.completed[
        college.id
      ]?.status ===
        "qualified" &&
      !options.force
    ) {`;

if (
  !s.includes(oldSkip)
) {
  throw new Error(
    "Resume-skip block not found"
  );
}

s =
  s.replace(
    oldSkip,
    newSkip
  );

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Resume logic fixed: only QUALIFIED colleges will be skipped."
);
