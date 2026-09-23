import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const r =
    await pool.query(`
      SELECT
        c.id AS college_id,
        c.name AS college,

        ras.aspect,

        COUNT(
          DISTINCT ras.review_item_id
        )::int AS review_items,

        COUNT(
          DISTINCT cri.source_id
        )::int AS sources

      FROM review_aspect_sentiments ras

      JOIN college_review_items cri
        ON cri.id =
           ras.review_item_id

      JOIN colleges c
        ON c.id =
           cri.college_id

      GROUP BY
        c.id,
        c.name,
        ras.aspect

      ORDER BY
        review_items ASC,
        college ASC,
        ras.aspect ASC
    `);

  console.table(
    r.rows
  );
}
finally {
  await pool.end();
}
