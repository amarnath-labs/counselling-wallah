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
  buildAssessmentQuestionPool,
} from './assessmentPoolBuilder.js';

import {
  getQuestionMap,
} from '../../repositories/careerQuestionRepository.js';

async function loadAssessment(assessmentId) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        stage,
        profile_json,
        status,
        question_pool_ids,
        created_at,
        updated_at
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

    allowedQuestionIds:
      assessment.question_pool_ids ||
      [],
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

  const id =
    crypto.randomUUID();


  const questionPool =
    await buildAssessmentQuestionPool({
      profile,
    });


  const questionPoolIds =
    questionPool?.ids ||
    [];


  await pool.query(
    `
      INSERT INTO career_assessments (
        id,
        stage,
        profile_json,
        status,
        question_pool_ids
      )
      VALUES (
        $1,
        $2,
        $3::jsonb,
        'active',
        $4::text[]
      )
    `,
    [
      id,
      profile.stage,
      JSON.stringify(profile),
      questionPoolIds,
    ]
  );

  const assessment = await loadAssessment(id);
  const state = await computeState(assessment);

  const question = await retrieveNextQuestion({
    profile: state.profile,
    answers: state.answers,
    traitEvidence: state.traitEvidence,
    careerMatches: state.careerMatches,

    allowedQuestionIds:
      state.allowedQuestionIds,
  });

  if (!question) {
    const error = new Error(
      `No eligible starting question is available for stage "${profile.stage}".`
    );

    error.statusCode = 409;
    error.code =
      'CAREER_START_QUESTION_UNAVAILABLE';

    throw error;
  }

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

  const validQuestion =
    await getQuestionMap([
      questionId,
    ]);


  if (
    !validQuestion.has(
      questionId
    )
  ) {
    const error =
      new Error(
        'Invalid questionId'
      );

    error.statusCode =
      400;

    throw error;
  }


  const allowedQuestionIds =
    assessment.question_pool_ids ||
    [];


  if (
    allowedQuestionIds.length >
      0 &&
    !allowedQuestionIds.includes(
      questionId
    )
  ) {
    const error =
      new Error(
        'questionId does not belong to this assessment.'
      );

    error.statusCode =
      400;

    error.code =
      'CAREER_QUESTION_NOT_IN_ASSESSMENT_POOL';

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

    allowedQuestionIds:
      state.allowedQuestionIds,
  });

  /*
  |--------------------------------------------------------------------------
  | No eligible question available
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Never manufacture confidence by force-completing an assessment before
  | the confidence engine says it is complete.
  |
  | With the V5 controlled bank this should normally not happen.
  |--------------------------------------------------------------------------
  */

  if (!question) {
    const error = new Error(
      state.confidence.answered < state.confidence.minimum
        ? `Adaptive assessment could not find another eligible question before the minimum requirement of ${state.confidence.minimum} answers was reached.`
        : 'Adaptive assessment could not find another eligible question while additional evidence was still required.'
    );

    error.statusCode = 409;

    error.code =
      'CAREER_QUESTION_POOL_EXHAUSTED';

    error.details = {
      stage:
        state.profile.stage,

      answered:
        state.confidence.answered,

      minimum:
        state.confidence.minimum,

      typicalTarget:
        state.confidence.typicalTarget,

      maximum:
        state.confidence.maximum,

      coreTraitCoverage:
        state.confidence.coreTraitCoverage,

      repeatedCoreTraitCoverage:
        state.confidence.repeatedCoreTraitCoverage,

      contradictions:
        state.confidence.contradictions,

      topCareerSeparation:
        state.confidence.topCareerSeparation,

      continueReasons:
        state.confidence.continueReasons,
    };

    throw error;
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









