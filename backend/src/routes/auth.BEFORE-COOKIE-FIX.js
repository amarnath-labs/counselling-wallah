import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || "cw_auth";

const COOKIE_DAYS =
  Number(process.env.AUTH_COOKIE_DAYS || 7);

const isProduction =
  process.env.NODE_ENV === "production";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function signToken(user) {
  if (!process.env.AUTH_JWT_SECRET) {
    throw new Error("AUTH_JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    },
    process.env.AUTH_JWT_SECRET,
    {
      expiresIn: `${COOKIE_DAYS}d`,
    }
  );
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: COOKIE_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase();

    const existing = await pool.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (existing.rows.length) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      12
    );

    const result = await pool.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        phone
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        name,
        email,
        phone,
        role,
        created_at
      `,
      [
        input.name,
        email,
        passwordHash,
        input.phone || null,
      ]
    );

    const user = result.rows[0];
    const token = signToken(user);

    setAuthCookie(res, token);

    res.status(201).json({
      data: {
        user,
      },
    });
  } catch (error) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        error: "Invalid registration data",
        details: error.issues,
      });
    }

    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const email = input.email.toLowerCase();

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        password_hash,
        created_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [email]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(
      input.password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    delete user.password_hash;

    const token = signToken(user);

    setAuthCookie(res, token);

    res.json({
      data: {
        user,
      },
    });
  } catch (error) {
    if (error?.name === "ZodError") {
      return res.status(400).json({
        error: "Invalid login data",
      });
    }

    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        role,
        created_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        error: "User account no longer exists",
      });
    }

    res.json({
      data: {
        user: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);

  res.json({
    success: true,
  });
});

export default router;
