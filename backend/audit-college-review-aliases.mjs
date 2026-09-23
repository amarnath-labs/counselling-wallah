import "dotenv/config";
import { pool } from "./src/db/pool.js";

function normalizeCollegeName(name) {
  let s =
    String(name || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  /*
  |--------------------------------------------------------------------------
  | NIT normalization
  |--------------------------------------------------------------------------
  */

  s =
    s.replace(
      /^nit\s+/,
      "national institute of technology "
    );

  s =
    s.replace(
      /^national institute technology\s+/,
      "national institute of technology "
    );

  /*
  |--------------------------------------------------------------------------
  | Common punctuation/location cleanup
  |--------------------------------------------------------------------------
  */

  s =
    s.replace(
      /\bthe\b/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

  return s;
}


try {
  const colleges =
    await pool.query(`
      SELECT
        c.id,
        c.name,

        COUNT(
          DISTINCT cri.id
        )::int AS review_items

      FROM colleges c

      LEFT JOIN college_review_items cri
        ON cri.college_id =
           c.id

      GROUP BY
        c.id,
        c.name

      ORDER BY
        c.name
    `);


  const groups =
    new Map();


  for (
    const row
    of colleges.rows
  ) {
    const normalized =
      normalizeCollegeName(
        row.name
      );

    if (
      !groups.has(
        normalized
      )
    ) {
      groups.set(
        normalized,
        []
      );
    }

    groups.get(
      normalized
    ).push({
      id:
        row.id,

      name:
        row.name,

      reviews:
        Number(
          row.review_items ||
          0
        ),
    });
  }


  const duplicates =
    [...groups.entries()]
      .filter(
        ([, rows]) =>
          rows.length >
          1
      )
      .map(
        ([
          normalized,
          rows,
        ]) => ({
          normalized,
          records:
            rows.length,

          total_reviews:
            rows.reduce(
              (
                total,
                row
              ) =>
                total +
                row.reviews,
              0
            ),

          rows,
        })
      )
      .sort(
        (a, b) =>
          b.total_reviews -
          a.total_reviews
      );


  console.log(
    "\n========================================"
  );

  console.log(
    "TRUMARG COLLEGE ALIAS REVIEW AUDIT"
  );

  console.log(
    "========================================"
  );


  console.log(
    "\nPotential duplicate college identities:",
    duplicates.length
  );


  for (
    const group
    of duplicates
  ) {
    console.log(
      "\n----------------------------------------"
    );

    console.log(
      "NORMALIZED:",
      group.normalized
    );

    console.log(
      "TOTAL REVIEWS:",
      group.total_reviews
    );

    console.table(
      group.rows
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Explicit NIT audit
  |--------------------------------------------------------------------------
  */

  console.log(
    "\n========================================"
  );

  console.log(
    "NIT ALIAS CHECK"
  );

  console.log(
    "========================================"
  );


  const nitRows =
    colleges.rows
      .filter(
        row => {
          const n =
            String(
              row.name ||
              ""
            )
              .toLowerCase();

          return (
            n.startsWith(
              "nit "
            ) ||
            n.includes(
              "national institute of technology"
            )
          );
        }
      )
      .map(
        row => ({
          id:
            row.id,

          name:
            row.name,

          normalized:
            normalizeCollegeName(
              row.name
            ),

          reviews:
            Number(
              row.review_items ||
              0
            ),
        })
      )
      .sort(
        (a, b) =>
          a.normalized.localeCompare(
            b.normalized
          )
      );


  console.table(
    nitRows
  );
}
finally {
  await pool.end();
}
