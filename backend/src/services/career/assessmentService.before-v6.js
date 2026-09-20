import crypto from 'node:crypto';

import { pool } from '../../db/pool.js';

import {
  normalizeCareerProfile,
} from './profileNormalizer.js';

import {
  buildTraitEvidence,
  flatTraitScores,
} from './traitScorer.js';

import {
  rankCareers,
} from './careerMatcher.js';

import {
  evaluateAssessmentState,
} from './confidenceEngine.js';

import {
  retrieveNextQuestion,
} from './questionRetriever.js';

import {
  buildCareerRecommendationReport,
} from './recommendationEngine.js';

import {
  getQuestionMap,
} from '../../repositories/careerQuestionRepository.js';

async function loadAssessment(assessmentId) {
  const { rows } = await pool.query(
    `
      SELECT id, stage, profile_json, status, created_at, updated_at
      FROM career_assessments
      WHERE id = $1
    `,
    [assessmentId]
  );

  return rows[0] || null;
}

async function loadAnswers(assessmentId) {
  const { rows } = await pool.query(
    `
      SELECT question_id AS "questionId", value
      FROM career_assessment_answers
      WHERE assessment_id = $1
      ORDER BY answered_at ASC, id ASC
    `,
    [assessmentId]
  );

  return rows.map((row) => ({
    questionId: row.questionId,
    value: Number(row.value),
  }));
}

async function computeState(assessment) {
  const profile = normalizeCareerProfile({
    ...assessment.profile_json,
    stage: assessment.stage,
  });

  const answers = await loadAnswers(assessment.id);
  const questionMap = await getQuestionMap(
    answers.map((answer) => answer.questionId)
  );

  const traitEvidence = buildTraitEvidence(questionMap, answers);
  const traitScores = flatTraitScores(traitEvidence);

  const careerMatches = rankCareers({
    stage: profile.stage,
    profile,
    traitScores,
    limit: 5,
  });

  const confidence = evaluateAssessmentState({
    stage: profile.stage,
    answers,
    traitEvidence,
    careerMatches,
  });

  return {
    profile,
    answers,
    traitEvidence,
    traitScores,
    careerMatches,
    confidence,
  };
}

function publicQuestion(question) {
  if (!question) return null;

  return {
    id: question.id,
    section: question.section,
    trait: question.trait,
    text: question.text,
    options: question.options,
  };
}

export async function startCareerAssessment(rawProfile) {
  const profile = normalizeCareerProfile(rawProfile);

  if (!profile.stage) {
    throw new Error('stage is required');
  }

  const id = crypto.randomUUID();

  await pool.query(
    `
      INSERT INTO career_assessments (
        id,
        stage,
        profile_json,
        status
      )
      VALUES ($1, $2, $3::jsonb, 'active')
    `,
    [id, profile.stage, JSON.stringify(profile)]
  );

  const assessment = await loadAssessment(id);
  const state = await computeState(assessment);

  const question = await retrieveNextQuestion({
    profile: state.profile,
    answers: state.answers,
    traitEvidence: state.traitEvidence,
    careerMatches: state.careerMatches,
  });

  return {
    assessmentId: id,
    completed: false,
    question: publicQuestion(question),
    traitScores: state.traitScores,
    progress: state.confidence,
  };
}

export async function answerCareerAssessment({
  assessmentId,
  questionId,
  value,
}) {
  const assessment = await loadAssessment(assessmentId);

  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  if (assessment.status === 'completed') {
    const state = await computeState(assessment);
    return {
      assessmentId,
      completed: true,
      question: null,
      traitScores: state.traitScores,
      progress: state.confidence,
    };
  }

  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 5) {
    const error = new Error('value must be an integer from 1 to 5');
    error.statusCode = 400;
    throw error;
  }

  const validQuestion = await getQuestionMap([questionId]);

  if (!validQuestion.has(questionId)) {
    const error = new Error('Invalid questionId');
    error.statusCode = 400;
    throw error;
  }

  await pool.query(
    `
      INSERT INTO career_assessment_answers (
        assessment_id,
        question_id,
        value
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (assessment_id, question_id)
      DO UPDATE SET
        value = EXCLUDED.value,
        answered_at = NOW()
    `,
    [assessmentId, questionId, numericValue]
  );

  await pool.query(
    `
      UPDATE career_assessments
      SET updated_at = NOW()
      WHERE id = $1
    `,
    [assessmentId]
  );

  const refreshed = await loadAssessment(assessmentId);
  const state = await computeState(refreshed);

  if (state.confidence.completed) {
    const report = buildCareerRecommendationReport({
      profile: state.profile,
      stage: state.profile.stage,
      traitEvidence: state.traitEvidence,
      careerMatches: state.careerMatches,
      confidence: state.confidence,
    });

    await pool.query(
      `
        UPDATE career_assessments
        SET status = 'completed', updated_at = NOW()
        WHERE id = $1
      `,
      [assessmentId]
    );

    await pool.query(
      `
        INSERT INTO career_recommendations (
          assessment_id,
          report_json
        )
        VALUES ($1, $2::jsonb)
        ON CONFLICT (assessment_id)
        DO UPDATE SET
          report_json = EXCLUDED.report_json,
          created_at = NOW()
      `,
      [assessmentId, JSON.stringify(report)]
    );

    return {
      assessmentId,
      completed: true,
      question: null,
      traitScores: state.traitScores,
      progress: state.confidence,
      report,
    };
  }

  const question = await retrieveNextQuestion({
    profile: state.profile,
    answers: state.answers,
    traitEvidence: state.traitEvidence,
    careerMatches: state.careerMatches,
  });

  // If no question remains, finish with the evidence we already have.
  if (!question) {
    const forcedConfidence = {
      ...state.confidence,
      completed: true,
    };

    const report = buildCareerRecommendationReport({
      profile: state.profile,
      stage: state.profile.stage,
      traitEvidence: state.traitEvidence,
      careerMatches: state.careerMatches,
      confidence: forcedConfidence,
    });

    await pool.query(
      `
        UPDATE career_assessments
        SET status = 'completed', updated_at = NOW()
        WHERE id = $1
      `,
      [assessmentId]
    );

    return {
      assessmentId,
      completed: true,
      question: null,
      traitScores: state.traitScores,
      progress: forcedConfidence,
      report,
    };
  }

  return {
    assessmentId,
    completed: false,
    question: publicQuestion(question),
    traitScores: state.traitScores,
    progress: state.confidence,
  };
}

export async function getCareerAssessmentReport(assessmentId) {
  const assessment = await loadAssessment(assessmentId);

  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  const { rows } = await pool.query(
    `
      SELECT report_json
      FROM career_recommendations
      WHERE assessment_id = $1
    `,
    [assessmentId]
  );

  if (rows[0]?.report_json) {
    return rows[0].report_json;
  }

  const state = await computeState(assessment);

  return buildCareerRecommendationReport({
    profile: state.profile,
    stage: state.profile.stage,
    traitEvidence: state.traitEvidence,
    careerMatches: state.careerMatches,
    confidence: state.confidence,
  });
}
