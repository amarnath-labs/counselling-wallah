import fs from 'node:fs/promises';

const websites = {
  'indian-institute-of-technology-madras':
    'https://www.iitm.ac.in',

  'indian-institute-of-technology-delhi':
    'https://home.iitd.ac.in',

  'indian-institute-of-technology-bombay':
    'https://www.iitb.ac.in',

  'indian-institute-of-technology-kanpur':
    'https://www.iitk.ac.in',

  'indian-institute-of-technology-kharagpur':
    'https://www.iitkgp.ac.in',

  'indian-institute-of-technology-roorkee':
    'https://www.iitr.ac.in',

  'indian-institute-of-technology-hyderabad':
    'https://www.iith.ac.in',

  'indian-institute-of-technology-guwahati':
    'https://www.iitg.ac.in',

  'national-institute-of-technology-tiruchirappalli':
    'https://www.nitt.edu',

  'indian-institute-of-technology-varanasi':
    'https://www.iitbhu.ac.in',

  'indian-institute-of-technology-indore':
    'https://www.iiti.ac.in',

  'national-institute-of-technology-rourkela':
    'https://www.nitrkl.ac.in',

  'national-institute-of-technology-karnataka-surathkal':
    'https://www.nitk.ac.in',

  'indian-institute-of-technology-patna':
    'https://www.iitp.ac.in',

  'national-institute-of-technology-calicut':
    'https://nitc.ac.in',

  'indian-institute-of-technology-mandi':
    'https://www.iitmandi.ac.in',

  'indian-institute-of-technology-jodhpur':
    'https://iitj.ac.in',

  'national-institute-of-technology-warangal':
    'https://www.nitw.ac.in',

  'indian-institute-of-technology-ropar':
    'https://www.iitrpr.ac.in',

  'indian-institute-of-technology-bhubaneswar':
    'https://www.iitbbs.ac.in',

  'malaviya-national-institute-of-technology-jaipur':
    'https://mnit.ac.in',

  'visvesvaraya-national-institute-of-technology-nagpur':
    'https://vnit.ac.in',

  'national-institute-of-technology-durgapur':
    'https://nitdgp.ac.in',

  'national-institute-of-technology-silchar':
    'https://www.nits.ac.in',

  'birla-institute-of-technology-mesra-ranchi':
    'https://www.bitmesra.ac.in',

  'national-institute-of-technology-patna':
    'https://www.nitp.ac.in',

  'indian-institute-of-engineering-science-and-technology-shibpur':
    'https://www.iiests.ac.in',

  'dr-b-r-ambedkar-national-institute-of-technology-jalandhar':
    'https://www.nitj.ac.in',

  'indian-institute-of-technology-jammu':
    'https://iitjammu.ac.in',

  'indian-institute-of-technology-tirupati':
    'https://www.iittp.ac.in',

  'motilal-nehru-national-institute-of-technology-allahabad':
    'https://www.mnnit.ac.in',

  'indian-institute-of-technology-palakkad':
    'https://iitpkd.ac.in',

  'national-institute-of-technology-delhi':
    'https://nitdelhi.ac.in',

  'sardar-vallabhbhai-national-institute-of-technology-surat':
    'https://www.svnit.ac.in',

  'indian-institute-of-technology-bhilai':
    'https://www.iitbhilai.ac.in',

  'national-institute-of-technology-srinagar':
    'https://nitsri.ac.in',

  'university-of-hyderabad':
    'https://uohyd.ac.in',

  'indian-institute-of-technology-dharwad':
    'https://www.iitdh.ac.in',

  'sant-longowal-institute-of-engineering-and-technology':
    'https://sliet.ac.in',

  'maulana-azad-national-institute-of-technology-bhopal':
    'https://www.manit.ac.in',

  'national-institute-of-technology-jamshedpur':
    'https://www.nitjsr.ac.in',

  'national-institute-of-technology-meghalaya':
    'https://www.nitm.ac.in',

  'national-institute-of-technology-kurukshetra':
    'https://nitkkr.ac.in',

  'national-institute-of-technology-raipur':
    'https://nitrr.ac.in',

  'atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior':
    'https://www.iiitm.ac.in',

  'national-institute-of-technology-hamirpur':
    'https://nith.ac.in',

  'national-institute-of-technology-puducherry':
    'https://www.nitpy.ac.in',

  'indian-institute-of-information-technology-guwahati':
    'https://www.iiitg.ac.in',

  'indian-institute-of-information-technology-allahabad':
    'https://www.iiita.ac.in',

  'indian-institute-of-information-technology-design-manufacturing-kancheepuram':
    'https://www.iiitdm.ac.in',

  'indian-institute-of-technology-goa':
    'https://iitgoa.ac.in',

  'international-institute-of-information-technology-naya-raipur':
    'https://www.iiitnr.ac.in',

  'islamic-university-of-science-and-technology-kashmir':
    'https://www.iust.ac.in',

  'national-institute-of-advanced-manufacturing-technology-ranchi':
    'https://niamt.ac.in',

  'national-institute-of-food-technology-entrepreneurship-and-management-kundli':
    'https://niftem.ac.in',

  'national-institute-of-food-technology-entrepreneurship-and-management-thanjavur':
    'https://niftem-t.ac.in',

  'national-institute-of-technology-agartala':
    'https://nita.ac.in',

  'national-institute-of-technology-arunachal-pradesh':
    'https://www.nitap.ac.in',

  'national-institute-of-technology-goa':
    'https://nitgoa.ac.in',

  'national-institute-of-technology-nagaland':
    'https://nitnagaland.ac.in',

  'national-institute-of-technology-sikkim':
    'https://nitsikkim.ac.in',

  'national-institute-of-technology-andhra-pradesh':
    'https://nitandhra.ac.in',

  'national-institute-of-technology-manipur':
    'https://nitmanipur.ac.in',

  'national-institute-of-technology-mizoram':
    'https://www.nitmz.ac.in',

  'national-institute-of-technology-uttarakhand':
    'https://nituk.ac.in',

  'north-eastern-regional-institute-of-science-and-technology-nirjuli-791109-itanagar-arunachal-pradesh':
    'https://nerist.ac.in',

  'pt-dwarka-prasad-mishra-indian-institute-of-information-technology-design-manufacture-jabalpur':
    'https://www.iiitdmj.ac.in',

  'puducherry-technological-university-puducherry':
    'https://www.ptuniv.edu.in',

  'shri-mata-vaishno-devi-university-katra-jammu-kashmir':
    'https://www.smvdu.ac.in'
};

const rows =
  JSON.parse(
    await fs.readFile(
      './college-website-candidates.json',
      'utf8'
    )
  );

let matched = 0;

for (const row of rows) {
  const website =
    websites[row.college_id];

  if (!website) {
    continue;
  }

  row.candidate_url =
    website;

  row.candidate_domain =
    new URL(website).hostname;

  row.confidence =
    'official_domain';

  row.verification_status =
    'verified';

  matched++;
}

await fs.writeFile(
  './college-website-candidates-verified.json',
  JSON.stringify(
    rows,
    null,
    2
  ),
  'utf8'
);

console.log('');
console.log('=======================================');
console.log('OFFICIAL WEBSITE MAPPING');
console.log('=======================================');

console.table([
  {
    status: 'Input missing websites',
    count: rows.length
  },
  {
    status: 'Mapped',
    count: matched
  },
  {
    status: 'Still unresolved',
    count: rows.length - matched
  }
]);

console.log('');
console.log(
  'Saved: ./college-website-candidates-verified.json'
);

console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);