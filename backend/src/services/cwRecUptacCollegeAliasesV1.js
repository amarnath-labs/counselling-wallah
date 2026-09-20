/*
|--------------------------------------------------------------------------
| CW-REC UPTAC 2025 verified college identity aliases
|--------------------------------------------------------------------------
|
| IMPORTANT:
| - Recommendation pipeline only.
| - Do NOT fuzzy-match these at runtime.
| - Do NOT modify shared colleges table names.
| - Keys are official UPTAC 2025 institute names.
| - Values are existing canonical colleges.id values.
|
*/

export const CWREC_UPTAC_COLLEGE_ALIASES_2025 =
  Object.freeze({

    'KIET GROUP OF INSTITUTIONS(KRISHNA INSTT. OF ENGG. & TECHNOLOGY),GHAZIABAD':
      'uptac-kiet-group-of-institutions-ghaziabad',

    'NOIDA INSTITUTE OF ENGG. & TECHNOLOGY,GAUTAM BUDDH NAGAR':
      'uptac-noida-institute-of-engg-technology-gautam-buddh-nagar',

    'GREATER NOIDA INSTITUTE OF TECHNOLOGY,GAUTAM BUDDH NAGAR':
      'uptac-greater-noida-institute-of-technology-gautam-buddh-nagar',

    'Dr. Rammanohar Lohia Avadh University, Faizabad':
      'uptac-dr-rammanohar-lohia-avadh-university-ayodhya',

    'Baba Shaheb (Dr.) B R Ambedkar College of Agricultural Engineering and Technology, Etawah (CSAUAT)':
      'uptac-dr-bhim-rao-ambedkar-college-of-agricultural-engineering-technology-etawah',

    'Maharaja Suhel Dev State University Azamgarh.':
      'uptac-maharaja-suhel-dev-state-university',

    'SHAMBHU NATH INSTITUTE OF ENGG. & TECHNOLGY,ALLAHABAD':
      'uptac-shambhu-nath-institute-of-engg-technology-allahabad',

    'B.B.S.COLLEGE OF ENGGINERING AND TECHNOLOGY,ALLAHABAD':
      'uptac-b-b-s-college-of-engineering-and-technology-allahabad',

    'UNITED COLLEGE OF ENGIINEERING & RESEARCH,GREATER NOIDA,GAUTAM BUDDH NAGAR':
      'uptac-united-college-of-engineering-research-greater-noida-gautam-buddh-nagar',

    'KUNWAR SATYA VEERA COLLEGE OF ENGG. & MANAGEMENT,BIJNAUR':
      'uptac-kunwar-satyavira-college-of-engineering-and-management-bijnor',

    'MANGALMAY INSTITUTE OF MANAGEMENT AND TECHNOLOGY, GAUTAM BUDDHA NAGAR':
      'uptac-mangalmay-institute-of-management-and-technology-gautam-buddh-nagar',

    'INDIAN INSTITUTE OF HANDLOOM TECHNOLOGY,VARANASI':
      'indian-institute-of-handloom-technology-varanasi',

    'MANGALMAY INSTITUTE OF ENGINEERING AND TECHNOLOGY ,GAUTAM BUDDHA NAGAR':
      'uptac-mangalmay-institute-of-management-and-technology-gautam-buddh-nagar',
  });


export function getCWRecUptacCollegeAlias2025(
  officialName
) {
  return (
    CWREC_UPTAC_COLLEGE_ALIASES_2025[
      String(
        officialName ??
        ''
      ).trim()
    ] ??
    null
  );
}
