import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const {
      email = null,
      page = null,
      category = 'feedback',
      message,
    } = req.body || {};

    const cleanMessage =
      String(message || '').trim();

    if (!cleanMessage) {
      return res.status(400).json({
        error: 'Feedback message is required',
      });
    }

    if (cleanMessage.length > 3000) {
      return res.status(400).json({
        error: 'Feedback message is too long',
      });
    }

    const allowedCategories =
      new Set([
        'feedback',
        'bug',
        'recommendation',
        'payment',
        'ui',
      ]);

    const cleanCategory =
      String(category || 'feedback')
        .trim()
        .toLowerCase();

    const finalCategory =
      allowedCategories.has(
        cleanCategory
      )
        ? cleanCategory
        : 'feedback';

    const cleanEmail =
      email
        ? String(email)
            .trim()
            .toLowerCase()
        : null;

    const cleanPage =
      page
        ? String(page)
            .trim()
            .slice(0, 500)
        : null;

    const userId =
      req.user?.id
        ? String(req.user.id)
        : null;

    const result =
      await pool.query(
        `
        INSERT INTO beta_feedback (
          user_id,
          email,
          page,
          category,
          message
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          status,
          created_at
        `,
        [
          userId,
          cleanEmail,
          cleanPage,
          finalCategory,
          cleanMessage,
        ]
      );

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
