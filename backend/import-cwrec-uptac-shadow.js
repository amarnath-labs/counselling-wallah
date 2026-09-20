import fs from 'node:fs/promises';
import * as cheerio from 'cheerio';
import { pool } from './src/db/pool.js';
import {
  getCWRecUptacCollegeAlias2025
} from './src/services/cwRecUptacCollegeAliasesV1.js';

const FILE = new URL(
  './uptac-2025.html',
  import.meta.url
);

function clean(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function norm(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRank(value) {
  const text =
    clean(value)
      .replace(/,/g, '');

  const match =
    text.match(/\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  return Math.round(
    Number(match[0])
  );
}

function getHeaderMap(headers) {
  const map = {};

  headers.forEach((header, index) => {
    const h =
      clean(header)
        .toLowerCase();

    if (h.includes('round')) {
      map.round = index;
    } else if (h.includes('institute')) {
      map.institute = index;
    } else if (h.includes('program')) {
      map.program = index;
    } else if (h.includes('quota')) {
      map.quota = index;
    } else if (h.includes('category')) {
      map.category = index;
    } else if (
      h.includes('seat gender') ||
      h.includes('gender')
    ) {
      map.gender = index;
    } else if (h.includes('opening rank')) {
      map.opening = index;
    } else if (h.includes('closing rank')) {
      map.closing = index;
    }
  });

  return map;
}

function parseRows(html) {
  const $ =
    cheerio.load(html);

  const rows = [];

  $('table').each((_, table) => {
    const trs =
      $(table).find('tr');

    if (!trs.length) {
      return;
    }

    const headers =
      trs
        .first()
        .find('th,td')
        .map(
          (_, cell) =>
            clean($(cell).text())
        )
        .get();

    const map =
      getHeaderMap(headers);

    if (
      map.round === undefined ||
      map.institute === undefined ||
      map.program === undefined ||
      map.category === undefined ||
      map.opening === undefined ||
      map.closing === undefined
    ) {
      return;
    }

    trs.slice(1).each((_, tr) => {
      const cells =
        $(tr)
          .find('td')
          .map(
            (_, cell) =>
              clean($(cell).text())
          )
          .get();

      if (!cells.length) {
        return;
      }

      const row = {
        round:
          clean(cells[map.round]),

        institute:
          clean(cells[map.institute]),

        program:
          clean(cells[map.program]),

        category:
          clean(cells[map.category]),

        quota:
          map.quota === undefined
            ? ''
            : clean(cells[map.quota]),

        gender:
          map.gender === undefined
            ? ''
            : clean(cells[map.gender]),

        opening_rank:
          parseRank(cells[map.opening]),

        closing_rank:
          parseRank(cells[map.closing]),
      };

      if (
        !row.institute ||
        !row.program ||
        !row.round ||
        !row.closing_rank
      ) {
        return;
      }

      rows.push(row);
    });
  });

  return rows;
}

async function main() {
  const html =
    await fs.readFile(
      FILE,
      'utf8'
    );

  const rows =
    parseRows(html);

  if (rows.length !== 10804) {
    throw new Error(
      `Expected 10804 source rows, got ${rows.length}`
    );
  }

  const client =
    await pool.connect();

  try {
    await client.query('BEGIN');

    const colleges =
      await client.query(`
        SELECT
          id,
          name
        FROM colleges
      `);

    const branches =
      await client.query(`
        SELECT
          id,
          college_id,
          name
        FROM branches
      `);

    const collegeMap =
      new Map();

    for (const college of colleges.rows) {
      collegeMap.set(
        norm(college.name),
        college
      );
    }

    const branchMap =
      new Map();

    for (const branch of branches.rows) {
      branchMap.set(
        `${branch.college_id}::${norm(branch.name)}`,
        branch
      );
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS cw_rec_uptac_cutoffs_2025 (
        id BIGSERIAL PRIMARY KEY,
        college_id TEXT NOT NULL,
        branch_id BIGINT NOT NULL,
        year INTEGER NOT NULL,
        round TEXT NOT NULL,
        category TEXT NOT NULL,
        quota TEXT,
        gender TEXT,
        opening_rank INTEGER,
        closing_rank INTEGER NOT NULL,
        official_college_name TEXT NOT NULL,
        official_branch_name TEXT NOT NULL,
        source_label TEXT NOT NULL,
        source_url TEXT,
        is_verified BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS
        idx_cw_rec_uptac_2025_lookup
      ON cw_rec_uptac_cutoffs_2025 (
        year,
        round,
        category,
        quota,
        gender,
        closing_rank
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS
        idx_cw_rec_uptac_2025_branch
      ON cw_rec_uptac_cutoffs_2025 (
        branch_id
      )
    `);

    await client.query(`
      DELETE FROM cw_rec_uptac_cutoffs_2025
    `);

    const prepared = [];

    for (const row of rows) {
      let college =
        collegeMap.get(
          norm(row.institute)
        );

      if (!college) {
        const aliasId =
          getCWRecUptacCollegeAlias2025(
            row.institute
          );

        if (aliasId) {
          college =
            colleges.rows.find(
              item =>
                String(item.id) ===
                String(aliasId)
            );
        }
      }

      if (!college) {
        throw new Error(
          `College mapping failed: ${row.institute}`
        );
      }

      const branch =
        branchMap.get(
          `${college.id}::${norm(row.program)}`
        );

      if (!branch) {
        throw new Error(
          `Branch mapping failed: ${row.institute} || ${row.program}`
        );
      }

      prepared.push({
        ...row,
        college_id:
          college.id,
        branch_id:
          branch.id,
      });
    }

    const BATCH_SIZE = 300;

    let inserted = 0;

    for (
      let i = 0;
      i < prepared.length;
      i += BATCH_SIZE
    ) {
      const batch =
        prepared.slice(
          i,
          i + BATCH_SIZE
        );

      const values = [];

      const placeholders = [];

      let p = 1;

      for (const row of batch) {
        placeholders.push(`
          (
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            $${p++},
            TRUE
          )
        `);

        values.push(
          row.college_id,
          row.branch_id,
          2025,
          row.round.replace(/^Round\s+/i, ''),
          row.category,
          row.quota,
          row.gender,
          row.opening_rank,
          row.closing_rank,
          row.institute,
          row.program,
          'Official UPTAC B.Tech OR-CR 2025',
          'https://uptac.admissions.nic.in/document/b-tech-opening-and-closing-ranks-2025/'
        );
      }

      await client.query(
        `
        INSERT INTO cw_rec_uptac_cutoffs_2025 (
          college_id,
          branch_id,
          year,
          round,
          category,
          quota,
          gender,
          opening_rank,
          closing_rank,
          official_college_name,
          official_branch_name,
          source_label,
          source_url,
          is_verified
        )
        VALUES
          ${placeholders.join(',')}
        `,
        values
      );

      inserted +=
        batch.length;

      console.log(
        `Inserted ${inserted}/${prepared.length}`
      );
    }

    const verify =
      await client.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (
            WHERE gender =
              'Both Male and Female Seats'
          )::int AS both_gender,
          COUNT(*) FILTER (
            WHERE gender =
              'Female Seats'
          )::int AS female_only,
          COUNT(*) FILTER (
            WHERE quota =
              'Home State'
          )::int AS home_state,
          COUNT(*) FILTER (
            WHERE quota =
              'All India'
          )::int AS all_india
        FROM cw_rec_uptac_cutoffs_2025
      `);

    console.table(
      verify.rows
    );

    const v =
      verify.rows[0];

    if (
      v.total !== 10804 ||
      v.both_gender !== 7795 ||
      v.female_only !== 3009 ||
      v.home_state !== 9138 ||
      v.all_india !== 1666
    ) {
      throw new Error(
        'Shadow table verification failed'
      );
    }

    await client.query('COMMIT');

    console.log(
      '\n✅ CW-REC UPTAC SHADOW IMPORT SUCCESS'
    );

    console.log(
      'Shared cutoffs table was NOT modified.'
    );
  } catch (error) {
    await client.query('ROLLBACK');

    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch(error => {
    console.error(
      '\nSHADOW IMPORT FAILED:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
