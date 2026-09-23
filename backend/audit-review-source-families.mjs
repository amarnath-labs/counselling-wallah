import "dotenv/config";
import { pool } from "./src/db/pool.js";

function family(name) {
  const s =
    String(name || "")
      .trim()
      .toLowerCase();

  if (s.includes("shiksha"))
    return "Shiksha";

  if (s.includes("collegedunia"))
    return "Collegedunia";

  if (s.includes("careers360"))
    return "Careers360";

  if (s.includes("quora"))
    return "Quora";

  if (s.includes("getmyuni"))
    return "GetMyUni";

  if (
    s.includes("collegebatch")
  )
    return "CollegeBatch";

  if (
    s.includes("collegedekho")
  )
    return "CollegeDekho";

  if (s.includes("zollege"))
    return "Zollege";

  return name || "Unknown";
}

try {
  const r =
    await pool.query(`
      SELECT
        rs.name AS source,
        COUNT(
          DISTINCT cri.id
        )::int AS review_items
      FROM review_sources rs
      LEFT JOIN college_review_items cri
        ON cri.source_id =
           rs.id
      GROUP BY
        rs.id,
        rs.name
      ORDER BY
        review_items DESC
    `);

  const merged =
    new Map();

  for (
    const row
    of r.rows
  ) {
    const key =
      family(
        row.source
      );

    merged.set(
      key,
      (
        merged.get(key) ||
        0
      ) +
      Number(
        row.review_items ||
        0
      )
    );
  }

  console.log(
    "\n=== CANONICAL SOURCE FAMILIES ==="
  );

  console.table(
    [...merged.entries()]
      .map(
        ([source, review_items]) => ({
          source,
          review_items,
        })
      )
      .sort(
        (a, b) =>
          b.review_items -
          a.review_items
      )
  );
}
finally {
  await pool.end();
}
