const fs = require("fs");

const file = "./src/routes/payments.js";
let s = fs.readFileSync(file, "utf8");

const marker = `router.get(
  '/test',
  (
    req,
    res
  ) => {`;

const replacement = `router.get(
  '/test',
  (
    req,
    res
  ) => {
    if (
      process.env.NODE_ENV === 'production'
    ) {
      return res.status(404).json({
        error: 'Route not found',
      });
    }`;

if (!s.includes(marker)) {
  throw new Error("payments /test route not found");
}

s = s.replace(marker, replacement);

fs.writeFileSync(file, s, "utf8");

console.log("Production payment test route lock added.");
