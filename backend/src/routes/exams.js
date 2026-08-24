import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

// GET all exams
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description AS desc, active
       FROM exams
       ORDER BY name`
    );

    // Temporary UPTAC fallback.
    // If UPTAC already exists in DB, don't add it again.
    const hasUptac = rows.some(
      (exam) => exam.id === 'uptac'
    );

    if (!hasUptac) {
      rows.push({
        id: 'uptac',
        name: 'UPTAC',
        desc: 'Uttar Pradesh Technical Admission Counselling for engineering admissions.',
        active: true,
      });
    }

    res.json({
      data: rows,
    });
  } catch (error) {
    next(error);
  }
});

// GET single exam
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description AS desc, active
       FROM exams
       WHERE id = $1`,
      [req.params.id]
    );

    // Temporary UPTAC fallback
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