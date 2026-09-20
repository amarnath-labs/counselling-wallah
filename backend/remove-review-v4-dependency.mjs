import fs from "node:fs";

const file =
  "./src/routes/counselling.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const before =
  source;

/*
|--------------------------------------------------------------------------
| REMOVE V4 IMPORT
|--------------------------------------------------------------------------
*/

source =
  source.replace(
    /^\s*import\s+.*reviewIntelligenceV4Service\.js.*\r?\n/gm,
    ''
  );

source =
  source.replace(
    /import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]*reviewIntelligenceV4Service\.js['"];\s*/gm,
    ''
  );

/*
|--------------------------------------------------------------------------
| REMOVE SIMPLE V4 CALL BLOCKS
|--------------------------------------------------------------------------
*/

source =
  source.replace(
    /^\s*const\s+\w+\s*=\s*await\s+\w*review\w*v4\w*\([\s\S]*?\);\s*$/gim,
    ''
  );

source =
  source.replace(
    /^\s*await\s+\w*review\w*v4\w*\([\s\S]*?\);\s*$/gim,
    ''
  );

if (
  source.includes(
    "reviewIntelligenceV4Service"
  )
) {
  console.error(
    "V4 reference still exists. Stop and inspect manually."
  );

  process.exit(1);
}

if (
  source === before
) {
  console.log(
    "No V4 changes made."
  );
} else {
  fs.writeFileSync(
    file,
    source,
    "utf8"
  );

  console.log(
    "Removed Review V4 dependency from counselling.js."
  );
}
