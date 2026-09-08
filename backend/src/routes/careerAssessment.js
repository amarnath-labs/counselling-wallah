import {
  Router,
} from 'express';

import crypto from 'node:crypto';

import bank from
  '../data/careerQuestions/v7/index.js';

import {
  buildAssessment,
} from
  '../careerAssessment/selectors/assessmentSelector.js';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| Temporary session storage
|--------------------------------------------------------------------------
|
| API integration test ke liye.
| PostgreSQL persistence next phase me add hoga.
|
*/

const sessions =
  new Map();


function publicQuestion(
  question
) {
  return {
    id:
      question.id,

    section:
      question.section,

    trait:
      question.trait,

    text:
      question.text,

    options:
      question.options,

    responseFormat:
      question.responseFormat,

    difficulty:
      question.difficulty,
  };
}


/*
|--------------------------------------------------------------------------
| POST /session
|--------------------------------------------------------------------------
|
| Creates a profile-aware assessment session.
|
*/

router.post(
  '/session',
  (
    req,
    res
  ) => {
    try {

      const {
        stage,
        board,
        interestDirection,
        subjects = [],
        goals = [],
        careerFamilies = [],
      } =
        req.body || {};


      if (!stage) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              'stage is required',
          });
      }


      const sessionId =
        crypto.randomUUID();


      const assessment =
        buildAssessment({

          bank,

          profile: {
            stage,
            board,
            interestDirection,
            subjects,
            goals,
            careerFamilies,

            /*
            | Stable seed means this session keeps
            | the same question selection.
            */

            seed:
              sessionId,
          },
        });


      const session = {

        id:
          sessionId,

        version:
          assessment.version,

        stage:
          assessment.stage,

        purpose:
          assessment.purpose,

        profile:
          assessment.profile,

        questionIds:
          assessment.questions.map(
            question =>
              question.id
          ),

        traitCounts:
          assessment.traitCounts,

        createdAt:
          new Date()
            .toISOString(),

        status:
          'active',

        responses:
          {},
      };


      sessions.set(
        sessionId,
        session
      );


      return res
        .status(201)
        .json({

          ok: true,

          session: {
            id:
              session.id,

            stage:
              session.stage,

            purpose:
              session.purpose,

            status:
              session.status,

            questionCount:
              assessment.questionCount,

            traitCounts:
              assessment.traitCounts,

            createdAt:
              session.createdAt,
          },

          questions:
            assessment.questions.map(
              publicQuestion
            ),
        });

    }
    catch (error) {

      console.error(
        '[CAREER ASSESSMENT SESSION]',
        error
      );


      return res
        .status(400)
        .json({

          ok: false,

          error:
            error.message ||
            'Could not create assessment session',
        });
    }
  }
);


/*
|--------------------------------------------------------------------------
| GET /session/:sessionId
|--------------------------------------------------------------------------
*/

router.get(
  '/session/:sessionId',
  (
    req,
    res
  ) => {

    const session =
      sessions.get(
        req.params.sessionId
      );


    if (!session) {
      return res
        .status(404)
        .json({

          ok: false,

          error:
            'Assessment session not found',
        });
    }


    const questionMap =
      new Map(
        bank.map(
          question => [
            question.id,
            question,
          ]
        )
      );


    const questions =
      session.questionIds
        .map(
          id =>
            questionMap.get(
              id
            )
        )
        .filter(
          Boolean
        )
        .map(
          publicQuestion
        );


    return res.json({

      ok: true,

      session: {
        id:
          session.id,

        stage:
          session.stage,

        purpose:
          session.purpose,

        profile:
          session.profile,

        status:
          session.status,

        questionCount:
          questions.length,

        createdAt:
          session.createdAt,
      },

      questions,
    });
  }
);


export default router;
