import { pool } from "./src/db/pool.js";

const result =
  await pool.query(`
    SELECT
      c.id,
      c.name,

      COUNT(
        DISTINCT cri.id
      )::int AS review_rows,

      COUNT(
        DISTINCT rs.id
      )::int AS sources,

      STRING_AGG(
        DISTINCT rs.name,
        ', '
        ORDER BY rs.name
      ) AS source_names

    FROM colleges c

    LEFT JOIN college_review_items cri
      ON cri.college_id = c.id

    LEFT JOIN review_sources rs
      ON rs.id = cri.source_id

    WHERE
      LOWER(
        COALESCE(
          c.type,
          ''
        )
      ) = 'nit'

      OR LOWER(c.name)
        LIKE
        '%national institute of technology%'

    GROUP BY
      c.id,
      c.name

    ORDER BY
      review_rows DESC,
      c.name
  `);

console.table(
  result.rows.map(
    row => ({
      id:
        row.id,

      college:
        row.name,

      reviews:
        row.review_rows,

      sources:
        row.sources,

      source_names:
        row.source_names,
    })
  )
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "NIT REVIEW DATABASE AUDIT"
);
console.log(
  "========================================"
);

console.log(
  "NIT colleges:",
  result.rows.length
);

console.log(
  "Total review rows:",
  result.rows.reduce(
    (sum, row) =>
      sum +
      Number(
        row.review_rows ||
        0
      ),
    0
  )
);

console.log(
  "Colleges with reviews:",
  result.rows.filter(
    row =>
      Number(
        row.review_rows
      ) > 0
  ).length
);

console.log(
  "Colleges with >=3 sources:",
  result.rows.filter(
    row =>
      Number(
        row.sources
      ) >= 3
  ).length
);

await pool.end();
