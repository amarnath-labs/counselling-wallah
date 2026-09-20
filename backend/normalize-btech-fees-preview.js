import fs from 'node:fs/promises';

const INPUT =
  './btech-fee-detailed-raw.json';

const OUTPUT =
  './btech-fee-auto-normalized-preview.json';

const rows =
  JSON.parse(
    (
      await fs.readFile(
        INPUT,
        'utf8'
      )
    ).replace(/^\uFEFF/, '')
  );

const AUTO_READY = new Set([
  'national-institute-of-technology-delhi',
  'indian-institute-of-technology-mandi',
  'atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior',
  'indian-institute-of-information-technology-allahabad',
  'indian-institute-of-information-technology-design-manufacturing-kancheepuram'
]);

function getContexts(row) {
  return (row.fee_signals || [])
    .map(s => `${s.line || ''} | ${s.context || ''}`)
    .join('\n');
}

function extractFirst(pattern, text) {
  const m = text.match(pattern);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

const output = [];

for (const row of rows) {
  if (!AUTO_READY.has(row.college_id)) {
    continue;
  }

  const text = getContexts(row);

  const normalized = {
    college_id: row.college_id,
    name: row.name,

    program: 'B.Tech',
    fee_scope: 'all_btech_branches',

    resolved_source_url:
      row.resolved_source_url,

    tuition_fee:
      extractFirst(
        /tuition fee[^0-9]{0,30}(\d[\d,]{3,})/i,
        text
      ),

    admission_fee:
      extractFirst(
        /admission fee[^0-9]{0,30}(\d[\d,]{3,})/i,
        text
      ),

    hostel_fee:
      extractFirst(
        /hostel fee[^0-9]{0,30}(\d[\d,]{3,})/i,
        text
      ),

    mess_fee:
      extractFirst(
        /mess fee[^0-9]{0,30}(\d[\d,]{3,})/i,
        text
      ),

    total_fee:
      extractFirst(
        /(?:total fee|grand total|total payable)[^0-9]{0,40}(\d[\d,]{3,})/i,
        text
      ),

    raw_signals:
      row.fee_signals,

    verification_status:
      'pending_review'
  };

  output.push(normalized);
}

await fs.writeFile(
  OUTPUT,
  JSON.stringify(
    output,
    null,
    2
  ),
  'utf8'
);

console.log('');
console.log('=======================================');
console.log('AUTO NORMALIZED BTECH FEE PREVIEW');
console.log('=======================================');

console.table(
  output.map(row => ({
    college: row.name,
    tuition: row.tuition_fee,
    admission: row.admission_fee,
    hostel: row.hostel_fee,
    mess: row.mess_fee,
    total: row.total_fee
  }))
);

console.log('');
console.log(
  'Saved: ./btech-fee-auto-normalized-preview.json'
);

console.log(
  'DATABASE HAS NOT BEEN MODIFIED.'
);
