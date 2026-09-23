import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );


/* =========================================================
   1. RESTORE DecisionIntelligencePanel index
========================================================= */

s =
  s.replace(
    /<DecisionIntelligencePanel([\s\S]*?)index=\{\s*serialOffset\s*\+\s*index\s*\}/m,
    (match, before) =>
      `<DecisionIntelligencePanel${before}index={index}`
  );


/* =========================================================
   2. CHANGE RecommendationCard index TO CONTINUOUS SERIAL
========================================================= */

const cardPattern =
  /(<RecommendationCard[\s\S]*?row=\{\s*row\s*\}[\s\S]*?)index=\{\s*index\s*\}/m;

if (
  !cardPattern.test(
    s
  )
) {
  throw new Error(
    "RecommendationCard index={index} not found"
  );
}

s =
  s.replace(
    cardPattern,
    `$1index={
                              serialOffset +
                              index
                            }`
  );


/* =========================================================
   3. ENSURE INLINE DEDUPE CALL IS CORRECT
========================================================= */

s =
  s.replace(
    /group\.dedupeRecommendationRows\(rows\)/g,
    "dedupeRecommendationRows(group.rows)"
  );


/* =========================================================
   4. VERIFY REQUIRED VARIABLES EXIST
========================================================= */

if (
  !s.includes(
    "const uniqueGroupRows ="
  )
) {
  throw new Error(
    "uniqueGroupRows definition missing"
  );
}

if (
  !s.includes(
    "const serialOffset ="
  )
) {
  throw new Error(
    "serialOffset definition missing"
  );
}

if (
  !s.includes(
    "uniqueGroupRows.map("
  )
) {
  throw new Error(
    "uniqueGroupRows.map not found"
  );
}


fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "FINAL INDEX CORRECTION APPLIED"
);
console.log(
  "========================================"
);
