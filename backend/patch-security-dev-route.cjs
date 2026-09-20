const fs = require("fs");

const file = "./src/server.js";
let s = fs.readFileSync(file, "utf8");

const oldBlock = `app.use(
  '/api/dev/cw-rec',
  cwRecV1DevRouter
);`;

const newBlock = `if (process.env.NODE_ENV !== 'production') {
  app.use(
    '/api/dev/cw-rec',
    cwRecV1DevRouter
  );
}`;

if (!s.includes(oldBlock)) {
  throw new Error("cw-rec dev route block not found");
}

s = s.replace(oldBlock, newBlock);

fs.writeFileSync(file, s, "utf8");

console.log("Production dev route lock added.");
