import {
  FACTOR_STATUS,
} from './cwRecV1.js';


function numberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}


function arrayOfClosingRanks(row) {
  if (
    Array.isArray(
      row?.historicalClosingRanks
    )
  ) {
    return row
      .historicalClosingRanks
      .map(Number)
      .filter(Number.isFinite);
  }

  if (
    Array.isArray(
      row?.historical_cutoffs
    )
  ) {
    return row
      .historical_cutoffs
      .map(
        (item) =>
          Number(
            item?.closingRank ??
            item?.closing_rank
          )
      )
      .filter(Number.isFinite);
  }

  const single =
    numberOrNull(
      row?.closingRank ??
      row?.closing_rank
    );

  return single === null
    ? []
    : [single];
}


function historicalRowsFromRow(row) {
  if (
    Array.isArray(
      row?.historicalRows
    )
  ) {
    return row.historicalRows;
  }

  if (
    Array.isArray(
      row?.historical_cutoffs
    )
  ) {
    return row
      .historical_cutoffs
      .map(
        (item) => ({
          year:
            item?.year ??
            item?.academic_year ??
            null,

          closingRank:
            item?.closingRank ??
            item?.closing_rank ??
            null,
        })
      );
  }

  const closingRank =
    numberOrNull(
      row?.closingRank ??
      row?.closing_rank
    );

  if (
    closingRank === null
  ) {
    return [];
  }

  return [
    {
      year:
        row?.year ??
        row?.academic_year ??
        null,

      closingRank,
    },
  ];
}


function qualityFromRow(row) {
  const quality =
    row?.quality ??
    row?.collegeQuality ??
    row?.college_quality ??
    {};

  return {
    nirfScore:
      numberOrNull(
        quality?.nirfScore ??
        quality?.nirf_score ??
        row?.nirfScore ??
        row?.nirf_score
      ),

    placementScore:
      numberOrNull(
        quality?.placementScore ??
        quality?.placement_score ??
        row?.placementScore ??
        row?.placement_score
      ),

    medianPackageScore:
      numberOrNull(
        quality?.medianPackageScore ??
        quality?.median_package_score ??
        row?.medianPackageScore ??
        row?.median_package_score
      ),

    confidence:
      numberOrNull(
        quality?.confidence ??
        row?.qualityConfidence ??
        row?.quality_confidence
      ) ?? 0,
  };
}


function reviewsFromRow(row) {
  const reviews =
    row?.reviews ??
    row?.reviewIntelligence ??
    row?.review_intelligence ??
    {};

  return {
    score:
      numberOrNull(
        reviews?.score ??
        row?.reviewScore ??
        row?.review_score
      ),

    confidence:
      numberOrNull(
        reviews?.confidence ??
        row?.reviewConfidence ??
        row?.review_confidence
      ) ?? 0,
  };
}


function budgetFromRow(
  row,
  profile
) {
  const budget =
    row?.budget ??
    row?.fees ??
    {};

  return {
    annualCost:
      numberOrNull(
        budget?.annualCost ??
        budget?.annual_cost ??
        row?.annualCost ??
        row?.annual_cost ??
        row?.annualFees ??
        row?.annual_fees
      ),

    annualBudget:
      numberOrNull(
        profile?.annualBudget ??
        profile?.annual_budget ??
        profile?.budget
      ),

    confidence:
      numberOrNull(
        budget?.confidence ??
        row?.budgetConfidence ??
        row?.budget_confidence
      ) ?? 0,
  };
}


function locationFromRow(
  row,
  profile
) {
  const mode =
    String(
      profile?.locationMode ??
      profile?.location_mode ??
      'NONE'
    )
      .trim()
      .toUpperCase();

  if (
    mode === 'NONE'
  ) {
    return {
      score: null,
      confidence: null,
      mode: 'NONE',

      status:
        FACTOR_STATUS
          .NOT_APPLICABLE,
    };
  }

  const score =
    numberOrNull(
      row?.locationScore ??
      row?.location_score ??
      row?.location?.score
    );

  return {
    score,

    confidence:
      numberOrNull(
        row?.locationConfidence ??
        row?.location_confidence ??
        row?.location?.confidence
      ) ?? 0,

    mode,

    status:
      score === null
        ? FACTOR_STATUS.UNAVAILABLE
        : FACTOR_STATUS.AVAILABLE,
  };
}


export function adaptCounsellingRowToCWRecInput(
  row,
  profile = {}
) {
  const quality =
    qualityFromRow(row);

  const reviews =
    reviewsFromRow(row);

  const budget =
    budgetFromRow(
      row,
      profile
    );

  const location =
    locationFromRow(
      row,
      profile
    );

  return {
    studentRank:
      numberOrNull(
        profile?.rank ??
        profile?.studentRank ??
        profile?.student_rank
      ),

    closingRanks:
      arrayOfClosingRanks(
        row
      ),

    historicalRows:
      historicalRowsFromRow(
        row
      ),

    admissionContextScore:
      numberOrNull(
        row?.admissionContextScore ??
        row?.admission_context_score
      ) ?? 60,

    branchPreferenceRank:
      numberOrNull(
        row?.branchPreferenceRank ??
        row?.branch_preference_rank
      ),

    branchFamilyMatchScore:
      numberOrNull(
        row?.branchFamilyMatchScore ??
        row?.branch_family_match_score
      ),

    nirfScore:
      quality.nirfScore,

    placementScore:
      quality.placementScore,

    medianPackageScore:
      quality.medianPackageScore,

    qualityConfidence:
      quality.confidence,

    reviewScore:
      reviews.score,

    reviewConfidence:
      reviews.confidence,

    annualCost:
      budget.annualCost,

    annualBudget:
      budget.annualBudget,

    budgetConfidence:
      budget.confidence,

    locationScore:
      location.score,

    locationConfidence:
      location.confidence,

    locationMode:
      location.mode,
  };
}