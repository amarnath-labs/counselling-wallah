import { pool } from './src/db/pool.js';

const targets = [
  {
    id: 'atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior',
    terms: ['gwalior', 'iiitm']
  },
  {
    id: 'indian-institute-of-information-technology-raichur-karnataka',
    terms: ['raichur']
  },
  {
    id: 'institute-of-chemical-technology-mumbai-indian-oil-odisha-campus-bhubaneswar',
    terms: ['chemical', 'odisha', 'bhubaneswar']
  },
  {
    id: 'mnit-jaipur',
    terms: ['malaviya', 'mnit', 'jaipur']
  },
  {
    id: 'pt-dwarka-prasad-mishra-indian-institute-of-information-technology-design-manufacture-jabalpur',
    terms: ['jabalpur', 'design', 'manufacture']
  },
  {
    id: 'rajiv-gandhi-national-aviation-university-fursatganj-amethi',
    terms: ['aviation', 'fursatganj', 'amethi']
  }
];

async function main() {
  console.log('');
  console.log('========================================');
  console.log('CW-REC MANUAL CANONICAL SEARCH V13');
  console.log('========================================');

  for (const target of targets) {

    const conditions = [];
    const values = [];

    for (const term of target.terms) {
      values.push(`%${term}%`);

      conditions.push(`
        (
          LOWER(c.id) LIKE $${values.length}
          OR
          LOWER(c.name) LIKE $${values.length}
        )
      `);
    }

    const result = await pool.query(`
      SELECT
        c.id,
        c.name,

        COUNT(fp.college_id)::int
          AS fee_profiles,

        MAX(fp.fee_year)
          AS latest_fee_year,

        MAX(fp.annual_total_fee)
          AS annual_total_fee,

        MAX(fp.annual_academic_fee)
          AS annual_academic_fee,

        MAX(fp.total_course_fee)
          AS total_course_fee,

        MAX(fp.academic_fee_per_semester)
          AS academic_fee_per_semester,

        MAX(fp.tuition_fee_per_semester)
          AS tuition_fee_per_semester

      FROM colleges c

      LEFT JOIN college_fee_profiles fp
        ON fp.college_id = c.id

      WHERE
        ${conditions.join(' OR ')}

      GROUP BY
        c.id,
        c.name

      ORDER BY
        fee_profiles DESC,
        c.name
    `, values);

    console.log('');
    console.log('TARGET:');
    console.log(target.id);

    console.table(result.rows);
  }

  console.log('');
  console.log('========================================');
  console.log('✅ MANUAL CANONICAL SEARCH COMPLETE');
  console.log('========================================');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
