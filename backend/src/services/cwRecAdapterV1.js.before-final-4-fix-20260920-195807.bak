/* =========================================================
   CW-REC REAL ROW ADAPTER
========================================================= */


/* =========================================================
   HELPERS
========================================================= */

function numberOrNull(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }


  const parsed =
    Number(
      value
    );


  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}


function firstDefined(
  ...values
) {
  for (
    const value of values
  ) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }


  return null;
}


/* =========================================================
   CLOSING RANKS
========================================================= */

function arrayOfClosingRanks(
  row
) {
  const values = [];


  /*
  |--------------------------------------------------------------------------
  | Explicit historical array
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      row?.historicalClosingRanks
    )
  ) {
    values.push(
      ...row
        .historicalClosingRanks
    );
  }


  if (
    Array.isArray(
      row?.historical_closing_ranks
    )
  ) {
    values.push(
      ...row
        .historical_closing_ranks
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Historical cutoff objects
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      row?.historical_cutoffs
    )
  ) {
    for (
      const item of
      row.historical_cutoffs
    ) {
      values.push(
        item?.closingRank ??
        item?.closing_rank ??
        item?.closing
      );
    }
  }


  if (
    Array.isArray(
      row?.historicalCutoffs
    )
  ) {
    for (
      const item of
      row.historicalCutoffs
    ) {
      values.push(
        item?.closingRank ??
        item?.closing_rank ??
        item?.closing
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Current row fallback
  |--------------------------------------------------------------------------
  */

  values.push(
    row?.closingRank
  );


  values.push(
    row?.closing_rank
  );


  return [
    ...new Set(
      values
        .map(
          numberOrNull
        )
        .filter(
          (value) =>
            value !== null &&
            value > 0
        )
    ),
  ];
}


/* =========================================================
   HISTORICAL ROWS
========================================================= */

function historicalRowsFromRow(
  row
) {
  const output = [];


  /*
  |--------------------------------------------------------------------------
  | Existing historical rows
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      row?.historicalRows
    )
  ) {
    for (
      const item of
      row.historicalRows
    ) {
      const closingRank =
        numberOrNull(
          item?.closingRank ??
          item?.closing_rank ??
          item?.closing
        );


      const year =
        numberOrNull(
          item?.year ??
          item?.academicYear ??
          item?.academic_year
        );


      if (
        closingRank !== null &&
        closingRank > 0
      ) {
        output.push({
          year,

          closingRank,
        });
      }
    }
  }


  /*
  |--------------------------------------------------------------------------
  | historical_cutoffs
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      row?.historical_cutoffs
    )
  ) {
    for (
      const item of
      row.historical_cutoffs
    ) {
      const closingRank =
        numberOrNull(
          item?.closingRank ??
          item?.closing_rank ??
          item?.closing
        );


      const year =
        numberOrNull(
          item?.year ??
          item?.academicYear ??
          item?.academic_year
        );


      if (
        closingRank !== null &&
        closingRank > 0
      ) {
        output.push({
          year,

          closingRank,
        });
      }
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Current cutoff
  |--------------------------------------------------------------------------
  */

  const currentClosing =
    numberOrNull(
      firstDefined(
        row?.closingRank,
        row?.closing_rank
      )
    );


  const currentYear =
    numberOrNull(
      firstDefined(
        row?.year,
        row?.academicYear,
        row?.academic_year
      )
    );


  if (
    currentClosing !== null &&
    currentClosing > 0
  ) {
    const alreadyPresent =
      output.some(
        (item) =>
          item.closingRank ===
            currentClosing &&
          item.year ===
            currentYear
      );


    if (
      !alreadyPresent
    ) {
      output.push({
        year:
          currentYear,

        closingRank:
          currentClosing,
      });
    }
  }


  return output;
}


/* =========================================================
   QUALITY
========================================================= */

function qualityFromRow(
  row
) {
  return {
    nirfScore:
      numberOrNull(
        firstDefined(
          row?.nirfScore,
          row?.nirf_score
        )
      ),


    placementScore:
      numberOrNull(
        firstDefined(
          row?.placementScore,
          row?.placement_score
        )
      ),


    medianPackageScore:
      numberOrNull(
        firstDefined(
          row?.medianPackageScore,
          row?.median_package_score
        )
      ),


    confidence:
      numberOrNull(
        firstDefined(
          row?.qualityConfidence,
          row?.quality_confidence
        )
      ) ?? 0,
  };
}


/* =========================================================
   REVIEWS
========================================================= */

function reviewsFromRow(
  row
) {
  return {
    score:
      numberOrNull(
        firstDefined(
          row?.reviewScore,
          row?.review_score,
          row?.reviewScoreV2,
          row?.review_score_v2
        )
      ),


    confidence:
      numberOrNull(
        firstDefined(
          row?.reviewConfidence,
          row?.review_confidence,
          row?.reviewConfidenceV2,
          row?.review_confidence_v2
        )
      ) ?? 0,
  };
}


/* =========================================================
   BUDGET / FEE
========================================================= */

function budgetFromRow(
  row,
  profile
) {
  /*
  |--------------------------------------------------------------------------
  | Real annual cost
  |--------------------------------------------------------------------------
  |
  | Prefer explicit annual total / adapter-ready values.
  |--------------------------------------------------------------------------
  */

  const annualCost =
    numberOrNull(
      firstDefined(
        row?.annualCost,
        row?.annual_cost,

        row?.annualTotalFee,
        row?.annual_total_fee,

        row?.totalAnnualFee,
        row?.total_annual_fee,

        row?.collegeAnnualTotalFee,
        row?.college_annual_total_fee,

        row?.estimatedAnnualBudgetFee,
        row?.estimated_annual_budget_fee,

        row?.annualAcademicFee,
        row?.annual_academic_fee,

        row?.annual_fees
      )
    );


  const annualBudget =
    numberOrNull(
      firstDefined(
        profile?.annualBudget,
        profile?.annual_budget,

        profile?.budget,

        row?.annualBudget,
        row?.annual_budget
      )
    );


  const confidence =
    numberOrNull(
      firstDefined(
        row?.budgetConfidence,
        row?.budget_confidence,

        row?.feeConfidence,
        row?.fee_confidence,

        row?.confidence_score
      )
    ) ?? 0;


  return {
    annualCost,

    annualBudget,

    confidence,
  };
}


/* =========================================================
   LOCATION
========================================================= */

function locationFromRow(
  row,
  profile
) {
  const mode =
    String(
      firstDefined(
        profile?.locationMode,
        profile?.location_mode,

        row?.locationMode,
        row?.location_mode,

        'NONE'
      )
    )
      .trim()
      .toUpperCase();


  /*
  |--------------------------------------------------------------------------
  | NONE
  |--------------------------------------------------------------------------
  |
  | Location is intentionally not part of recommendation.
  |--------------------------------------------------------------------------
  */

  if (
    mode ===
    'NONE'
  ) {
    return {
      mode:
        'NONE',

      score:
        null,

      confidence:
        null,
    };
  }


  return {
    mode,

    score:
      numberOrNull(
        firstDefined(
          profile?.locationScore,
          profile?.location_score,

          row?.locationScore,
          row?.location_score
        )
      ),

    confidence:
      numberOrNull(
        firstDefined(
          profile?.locationConfidence,
          profile?.location_confidence,

          row?.locationConfidence,
          row?.location_confidence
        )
      ) ?? 0,
  };
}


/* =========================================================
   MAIN ADAPTER
========================================================= */

export function adaptCounsellingRowToCWRecInput(
  row,
  profile = {}
) {
  if (
    !row ||
    typeof row !==
      'object'
  ) {
    throw new Error(
      'Valid counselling row is required'
    );
  }


  /* =======================================================
     STUDENT
  ======================================================= */

  const studentRank =
    numberOrNull(
      firstDefined(
        profile?.rank,
        profile?.studentRank,
        profile?.student_rank,

        row?.studentRank,
        row?.student_rank
      )
    );


  /* =======================================================
     ADMISSION
  ======================================================= */

  const closingRanks =
    arrayOfClosingRanks(
      row
    );


  const historicalRows =
    historicalRowsFromRow(
      row
    );


  const admissionContextScore =
    numberOrNull(
      firstDefined(
        profile
          ?.admissionContextScore,

        profile
          ?.admission_context_score,

        row
          ?.admissionContextScore,

        row
          ?.admission_context_score
      )
    ) ?? 60;


  /* =======================================================
     BRANCH PREFERENCE

     CRITICAL FIX:
     PROFILE VALUES MUST NOT BE LOST.
  ======================================================= */

  const branchPreferenceRank =
    numberOrNull(
      firstDefined(
        profile
          ?.branchPreferenceRank,

        profile
          ?.branch_preference_rank,

        row
          ?.branchPreferenceRank,

        row
          ?.branch_preference_rank
      )
    );


  const branchFamilyMatchScore =
    numberOrNull(
      firstDefined(
        profile
          ?.branchFamilyMatchScore,

        profile
          ?.branch_family_match_score,

        row
          ?.branchFamilyMatchScore,

        row
          ?.branch_family_match_score
      )
    );


  /* =======================================================
     QUALITY
  ======================================================= */

  const quality =
    qualityFromRow(
      row
    );


  /* =======================================================
     REVIEWS
  ======================================================= */

  const reviews =
    reviewsFromRow(
      row
    );


  /* =======================================================
     BUDGET
  ======================================================= */

  const budget =
    budgetFromRow(
      row,
      profile
    );


  /* =======================================================
     LOCATION
  ======================================================= */

  const location =
    locationFromRow(
      row,
      profile
    );


  /* =======================================================
     FINAL ADAPTED INPUT
  ======================================================= */

  return {
    studentRank,


    /* =========================
       ADMISSION
    ========================= */

    closingRanks,

    historicalRows,

    admissionContextScore,


    /* =========================
       BRANCH
    ========================= */

    branchPreferenceRank,

    branchFamilyMatchScore,


    /* =========================
       QUALITY
    ========================= */

    nirfScore:
      quality.nirfScore,

    placementScore:
      quality.placementScore,

    medianPackageScore:
      quality
        .medianPackageScore,

    qualityConfidence:
      quality.confidence,


    /* =========================
       REVIEWS
    ========================= */

    reviewScore:
      reviews.score,

    reviewConfidence:
      reviews.confidence,


    /* =========================
       BUDGET
    ========================= */

    annualCost:
      budget.annualCost,

    annualBudget:
      budget.annualBudget,

    budgetConfidence:
      budget.confidence,


    /* =========================
       LOCATION
    ========================= */

    locationScore:
      location.score,

    locationConfidence:
      location.confidence,

    locationMode:
      location.mode,
  };
}