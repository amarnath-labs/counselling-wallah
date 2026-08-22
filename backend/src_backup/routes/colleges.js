import { Router } from 'express';
import { pool } from '../db/pool.js';

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
          'name', b.name,
          'fees', b.fees,
          'median', b.median_package,
          'average', b.average_package,
          'highest', b.highest_package,
          'placement', b.placement_rate,

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

          'closingRank2026',
          (
            SELECT co.closing_rank
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          ),

          'round',
          (
            SELECT co.round
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2025
            ORDER BY co.id DESC
            LIMIT 1
          ),

          'round2026',
          (
            SELECT co.round
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2026
            ORDER BY co.id DESC
            LIMIT 1
          ),

          'source',
          (
            SELECT co.source_label
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2025
            ORDER BY co.id DESC
            LIMIT 1
          ),

          'sourced',
          COALESCE(
            (
              SELECT co.is_verified
              FROM cutoffs co
              WHERE co.branch_id = b.id
                AND co.year = 2025
              ORDER BY co.id DESC
              LIMIT 1
            ),
            FALSE
          ),

          'verificationStatus',
          (
            SELECT co.verification_status
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2025
            ORDER BY co.id DESC
            LIMIT 1
          ),

          'sourceUrl',
          (
            SELECT co.source_url
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2025
            ORDER BY co.id DESC
            LIMIT 1
          ),

          'retrievedAt',
          (
            SELECT co.retrieved_at
            FROM cutoffs co
            WHERE co.branch_id = b.id
              AND co.year = 2025
            ORDER BY co.id DESC
            LIMIT 1
          )
        )
        ORDER BY b.name
      ) FILTER (WHERE b.id IS NOT NULL),
      '[]'::json
    ) AS branches

  FROM colleges c
  LEFT JOIN branches b ON b.college_id = c.id
`;

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    const conditions = [];

    if (req.query.state) {
      params.push(req.query.state);
      conditions.push(`c.state = $${params.length}`);
    }

    if (req.query.type) {
      params.push(req.query.type);
      conditions.push(`c.type = $${params.length}`);
    }

    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      conditions.push(`c.name ILIKE $${params.length}`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const { rows } = await pool.query(
      `${collegeQuery}
       ${where}
       GROUP BY c.id
       ORDER BY c.name`,
      params
    );

    res.json({ data: rows.map(mapCollege) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${collegeQuery}
       WHERE c.id = $1
       GROUP BY c.id`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: 'College not found',
      });
    }

    res.json({ data: mapCollege(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/cutoffs', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
          b.name AS branch,
          co.year,
          co.round,
          co.category,
          co.quota,
          co.gender,
          co.closing_rank AS "closingRank",
          co.source_label AS source,
          co.is_verified AS "isVerified",
          co.verification_status AS "verificationStatus",
          co.source_url AS "sourceUrl",
          co.retrieved_at AS "retrievedAt"
       FROM branches b
       JOIN cutoffs co ON co.branch_id = b.id
       WHERE b.college_id = $1
       ORDER BY b.name, co.year DESC, co.id`,
      [req.params.id]
    );

    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

export default router;