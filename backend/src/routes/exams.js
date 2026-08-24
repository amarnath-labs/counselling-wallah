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

    res.json({ data: rows });
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

    if (!rows[0]) {
      return res.status(404).json({
        error: 'Exam not found'
      });
    }

    res.json({ data: rows[0] });
  } catch (error) {
    next(error);
  }
});

// TEMPORARY: Add UPTAC to production database
router.post('/admin/add-uptac', async (_req, res, next) => {
  try {
    await pool.query(`
      INSERT INTO exams (
        id,
        name,
        description,
        active
      )
      VALUES (
        'uptac',
        'UPTAC',
        'Uttar Pradesh Technical Admission Counselling for engineering admissions.',
        TRUE
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        active = EXCLUDED.active,
        updated_at = NOW()
    `);

    res.json({
      success: true,
      message: 'UPTAC added successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;