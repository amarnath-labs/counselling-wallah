import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

const EXAMS_CACHE_TTL_MS =
  10 * 60 * 1000;

let examsCache = null;
let examsInFlight = null;

// ============================================================
// GET ALL EXAMS
// ============================================================

router.get('/', async (_req, res, next) => {
  try {
    if (
      examsCache &&
      examsCache.expiresAt > Date.now()
    ) {
      return res.json(
        examsCache.payload
      );
    }

    if (examsInFlight) {
      const payload =
        await examsInFlight;

      return res.json(payload);
    }

    examsInFlight =
      (async () => {
        const { rows } =
          await pool.query(`
            SELECT
              id,
              name,
              description AS desc,
              active
            FROM exams
            ORDER BY name
          `);

        const hasUptac =
          rows.some(
            (exam) =>
              exam.id === 'uptac'
          );

        if (!hasUptac) {
          rows.push({
            id: 'uptac',
            name: 'UPTAC',
            desc:
              'Uttar Pradesh Technical Admission Counselling for engineering admissions.',
            active: true,
          });
        }

        return {
          data: rows,
        };
      })();

    try {
      const payload =
        await examsInFlight;

      examsCache = {
        payload,
        expiresAt:
          Date.now() +
          EXAMS_CACHE_TTL_MS,
      };

      return res.json(payload);
    } finally {
      examsInFlight = null;
    }
  } catch (error) {
    examsInFlight = null;
    next(error);
  }
});

// ============================================================
// TEMPORARY: DEBUG CUTOFFS
// ============================================================

router.get('/admin/debug-cutoffs', async (_req, res, next) => {
  try {
    const columns = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'cutoffs'
      ORDER BY ordinal_position
    `);

    const count = await pool.query(`
      SELECT
        COUNT(*)::int AS count
      FROM cutoffs
      WHERE LOWER(COALESCE(counselling_type, '')) = 'uptac'
        AND year = 2025
    `);

    res.json({
      success: true,
      columns: columns.rows,
      uptac2025Count: count.rows[0]?.count ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// TEMPORARY: DEBUG BRANCHES
// ============================================================

router.get('/admin/debug-branches', async (_req, res, next) => {
  try {
    const columns = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'branches'
      ORDER BY ordinal_position
    `);

    const sample = await pool.query(`
      SELECT *
      FROM branches
      LIMIT 10
    `);

    res.json({
      success: true,
      columns: columns.rows,
      sample: sample.rows,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET SINGLE EXAM
// ============================================================

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `
        SELECT
          id,
          name,
          description AS desc,
          active
        FROM exams
        WHERE id = $1
      `,
      [req.params.id]
    );

    if (
      req.params.id === 'uptac' &&
      !rows[0]
    ) {
      return res.json({
        data: {
          id: 'uptac',
          name: 'UPTAC',
          desc: 'Uttar Pradesh Technical Admission Counselling for engineering admissions.',
          active: true,
        },
      });
    }

    if (!rows[0]) {
      return res.status(404).json({
        error: 'Exam not found',
      });
    }

    res.json({
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
