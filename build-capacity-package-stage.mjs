import fs from "node:fs";
import { execFileSync } from "node:child_process";

const dir = ".capacity-package-stage";

fs.mkdirSync(dir, {
  recursive: true
});

const pkg = JSON.parse(
  execFileSync(
    "git",
    [
      "show",
      "HEAD:backend/package.json"
    ],
    {
      encoding: "utf8"
    }
  )
);

const lock = execFileSync(
  "git",
  [
    "show",
    "HEAD:backend/package-lock.json"
  ],
  {
    encoding: "utf8"
  }
);

pkg.dependencies = {
  ...pkg.dependencies,
  compression: "^1.8.1",
};

fs.writeFileSync(
  `${dir}/package.json`,
  JSON.stringify(pkg, null, 2) + "\n"
);

fs.writeFileSync(
  `${dir}/package-lock.json`,
  lock
);

console.log(
  "✅ Clean HEAD package snapshot created"
);
