import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description AS desc, active
       FROM exams ORDER BY name`
    );
    res.json({ data: rows });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description AS desc, active FROM exams WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Exam not found' });
    res.json({ data: rows[0] });
  } catch (error) { next(error); }
});

export default router;
