import "dotenv/config";

import {
  getCandidateQuestions
} from "./src/repositories/careerQuestionRepository.js";

try {
  const rows =
    await getCandidateQuestions({
      stage: "foundation",
      excludeIds: [],
      limit: 2000,
      version: 7,
      currentClass: "class-8",
    });

  console.log(
    "CANDIDATE COUNT:",
    rows.length
  );

  console.log(
    "FIRST 10:"
  );

  console.dir(
    rows.slice(0, 10),
    {
      depth: 5
    }
  );
}
catch (error) {
  console.error(error);
}
process.exit();
