const fs = require("fs");

const file =
  "./backend/src/server.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


const anchor =
  "'https://counselling-wallah-frontend.vercel.app',";


if (
  !text.includes(
    anchor
  )
) {
  throw new Error(
    "CORS production origin anchor not found"
  );
}


const originsToAdd = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:4173",
];


let insertLines = "";


for (
  const origin
  of originsToAdd
) {
  if (
    !text.includes(
      `'${origin}'`
    )
  ) {
    insertLines +=
      `    '${origin}',\n`;
  }
}


if (
  insertLines
) {
  text =
    text.replace(
      anchor,
      `${insertLines}    ${anchor}`
    );
}


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: localhost 5173/5174/5175/4173 allowed"
);
