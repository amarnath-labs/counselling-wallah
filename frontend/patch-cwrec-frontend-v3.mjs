import fs from "node:fs";

const path =
  "./src/services/cwRecRecommendationService.js";

let s =
  fs.readFileSync(
    path,
    "utf8"
  );

if (
  s.includes(
    "cwRecAuthoritative:"
  )
) {
  console.log(
    "CW-REC frontend authoritative fields already present"
  );

  process.exit(0);
}

const anchor =
`  return {
    ...row,

    collegeId:
      row?.collegeId,`;

if (
  !s.includes(anchor)
) {
  throw new Error(
    "ADAPTER RETURN ANCHOR NOT FOUND"
  );
}

const replacement =
`  return {
    ...row,

    cwRecAuthoritative:
      true,

    reviewIntelligenceV3:
      row?.reviewIntelligenceV3 ??
      null,

    collegeId:
      row?.collegeId,`;

s =
  s.replace(
    anchor,
    replacement
  );

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: frontend adapter preserves Review Intelligence V3"
);
