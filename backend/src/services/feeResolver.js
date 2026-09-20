const MIN_PLAUSIBLE_ANNUAL_FEE = 20000;
const MAX_PLAUSIBLE_ANNUAL_FEE = 500000;

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const num = Number(value);

  return Number.isFinite(num)
    ? num
    : null;
}

function isPlausibleAnnualFee(value) {
  return (
    Number.isFinite(value) &&
    value >= MIN_PLAUSIBLE_ANNUAL_FEE &&
    value <= MAX_PLAUSIBLE_ANNUAL_FEE
  );
}

function buildCandidate({
  amount,
  method,
  confidence,
  priority,
  sourceField
}) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  return {
    amount,
    method,
    confidence,
    priority,
    sourceField,
    plausible: isPlausibleAnnualFee(amount)
  };
}

export function resolveCollegeAnnualFee(profile = {}) {
  const candidates = [];

  const annualTotalFee =
    toNumber(profile.annual_total_fee);

  const annualAcademicFee =
    toNumber(profile.annual_academic_fee);

  const firstSemesterFee =
    toNumber(profile.first_semester_fee);

  const academicFeePerSemester =
    toNumber(profile.academic_fee_per_semester);

  const tuitionFeePerSemester =
    toNumber(profile.tuition_fee_per_semester);

  const totalCourseFee =
    toNumber(profile.total_course_fee);

  const courseDurationYears =
    toNumber(profile.course_duration_years) || 4;

  if (annualTotalFee !== null) {
    candidates.push(
      buildCandidate({
        amount: annualTotalFee,
        method: 'annual_total_fee',
        confidence: 'high',
        priority: 100,
        sourceField: 'annual_total_fee'
      })
    );
  }

  if (annualAcademicFee !== null) {
    candidates.push(
      buildCandidate({
        amount: annualAcademicFee,
        method: 'annual_academic_fee',
        confidence: 'high',
        priority: 95,
        sourceField: 'annual_academic_fee'
      })
    );
  }

  if (academicFeePerSemester !== null) {
    candidates.push(
      buildCandidate({
        amount: academicFeePerSemester * 2,
        method: 'academic_fee_per_semester_x2',
        confidence: 'high',
        priority: 90,
        sourceField: 'academic_fee_per_semester'
      })
    );
  }

  if (tuitionFeePerSemester !== null) {
    candidates.push(
      buildCandidate({
        amount: tuitionFeePerSemester * 2,
        method: 'tuition_fee_per_semester_x2',
        confidence: 'high',
        priority: 85,
        sourceField: 'tuition_fee_per_semester'
      })
    );
  }

  if (firstSemesterFee !== null) {
    candidates.push(
      buildCandidate({
        amount: firstSemesterFee * 2,
        method: 'first_semester_fee_x2',
        confidence: 'medium',
        priority: 70,
        sourceField: 'first_semester_fee'
      })
    );
  }

  /*
   * V6:
   * total_course_fee fallback is allowed when
   * all structured annual candidates are implausible.
   */

  const structuredAnnualCandidates = [
    annualTotalFee,
    annualAcademicFee,

    academicFeePerSemester !== null
      ? academicFeePerSemester * 2
      : null,

    tuitionFeePerSemester !== null
      ? tuitionFeePerSemester * 2
      : null,

    firstSemesterFee !== null
      ? firstSemesterFee * 2
      : null
  ];

  const hasPlausibleStructuredFee =
    structuredAnnualCandidates.some(
      value =>
        value !== null &&
        isPlausibleAnnualFee(value)
    );

  if (
    totalCourseFee !== null &&
    !hasPlausibleStructuredFee &&
    courseDurationYears > 0
  ) {
    const annualized =
      totalCourseFee /
      courseDurationYears;

    candidates.push(
      buildCandidate({
        amount: annualized,
        method: 'total_course_fee_div_duration_fallback',
        confidence: 'medium',
        priority: 40,
        sourceField: 'total_course_fee'
      })
    );
  }

  const validCandidates =
    candidates
      .filter(Boolean)
      .filter(
        candidate =>
          candidate.plausible
      )
      .sort((a, b) => {
        if (
          b.priority !==
          a.priority
        ) {
          return (
            b.priority -
            a.priority
          );
        }

        return (
          b.amount -
          a.amount
        );
      });

  if (validCandidates.length === 0) {
    return {
      annualFee: null,
      confidence: 'low',
      method: null,
      sourceField: null,
      needsReview: true,
      reason: 'NO_PLAUSIBLE_ANNUAL_FEE',
      candidates: candidates.filter(Boolean)
    };
  }

  const selected =
    validCandidates[0];

  const plausibleAmounts =
    validCandidates.map(
      candidate =>
        candidate.amount
    );

  const minValue =
    Math.min(...plausibleAmounts);

  const maxValue =
    Math.max(...plausibleAmounts);

  const conflictRatio =
    minValue > 0
      ? maxValue / minValue
      : Infinity;

  const hasMajorConflict =
    plausibleAmounts.length > 1 &&
    conflictRatio >= 2.5;

  return {
    annualFee:
      Math.round(selected.amount),

    confidence:
      hasMajorConflict
        ? 'medium'
        : selected.confidence,

    method:
      selected.method,

    sourceField:
      selected.sourceField,

    needsReview:
      hasMajorConflict,

    reason:
      hasMajorConflict
        ? 'CONFLICTING_FEE_VALUES'
        : null,

    candidates:
      candidates.filter(Boolean)
  };
}

export function resolveBranchAnnualFee(
  branchFee = {}
) {
  const totalAnnualFee =
    toNumber(
      branchFee.total_annual_fee
    );

  if (
    totalAnnualFee !== null &&
    isPlausibleAnnualFee(
      totalAnnualFee
    )
  ) {
    return {
      annualFee:
        Math.round(
          totalAnnualFee
        ),

      confidence:
        'high',

      method:
        'branch_total_annual_fee',

      needsReview:
        false,

      reason:
        null
    };
  }

  const tuition =
    toNumber(
      branchFee.tuition_fee
    );

  const hostel =
    toNumber(
      branchFee.hostel_fee
    );

  const other =
    toNumber(
      branchFee.other_fee
    );

  if (
    tuition !== null ||
    hostel !== null ||
    other !== null
  ) {
    const total =
      (tuition || 0) +
      (hostel || 0) +
      (other || 0);

    if (
      isPlausibleAnnualFee(total)
    ) {
      return {
        annualFee:
          Math.round(total),

        confidence:
          'medium',

        method:
          'branch_fee_components_sum',

        needsReview:
          false,

        reason:
          null
      };
    }
  }

  return {
    annualFee: null,
    confidence: 'low',
    method: null,
    needsReview: true,
    reason:
      'NO_PLAUSIBLE_BRANCH_FEE'
  };
}

export {
  MIN_PLAUSIBLE_ANNUAL_FEE,
  MAX_PLAUSIBLE_ANNUAL_FEE,
  isPlausibleAnnualFee
};
