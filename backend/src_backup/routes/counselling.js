import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/events', async (req, res, next) => {
  try {
    const params = [];
    let query = `SELECT name, event_date_text AS date, status, is_demo AS "isDemo" FROM counselling_events`;
    if (req.query.examId) {
      params.push(req.query.examId);
      query += ` WHERE exam_id = $1`;
    }
    query += ' ORDER BY id';
    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (error) { next(error); }
});

export default router;
