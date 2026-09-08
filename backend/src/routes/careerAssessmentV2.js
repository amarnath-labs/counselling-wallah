import { Router } from 'express';

import {
  startCareerAssessment,
  answerCareerAssessment,
  getCareerAssessmentReport,
} from '../services/career/assessmentService.js';

const router = Router();

router.post('/assessment/start', async (req, res, next) => {
  try {
    const profile = req.body?.profile || req.body || {};

    const result = await startCareerAssessment(profile);

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/assessment/:id/answer', async (req, res, next) => {
  try {
    const result = await answerCareerAssessment({
      assessmentId: req.params.id,
      questionId: req.body?.questionId,
      value: req.body?.value,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/assessment/:id/report', async (req, res, next) => {
  try {
    const report = await getCareerAssessmentReport(req.params.id);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

export default router;
