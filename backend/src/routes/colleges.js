import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

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
| Optimized college query
|--------------------------------------------------------------------------
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

          'closingRank',
          COALESCE(cutoff2025.closing_rank, 0),

          'openingRank2026',
          cutoff2026r1.opening_rank,

          'closingRank2026',
          cutoff2026r1.closing_rank,

          'round2026',
          cutoff2026latest.round,

          'category2026',
          cutoff2026latest.category,

          'quota2026',
          cutoff2026latest.quota,

          'gender2026',
          cutoff2026latest.gender,

          'source2026',
          cutoff2026latest.source_label,

          'verified2026',
          COALESCE(
            cutoff2026latest.is_verified,
            FALSE
          ),

          'verificationStatus2026',
          cutoff2026latest.verification_status,

          'sourceUrl2026',
          cutoff2026latest.source_url,

          'retrievedAt2026',
          cutoff2026latest.retrieved_at

        )

        ORDER BY b.name

      ) FILTER (WHERE b.id IS NOT NULL),

      '[]'::json
    ) AS branches

  FROM colleges c

  LEFT JOIN branches b
    ON b.college_id = c.id

  LEFT JOIN LATERAL (
    SELECT
      co.closing_rank
    FROM cutoffs co
    WHERE co.branch_id = b.id
      AND co.year = 2025
    ORDER BY co.id DESC
    LIMIT 1
  ) cutoff2025
    ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      co.opening_rank,
      co.closing_rank
    FROM cutoffs co
    WHERE co.branch_id = b.id
      AND co.year = 2026
      AND co.round = '1'
    ORDER BY co.id DESC
    LIMIT 1
  ) cutoff2026r1
    ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      co.round,
      co.category,
      co.quota,
      co.gender,
      co.source_label,
      co.is_verified,
      co.verification_status,
      co.source_url,
      co.retrieved_at
    FROM cutoffs co
    WHERE co.branch_id = b.id
      AND co.year = 2026
    ORDER BY co.id DESC
    LIMIT 1
  ) cutoff2026latest
    ON TRUE
`;

/*
|--------------------------------------------------------------------------
| GET ALL COLLEGES
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res, next) => {
  try {
    const params = [];
    const conditions = [];

    if (req.query.state) {
      params.push(req.query.state);

      conditions.push(
        `c.state ILIKE $${params.length}`
      );
    }

    if (req.query.type) {
      params.push(req.query.type);

      conditions.push(
        `c.type ILIKE $${params.length}`
      );
    }

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

      GROUP BY
        c.id,
        c.name,
        c.city,
        c.state,
        c.type,
        c.established,
        c.website,
        c.portal

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

      GROUP BY
        c.id,
        c.name,
        c.city,
        c.state,
        c.type,
        c.established,
        c.website,
        c.portal
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
*/

router.get("/:id/cutoffs", async (req, res, next) => {
  try {
    const params = [req.params.id];

    let yearCondition = "";

    if (req.query.year) {
      params.push(Number(req.query.year));

      yearCondition =
        `AND co.year = $${params.length}`;
    }

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

export default router;