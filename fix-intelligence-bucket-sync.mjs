import fs from "node:fs";

const file =
  "./frontend/src/components/CollegeCard.jsx";

const backup =
  "./frontend/src/components/CollegeCard.before-intelligence-bucket-sync.jsx";

if (!fs.existsSync(file)) {
  throw new Error(`Missing file: ${file}`);
}

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| MAIN ADMISSION BUCKET FOR INTELLIGENCE DISPLAY
|--------------------------------------------------------------------------
|
| The result card already uses row.bucket as the canonical admission bucket.
| Admission Intelligence should display the same canonical bucket.
|
| We are NOT changing admission calculations here.
| Only the displayed intelligence headline bucket is synchronized.
|--------------------------------------------------------------------------
*/

const oldBlock =
`const bucket =
                            intelligence
                              .historicalBucket;`;

const newBlock =
`const bucket =
                            row?.bucket
                              ? String(
                                  row.bucket
                                )
                                  .charAt(0)
                                  .toUpperCase() +
                                String(
                                  row.bucket
                                )
                                  .slice(1)
                                  .toLowerCase()
                              : intelligence
                                  .historicalBucket;`;

if (!s.includes(oldBlock)) {
  throw new Error(
    "Historical bucket display block not found."
  );
}

s =
  s.replace(
    oldBlock,
    newBlock
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
  "ADMISSION INTELLIGENCE BUCKET SYNCED"
);
console.log(
  "=============================================="
);
console.log(
  "CSAB Match Target -> Intelligence Target"
);
console.log(
  "JoSAA Match Target -> Intelligence Target"
);
console.log(
  "Admission calculation logic: UNCHANGED"
);
console.log(
  "Historical rows/trend data: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
