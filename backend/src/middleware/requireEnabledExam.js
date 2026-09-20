import {
  isExamEnabled,
} from "../config/enabledExams.js";


export function requireEnabledExam(
  req,
  res,
  next
) {
  const examId =
    String(
      req.params?.examId ??
      req.query?.examId ??
      req.body?.examId ??
      ""
    )
      .trim()
      .toLowerCase();


  /*
  |--------------------------------------------------------------------------
  | Route may not require examId
  |--------------------------------------------------------------------------
  */

  if (!examId) {
    return next();
  }


  /*
  |--------------------------------------------------------------------------
  | Reject disabled exam
  |--------------------------------------------------------------------------
  */

  if (
    !isExamEnabled(
      examId
    )
  ) {
    return res
      .status(404)
      .json({
        ok: false,

        code:
          "EXAM_NOT_AVAILABLE",

        examId,

        message:
          "This exam is currently not available on TruMarg.",
      });
  }


  return next();
}


export default requireEnabledExam;
