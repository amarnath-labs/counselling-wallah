import "dotenv/config";

import {
  startCareerAssessment
} from "./src/services/career/assessmentService.js";

try {
  const result =
    await startCareerAssessment({
      stage: "class-8",
      basics: {
        class: "class-8"
      }
    });

  console.log("SERVICE SUCCESS");
  console.dir(result, {
    depth: 10
  });
}
catch (error) {
  console.error("");
  console.error("SERVICE FAILED");
  console.error("MESSAGE:", error.message);
  console.error("CODE:", error.code);
  console.error("DETAIL:", error.detail);
  console.error("HINT:", error.hint);
  console.error("STATUS:", error.statusCode);
  console.error("");
  console.error(error.stack);
}

process.exit();
