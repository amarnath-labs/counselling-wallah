import { pool } from './src/db/pool.js';

const TARGETS = [
  'KIET GROUP OF INSTITUTIONS(KRISHNA INSTT. OF ENGG. & TECHNOLOGY),GHAZIABAD',
  'NOIDA INSTITUTE OF ENGG. & TECHNOLOGY,GAUTAM BUDDH NAGAR',
  'GREATER NOIDA INSTITUTE OF TECHNOLOGY,GAUTAM BUDDH NAGAR',
  'Dr. Rammanohar Lohia Avadh University, Faizabad',
  'Baba Shaheb (Dr.) B R Ambedkar College of Agricultural Engineering and Technology, Etawah (CSAUAT)',
  'Maharaja Suhel Dev State University Azamgarh.',
  'SHAMBHU NATH INSTITUTE OF ENGG. & TECHNOLGY,ALLAHABAD',
  'B.B.S.COLLEGE OF ENGGINERING AND TECHNOLOGY,ALLAHABAD',
  'UNITED COLLEGE OF ENGIINEERING & RESEARCH,GREATER NOIDA,GAUTAM BUDDH NAGAR',
  'KUNWAR SATYA VEERA COLLEGE OF ENGG. & MANAGEMENT,BIJNAUR',
  'MANGALMAY INSTITUTE OF MANAGEMENT AND TECHNOLOGY, GAUTAM BUDDHA NAGAR',
  'INDIAN INSTITUTE OF HANDLOOM TECHNOLOGY,VARANASI',
  'MANGALMAY INSTITUTE OF ENGINEERING AND TECHNOLOGY ,GAUTAM BUDDHA NAGAR'
];

function clean(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function norm(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bengg\b/g, 'engineering')
    .replace(/\bengginering\b/g, 'engineering')
    .replace(/\bengiineering\b/g, 'engineering')
    .replace(/\btechnolgy\b/g, 'technology')
    .replace(/\binstt\b/g, 'institute')
    .replace(/\binst\b/g, 'institute')
    .replace(/\bdr\b/g, 'doctor')
    .replace(/\bnoida\b/g, 'noida')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return new Set(
    norm(value)
      .split(' ')
      .filter(Boolean)
      .filter(token => token.length > 1)
  );
}

function jaccard(a, b) {
  const A = tokens(a);
  const B = tokens(b);

  if (!A.size || !B.size) {
    return 0;
  }

  let intersection = 0;

  for (const token of A) {
    if (B.has(token)) {
      intersection++;
    }
  }

  const union =
    new Set([
      ...A,
      ...B
    ]).size;

  return union
    ? intersection / union
    : 0;
}

function containment(a, b) {
  const A = tokens(a);
  const B = tokens(b);

  if (!A.size || !B.size) {
    return 0;
  }

  let common = 0;

  for (const token of A) {
    if (B.has(token)) {
      common++;
    }
  }

  return common / Math.min(
    A.size,
    B.size
  );
}

function score(a, b) {
  const na = norm(a);
  const nb = norm(b);

  if (na === nb) {
    return 1;
  }

  if (
    na.includes(nb) ||
    nb.includes(na)
  ) {
    return 0.98;
  }

  return (
    jaccard(a, b) * 0.70 +
    containment(a, b) * 0.30
  );
}

async function main() {
  const result = await pool.query(`
    SELECT
      id,
      name,
      city,
      state,
      type
    FROM colleges
    ORDER BY name
  `);

  const colleges =
    result.rows;

  console.log(
    '\n========================================'
  );

  console.log(
    'CW-REC COLLEGE ALIAS AUDIT'
  );

  console.log(
    '========================================'
  );

  for (const target of TARGETS) {
    const ranked =
      colleges
        .map(college => ({
          ...college,
          similarity:
            score(
              target,
              college.name
            )
        }))
        .sort(
          (a, b) =>
            b.similarity -
            a.similarity
        )
        .slice(
          0,
          6
        );

    console.log(
      '\n----------------------------------------'
    );

    console.log(
      'OFFICIAL:',
      target
    );

    console.table(
      ranked.map(row => ({
        similarity:
          Number(
            (
              row.similarity *
              100
            ).toFixed(2)
          ),

        id:
          row.id,

        dbName:
          row.name,

        city:
          row.city,

        state:
          row.state,

        type:
          row.type
      }))
    );
  }
}

main()
  .catch(error => {
    console.error(
      '\nALIAS AUDIT ERROR:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
