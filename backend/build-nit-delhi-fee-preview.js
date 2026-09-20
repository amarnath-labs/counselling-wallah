import fs from 'node:fs/promises';

const sourceUrl =
  'https://media.nitdelhi.ac.in/uploads/web_media/Fee%20structure%20B%20Tech@nitdelhi523e4c95-82fb-422f-b1a4-624356f76d80.pdf';

const groups = [
  {
    student_category: 'GEN/OBC/EWS',
    income_min: 500000,
    income_max: null,
    tuition_fee: 62500,
    day_total: 114200,
    ac_total: 166200,
    non_ac_total: 154200
  },
  {
    student_category: 'GEN/OBC/EWS',
    income_min: 100000,
    income_max: 500000,
    tuition_fee: 20833,
    day_total: 72533,
    ac_total: 124533,
    non_ac_total: 112533
  },
  {
    // Keep source wording unresolved instead of
    // inventing eligibility rules.
    student_category:
      'GEN/OBC/EWS/SC/ST/PwD - source eligibility review required',

    income_min: null,
    income_max: null,

    tuition_fee: 0,

    day_total: 51700,
    ac_total: 103700,
    non_ac_total: 91700
  }
];

const variants = [];

for (const group of groups) {

  const common = {
    semester: 1,
    fee_period: 'semester',

    student_category:
      group.student_category,

    income_min:
      group.income_min,

    income_max:
      group.income_max,

    tuition_fee:
      group.tuition_fee,

    admission_fee: 4000,

    // Not guessed from incomplete extracted rows.
    institute_fee: null,
    mess_fee: null,
    caution_deposit: null,
    other_fee: null,

    is_one_time_included: true,

    verification_status:
      'pending_review'
  };

  variants.push({
    ...common,

    residence_type:
      'day_scholar',

    room_type:
      null,

    hostel_fee:
      null,

    total_fee:
      group.day_total
  });

  variants.push({
    ...common,

    residence_type:
      'hosteller',

    room_type:
      'AC',

    // Total hostel section E from source.
    hostel_fee:
      52000,

    total_fee:
      group.ac_total
  });

  variants.push({
    ...common,

    residence_type:
      'hosteller',

    room_type:
      'non_AC',

    hostel_fee:
      40000,

    total_fee:
      group.non_ac_total
  });
}

const preview = {

  branch_fee: {

    college_id:
      'national-institute-of-technology-delhi',

    branch_id:
      null,

    program:
      'B.Tech',

    fee_scope:
      'all_btech_branches',

    academic_year:
      2025,

    source_label:
      'NIT Delhi Official B.Tech Fee Structure',

    source_url:
      sourceUrl,

    verification_status:
      'pending_review'
  },

  fee_variants:
    variants
};

await fs.writeFile(
  './nit-delhi-fee-preview.json',
  JSON.stringify(
    preview,
    null,
    2
  ),
  'utf8'
);

console.log('');
console.log(
  '======================================='
);

console.log(
  'NIT DELHI 9-VARIANT FEE PREVIEW'
);

console.log(
  '======================================='
);

console.log('');

console.table(
  variants.map(
    (v, index) => ({
      no: index + 1,

      category:
        v.student_category,

      income_min:
        v.income_min,

      income_max:
        v.income_max,

      residence:
        v.residence_type,

      room:
        v.room_type,

      tuition:
        v.tuition_fee,

      hostel:
        v.hostel_fee,

      total:
        v.total_fee
    })
  )
);

console.log('');
console.log(
  'Variants:',
  variants.length
);

console.log(
  'Saved: ./nit-delhi-fee-preview.json'
);

console.log('');
console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);
