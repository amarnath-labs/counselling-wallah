import fs from "node:fs";

const files = [
  "./src/components/RouteSEO.jsx",
  "./scripts/generate-seo-pages.mjs",
];

for (
  const file of files
) {
  if (
    !fs.existsSync(file)
  ) {
    continue;
  }

  let source =
    fs.readFileSync(
      file,
      "utf8"
    );

  source =
    source.replaceAll(
      "College Predictor 2026 - JEE Main & UPTAC | TruMarg",
      "College Predictor 2026 - JEE Main, JEE Advanced & UPTAC | TruMarg"
    );

  fs.writeFileSync(
    file,
    source,
    "utf8"
  );

  console.log(
    `Updated ${file}`
  );
}
