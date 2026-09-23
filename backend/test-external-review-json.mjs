import {
  getExternalReviewIntelligence,
  getExternalReviewStats,
} from "./src/services/externalReviewJsonService.js";

console.log(
  getExternalReviewStats()
);

console.dir(
  getExternalReviewIntelligence({
    collegeName:
      "IIITV-ICD (Indian Institute of Information Technology Vadodara - International Campus Diu)",
  }),
  {
    depth: null,
  }
);
