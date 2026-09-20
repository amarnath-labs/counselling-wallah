/*
|--------------------------------------------------------------------------
| TruMarg Exam Availability
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Database/data delete nahi ho raha.
| Recommendation logic change nahi ho raha.
|
| Abhi sirf:
| - JEE Main
| - JEE Advanced
| - UPTAC
|
| enabled hain.
|
|--------------------------------------------------------------------------
*/

export const ENABLED_EXAM_IDS = Object.freeze([
  "jee-main",
  "jee-advanced",
  "uptac",
]);


export const ENABLED_EXAM_SET =
  new Set(
    ENABLED_EXAM_IDS
  );


export function normalizeExamId(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


export function isExamEnabled(examOrId) {
  const rawId =
    typeof examOrId === "object" &&
    examOrId !== null
      ? (
          examOrId.id ??
          examOrId.examId ??
          examOrId.exam_id ??
          examOrId.slug ??
          examOrId.code
        )
      : examOrId;

  return ENABLED_EXAM_SET.has(
    normalizeExamId(rawId)
  );
}


export function filterEnabledExams(exams) {
  if (!Array.isArray(exams)) {
    return [];
  }

  return exams.filter(
    exam =>
      isExamEnabled(exam)
  );
}


export function getExamAvailability(examOrId) {
  return {
    enabled:
      isExamEnabled(examOrId),
  };
}


export default {
  ENABLED_EXAM_IDS,
  ENABLED_EXAM_SET,
  normalizeExamId,
  isExamEnabled,
  filterEnabledExams,
  getExamAvailability,
};
