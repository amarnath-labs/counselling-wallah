import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Map college response
|--------------------------------------------------------------------------
*/

function mapCollege(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    type: row.type,
    established: row.established,
    website: row.website,
    portal: row.portal,
    branches: row.branches ?? [],
  };
}

/*
|--------------------------------------------------------------------------
| College query
|--------------------------------------------------------------------------
|
| IMPORTANT:
| - 2026 is the current JoSAA dataset
| - Prefer Round 1 2026
| - Return opening + closing rank
| - Return verification/source information
|
*/

const collegeQuery = `
  SELECT
    c.id,
    c.name,
    c.city,
    c.state,
    c.type,
    c.established,
    c.website,
    c.portal,

    COALESCE(
      json_agg(
        json_build_object(

          'name',
          b.name,

          'fees',
          b.fees,

          'median',
          b.median_package,

          'average',
          b.average_package,

          'highest',
          b.highest_package,

          'placement',
          b.placement_rate,

          /*
          |--------------------------------------------------------------------------
          | 2025 fallback fields
          |--------------------------------------------------------------------------
          */

          'closingRank',
          COALESCE(
            (
              SELECT co.closing_rank
              FROM cutoffs co
              WHERE co.branch_id = b.id
                AND co.year = 2025
              ORDER BY co.id DESC
              LIMIT 1
            ),
            0
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 opening rank
          |--------------------------------------------------------------------------
          */

          'openingRank2026',
          (
            SELECT co.opening_rank
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
              AND co.round = '1'
            ORDER BY co.id DESC
            LIMIT 1
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 closing rank
          |--------------------------------------------------------------------------
          */

          'closingRank2026',
          (
            SELECT co.closing_rank
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
              AND co.round = '1'
            ORDER BY co.id DESC
            LIMIT 1
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 round
          |--------------------------------------------------------------------------
          */

          'round2026',
          (
            SELECT co.round
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 category
          |--------------------------------------------------------------------------
          */

          'category2026',
          (
            SELECT co.category
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 quota
          |--------------------------------------------------------------------------
          */

          'quota2026',
          (
            SELECT co.quota
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 gender
          |--------------------------------------------------------------------------
          */

          'gender2026',
          (
            SELECT co.gender
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 source
          |--------------------------------------------------------------------------
          */

          'source2026',
          (
            SELECT co.source_label
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 verification
          |--------------------------------------------------------------------------
          */

          'verified2026',
          COALESCE(
            (
              SELECT co.is_verified
              FROM cutoffs co
              WHERE co.branch_id = b.id
                AND co.year = 2026
              ORDER BY co.id DESC
              LIMIT 1
            ),
            FALSE
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 verification status
          |--------------------------------------------------------------------------
          */

          'verificationStatus2026',
          (
            SELECT co.verification_status
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 source URL
          |--------------------------------------------------------------------------
          */

          'sourceUrl2026',
          (
            SELECT co.source_url
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          ),

          /*
          |--------------------------------------------------------------------------
          | 2026 retrieved timestamp
          |--------------------------------------------------------------------------
          */

          'retrievedAt2026',
          (
            SELECT co.retrieved_at
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          )

        )

        ORDER BY b.name

      ) FILTER (WHERE b.id IS NOT NULL),

      '[]'::json
    ) AS branches

  FROM colleges c

  LEFT JOIN branches b
    ON b.college_id = c.id
`;

/*
|--------------------------------------------------------------------------
| GET ALL COLLEGES
|--------------------------------------------------------------------------
|
| Examples:
|
| /api/colleges
| /api/colleges?q=Gandhinagar
| /api/colleges?state=Gujarat
| /api/colleges?type=IIT
|
*/

router.get("/", async (req, res, next) => {
  try {
    const params = [];
    const conditions = [];

    /*
    |--------------------------------------------------------------------------
    | State filter
    |--------------------------------------------------------------------------
    */

    if (req.query.state) {
      params.push(req.query.state);

      conditions.push(
        `c.state ILIKE $${params.length}`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Type filter
    |--------------------------------------------------------------------------
    */

    if (req.query.type) {
      params.push(req.query.type);

      conditions.push(
        `c.type ILIKE $${params.length}`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    if (req.query.q) {
      params.push(
        `%${req.query.q.trim()}%`
      );

      conditions.push(
        `(
          c.name ILIKE $${params.length}
          OR c.city ILIKE $${params.length}
          OR c.state ILIKE $${params.length}
        )`
      );
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows } = await pool.query(
      `
      ${collegeQuery}

      ${where}

      GROUP BY c.id

      ORDER BY c.name
      `,
      params
    );

    res.json({
      data: rows.map(mapCollege),
    });

  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| GET SINGLE COLLEGE
|--------------------------------------------------------------------------
*/

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
      ${collegeQuery}

      WHERE c.id = $1

      GROUP BY c.id
      `,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: "College not found",
      });
    }

    res.json({
      data: mapCollege(rows[0]),
    });

  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| GET COLLEGE CUTOFFS
|--------------------------------------------------------------------------
|
| Example:
|
| /api/colleges/indian-institute-of-technology-gandhinagar/cutoffs
|
| Returns complete 2026 + previous-year cutoff data.
|
*/

router.get("/:id/cutoffs", async (req, res, next) => {
  try {

    const params = [req.params.id];

    let yearCondition = "";

    /*
    |--------------------------------------------------------------------------
    | Optional year filter
    |--------------------------------------------------------------------------
    |
    | /cutoffs?year=2026
    |
    */

    if (req.query.year) {
      params.push(Number(req.query.year));

      yearCondition =
        `AND co.year = $${params.length}`;
    }

    /*
    |--------------------------------------------------------------------------
    | Optional round filter
    |--------------------------------------------------------------------------
    |
    | /cutoffs?year=2026&round=1
    |
    */

    let roundCondition = "";

    if (req.query.round) {
      params.push(req.query.round);

      roundCondition =
        `AND co.round = $${params.length}`;
    }

    const { rows } = await pool.query(
      `
      SELECT

        b.id AS branch_id,

        b.name AS branch,

        co.year,

        co.round,

        co.category,

        co.quota,

        co.gender,

        co.opening_rank AS "openingRank",

        co.closing_rank AS "closingRank",

        co.source_label AS source,

        co.is_verified AS "isVerified",

        co.verification_status AS "verificationStatus",

        co.source_url AS "sourceUrl",

        co.retrieved_at AS "retrievedAt",

        co.counselling_type AS "counsellingType"

      FROM branches b

      JOIN cutoffs co
        ON co.branch_id = b.id

      WHERE b.college_id = $1

        ${yearCondition}

        ${roundCondition}

      ORDER BY

        co.year DESC,

        CASE
          WHEN co.round ~ '^[0-9]+$'
          THEN CAST(co.round AS INTEGER)
          ELSE 999
        END DESC,

        b.name,

        co.category,

        co.quota,

        co.gender
      `,
      params
    );

    res.json({
      data: rows,
    });

  } catch (error) {
    next(error);
  }
});

/*
|--------------------------------------------------------------------------
| Export router
|--------------------------------------------------------------------------
*/

export default router;