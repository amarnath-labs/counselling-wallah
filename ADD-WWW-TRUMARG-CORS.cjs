const fs = require("fs");

const file =
  "./backend/src/server.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


if (
  !text.includes(
    "https://trumarg.com"
  )
) {
  throw new Error(
    "Existing TruMarg CORS origin not found; manual inspection required"
  );
}


if (
  !text.includes(
    "https://www.trumarg.com"
  )
) {
  text =
    text.replace(
      /(['"]https:\/\/trumarg\.com['"]\s*,?)/,
      `$1
    'https://www.trumarg.com',`
    );
}


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: www.trumarg.com added to CORS allowlist if needed"
);
