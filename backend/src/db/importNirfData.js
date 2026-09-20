import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import { pool } from './pool.js';
import { findCollegeMatch } from './collegeNameMatcher.js';


async function loadJson(filePath) {
  const absolutePath =
    path.resolve(
      process.cwd(),
      filePath
    );

  let raw =
    await fs.readFile(
      absolutePath,
      'utf8'
    );

  // Remove UTF-8 BOM if present
  raw = raw.replace(
    /^\uFEFF/,
    ''
  );

  return JSON.parse(raw);
}


async function main() {
  const inputFile =
    process.argv[2];

  if (!inputFile) {
    console.error(
      'Usage: node src/db/importNirfData.js <json-file>'
    );

    process.exit(1);
  }

  console.log(
    '[NIRF IMPORT] Input:',
    inputFile
  );


  // ----------------------------------------------------------
  // LOAD INPUT DATA
  // ----------------------------------------------------------

  const rows =
    await loadJson(
      inputFile
    );

  if (!Array.isArray(rows)) {
    throw new Error(
      'NIRF JSON must contain an array.'
    );
  }

  console.log(
    '[NIRF IMPORT] Source rows:',
    rows.length
  );


  // ----------------------------------------------------------
  // LOAD COUNSELLING WALLAH COLLEGES
  // ----------------------------------------------------------

  const collegeResult =
    await pool.query(`
      SELECT
        id,
        name,
        city,
        state
      FROM colleges
      ORDER BY name
    `);

  const colleges =
    collegeResult.rows;

  console.log(
    '[NIRF IMPORT] Colleges in database:',
    colleges.length
  );


  // ----------------------------------------------------------
  // MATCH FIRST - DO NOT INSERT YET
  // ----------------------------------------------------------

  const matched =
    [];

  const unmatched =
    [];


  for (const row of rows) {
    const sourceName =
      String(
        row?.college_name || ''
      ).trim();

    if (!sourceName) {
      unmatched.push({
        ...row,
        reason:
          'missing_college_name',
      });

      continue;
    }


    const result =
      findCollegeMatch(
        sourceName,
        colleges
      );


    if (!result.college) {
      unmatched.push({
        ...row,

        match_score:
          Number(
            result.score || 0
          ),

        reason:
          'no_safe_match',
      });

      continue;
    }


    matched.push({
      source:
        row,

      college:
        result.college,

      matchScore:
        result.score,

      matchType:
        result.matchType,
    });
  }


  // ----------------------------------------------------------
  // DISPLAY MATCH SUMMARY
  // ----------------------------------------------------------

  console.log('');
  console.log(
    '---------------------------------------'
  );

  console.log(
    'NIRF MATCH SUMMARY'
  );

  console.log(
    '---------------------------------------'
  );

  console.log(
    'Source rows:',
    rows.length
  );

  console.log(
    'Matched:',
    matched.length
  );

  console.log(
    'Unmatched:',
    unmatched.length
  );


  // ----------------------------------------------------------
  // DISPLAY MATCHES
  // ----------------------------------------------------------

  if (matched.length > 0) {
    console.log('');
    console.log(
      'MATCHED COLLEGES'
    );

    console.table(
      matched
        .slice(
          0,
          30
        )
        .map(
          (item) => ({
            source_name:
              item.source.college_name,

            database_name:
              item.college.name,

            college_id:
              item.college.id,

            match_type:
              item.matchType,

            confidence:
              Number(
                item.matchScore
              ).toFixed(3),

            nirf_rank:
              item.source.nirf_rank,

            nirf_score:
              item.source.nirf_score,
          })
        )
    );
  }


  // ----------------------------------------------------------
  // WRITE UNMATCHED REPORT
  // ----------------------------------------------------------

  const reportPath =
    path.resolve(
      process.cwd(),
      'nirf-unmatched.json'
    );


  await fs.writeFile(
    reportPath,

    JSON.stringify(
      unmatched,
      null,
      2
    ),

    'utf8'
  );


  console.log('');
  console.log(
    '[NIRF IMPORT] Unmatched report:',
    reportPath
  );


  // ----------------------------------------------------------
  // DATABASE TRANSACTION
  // ----------------------------------------------------------

  const client =
    await pool.connect();

  let inserted =
    0;


  try {
    await client.query(
      'BEGIN'
    );


    for (const item of matched) {
      const row =
        item.source;

      const collegeId =
        item.college.id;


      await client.query(
        `
        INSERT INTO college_quality_metrics (
          college_id,
          nirf_rank,
          nirf_score,
          academic_year,
          source_label,
          source_url,
          verification_status,
          retrieved_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          NOW()
        )
        `,
        [
          collegeId,

          row.nirf_rank ??
            null,

          row.nirf_score ??
            null,

          row.academic_year ??
            null,

          row.source_label ??
            'NIRF',

          row.source_url ??
            null,

          row.verification_status ??
            'pending',
        ]
      );


      inserted++;
    }


    await client.query(
      'COMMIT'
    );


    console.log('');
    console.log(
      'NIRF import complete.'
    );

    console.log(
      'Quality rows inserted:',
      inserted
    );

    console.log(
      'Unmatched rows:',
      unmatched.length
    );

  } catch (error) {
    await client.query(
      'ROLLBACK'
    );

    throw error;

  } finally {
    client.release();
    await pool.end();
  }
}


main().catch(
  async (error) => {
    console.error(
      '[NIRF IMPORT] FAILED:',
      error.message
    );

    try {
      await pool.end();
    } catch {
      // ignore shutdown error
    }

    process.exitCode = 1;
  }
);