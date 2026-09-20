import fs from "node:fs";

const file = "./validate-fee-json.js";

let code = fs.readFileSync(file, "utf8");

const oldText = `const records =
  JSON.parse(
    fs.readFileSync(
      inputFile,
      "utf8"
    )
  );`;

const newText = `const rawInput =
  fs.readFileSync(
    inputFile,
    "utf8"
  )
  .replace(/^\\uFEFF/, "")
  .trim();

const records =
  JSON.parse(rawInput);`;

if (!code.includes(oldText)) {
  console.error("JSON read block not found.");
  process.exit(1);
}

code = code.replace(
  oldText,
  newText
);

fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log(
  "Validator is now UTF-8 BOM safe."
);
