import fs from "node:fs";

const batchFile = "./fee-bulk-batch-2026-08-29T05-36-43-549Z.json";

const batch = JSON.parse(
  fs.readFileSync(batchFile, "utf8").replace(/^\uFEFF/, "")
);

function getCollege(name) {
  const row = batch.find(
    x => x.college_name === name
  );

  if (!row) {
    throw new Error(
      `College not found in batch: ${name}`
    );
  }

  return row;
}

const out = [];


/* =========================================
   1. ANA COLLEGE BAREILLY
   ========================================= */

{
  const c = getCollege(
    "A.N.A.COLLEGE OF ENGINEERING & MANAGEMENT,BAREILLY"
  );

  out.push({
    college_id: c.college_id,
    college_name: c.college_name,
    program: "B.Tech",
    academic_year: 2026,

    tuition_fee_per_semester: 32500,
    academic_fee_per_semester: null,
    hostel_fee_per_semester: null,
    mess_fee_per_semester: null,

    first_semester_fee: null,
    first_year_fee: 65000,

    annual_academic_fee: 65000,
    annual_total_fee: null,
    total_course_fee: null,

    one_time_fee: null,
    security_deposit: null,

    source_kind: "official",
    source_label: "ANA College BTech Fee Structure 2026-27",
    source_url:
      "https://anacollege.org/bachelor-of-technology/",

    source_priority: 100,
    confidence_score: 98,
    verification_status: "high_confidence",
    extraction_method: "manual",

    notes:
      "Official 2026-27 B.Tech CSE fee INR 65000 per year and INR 32500 per semester. Official page reports INR 260000 as four-year tuition only, therefore it is not stored as total_course_fee."
  });
}


/* =========================================
   2. ASSAM UNIVERSITY SILCHAR
   ========================================= */

{
  const c = getCollege(
    "Assam University, Silchar"
  );

  out.push({
    college_id: c.college_id,
    college_name: c.college_name,
    program: "B.Tech",
    academic_year: 2026,

    tuition_fee_per_semester: null,
    academic_fee_per_semester: null,

    /*
      JoSAA says approx hostel INR 25000 annually.
      We do not force semester split.
    */
    hostel_fee_per_semester: null,

    mess_fee_per_semester: null,

    /*
      Source states total payable at admission.
    */
    first_semester_fee: 55145,
    first_year_fee: null,

    /*
      Explicit annual academic-side items summed:
      INR 48770.
    */
    annual_academic_fee: 48770,

    annual_total_fee: null,
    total_course_fee: null,

    one_time_fee: 3375,
    security_deposit: 3000,

    source_kind: "counselling_portal",
    source_label:
      "JoSAA Assam University BTech Institute Profile",

    source_url:
      "https://josaa.admissions.nic.in/seatinfo/root/InstProfile.aspx?instcd=401",

    source_priority: 95,
    confidence_score: 96,
    verification_status: "high_confidence",
    extraction_method: "manual",

    notes:
      "JoSAA institute profile states total payable at admission INR 55145. Annual academic-side charges including annual course fee and tuition sum to INR 48770. Hostel approximately INR 25000 annually, so semester hostel field is left null."
  });
}


/* =========================================
   3. BIT MESRA - MAIN CAMPUS
   ========================================= */

{
  const c = getCollege(
    "Birla Institute of Technology, Mesra, Ranchi"
  );

  out.push({
    college_id: c.college_id,
    college_name: c.college_name,
    program: "B.Tech",
    academic_year: 2026,

    tuition_fee_per_semester: 169000,

    /*
      1st semester:
      tuition 169000
      development 12000
      exam 8000
      = 189000
    */
    academic_fee_per_semester: 189000,

    hostel_fee_per_semester: null,
    mess_fee_per_semester: null,

    /*
      189000 +
      admission 20000 +
      caution 10000 +
      IT infra 15000
    */
    first_semester_fee: 234000,

    first_year_fee: null,

    /*
      Sem 1 + Sem 2:
      189000 + 189000
    */
    annual_academic_fee: 378000,

    annual_total_fee: null,
    total_course_fee: null,

    one_time_fee: 35000,
    security_deposit: 10000,

    source_kind: "official",
    source_label:
      "BIT Mesra BTech Fee Structure 2026-27",

    source_url:
      "https://bitmesra.ac.in/print_Brochure_a/105/103",

    source_priority: 100,
    confidence_score: 100,
    verification_status: "verified",
    extraction_method: "manual",

    notes:
      "Official BIT Mesra 2026 fee structure for B.Tech CSE/AIML/ECE. First semester tuition INR 169000, development INR 12000 and exam INR 8000. Hostel is extra and therefore not included in normalized annual_total_fee."
  });
}


/* =========================================
   4. BIT MESRA ALIAS
   ========================================= */

{
  const c = getCollege(
    "BIT Mesra, Ranchi"
  );

  out.push({
    college_id: c.college_id,
    college_name: c.college_name,
    program: "B.Tech",
    academic_year: 2026,

    tuition_fee_per_semester: 169000,
    academic_fee_per_semester: 189000,

    hostel_fee_per_semester: null,
    mess_fee_per_semester: null,

    first_semester_fee: 234000,
    first_year_fee: null,

    annual_academic_fee: 378000,
    annual_total_fee: null,
    total_course_fee: null,

    one_time_fee: 35000,
    security_deposit: 10000,

    source_kind: "official",
    source_label:
      "BIT Mesra BTech Fee Structure 2026-27",

    source_url:
      "https://bitmesra.ac.in/print_Brochure_a/105/103",

    source_priority: 100,
    confidence_score: 100,
    verification_status: "verified",
    extraction_method: "manual",

    notes:
      "Alias record for BIT Mesra main campus. Same official 2026 B.Tech CSE/AIML/ECE fee structure."
  });
}


/* =========================================
   5. BIT DEOGHAR OFF CAMPUS
   ========================================= */

{
  const c = getCollege(
    "Birla Institute of Technology, Deoghar Off-Campus"
  );

  out.push({
    college_id: c.college_id,
    college_name: c.college_name,
    program: "B.Tech",
    academic_year: 2026,

    tuition_fee_per_semester: 159000,

    /*
      159000 + 11000 + 8000
    */
    academic_fee_per_semester: 178000,

    hostel_fee_per_semester: null,
    mess_fee_per_semester: null,

    /*
      178000 +
      admission 20000 +
      caution 10000 +
      IT infrastructure 15000
    */
    first_semester_fee: 223000,

    first_year_fee: null,

    annual_academic_fee: 356000,

    annual_total_fee: null,
    total_course_fee: null,

    one_time_fee: 35000,
    security_deposit: 10000,

    source_kind: "official",
    source_label:
      "BIT Deoghar BTech Fee Structure 2026-27",

    source_url:
      "https://bitmesra.ac.in/print_Brochure_a/105/103",

    source_priority: 100,
    confidence_score: 100,
    verification_status: "verified",
    extraction_method: "manual",

    notes:
      "Official BIT 2026 B.Tech CSE/AIML off-campus fee structure. First semester tuition INR 159000, development INR 11000 and exam INR 8000."
  });
}


/* =========================================
   6. BIT PATNA OFF CAMPUS
   ========================================= */

{
  const c = getCollege(
    "Birla Institute of Technology, Patna Off-Campus"
  );

  out.push({
    college_id: c.college_id,
    college_name: c.college_name,
    program: "B.Tech",
    academic_year: 2026,

    tuition_fee_per_semester: 159000,
    academic_fee_per_semester: 178000,

    hostel_fee_per_semester: null,
    mess_fee_per_semester: null,

    first_semester_fee: 223000,
    first_year_fee: null,

    annual_academic_fee: 356000,

    annual_total_fee: null,
    total_course_fee: null,

    one_time_fee: 35000,
    security_deposit: 10000,

    source_kind: "official",
    source_label:
      "BIT Patna BTech Fee Structure 2026-27",

    source_url:
      "https://bitmesra.ac.in/print_Brochure_a/105/103",

    source_priority: 100,
    confidence_score: 100,
    verification_status: "verified",
    extraction_method: "manual",

    notes:
      "Official BIT 2026 B.Tech CSE/AIML off-campus fee structure. First semester tuition INR 159000, development INR 11000 and exam INR 8000."
  });
}


fs.writeFileSync(
  "./fee-bulk-batch-02-ready.json",
  JSON.stringify(out, null, 2),
  "utf8"
);

console.log(
  `READY: fee-bulk-batch-02-ready.json | records=${out.length}`
);
