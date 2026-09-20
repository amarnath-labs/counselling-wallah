import fs from "node:fs";

const file =
  "./src/services/recommendationService.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const oldBlockRegex =
  /if\s*\(\s*profile\.quota\s*\)\s*\{[\s\S]*?params\.set\(\s*['"]quota['"]\s*,[\s\S]*?\);\s*\}\s*else\s+if\s*\(\s*normalizedExam\s*!==\s*['"]uptac['"]\s*\)\s*\{[\s\S]*?params\.set\(\s*['"]quota['"]\s*,\s*['"]AI['"]\s*\);\s*\}/m;

const newBlock =
`/*
  |--------------------------------------------------------------------------
  | QUOTA / HOME-STATE ELIGIBILITY
  |--------------------------------------------------------------------------
  |
  | JEE Main:
  | HS / OS must be derived automatically from homeState.
  | Do NOT force AI when homeState exists.
  |
  | Explicit special quota can still be sent.
  |--------------------------------------------------------------------------
  */

  const normalizedQuota =
    String(
      profile.quota || ''
    )
      .trim()
      .toUpperCase();

  const automaticJosaaQuotas =
    new Set([
      '',
      'AI',
      'HS',
      'OS',
      'ALL INDIA',
      'HOME STATE',
      'OTHER STATE',
    ]);

  const useAutomaticHomeStateQuota =
    normalizedExam === 'jee-main' &&
    Boolean(profile.homeState) &&
    automaticJosaaQuotas.has(
      normalizedQuota
    );

  if (
    profile.quota &&
    !useAutomaticHomeStateQuota
  ) {
    params.set(
      'quota',
      String(
        profile.quota
      )
    );
  }

  /*
   * IMPORTANT:
   * No default quota=AI for JEE Main.
   * Backend derives HS/OS from homeState.
   */`;

if (
  source.includes(
    "useAutomaticHomeStateQuota"
  )
) {
  console.log(
    "JEE Main automatic HS/OS quota fix already present."
  );

  process.exit(0);
}

if (
  !oldBlockRegex.test(
    source
  )
) {
  throw new Error(
    "Old quota/default-AI block not found."
  );
}

source =
  source.replace(
    oldBlockRegex,
    newBlock
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Removed forced AI quota for JEE Main home-state profiles."
);

console.log(
  "Backend will now derive HS / OS / AI eligibility."
);
