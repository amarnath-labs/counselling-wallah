/*
|--------------------------------------------------------------------------
| TruMarg Enabled Exams
|--------------------------------------------------------------------------
|
| Data/database ko delete nahi karna hai.
| Sirf currently supported exams API se expose karne hain.
|
|--------------------------------------------------------------------------
*/

export const ENABLED_EXAM_IDS =
  Object.freeze([
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


export function filterEnabledExams(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.filter(
    row =>
      isExamEnabled(row)
  );
}


export default {
  ENABLED_EXAM_IDS,
  ENABLED_EXAM_SET,
  normalizeExamId,
  isExamEnabled,
  filterEnabledExams,
};
