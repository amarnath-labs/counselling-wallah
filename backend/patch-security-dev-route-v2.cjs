const fs = require("fs");

const file = "./src/server.js";
let s = fs.readFileSync(file, "utf8");

if (
  s.includes(
    "process.env.NODE_ENV !== 'production'"
  ) &&
  s.includes(
    "'/api/dev/cw-rec'"
  )
) {
  console.log(
    "Dev route already production-locked."
  );
  process.exit(0);
}

const re =
  /app\.use\(\s*['"]\/api\/dev\/cw-rec['"]\s*,\s*cwRecV1DevRouter\s*\);/m;

if (!re.test(s)) {
  throw new Error(
    "cw-rec dev route block still not found"
  );
}

s = s.replace(
  re,
  `if (process.env.NODE_ENV !== 'production') {
  app.use(
    '/api/dev/cw-rec',
    cwRecV1DevRouter
  );
}`
);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Production dev route lock added."
);
