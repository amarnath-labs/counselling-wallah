import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const targets = [
  "./src/routes/cwRecV1-dev.js",
  "./src/services/cwRecDataV1.js",
  "./src/services/cwRecV1.js",
  "./src/services/reviewAspectInsightsService.js",
  "./src/services/reviewScoringService.js"
];

const tracked = new Set(
  execSync(
    'git ls-files',
    { encoding: "utf8" }
  )
    .split(/\r?\n/)
    .filter(Boolean)
    .map(x => x.replace(/^backend\//, ""))
);

for (const file of targets) {
  console.log("\n========================================");
  console.log(file);
  console.log("========================================");

  const source = fs.readFileSync(file, "utf8");

  const regex =
    /(?:import[\s\S]*?from\s*|import\s*)['"]([^'"]+)['"]/g;

  let match;

  while ((match = regex.exec(source))) {
    const spec = match[1];

    if (!spec.startsWith(".")) {
      console.log("PACKAGE :", spec);
      continue;
    }

    const resolved =
      path.normalize(
        path.join(
          path.dirname(file),
          spec
        )
      ).replace(/\\/g, "/");

    const clean =
      resolved.replace(/^\.\//, "");

    const exists =
      fs.existsSync(resolved);

    const isTracked =
      tracked.has(clean);

    console.log(
      `${exists ? "EXISTS " : "MISSING"} | ${isTracked ? "TRACKED  " : "UNTRACKED"} | ${clean}`
    );
  }
}
