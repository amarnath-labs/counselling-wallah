const fs = require("fs");

const file =
  "./backend/src/server.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


const anchor =
  "const allowedOrigins =";


const start =
  text.indexOf(
    anchor
  );


if (
  start === -1
) {
  throw new Error(
    "allowedOrigins block not found"
  );
}


const openBracket =
  text.indexOf(
    "[",
    start
  );


const closeBracket =
  text.indexOf(
    "];",
    openBracket
  );


if (
  openBracket === -1 ||
  closeBracket === -1
) {
  throw new Error(
    "allowedOrigins array not found"
  );
}


const block =
  text.slice(
    openBracket,
    closeBracket + 1
  );


const wanted = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:4173"
];


let newBlock =
  block;


for (
  const origin
  of wanted
) {
  if (
    !newBlock.includes(
      origin
    )
  ) {
    newBlock =
      newBlock.replace(
        "[",
        `[\n  '${origin}',`
      );
  }
}


text =
  text.slice(
    0,
    openBracket
  ) +
  newBlock +
  text.slice(
    closeBracket + 1
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: localhost dev origins added to CORS"
);
