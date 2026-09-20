import fs from "node:fs";

const path = "./src/routes/counselling.js";

let text = fs.readFileSync(path, "utf8");

/*
|--------------------------------------------------------------------------
| FIX UPTAC ROUND NORMALIZATION
|--------------------------------------------------------------------------
|
| DB stores: 1, 2, 3...
| Accept frontend values:
|   1
|   Round 1
|
|--------------------------------------------------------------------------
*/

const oldRoundBlock = /if\s*\(\s*examId\s*===\s*['"]uptac['"]\s*\)\s*\{\s*const roundNumber\s*=\s*round\s*\.replace\(\s*\/\^round\\s\*\/i,\s*['"]{0,1}['"]{0,1}\s*\)\s*\.trim\(\);\s*if\s*\(\s*\/\^\\d\+\$\/\.test\(\s*roundNumber\s*\)\s*\)\s*\{\s*round\s*=\s*`Round \$\{roundNumber\}`;\s*\}\s*\}/m;

const simplerRoundBlock = /if\s*\(\s*examId\s*===\s*['"]uptac['"]\s*\)\s*\{[\s\S]*?const roundNumber\s*=[\s\S]*?\.replace\([\s\S]*?\)[\s\S]*?\.trim\(\);[\s\S]*?if\s*\([\s\S]*?\^\\d\+[\s\S]*?\)\s*\{[\s\S]*?round\s*=\s*`Round \$\{roundNumber\}`;[\s\S]*?\}\s*\}/m;

const replacement = `if (examId === 'uptac') {

        const roundNumber =
          round
            .replace(
              /^round\\s*/i,
              ''
            )
            .trim();

        if (
          /^\\d+$/.test(
            roundNumber
          )
        ) {
          /*
           * UPTAC database stores rounds as:
           * 1, 2, 3...
           */
          round =
            roundNumber;
        }
      }`;

if (text.includes("`Round ${roundNumber}`")) {
  const before = text;

  text = text.replace(
    oldRoundBlock,
    replacement
  );

  if (text === before) {
    text = text.replace(
      simplerRoundBlock,
      replacement
    );
  }

  if (text === before) {
    throw new Error(
      "Could not safely replace UPTAC round block."
    );
  }

  console.log(
    "✅ UPTAC round normalization fixed"
  );
} else {
  console.log(
    "ℹ️ UPTAC round normalization already appears fixed"
  );
}

/*
|--------------------------------------------------------------------------
| HARD RESULT LIMIT = 500
|--------------------------------------------------------------------------
*/

if (!/\bLIMIT\s+500\b/i.test(text)) {

  const orderPattern =
    /(ORDER BY\s+co\.closing_rank\s+ASC,\s+c\.name\s+ASC,\s+b\.name\s+ASC)(\s*)(`)/m;

  if (!orderPattern.test(text)) {
    throw new Error(
      "Could not find counselling ORDER BY block."
    );
  }

  text = text.replace(
    orderPattern,
    `$1
        LIMIT 500$2$3`
  );

  console.log(
    "✅ Hard counselling result limit = 500"
  );

} else {

  console.log(
    "ℹ️ LIMIT 500 already present"
  );
}

fs.writeFileSync(
  path,
  text,
  "utf8"
);

console.log(
  "✅ counselling capacity patch complete"
);
