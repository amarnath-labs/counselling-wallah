import fs from "node:fs";

const batchFile =
  "./fee-bulk-batch-2026-08-29T05-44-14-757Z.json";

const batch = JSON.parse(
  fs.readFileSync(batchFile, "utf8").replace(/^\uFEFF/, "")
);

function getCollege(name) {
  const row = batch.find(x => x.college_name === name);

  if (!row) {
    throw new Error(`College not found: ${name}`);
  }

  return row;
}

function make(name, data) {
  const c = getCollege(name);

  return {
    college_id: c.college_id,
    college_name: c.college_name,
    program: "B.Tech",
    academic_year: 2026,

    tuition_fee_per_semester: null,
    academic_fee_per_semester: null,
    hostel_fee_per_semester: null,
    mess_fee_per_semester: null,
    first_semester_fee: null,
    first_year_fee: null,
    annual_academic_fee: null,
    annual_total_fee: null,
    total_course_fee: null,
    one_time_fee: null,
    security_deposit: null,

    extraction_method: "manual",
    ...data
  };
}

const out = [

make(
"Acharya Narendra Deva University of Agriculture & Technology, Kumarganj, Ayodhya",
{
  total_course_fee: 207000,
  source_kind: "careers360",
  source_label: "ANDUAT BTech Fees 2026",
  source_url:
    "https://www.careers360.com/university/acharya-narendra-deva-university-of-agriculture-and-technology-faizabad/fees",
  source_priority: 70,
  confidence_score: 80,
  verification_status: "review_recommended",
  notes:
    "Careers360 reports INR 2.07 lakh total B.Tech fee for CSE/Mechanical/Agricultural Engineering options. Fee differs by programme, so semester fields remain null."
}),

make(
"ALIGARH COLLEGE OF ENGG. & TECH,ALIGARH",
{
  total_course_fee: 244800,
  source_kind: "shiksha",
  source_label: "ACET Aligarh BTech Fees 2026",
  source_url:
    "https://www.shiksha.com/college/aligarh-college-of-engineering-and-technology-24927/fees",
  source_priority: 65,
  confidence_score: 82,
  verification_status: "review_recommended",
  notes:
    "Shiksha reports INR 244800 total B.Tech fee for four years based on AFRC UP."
}),

make(
"APOLLO INSTITUTE OF TECHNOLOGY,KANPUR",
{
  total_course_fee: 300000,
  source_kind: "careers360",
  source_label: "Apollo Institute Kanpur BTech Fees 2026",
  source_url:
    "https://www.careers360.com/colleges/apollo-institute-of-technology-kanpur/fees",
  source_priority: 70,
  confidence_score: 82,
  verification_status: "review_recommended",
  notes:
    "Careers360 reports INR 300000 total four-year B.Tech fee for major branches."
}),

make(
"Atal Bihari Vajpayee Indian Institute of Information Technology & Management Gwalior",
{
  tuition_fee_per_semester: 95000,
  academic_fee_per_semester: 105000,
  hostel_fee_per_semester: 15000,
  mess_fee_per_semester: 20000,
  first_semester_fee: 168750,
  annual_academic_fee: 210000,
  annual_total_fee: 308750,
  source_kind: "official",
  source_label: "ABV-IIITM Gwalior Official Fee Structure",
  source_url:
    "https://iiitm.ac.in/public/uploads/media_uploads/1779189402_Fees-Details-2025-2026-f.pdf",
  source_priority: 100,
  confidence_score: 95,
  verification_status: "high_confidence",
  notes:
    "Alias record reused from existing official ABV-IIITM fee evidence."
}),

make(
"AZAD INSTITUTE OF ENGINEERING & TECHNOLOGY,LUCKNOW",
{
  total_course_fee: 492000,
  source_kind: "collegedunia",
  source_label: "AIET Lucknow BTech Fees 2026",
  source_url:
    "https://collegedunia.com/college/12926-azad-institute-of-engineering-and-technology-aiet-lucknow/courses-fees",
  source_priority: 70,
  confidence_score: 75,
  verification_status: "review_recommended",
  notes:
    "Collegedunia reports B.Tech complete-course fee between INR 3.32 lakh and INR 4.92 lakh depending on specialization. INR 4.92 lakh retained as upper reported B.Tech total; review recommended."
}),

make(
"B.B.S.COLLEGE OF ENGINEERING AND TECHNOLOGY,ALLAHABAD",
{
  tuition_fee_per_semester: 60000,
  annual_academic_fee: 120000,
  source_kind: "official",
  source_label: "BBSBEC Fee Structure Batch 2026",
  source_url:
    "https://bbsbec.edu.in/wp-content/uploads/2026/03/FEE-STRUCTURE-2026.pdf",
  source_priority: 100,
  confidence_score: 98,
  verification_status: "high_confidence",
  notes:
    "Official Batch 2026 PDF: B.Tech CSE/AI fee INR 60000 per semester. Other core branches are INR 50000 per semester. Record represents CSE/AI."
}),

make(
"B.N.COLLEGE OF ENGINEERING & TECHNOLOGY(BNCET),LUCKNOW",
{
  annual_academic_fee: 76792,
  source_kind: "official",
  source_label: "BNCET Fee Structure",
  source_url:
    "https://bncet.ac.in/fees-structure/",
  source_priority: 100,
  confidence_score: 92,
  verification_status: "high_confidence",
  notes:
    "Official BNCET page lists B.Tech fee INR 76792 plus examination fees. Page labels it total fee but context indicates current course fee amount; stored conservatively as annual academic-side fee."
}),

make(
"BABU BANARSI DAS INSTITUTE OF TECH.,GHAZIABAD",
{
  total_course_fee: 480000,
  source_kind: "shiksha",
  source_label: "BBDIT Ghaziabad BTech Fees 2026",
  source_url:
    "https://www.shiksha.com/college/babu-banarsi-das-institute-of-technology-ghaziabad-37647/fees",
  source_priority: 65,
  confidence_score: 75,
  verification_status: "review_recommended",
  notes:
    "Shiksha reports B.Tech tuition range INR 240000-480000 depending on specialisation/duration. Upper complete-course figure stored with review status."
}),

make(
"BABU SUNDER SINGH INSTITUTE OF TECHNOLOGY & MANAGEMENT,LUCKNOW",
{
  total_course_fee: 245000,
  source_kind: "collegedunia",
  source_label: "BSSITM Lucknow BTech Fees 2026",
  source_url:
    "https://collegedunia.com/college/15640-babu-sunder-singh-institute-of-technology-and-management-bssitm-lucknow/courses-fees",
  source_priority: 70,
  confidence_score: 82,
  verification_status: "review_recommended",
  notes:
    "Collegedunia reports INR 245000 total B.Tech fees for full course."
}),

make(
"Bundelkhand University, Jhansi",
{
  total_course_fee: 223000,
  source_kind: "careers360",
  source_label: "IET Bundelkhand University BTech Fees 2026",
  source_url:
    "https://www.careers360.com/colleges/institute-of-engineering-and-technology-bundelkhand-university-jhansi/fees",
  source_priority: 70,
  confidence_score: 82,
  verification_status: "review_recommended",
  notes:
    "Careers360 reports INR 223000 total B.Tech fee for major engineering specialisations."
}),

make(
"CENTRAL INSTITUTE OF PETROCHEMICALS ENGINEERING & TECHNOLOGY (CIPET), LUCKNOW",
{
  total_course_fee: 245000,
  source_kind: "collegedunia",
  source_label: "CIPET Lucknow BTech Fees 2026",
  source_url:
    "https://collegedunia.com/college/13170-cipet-institute-of-plastics-technology-ipt-lucknow/courses-fees",
  source_priority: 70,
  confidence_score: 82,
  verification_status: "review_recommended",
  notes:
    "Collegedunia reports INR 245000 total B.Tech fees for complete course in 2026."
}),

make(
"Central institute of Technology Kokrajar, Assam",
{
  total_course_fee: 99602,
  source_kind: "other_secondary",
  source_label: "CIT Kokrajhar BTech Fee Structure",
  source_url:
    "https://cit.kokrajhar.in/",
  source_priority: 60,
  confidence_score: 70,
  verification_status: "review_recommended",
  notes:
    "Secondary CIT Kokrajhar information page reports four-year B.Tech total INR 99602. Official admission portal confirms current 2026 fee-structure section but accessible numeric table was not exposed."
}),

make(
"Central University of Jammu",
{
  total_course_fee: 554000,
  source_kind: "careers360",
  source_label: "Central University Jammu BTech Fees 2026",
  source_url:
    "https://www.careers360.com/university/central-university-of-jammu-jammu/fees",
  source_priority: 70,
  confidence_score: 88,
  verification_status: "review_recommended",
  notes:
    "Careers360 reports INR 420000 tuition and approximately INR 554000 complete B.Tech fee."
}),

make(
"Central University of Karnataka",
{
  first_semester_fee: 40820,
  first_year_fee: 76420,
  annual_academic_fee: 76420,
  source_kind: "official",
  source_label: "Central University Karnataka BTech Fee Structure",
  source_url:
    "https://www.cuk.ac.in/Circular/Fee%20for%20website%2001.07.2025.pdf",
  source_priority: 95,
  confidence_score: 85,
  verification_status: "review_recommended",
  notes:
    "Latest accessible official detailed B.Tech structure is AY 2025-26: first odd semester INR 40820, even semester INR 35600, annual INR 76420. Stored for review because exact 2026-27 PDF was not retrieved."
}),

make(
"Central University of Punjab, Bathinda",
{
  total_course_fee: 278000,
  source_kind: "careers360",
  source_label: "Central University Punjab BTech Fees 2026",
  source_url:
    "https://www.careers360.com/university/central-university-of-punjab-bathinda/fees",
  source_priority: 70,
  confidence_score: 88,
  verification_status: "review_recommended",
  notes:
    "Careers360 reports B.Tech CSE total fee INR 278000, with tuition component INR 176000 for full course."
}),

make(
"CENTRE FOR ADVANCE STUDIES,LUCKNOW",
{
  source_kind: "counselling_portal",
  source_label: "UPTAC 2026 Institute Evidence",
  source_url:
    "https://admissions.nic.in/UPTAC/Applicant/report/orcrreport.aspx",
  source_priority: 50,
  confidence_score: 40,
  verification_status: "review_recommended",
  notes:
    "Current fee amount could not be safely established from a reliable fee source. No numeric field is populated."
}),

make(
"Ch. Charan Singh University Campus (SCRIET) Meerut",
{
  first_year_fee: 91000,
  total_course_fee: 331000,
  security_deposit: 5000,
  source_kind: "collegedunia",
  source_label: "SCRIET Meerut BTech Fees 2026",
  source_url:
    "https://collegedunia.com/college/15149-sir-chhotu-ram-institute-of-engineering-and-technology-scriet-meerut/bachelor-of-technology-btech-full-time",
  source_priority: 70,
  confidence_score: 86,
  verification_status: "review_recommended",
  notes:
    "Collegedunia reports uniform B.Tech fee INR 331000 over four years, INR 91000 in year 1 and INR 80000 in years 2-4, plus refundable INR 5000 security."
}),

make(
"CHAUDHARY BEERI SINGH COLLEGE OF ENGINEERING & MANAGEMENT,AGRA",
{
  source_kind: "counselling_portal",
  source_label: "UPTAC Institute Listing",
  source_url:
    "https://admissions.nic.in/UPTAC/Applicant/report/orcrreport.aspx",
  source_priority: 50,
  confidence_score: 40,
  verification_status: "review_recommended",
  notes:
    "Institute verified in UPTAC records, but a reliable current 2026 B.Tech fee amount was not established. Numeric fields intentionally null."
}),

make(
"Chhattisgarh Swami Vivekanada Technical University, Bhilai (CSVTU Bhilai)",
{
  total_course_fee: 440000,
  source_kind: "careers360",
  source_label: "CSVTU Bhilai BTech Fees 2026",
  source_url:
    "https://www.careers360.com/university/chhattisgarh-swami-vivekanand-technical-university-bhilai/fees",
  source_priority: 70,
  confidence_score: 75,
  verification_status: "review_recommended",
  notes:
    "Careers360 reports B.Tech CSE tuition/total up to INR 440000. CSVTU has many affiliated programmes, so review is required before treating this as universal."
}),

make(
"COLLEGE OF ENGG. & RURAL TECHNOLOGY,MEERUT",
{
  total_course_fee: 445000,
  source_kind: "collegedunia",
  source_label: "CERT Meerut BTech Fees 2026",
  source_url:
    "https://collegedunia.com/college/13261-college-of-engineering-and-rural-technology-cert-meerut/courses-fees?course_type=Full-Time&slug=bachelor-of-technology-btech",
  source_priority: 70,
  confidence_score: 82,
  verification_status: "review_recommended",
  notes:
    "Collegedunia reports INR 245000 academic fee + INR 200000 hostel fee = INR 445000 total for four-year B.Tech."
}),

make(
"CU Jharkhand",
{
  first_semester_fee: 35548,
  annual_academic_fee: null,
  total_course_fee: 250000,
  source_kind: "official",
  source_label: "Central University of Jharkhand BTech Fee 2026",
  source_url:
    "https://cuj.ac.in/file/FEEPOSTGRADUATE2026.pdf",
  source_priority: 100,
  confidence_score: 90,
  verification_status: "review_recommended",
  notes:
    "Official 2026-30 B.Tech fee PDF provides semester-wise structure. Careers360 reports approximately INR 250000 complete B.Tech fee. Annual value intentionally not normalized here due OCR ambiguity in official table."
}),

make(
"D. D. U. Gorakhpur University, Gorakhpur",
{
  total_course_fee: 400000,
  source_kind: "other_secondary",
  source_label: "DDU Gorakhpur BTech Fees 2026",
  source_url:
    "https://www.getmyuni.com/college/deen-dayal-upadhyaya-gorakhpur-university-gorakhpur-courses-fees",
  source_priority: 60,
  confidence_score: 80,
  verification_status: "review_recommended",
  notes:
    "Secondary source reports INR 400000 total four-year B.Tech fee."
}),

make(
"DEEWAN V.S. INSTITUTE OF ENGINEERING & TECHNOLOGY, MEERUT,MEERUT",
{
  total_course_fee: 245000,
  source_kind: "collegedunia",
  source_label: "DVSIET Meerut BTech Fees 2026",
  source_url:
    "https://collegedunia.com/college/13339-dewan-vs-institute-of-engineering-and-technology-dvsiet-meerut/courses-fees",
  source_priority: 70,
  confidence_score: 82,
  verification_status: "review_recommended",
  notes:
    "Collegedunia reports INR 245000 complete B.Tech fee for 2026."
}),

make(
"DELHI INSTITUTE OF ENGINEERING & TECHNOLOGY,MEERUT",
{
  total_course_fee: 80000,
  source_kind: "careers360",
  source_label: "DIET Meerut BTech Fees 2026",
  source_url:
    "https://www.careers360.com/colleges/delhi-institute-of-engineering-and-technology-meerut/fees",
  source_priority: 70,
  confidence_score: 75,
  verification_status: "review_recommended",
  notes:
    "Careers360 reports INR 80000 total fee for several B.Tech branches. Secondary sources conflict on annual versus total interpretation, therefore review required."
}),

make(
"Delhi Technological University",
{
  total_course_fee: 1036000,
  source_kind: "careers360",
  source_label: "DTU BTech Fees 2026",
  source_url:
    "https://www.careers360.com/university/delhi-technological-university-delhi/courses/be-btech-idpg",
  source_priority: 70,
  confidence_score: 85,
  verification_status: "review_recommended",
  notes:
    "Careers360 reports around INR 10.36 lakh total B.Tech fee for common branches. Different pages show branch-specific totals, so review recommended."
})

];

fs.writeFileSync(
  "./fee-bulk-batch-06-ready.json",
  JSON.stringify(out, null, 2),
  "utf8"
);

console.log(`READY: ${out.length} records`);

