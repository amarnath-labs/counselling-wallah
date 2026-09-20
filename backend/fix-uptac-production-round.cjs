const fs = require("fs");

const file = "./src/routes/counselling.js";
let s = fs.readFileSync(file, "utf8");

const oldText = `          /*
           * UPTAC database stores rounds as:
           * 1, 2, 3...
           */
          round =
            roundNumber;`;

const newText = `          /*
           * UPTAC production database stores rounds as:
           * Round 1, Round 2, Round 3...
           */
          round =
            \`Round \${roundNumber}\`;`;

if (!s.includes(oldText)) {
  throw new Error("Exact UPTAC round assignment not found");
}

s = s.replace(oldText, newText);

fs.writeFileSync(file, s, "utf8");

console.log("UPTAC round format fixed to Round N.");
