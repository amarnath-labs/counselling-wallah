import fs from "node:fs";
import * as cheerio from "cheerio";

const INPUT = "./josaa-2026-institutes.html";
const OUTPUT = "./josaa-2026-official-institutes.json";

if (!fs.existsSync(INPUT)) {
  throw new Error(`${INPUT} not found`);
}

const html = fs.readFileSync(INPUT, "utf8");
const $ = cheerio.load(html);

const institutes = [];

$(
  'span[id*="gvInstTypelist"][id$="lblinstcd"]'
).each((_, el) => {

  const text = $(el)
    .text()
    .replace(/\s+/g, " ")
    .trim();

  /*
    Example:
    101 Indian Institute of Technology Bhubaneswar
  */

  const match = text.match(
    /^(\d+)\s+(.+)$/
  );

  if (!match) return;

  institutes.push({
    josaa_code: match[1].trim(),
    institute_name: match[2].trim()
  });
});

/*
  Remove accidental duplicates by JoSAA code
*/

const unique = [
  ...new Map(
    institutes.map(x => [
      x.josaa_code,
      x
    ])
  ).values()
];

unique.sort(
  (a, b) =>
    Number(a.josaa_code) -
    Number(b.josaa_code)
);

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(unique, null, 2),
  "utf8"
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "OFFICIAL JOSAA 2026 INSTITUTES"
);
console.log(
  "========================================"
);

console.log(
  "Institutes extracted:",
  unique.length
);

console.table(
  unique.slice(0, 20)
);

console.log("");
console.log(
  "Saved:",
  OUTPUT
);
