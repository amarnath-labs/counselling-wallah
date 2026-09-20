import {
  pool,
} from './src/db/pool.js';


try {
  const result =
    await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE
        table_name = 'career_questions'
        AND column_name IN (
          'scenario',
          'scenario_family'
        )
      ORDER BY column_name
    `);

  console.table(
    result.rows
  );


  const names =
    new Set(
      result.rows.map(
        (row) =>
          row.column_name
      )
    );


  if (
    !names.has('scenario') ||
    !names.has('scenario_family')
  ) {
    throw new Error(
      'scenario/scenario_family DB columns are not both available'
    );
  }


  console.log(
    '\n✅ SCENARIO COLUMNS DATABASE CHECK PASSED'
  );
}
finally {
  await pool.end();
}
