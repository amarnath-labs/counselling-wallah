function intersects(
  left = [],
  right = []
) {
  const rightSet =
    new Set(
      right
    );

  return left.some(
    value =>
      rightSet.has(
        value
      )
  );
}


export function filterCandidates({
  bank,
  profile,
  stageConfig,
}) {
  const stageGoals =
    stageConfig.goals ||
    [];


  return bank.filter(
    question => {

      if (
        question.active ===
        false
      ) {
        return false;
      }


      const classes =
        question.classes ||
        [];


      if (
        !classes.includes(
          profile.stage
        )
      ) {
        return false;
      }


      const boards =
        question.boards ||
        [];


      if (
        boards.length > 0 &&
        profile.board &&
        !boards.includes(
          profile.board
        )
      ) {
        return false;
      }


      const questionGoals =
        question.goals ||
        [];


      if (
        profile.goals.length > 0 &&
        questionGoals.length > 0 &&
        !intersects(
          profile.goals,
          questionGoals
        )
      ) {
        return false;
      }


      /*
      |--------------------------------------------------------------------------
      | Optional stage-level goal compatibility
      |--------------------------------------------------------------------------
      |
      | stageConfig.goals is optional.
      | If the stage config does not define goals,
      | do not reject otherwise valid questions.
      |
      */

      if (
        stageGoals.length > 0 &&
        questionGoals.length > 0 &&
        !intersects(
          stageGoals,
          questionGoals
        )
      ) {
        return false;
      }


      return true;
    }
  );
}


export default filterCandidates;
