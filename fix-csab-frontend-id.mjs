import fs from "node:fs";

const files = [
  "./frontend/src/hooks/useAppState.jsx",
  "./frontend/src/pages/Results.jsx",
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${file}`);
  }

  const backup =
    file.replace(
      /(\.[^.]+)$/,
      ".before-csab-id-fix$1"
    );

  fs.copyFileSync(
    file,
    backup
  );

  let s =
    fs.readFileSync(
      file,
      "utf8"
    );

  const before =
    (
      s.match(
        /csab-special/g
      ) || []
    ).length;

  s =
    s.replaceAll(
      "csab-special",
      "csab"
    );

  fs.writeFileSync(
    file,
    s,
    "utf8"
  );

  console.log(
    file,
    "replacements:",
    before
  );
}

console.log("");
console.log(
  "=============================================="
);
console.log(
  "CSAB FRONTEND ID FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "JoSAA tab -> jee-main -> JOSAA"
);
console.log(
  "CSAB tab  -> csab -> CSAB_SPECIAL"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Review logic: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
