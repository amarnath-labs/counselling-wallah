import fs from "node:fs";

const file =
  "./frontend/src/components/CollegeCard.jsx";

const backup =
  "./frontend/src/components/CollegeCard.before-canonical-intelligence-bucket.jsx";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);


const oldPattern =
/const bucket\s*=\s*intelligence\s*\.historicalBucket\s*;/m;

if (
  !oldPattern.test(s)
) {
  throw new Error(
    "Historical intelligence bucket block not found."
  );
}


s =
  s.replace(
    oldPattern,
`const bucket =
                            String(
                              row?.bucket ||
                              intelligence?.historicalBucket ||
                              'target'
                            )
                              .trim()
                              .toLowerCase();`
  );


fs.writeFileSync(
  file,
  s,
  "utf8"
);


console.log("");
console.log(
  "=============================================="
);
console.log(
  "INTELLIGENCE BUCKET SYNCED"
);
console.log(
  "=============================================="
);
console.log(
  "CSAB Match Target -> Intelligence Target"
);
console.log(
  "CSAB Match Dream  -> Intelligence Dream"
);
console.log(
  "JoSAA Match same behavior"
);
console.log(
  "Admission calculation logic: UNCHANGED"
);
console.log(
  "Historical cutoff data: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
