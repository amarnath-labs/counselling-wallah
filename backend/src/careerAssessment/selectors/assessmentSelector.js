import {
  getStageConfig,
} from '../config/stageConfigs.js';

import {
  normalizeProfile,
} from '../utils/profileNormalization.js';

import {
  filterCandidates,
} from './candidateFilter.js';

import {
  rankQuestions,
} from './questionRanker.js';

import {
  selectBalancedQuestions,
} from './diversitySelector.js';


export function buildAssessment({
  bank,
  profile:
    rawProfile,
}) {
  if (
    !Array.isArray(
      bank
    )
  ) {
    throw new Error(
      'Assessment bank must be an array.'
    );
  }


  const profile =
    normalizeProfile(
      rawProfile ||
      {}
    );


  if (
    !profile.stage
  ) {
    throw new Error(
      'Student stage is required.'
    );
  }


  const stageConfig =
    getStageConfig(
      profile.stage
    );


  const candidates =
    filterCandidates({
      bank,
      profile,
      stageConfig,
    });


  if (
    candidates.length <
    stageConfig.assessmentSize
  ) {
    throw new Error(
      `Not enough eligible questions for ${profile.stage}. ` +
      `Found ${candidates.length}, need ${stageConfig.assessmentSize}.`
    );
  }


  const ranked =
    rankQuestions({
      questions:
        candidates,

      profile,

      stageConfig,
    });


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | Pass normalized profile into diversity selector.
  |
  | Required for:
  | - core vs personalized split
  | - stream matching
  | - subject matching
  | - entrance-exam matching
  | - interest matching
  | - career-family matching
  |
  */

  const selection =
    selectBalancedQuestions({
      ranked,
      stageConfig,
      profile,
    });


  if (
    !selection.complete
  ) {
    throw new Error(
      `Assessment selector produced ${selection.selectedCount} ` +
      `questions but expected ${selection.targetCount}.`
    );
  }


  return {

    version:
      1,

    stage:
      profile.stage,

    purpose:
      stageConfig.purpose,

    profile,

    candidateCount:
      candidates.length,

    questionCount:
      selection.questions.length,

    traitCounts:
      selection.traitCounts,

    coreTarget:
      selection.coreTarget,

    personalisedTarget:
      selection.personalisedTarget,

    personalisedSelected:
      selection.personalisedSelected,

    questions:
      selection.questions,
  };
}


export default buildAssessment;
