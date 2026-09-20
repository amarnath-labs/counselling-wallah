import fs from 'node:fs/promises';

const OUTPUT_DIR = '.';

/*
|--------------------------------------------------------------------------
| COMMON MASTER RECORD
|--------------------------------------------------------------------------
*/

function baseBranchFee({
  college_id,
  academic_year,
  source_label,
  source_url,
  verification_status = 'pending_review'
}) {
  return {
    college_id,
    branch_id: null,
    program: 'B.Tech',
    fee_scope: 'all_btech_branches',
    academic_year,
    source_label,
    source_url,
    verification_status
  };
}

/*
|--------------------------------------------------------------------------
| NIT DELHI
|--------------------------------------------------------------------------
*/

function buildNitDelhiPreview() {
  const branch_fee = baseBranchFee({
    college_id:
      'national-institute-of-technology-delhi',

    academic_year:
      2025,

    source_label:
      'NIT Delhi Official B.Tech Fee Structure',

    source_url:
      'https://media.nitdelhi.ac.in/uploads/web_media/Fee%20structure%20B%20Tech@nitdelhi523e4c95-82fb-422f-b1a4-624356f76d80.pdf'
  });

  const groups = [
    {
      category: 'GEN/OBC/EWS',
      income_min: 500000,
      income_max: null,
      tuition: 62500,

      day:
        114200,

      ac:
        166200,

      non_ac:
        154200
    },

    {
      category: 'GEN/OBC/EWS',
      income_min: 100000,
      income_max: 500000,
      tuition: 20833,

      day:
        72533,

      ac:
        124533,

      non_ac:
        112533
    },

    {
      category:
        'GEN/OBC/EWS/SC/ST/PwD - source eligibility review required',

      income_min: null,
      income_max: null,

      tuition: 0,

      day:
        51700,

      ac:
        103700,

      non_ac:
        91700
    }
  ];

  const fee_variants = [];

  for (const g of groups) {
    const common = {
      semester:
        1,

      fee_period:
        'semester',

      student_category:
        g.category,

      income_min:
        g.income_min,

      income_max:
        g.income_max,

      tuition_fee:
        g.tuition,

      admission_fee:
        4000,

      institute_fee:
        null,

      mess_fee:
        null,

      caution_deposit:
        null,

      other_fee:
        null,

      is_one_time_included:
        true,

      verification_status:
        'pending_review'
    };

    fee_variants.push(
      {
        ...common,

        residence_type:
          'day_scholar',

        room_type:
          null,

        hostel_fee:
          null,

        total_fee:
          g.day
      },

      {
        ...common,

        residence_type:
          'hosteller',

        room_type:
          'AC',

        hostel_fee:
          52000,

        total_fee:
          g.ac
      },

      {
        ...common,

        residence_type:
          'hosteller',

        room_type:
          'non_AC',

        hostel_fee:
          40000,

        total_fee:
          g.non_ac
      }
    );
  }

  return {
    filename:
      'nit-delhi-fee-preview.json',

    branch_fee,
    fee_variants
  };
}

/*
|--------------------------------------------------------------------------
| IIT MANDI
|--------------------------------------------------------------------------
*/

function buildIitMandiPreview() {
  const branch_fee =
    baseBranchFee({
      college_id:
        'indian-institute-of-technology-mandi',

      academic_year:
        2022,

      source_label:
        'IIT Mandi Official B.Tech Fee Structure AY 2022-23',

      source_url:
        'https://academics.iitmandi.ac.in/pdf/fees/B.Tech%202021%20and%20earlier%20batches_Fee%20Structure%20AY%202022-23.pdf'
    });

  const fee_variants = [
    {
      semester: 1,
      fee_period: 'semester',

      student_category:
        'GEN/OBC(NCL)',

      income_min:
        500000,

      income_max:
        null,

      residence_type:
        'hosteller',

      room_type:
        null,

      tuition_fee:
        100000,

      admission_fee:
        null,

      institute_fee:
        3600,

      hostel_fee:
        7000,

      mess_fee:
        15000,

      caution_deposit:
        null,

      other_fee:
        null,

      total_fee:
        125600,

      is_one_time_included:
        true,

      verification_status:
        'pending_review'
    },

    {
      semester: 2,
      fee_period: 'semester',

      student_category:
        'GEN/OBC(NCL)',

      income_min:
        500000,

      income_max:
        null,

      residence_type:
        'hosteller',

      room_type:
        null,

      tuition_fee:
        100000,

      admission_fee:
        null,

      institute_fee:
        2850,

      hostel_fee:
        7000,

      mess_fee:
        15000,

      caution_deposit:
        null,

      other_fee:
        null,

      total_fee:
        124850,

      is_one_time_included:
        false,

      verification_status:
        'pending_review'
    },

    {
      semester: 1,
      fee_period: 'semester',

      student_category:
        'SC/ST/PH',

      income_min:
        null,

      income_max:
        null,

      residence_type:
        'hosteller',

      room_type:
        null,

      tuition_fee:
        0,

      admission_fee:
        null,

      institute_fee:
        3600,

      hostel_fee:
        7000,

      mess_fee:
        15000,

      caution_deposit:
        null,

      other_fee:
        null,

      total_fee:
        25600,

      is_one_time_included:
        true,

      verification_status:
        'pending_review'
    },

    {
      semester: 2,
      fee_period: 'semester',

      student_category:
        'SC/ST/PH',

      income_min:
        null,

      income_max:
        null,

      residence_type:
        'hosteller',

      room_type:
        null,

      tuition_fee:
        0,

      admission_fee:
        null,

      institute_fee:
        2850,

      hostel_fee:
        7000,

      mess_fee:
        15000,

      caution_deposit:
        null,

      other_fee:
        null,

      total_fee:
        24850,

      is_one_time_included:
        false,

      verification_status:
        'pending_review'
    }
  ];

  return {
    filename:
      'iit-mandi-fee-preview.json',

    branch_fee,
    fee_variants
  };
}

/*
|--------------------------------------------------------------------------
| ABV-IIITM GWALIOR
|--------------------------------------------------------------------------
*/

function buildAbvIiitmGwaliorPreview() {
  const branch_fee =
    baseBranchFee({
      college_id:
        'atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior',

      academic_year:
        2026,

      source_label:
        'ABV-IIITM Gwalior Official Fee Structure 2026-27',

      source_url:
        'https://iiitm.ac.in/public/uploads/media_uploads/1779189402_Fees-Details-2025-2026-f.pdf'
    });

  const fee_variants = [
    {
      semester:
        1,

      fee_period:
        'semester',

      student_category:
        'B.Tech regular - tuition applicable',

      income_min:
        null,

      income_max:
        null,

      residence_type:
        'hosteller',

      room_type:
        null,

      tuition_fee:
        95000,

      admission_fee:
        1500,

      institute_fee:
        105000,

      hostel_fee:
        15000,

      mess_fee:
        20000,

      caution_deposit:
        15000,

      other_fee:
        null,

      total_fee:
        168750,

      is_one_time_included:
        true,

      verification_status:
        'pending_review'
    },

    {
      semester:
        1,

      fee_period:
        'semester',

      student_category:
        'SC/ST/PwD - tuition waiver',

      income_min:
        null,

      income_max:
        null,

      residence_type:
        'hosteller',

      room_type:
        null,

      tuition_fee:
        0,

      admission_fee:
        1500,

      institute_fee:
        40000,

      hostel_fee:
        15000,

      mess_fee:
        20000,

      caution_deposit:
        15000,

      other_fee:
        null,

      total_fee:
        105750,

      is_one_time_included:
        true,

      verification_status:
        'pending_review'
    }
  ];

  return {
    filename:
      'abv-iiitm-gwalior-fee-preview.json',

    branch_fee,
    fee_variants
  };
}

/*
|--------------------------------------------------------------------------
| IIIT ALLAHABAD
|--------------------------------------------------------------------------
|
| Domestic B.Tech only:
|
|   Gen/OBC/EWS
|   SC/ST/PwD
|
| DASA / CIWG / Study-in-India are intentionally NOT mixed here.
|
| 8 semesters × 2 room types × 2 categories
| = 32 variants
|
*/

function buildIiitaPreview() {
  const branch_fee =
    baseBranchFee({
      college_id:
        'indian-institute-of-information-technology-allahabad',

      academic_year:
        2026,

      source_label:
        'IIIT Allahabad Official B.Tech Batch-2026 Four Year Fee Structure',

      source_url:
        'https://www.iiita.ac.in/sites/default/files/Fee%20Structure%20B.Tech_.%20%28New%20Batch%202026%29.pdf',

      verification_status:
        'verified'
    });

  /*
  |--------------------------------------------------------------------------
  | GEN / OBC / EWS
  |--------------------------------------------------------------------------
  */

  const genTuition = [
    99000,
    99000,
    99000,
    99000,
    99000,
    99000,
    99000,
    99000
  ];

  const genDoubleTotals = [
    155430,
    122790,
    130210,
    125230,
    133410,
    127920,
    136910,
    130860
  ];

  const genSingleTotals = [
    169010,
    136370,
    145160,
    140180,
    149880,
    144390,
    155040,
    148990
  ];

  /*
  |--------------------------------------------------------------------------
  | SC / ST / PwD
  |--------------------------------------------------------------------------
  |
  | Official table shows tuition as NA / exempt.
  |
  */

  const reservedDoubleTotals = [
    56430,
    23790,
    31210,
    26230,
    34410,
    28920,
    37910,
    31860
  ];

  const reservedSingleTotals = [
    70010,
    37370,
    46160,
    41180,
    50880,
    45390,
    56040,
    49990
  ];

  /*
  |--------------------------------------------------------------------------
  | HOSTEL SUBTOTALS
  |--------------------------------------------------------------------------
  */

  const doubleHostel = [
    14410,
    14410,
    15870,
    15870,
    17490,
    17490,
    19260,
    19260
  ];

  const singleHostel = [
    27990,
    27990,
    30820,
    30820,
    33960,
    33960,
    37390,
    37390
  ];

  /*
  |--------------------------------------------------------------------------
  | OTHER SEMESTER / INSTITUTE CHARGES
  |--------------------------------------------------------------------------
  |
  | Semester subtotal excluding tuition.
  |
  */

  const semesterOther = [
    9380,
    9380,
    10360,
    10360,
    11430,
    11430,
    12600,
    12600
  ];

  /*
  |--------------------------------------------------------------------------
  | ANNUAL DUES
  |--------------------------------------------------------------------------
  |
  | These apply at beginning of academic years:
  |
  | Sem 1 → 4520
  | Sem 3 → 4980
  | Sem 5 → 5490
  | Sem 7 → 6050
  |
  */

  const annualDuesBySemester = [
    4520,
    0,
    4980,
    0,
    5490,
    0,
    6050,
    0
  ];

  /*
  |--------------------------------------------------------------------------
  | ONE-TIME FEE
  |--------------------------------------------------------------------------
  */

  const admissionFee =
    4460;

  const enrolmentFee =
    1800;

  const identityCardFee =
    1800;

  const alumniFund =
    14190;

  const cautionMoney =
    5870;

  const oneTimeOther =
    enrolmentFee +
    identityCardFee +
    alumniFund;

  const fee_variants = [];

  /*
  |--------------------------------------------------------------------------
  | GEN/OBC/EWS
  |--------------------------------------------------------------------------
  */

  for (
    let i = 0;
    i < 8;
    i++
  ) {
    const semester =
      i + 1;

    const firstSemester =
      semester === 1;

    const common = {
      semester,

      fee_period:
        'semester',

      student_category:
        'GEN/OBC/EWS',

      income_min:
        null,

      income_max:
        null,

      residence_type:
        'hosteller',

      tuition_fee:
        genTuition[i],

      admission_fee:
        firstSemester
          ? admissionFee
          : null,

      /*
      | institute_fee contains:
      |
      | recurring semester charges
      | +
      | annual dues when applicable
      |
      */

      institute_fee:
        semesterOther[i] +
        annualDuesBySemester[i],

      mess_fee:
        null,

      caution_deposit:
        firstSemester
          ? cautionMoney
          : null,

      other_fee:
        firstSemester
          ? oneTimeOther
          : null,

      is_one_time_included:
        firstSemester,

      verification_status:
        'verified'
    };

    fee_variants.push({
      ...common,

      room_type:
        'double_sharing',

      hostel_fee:
        doubleHostel[i],

      total_fee:
        genDoubleTotals[i]
    });

    fee_variants.push({
      ...common,

      room_type:
        'single_occupancy',

      hostel_fee:
        singleHostel[i],

      total_fee:
        genSingleTotals[i]
    });
  }

  /*
  |--------------------------------------------------------------------------
  | SC/ST/PwD
  |--------------------------------------------------------------------------
  */

  for (
    let i = 0;
    i < 8;
    i++
  ) {
    const semester =
      i + 1;

    const firstSemester =
      semester === 1;

    const common = {
      semester,

      fee_period:
        'semester',

      student_category:
        'SC/ST/PwD',

      income_min:
        null,

      income_max:
        null,

      residence_type:
        'hosteller',

      tuition_fee:
        0,

      admission_fee:
        firstSemester
          ? admissionFee
          : null,

      institute_fee:
        semesterOther[i] +
        annualDuesBySemester[i],

      mess_fee:
        null,

      caution_deposit:
        firstSemester
          ? cautionMoney
          : null,

      other_fee:
        firstSemester
          ? oneTimeOther
          : null,

      is_one_time_included:
        firstSemester,

      verification_status:
        'verified'
    };

    fee_variants.push({
      ...common,

      room_type:
        'double_sharing',

      hostel_fee:
        doubleHostel[i],

      total_fee:
        reservedDoubleTotals[i]
    });

    fee_variants.push({
      ...common,

      room_type:
        'single_occupancy',

      hostel_fee:
        singleHostel[i],

      total_fee:
        reservedSingleTotals[i]
    });
  }

  return {
    filename:
      'iiit-allahabad-fee-preview.json',

    branch_fee,
    fee_variants
  };
}

/*
|--------------------------------------------------------------------------
| IIITDM KANCHEEPURAM
|--------------------------------------------------------------------------
*/

function buildIiitdmKancheepuramPreview() {
  const branch_fee =
    baseBranchFee({
      college_id:
        'indian-institute-of-information-technology-design-manufacturing-kancheepuram',

      academic_year:
        2026,

      source_label:
        'IIITDM Kancheepuram Official B.Tech Fee Structure 2026-27',

      source_url:
        'http://old.iiitdm.ac.in/img/academics/Fee_Structure_2026-27.pdf'
    });

  const fee_variants = [
    {
      semester:
        1,

      fee_period:
        'semester',

      student_category:
        'B.Tech regular - tuition applicable',

      income_min:
        null,

      income_max:
        null,

      residence_type:
        'hosteller',

      room_type:
        null,

      tuition_fee:
        99000,

      admission_fee:
        500,

      institute_fee:
        109300,

      hostel_fee:
        23696,

      mess_fee:
        16800,

      caution_deposit:
        null,

      other_fee:
        null,

      total_fee:
        149796,

      is_one_time_included:
        true,

      verification_status:
        'pending_review'
    },

    {
      semester:
        1,

      fee_period:
        'semester',

      student_category:
        'SC/ST/PwD - tuition exempt',

      income_min:
        null,

      income_max:
        null,

      residence_type:
        'hosteller',

      room_type:
        null,

      tuition_fee:
        0,

      admission_fee:
        500,

      institute_fee:
        null,

      hostel_fee:
        23696,

      mess_fee:
        16800,

      caution_deposit:
        null,

      other_fee:
        null,

      total_fee:
        null,

      is_one_time_included:
        true,

      verification_status:
        'pending_review'
    }
  ];

  return {
    filename:
      'iiitdm-kancheepuram-fee-preview.json',

    branch_fee,
    fee_variants
  };
}

/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/



/*
|--------------------------------------------------------------------------
| NIT SIKKIM
|--------------------------------------------------------------------------
|
| B.Tech 2025-2029 batch
|
| Tuition categories:
|
| 1. Full Fee Payer
| 2. 2/3 Tuition Remission
| 3. Full Tuition Waiver
|
| Hostel:
|
| Semester 1 = 16750
| Semester 2-8 = 8250
|
| Mess charges are separately notified.
|
*/

function buildNitSikkimPreview() {
  const branch_fee =
    baseBranchFee({
      college_id:
        'national-institute-of-technology-sikkim',

      academic_year:
        2025,

      source_label:
        'NIT Sikkim Official B.Tech Fee Structure 2025-2029 Batch',

      source_url:
        'https://nitsikkim.ac.in/documents/Fee%20Structure/2025_jan/B.Tech%20Fee%20structure%20for%202025-26.pdf',

      verification_status:
        'verified'
    });

  const fullTuition = [
    62500,
    62500,
    62500,
    62500,
    62500,
    62500,
    62500,
    62500
  ];

  const remissionTuition = [
    20834,
    20834,
    20834,
    20834,
    20834,
    20834,
    20834,
    20834
  ];

  const waivedTuition = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ];

  const fullInstituteTotals = [
    71368,
    71368,
    71368,
    71368,
    71368,
    71368,
    71368,
    71368
  ];

  const remissionInstituteTotals = [
    29702,
    29702,
    29702,
    29702,
    29702,
    29702,
    29702,
    29702
  ];

  const waiverInstituteTotals = [
    8868,
    8868,
    8868,
    8868,
    8868,
    8868,
    8868,
    8868
  ];

  const hostelFees = [
    16750,
    8250,
    8250,
    8250,
    8250,
    8250,
    8250,
    8250
  ];

  const fee_variants = [];

  function addCategory({
    category,
    income_min,
    income_max,
    tuition,
    instituteTotals
  }) {
    for (
      let i = 0;
      i < 8;
      i++
    ) {
      const semester =
        i + 1;

      const tuitionFee =
        tuition[i];

      const instituteTotal =
        instituteTotals[i];

      const otherInstituteCharges =
        instituteTotal -
        tuitionFee;

      /*
      |--------------------------------------------------------------------------
      | DAY SCHOLAR
      |--------------------------------------------------------------------------
      */

      fee_variants.push({
        semester,

        fee_period:
          'semester',

        student_category:
          category,

        income_min,
        income_max,

        residence_type:
          'day_scholar',

        room_type:
          null,

        tuition_fee:
          tuitionFee,

        admission_fee:
          null,

        institute_fee:
          otherInstituteCharges,

        hostel_fee:
          null,

        mess_fee:
          null,

        caution_deposit:
          null,

        other_fee:
          null,

        total_fee:
          instituteTotal,

        is_one_time_included:
          false,

        verification_status:
          'verified'
      });

      /*
      |--------------------------------------------------------------------------
      | HOSTELLER
      |--------------------------------------------------------------------------
      */

      fee_variants.push({
        semester,

        fee_period:
          'semester',

        student_category:
          category,

        income_min,
        income_max,

        residence_type:
          'hosteller',

        room_type:
          null,

        tuition_fee:
          tuitionFee,

        admission_fee:
          null,

        institute_fee:
          otherInstituteCharges,

        hostel_fee:
          hostelFees[i],

        mess_fee:
          null,

        caution_deposit:
          null,

        other_fee:
          null,

        total_fee:
          instituteTotal +
          hostelFees[i],

        is_one_time_included:
          semester === 1,

        verification_status:
          'verified'
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FULL FEE PAYER
  |--------------------------------------------------------------------------
  */

  addCategory({
    category:
      'GEN/OBC/EWS',

    income_min:
      500000,

    income_max:
      null,

    tuition:
      fullTuition,

    instituteTotals:
      fullInstituteTotals
  });

  /*
  |--------------------------------------------------------------------------
  | 2/3 TUITION REMISSION
  |--------------------------------------------------------------------------
  */

  addCategory({
    category:
      'GEN/OBC/EWS',

    income_min:
      100000,

    income_max:
      500000,

    tuition:
      remissionTuition,

    instituteTotals:
      remissionInstituteTotals
  });

  /*
  |--------------------------------------------------------------------------
  | FULL TUITION WAIVER
  |--------------------------------------------------------------------------
  */

  addCategory({
    category:
      'SC/ST/PwD or income below 1 lakh',

    income_min:
      null,

    income_max:
      100000,

    tuition:
      waivedTuition,

    instituteTotals:
      waiverInstituteTotals
  });

  return {
    filename:
      'nit-sikkim-fee-preview.json',

    branch_fee,
    fee_variants
  };
}



/*
|--------------------------------------------------------------------------
| NIT ROURKELA
|--------------------------------------------------------------------------
|
| Domestic B.Tech fee structure only.
|
| Tuition:
| - Full fee: 62500 / semester
| - Income 1-5 lakh: 20833 / semester
| - SC/ST/PH or income below 1 lakh: 0
|
| Other recurring:
| - Other fee: 5000
| - Student activity: 2000
| - Medical: 2000
| - Hostel seat rent: 5000
| - Hall establishment: 5000 where applicable
| - Mess advance: 30000 approximate
|
| One-time:
| - Admission fee: 2500
| - Caution deposit: 10000 refundable
|
| The separate 7500 tuition blocks are intentionally excluded.
|
*/

function buildNitRourkelaPreview() {
  const branch_fee =
    baseBranchFee({
      college_id:
        'national-institute-of-technology-rourkela',

      academic_year:
        2026,

      source_label:
        'NIT Rourkela Official Fee Structure',

      source_url:
        'https://www.nitrkl.ac.in/docs/Announcement/14072026180430277.pdf',

      verification_status:
        'pending_review'
    });

  const fee_variants = [];

  const groups = [
    {
      category:
        'GEN/OBC/EWS',

      income_min:
        500000,

      income_max:
        null,

      tuition:
        62500
    },

    {
      category:
        'GEN/OBC/EWS',

      income_min:
        100000,

      income_max:
        500000,

      tuition:
        20833
    },

    {
      category:
        'SC/ST/PH or income below 1 lakh',

      income_min:
        null,

      income_max:
        100000,

      tuition:
        0
    }
  ];

  for (const group of groups) {
    for (
      let semester = 1;
      semester <= 8;
      semester++
    ) {
      const firstSemester =
        semester === 1;

      const lastSemester =
        semester === 8;

      const admissionFee =
        firstSemester
          ? 2500
          : null;

      const cautionDeposit =
        firstSemester
          ? 10000
          : null;

      const otherAcademic =
        5000 +
        2000 +
        2000;

      const hallEstablishment =
        semester >= 3 &&
        semester <= 7
          ? 5000
          : 0;

      const souvenirFee =
        lastSemester
          ? 500
          : 0;

      const convocationFee =
        lastSemester
          ? 2500
          : 0;

      const hostelFee =
        5000 +
        hallEstablishment;

      const messAdvance =
        30000;

      const total =
        group.tuition +
        otherAcademic +
        hostelFee +
        messAdvance +
        (admissionFee || 0) +
        (cautionDeposit || 0) +
        souvenirFee +
        convocationFee;

      fee_variants.push({
        semester,

        fee_period:
          'semester',

        student_category:
          group.category,

        income_min:
          group.income_min,

        income_max:
          group.income_max,

        residence_type:
          'hosteller',

        room_type:
          null,

        tuition_fee:
          group.tuition,

        admission_fee:
          admissionFee,

        institute_fee:
          otherAcademic,

        hostel_fee:
          hostelFee,

        mess_fee:
          messAdvance,

        caution_deposit:
          cautionDeposit,

        other_fee:
          souvenirFee +
          convocationFee,

        total_fee:
          total,

        is_one_time_included:
          firstSemester,

        verification_status:
          'pending_review'
      });
    }
  }

  return {
    filename:
      'nit-rourkela-fee-preview.json',

    branch_fee,
    fee_variants
  };
}

function validatePreview(
  preview
) {
  if (
    !preview ||
    !preview.branch_fee
  ) {
    throw new Error(
      'Invalid preview: branch_fee missing'
    );
  }

  if (
    !Array.isArray(
      preview.fee_variants
    )
  ) {
    throw new Error(
      `Invalid variants for ${preview.branch_fee.college_id}`
    );
  }

  for (
    const variant
    of preview.fee_variants
  ) {
    if (
      variant.semester !== null &&
      (
        variant.semester < 1 ||
        variant.semester > 12
      )
    ) {
      throw new Error(
        `Invalid semester for ${preview.branch_fee.college_id}`
      );
    }

    const monetaryFields = [
      'tuition_fee',
      'admission_fee',
      'institute_fee',
      'hostel_fee',
      'mess_fee',
      'caution_deposit',
      'other_fee',
      'total_fee'
    ];

    for (
      const field
      of monetaryFields
    ) {
      const value =
        variant[field];

      if (
        value !== null &&
        value !== undefined &&
        (
          !Number.isFinite(value) ||
          value < 0
        )
      ) {
        throw new Error(
          `Invalid ${field} for ${preview.branch_fee.college_id}`
        );
      }
    }
  }
}

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/



/*
|--------------------------------------------------------------------------
| NIT MIZORAM
|--------------------------------------------------------------------------
|
| Official B.Tech semester fee structure.
|
| Fee groups:
|
| 1. GEN/OBC - parental income above 5 lakh
| 2. GEN/OBC - parental income 1 lakh to 5 lakh
| 3. GEN/OBC - parental income below 1 lakh
| 4. SC/ST/PH
|
| IMPORTANT:
|
| Tuition and semester grand totals are directly mapped.
|
| The difference between total and tuition is NOT automatically labelled
| as hostel/institute/mess because the source contains multiple academic
| and other components.
|
| Therefore the remaining amount is stored in other_fee.
|
|--------------------------------------------------------------------------
*/

function buildNitMizoramPreview() {

  const branch_fee =
    baseBranchFee({

      college_id:
        'national-institute-of-technology-mizoram',

      academic_year:
        2025,

      source_label:
        'NIT Mizoram Official B.Tech Fee Structure',

      source_url:
        'https://nitmz.ac.in/',

      verification_status:
        'pending_review'
    });


  /*
  |--------------------------------------------------------------------------
  | FULL TUITION
  | GEN/OBC
  | PARENTAL INCOME ABOVE 5 LAKH
  |--------------------------------------------------------------------------
  */

  const fullTuition = [
    62500,
    62500,
    62500,
    62500,
    62500,
    62500,
    62500,
    62500
  ];

  const fullTotals = [
    69400,
    67100,
    67650,
    67350,
    67650,
    67350,
    67650,
    68850
  ];


  /*
  |--------------------------------------------------------------------------
  | TWO-THIRD TUITION REMISSION
  | GEN/OBC
  | PARENTAL INCOME 1 LAKH TO 5 LAKH
  |--------------------------------------------------------------------------
  */

  const remissionTuition = [
    20833,
    20833,
    20833,
    20833,
    20833,
    20833,
    20833,
    20833
  ];

  const remissionTotals = [
    27733,
    25433,
    25983,
    25683,
    25983,
    25683,
    25983,
    27183
  ];


  /*
  |--------------------------------------------------------------------------
  | FULL TUITION WAIVER
  | GEN/OBC
  | PARENTAL INCOME BELOW 1 LAKH
  |--------------------------------------------------------------------------
  */

  const lowIncomeTuition = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ];

  const lowIncomeTotals = [
    6900,
    4600,
    5150,
    4850,
    5150,
    4850,
    5150,
    6350
  ];


  /*
  |--------------------------------------------------------------------------
  | SC/ST/PH
  | FULL TUITION WAIVER
  |--------------------------------------------------------------------------
  */

  const reservedTuition = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ];

  const reservedTotals = [
    6900,
    4600,
    5150,
    4850,
    5150,
    4850,
    5150,
    6350
  ];


  const fee_variants = [];


  /*
  |--------------------------------------------------------------------------
  | COMMON 8-SEMESTER GENERATOR
  |--------------------------------------------------------------------------
  */

  function addSemesterVariants({
    category,
    income_min,
    income_max,
    tuition,
    totals
  }) {

    for (
      let index = 0;
      index < 8;
      index++
    ) {

      const semester =
        index + 1;

      const tuitionFee =
        tuition[index];

      const totalFee =
        totals[index];

      const remainingFee =
        totalFee -
        tuitionFee;


      fee_variants.push({

        semester,

        fee_period:
          'semester',

        student_category:
          category,

        income_min,

        income_max,

        /*
        |--------------------------------------------------------------------------
        | Hostel status is not assumed from this table.
        |--------------------------------------------------------------------------
        */

        residence_type:
          null,

        room_type:
          null,


        /*
        |--------------------------------------------------------------------------
        | VERIFIED NUMERIC VALUES
        |--------------------------------------------------------------------------
        */

        tuition_fee:
          tuitionFee,

        admission_fee:
          null,

        institute_fee:
          null,

        hostel_fee:
          null,

        mess_fee:
          null,

        caution_deposit:
          null,


        /*
        |--------------------------------------------------------------------------
        | Difference between semester total and tuition.
        |
        | This may include multiple components.
        |--------------------------------------------------------------------------
        */

        other_fee:
          remainingFee,

        total_fee:
          totalFee,


        /*
        |--------------------------------------------------------------------------
        | Exact one-time split has not been independently mapped.
        |--------------------------------------------------------------------------
        */

        is_one_time_included:
          false,

        verification_status:
          'pending_review'
      });
    }
  }


  /*
  |--------------------------------------------------------------------------
  | CATEGORY 1
  | GEN/OBC > 5 LAKH
  |--------------------------------------------------------------------------
  */

  addSemesterVariants({

    category:
      'GEN/OBC',

    income_min:
      500000,

    income_max:
      null,

    tuition:
      fullTuition,

    totals:
      fullTotals
  });


  /*
  |--------------------------------------------------------------------------
  | CATEGORY 2
  | GEN/OBC 1-5 LAKH
  |--------------------------------------------------------------------------
  */

  addSemesterVariants({

    category:
      'GEN/OBC',

    income_min:
      100000,

    income_max:
      500000,

    tuition:
      remissionTuition,

    totals:
      remissionTotals
  });


  /*
  |--------------------------------------------------------------------------
  | CATEGORY 3
  | GEN/OBC BELOW 1 LAKH
  |--------------------------------------------------------------------------
  */

  addSemesterVariants({

    category:
      'GEN/OBC',

    income_min:
      null,

    income_max:
      100000,

    tuition:
      lowIncomeTuition,

    totals:
      lowIncomeTotals
  });


  /*
  |--------------------------------------------------------------------------
  | CATEGORY 4
  | SC/ST/PH
  |--------------------------------------------------------------------------
  */

  addSemesterVariants({

    category:
      'SC/ST/PH',

    income_min:
      null,

    income_max:
      null,

    tuition:
      reservedTuition,

    totals:
      reservedTotals
  });


  /*
  |--------------------------------------------------------------------------
  | FINAL PREVIEW
  |--------------------------------------------------------------------------
  */

  return {

    filename:
      'nit-mizoram-fee-preview.json',

    branch_fee,

    fee_variants
  };
}


const builders = [
  buildNitDelhiPreview,
  buildIitMandiPreview,
  buildAbvIiitmGwaliorPreview,
  buildIiitaPreview,
  buildIiitdmKancheepuramPreview,
  buildNitMizoramPreview,
  buildNitSikkimPreview,
  buildNitRourkelaPreview
];

const summary = [];

for (
  const builder
  of builders
) {
  const preview =
    builder();

  validatePreview(
    preview
  );

  const output = {
    branch_fee:
      preview.branch_fee,

    fee_variants:
      preview.fee_variants
  };

  await fs.writeFile(
    `${OUTPUT_DIR}/${preview.filename}`,

    JSON.stringify(
      output,
      null,
      2
    ),

    'utf8'
  );

  summary.push({
    college_id:
      preview.branch_fee.college_id,

    academic_year:
      preview.branch_fee.academic_year,

    variants:
      preview.fee_variants.length,

    verified_variants:
      preview.fee_variants.filter(
        row =>
          row.verification_status ===
          'verified'
      ).length,

    file:
      preview.filename
  });
}

console.log('');
console.log(
  '======================================='
);

console.log(
  'MULTI-COLLEGE BTECH FEE PREVIEW'
);

console.log(
  '======================================='
);

console.table(
  summary
);

console.log('');

console.log(
  'Total preview variants:',
  summary.reduce(
    (sum, row) =>
      sum + row.variants,
    0
  )
);

console.log('');

console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);