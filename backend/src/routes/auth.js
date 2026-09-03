import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || "cw_auth";

const COOKIE_DAYS =
  Number(process.env.AUTH_COOKIE_DAYS || 7);

const isProduction =
  process.env.NODE_ENV === "production";


/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  email: z
    .string()
    .trim()
    .email()
    .max(255),

  password: z
    .string()
    .min(8)
    .max(128),

  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
});


const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email(),

  password: z
    .string()
    .min(1),
});


/*
|--------------------------------------------------------------------------
| JWT
|--------------------------------------------------------------------------
*/

function signToken(user) {
  const secret =
    process.env.AUTH_JWT_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_JWT_SECRET is not configured"
    );
  }

  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role || "user",
    },
    secret,
    {
      expiresIn:
        `${COOKIE_DAYS}d`,
    }
  );
}


/*
|--------------------------------------------------------------------------
| AUTH COOKIE
|--------------------------------------------------------------------------
|
| Production:
|
| Frontend:
| https://counselling-wallah-frontend.vercel.app
|
| Backend:
| https://counsellingwallah-backend.onrender.com
|
| They are cross-site, therefore:
|
| SameSite=None
| Secure=true
|
|--------------------------------------------------------------------------
*/

function getCookieOptions() {
  if (isProduction) {
    return {
      httpOnly: true,

      secure: true,

      sameSite: "none",

      path: "/",

      maxAge:
        COOKIE_DAYS *
        24 *
        60 *
        60 *
        1000,
    };
  }

  return {
    httpOnly: true,

    secure: false,

    sameSite: "lax",

    path: "/",

    maxAge:
      COOKIE_DAYS *
      24 *
      60 *
      60 *
      1000,
  };
}


function setAuthCookie(
  res,
  token
) {
  res.cookie(
    COOKIE_NAME,
    token,
    getCookieOptions()
  );
}


function clearAuthCookie(
  res
) {
  const options =
    getCookieOptions();

  /*
  |--------------------------------------------------------------------------
  | maxAge must not be supplied to clearCookie
  |--------------------------------------------------------------------------
  */

  delete options.maxAge;

  res.clearCookie(
    COOKIE_NAME,
    options
  );
}


/*
|--------------------------------------------------------------------------
| USER RESPONSE
|--------------------------------------------------------------------------
|
| Never return password hashes.
|
|--------------------------------------------------------------------------
*/

function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id:
      user.id,

    name:
      user.name,

    email:
      user.email,

    phone:
      user.phone || "",

    role:
      user.role || "user",

    createdAt:
      user.created_at || null,
  };
}


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  async (
    req,
    res,
    next
  ) => {
    try {
      const input =
        registerSchema.parse(
          req.body
        );

      const email =
        input.email
          .trim()
          .toLowerCase();


      /*
      |--------------------------------------------------------------------------
      | Check existing account
      |--------------------------------------------------------------------------
      */

      const existing =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE LOWER(email) = LOWER($1)
          LIMIT 1
          `,
          [
            email,
          ]
        );


      if (
        existing.rows.length
      ) {
        return res
          .status(409)
          .json({
            error:
              "An account with this email already exists",
          });
      }


      /*
      |--------------------------------------------------------------------------
      | Hash password
      |--------------------------------------------------------------------------
      */

      const passwordHash =
        await bcrypt.hash(
          input.password,
          12
        );


      /*
      |--------------------------------------------------------------------------
      | Create user
      |--------------------------------------------------------------------------
      */

      const result =
        await pool.query(
          `
          INSERT INTO users (
            name,
            email,
            password_hash,
            phone
          )
          VALUES (
            $1,
            $2,
            $3,
            $4
          )
          RETURNING
            id,
            name,
            email,
            phone,
            role,
            created_at
          `,
          [
            input.name.trim(),

            email,

            passwordHash,

            input.phone
              ? input.phone.trim()
              : null,
          ]
        );


      const user =
        result.rows[0];


      /*
      |--------------------------------------------------------------------------
      | Create login token
      |--------------------------------------------------------------------------
      */

      const token =
        signToken(
          user
        );


      /*
      |--------------------------------------------------------------------------
      | Store token in HTTP-only cookie
      |--------------------------------------------------------------------------
      */

      setAuthCookie(
        res,
        token
      );


      return res
        .status(201)
        .json({
          success:
            true,

          user:
            serializeUser(
              user
            ),
        });

    } catch (
      error
    ) {
      /*
      |--------------------------------------------------------------------------
      | Zod validation error
      |--------------------------------------------------------------------------
      */

      if (
        error instanceof
        z.ZodError
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid registration data",

            details:
              error.issues,
          });
      }


      /*
      |--------------------------------------------------------------------------
      | PostgreSQL unique email safety
      |--------------------------------------------------------------------------
      */

      if (
        error?.code ===
        "23505"
      ) {
        return res
          .status(409)
          .json({
            error:
              "An account with this email already exists",
          });
      }


      return next(
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
  "/login",
  async (
    req,
    res,
    next
  ) => {
    try {
      const input =
        loginSchema.parse(
          req.body
        );


      const email =
        input.email
          .trim()
          .toLowerCase();


      /*
      |--------------------------------------------------------------------------
      | Find account
      |--------------------------------------------------------------------------
      */

      const result =
        await pool.query(
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
          [
            email,
          ]
        );


      const user =
        result.rows[0];


      if (!user) {
        return res
          .status(401)
          .json({
            error:
              "Invalid email or password",
          });
      }


      /*
      |--------------------------------------------------------------------------
      | Verify password
      |--------------------------------------------------------------------------
      */

      const passwordMatches =
        await bcrypt.compare(
          input.password,
          user.password_hash
        );


      if (
        !passwordMatches
      ) {
        return res
          .status(401)
          .json({
            error:
              "Invalid email or password",
          });
      }


      /*
      |--------------------------------------------------------------------------
      | Create JWT
      |--------------------------------------------------------------------------
      */

      const token =
        signToken(
          user
        );


      /*
      |--------------------------------------------------------------------------
      | Store JWT cookie
      |--------------------------------------------------------------------------
      */

      setAuthCookie(
        res,
        token
      );


      return res.json({
        success:
          true,

        user:
          serializeUser(
            user
          ),
      });

    } catch (
      error
    ) {
      if (
        error instanceof
        z.ZodError
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid login data",

            details:
              error.issues,
          });
      }


      return next(
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  requireAuth,
  async (
    req,
    res,
    next
  ) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | requireAuth should populate req.user
      |--------------------------------------------------------------------------
      */

      const userId =
        req.user?.id ||
        req.user?.sub;


      if (!userId) {
        return res
          .status(401)
          .json({
            error:
              "Authentication required",
          });
      }


      const result =
        await pool.query(
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
          [
            userId,
          ]
        );


      if (
        !result.rows.length
      ) {
        clearAuthCookie(
          res
        );

        return res
          .status(401)
          .json({
            error:
              "Authentication required",
          });
      }


      return res.json({
        success:
          true,

        user:
          serializeUser(
            result.rows[0]
          ),
      });

    } catch (
      error
    ) {
      return next(
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

router.post(
  "/logout",
  (
    req,
    res
  ) => {
    clearAuthCookie(
      res
    );

    return res.json({
      success:
        true,

      message:
        "Logged out successfully",
    });
  }
);


export default router;