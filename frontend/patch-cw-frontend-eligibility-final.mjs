import fs from "node:fs";

const file =
  "./src/services/cwRecRecommendationService.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

/*
|--------------------------------------------------------------------------
| Replace old quota sending
|--------------------------------------------------------------------------
*/

const oldQuotaRegex =
  /if\s*\(\s*profile\.quota\s*\)\s*\{\s*params\.set\(\s*['"]quota['"]\s*,\s*String\(\s*profile\.quota\s*\)\s*\);\s*\}/m;

if (
  oldQuotaRegex.test(source)
) {
  source =
    source.replace(
      oldQuotaRegex,
`/*
  |--------------------------------------------------------------------------
  | QUOTA
  |--------------------------------------------------------------------------
  |
  | For JEE Main, HS/OS eligibility is derived from homeState.
  | Do NOT force normal AI/HS/OS quota when homeState exists.
  |
  | Special quota values remain explicit.
  |
  */

  const normalizedExamId =
    String(
      examId || ''
    )
      .trim()
      .toLowerCase();

  const normalizedQuota =
    String(
      profile.quota || ''
    )
      .trim()
      .toUpperCase();

  const normalJosaaQuotas =
    new Set([
      'AI',
      'HS',
      'OS',
      'ALL INDIA',
      'HOME STATE',
      'OTHER STATE',
    ]);

  const shouldSendQuota =
    Boolean(
      profile.quota
    ) &&
    !(
      normalizedExamId ===
        'jee-main' &&
      profile.homeState &&
      normalJosaaQuotas.has(
        normalizedQuota
      )
    );

  if (
    shouldSendQuota
  ) {
    params.set(
      'quota',
      String(
        profile.quota
      )
    );
  }`
    );

  console.log(
    "Fixed frontend JEE quota/homeState handling."
  );
}
else if (
  source.includes(
    "normalJosaaQuotas"
  )
) {
  console.log(
    "Frontend quota/homeState fix already present."
  );
}
else {
  throw new Error(
    "Old profile.quota block not found."
  );
}

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "CW frontend eligibility fix complete."
);
