import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  console.log(
    "\n=== REVIEW SOURCES ==="
  );

  const sources =
    await pool.query(`
      SELECT
        id,
        name,
        source_type
      FROM review_sources
      ORDER BY name
    `);

  console.table(
    sources.rows
  );


  console.log(
    "\n=== REVIEW ITEMS PER SOURCE ==="
  );

  const counts =
    await pool.query(`
      SELECT
        rs.name AS source,
        COUNT(cri.id)::int AS review_items
      FROM review_sources rs
      LEFT JOIN college_review_items cri
        ON cri.source_id = rs.id
      GROUP BY
        rs.id,
        rs.name
      ORDER BY
        review_items DESC,
        rs.name
    `);

  console.table(
    counts.rows
  );


  console.log(
    "\n=== ASPECT EVIDENCE COUNTS ==="
  );

  const aspects =
    await pool.query(`
      SELECT
        ras.aspect,
        COUNT(DISTINCT ras.review_item_id)::int
          AS review_items,
        COUNT(DISTINCT cri.source_id)::int
          AS sources
      FROM review_aspect_sentiments ras
      LEFT JOIN college_review_items cri
        ON cri.id =
           ras.review_item_id
      GROUP BY
        ras.aspect
      ORDER BY
        review_items DESC
    `);

  console.table(
    aspects.rows
  );
}
finally {
  await pool.end();
}
