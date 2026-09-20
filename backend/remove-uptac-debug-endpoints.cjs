const fs = require("fs");

const file = "./src/routes/counselling.js";
let s = fs.readFileSync(file, "utf8");

const start1 = s.indexOf("/*\n|--------------------------------------------------------------------------\n| TEMPORARY PRODUCTION UPTAC DEBUG");
const route2 = s.indexOf("router.get(\n  '/admin/debug-production-uptac-values'");

if (start1 === -1) {
  throw new Error("First debug block not found");
}

if (route2 === -1) {
  throw new Error("Second debug route not found");
}

const exportPos = s.indexOf("export default router;", route2);

if (exportPos === -1) {
  throw new Error("export default router not found");
}

s =
  s.slice(0, start1).trimEnd() +
  "\n\n" +
  s.slice(exportPos);

fs.writeFileSync(file, s, "utf8");

console.log("Temporary UPTAC debug endpoints removed.");
