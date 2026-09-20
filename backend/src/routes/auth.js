import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { pool } from '../db/pool.js';

import {
  requireAuth,
} from '../middleware/auth.js';

import {
  createSessionId,
  createAuthSession,
  revokeAuthSession,
} from '../services/authSessionStore.js';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ||
  'cw_auth';


const COOKIE_DAYS =
  Math.max(
    1,
    Number(
      process.env.AUTH_COOKIE_DAYS ||
      7
    )
  );


const isProduction =
  process.env.NODE_ENV ===
  'production';


const SESSION_TTL_SECONDS =
  COOKIE_DAYS *
  24 *
  60 *
  60;


/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

const registerSchema =
  z.object({

    name:
      z
        .string()
        .trim()
        .min(2)
        .max(100),

    email:
      z
        .string()
        .trim()
        .email()
        .max(255),

    password:
      z
        .string()
        .min(8)
        .max(128),

    phone:
      z
        .string()
        .trim()
        .max(20)
        .optional()
        .or(
          z.literal('')
        ),
  });


const loginSchema =
  z.object({

    email:
      z
        .string()
        .trim()
        .email(),

    password:
      z
        .string()
        .min(1),
  });


/*
|--------------------------------------------------------------------------
| JWT
|--------------------------------------------------------------------------
*/

function signToken(
  user,
  sessionId
) {

  const secret =
    process.env
      .AUTH_JWT_SECRET;


  if (!secret) {

    throw new Error(
      'AUTH_JWT_SECRET is not configured'
    );
  }


  return jwt.sign(
    {
      sub:
        String(
          user.id
        ),

      email:
        user.email,

      role:
        user.role ||
        'user',

      /*
      |--------------------------------------------------------------------------
      | Redis session ID
      |--------------------------------------------------------------------------
      */

      sid:
        sessionId,
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
| COOKIE OPTIONS
|--------------------------------------------------------------------------
*/

function getCookieOptions() {

  /*
  |--------------------------------------------------------------------------
  | Production
  |--------------------------------------------------------------------------
  |
  | If frontend and backend are separate domains:
  |
  | SameSite=None
  | Secure=true
  |
  |--------------------------------------------------------------------------
  */

  if (isProduction) {

    return {
      httpOnly:
        true,

      secure:
        true,

      sameSite:
        'none',

      path:
        '/',

      maxAge:
        COOKIE_DAYS *
        24 *
        60 *
        60 *
        1000,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Development
  |--------------------------------------------------------------------------
  */

  return {
    httpOnly:
      true,

    secure:
      false,

    sameSite:
      'lax',

    path:
      '/',

    maxAge:
      COOKIE_DAYS *
      24 *
      60 *
      60 *
      1000,
  };
}


/*
|--------------------------------------------------------------------------
| SET AUTH COOKIE
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| CLEAR AUTH COOKIE
|--------------------------------------------------------------------------
*/

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

function serializeUser(
  user
) {

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
      user.phone ||
      null,

    role:
      user.role ||
      'user',

    createdAt:
      user.created_at ||
      null,
  };
}


/*
|--------------------------------------------------------------------------
| CREATE LOGIN SESSION
|--------------------------------------------------------------------------
*/

async function createLoginSession(
  user
) {

  const sessionId =
    createSessionId();


  const sessionCreated =
    await createAuthSession({
      sessionId,

      userId:
        user.id,

      ttlSeconds:
        SESSION_TTL_SECONDS,
    });


  /*
  |--------------------------------------------------------------------------
  | Production Redis safety
  |--------------------------------------------------------------------------
  |
  | Redis is configured in production architecture.
  | If session could not be created we should not issue a JWT with a dead sid.
  |
  |--------------------------------------------------------------------------
  */

  if (!sessionCreated) {

    throw new Error(
      'Unable to create authentication session'
    );
  }


  const token =
    signToken(
      user,
      sessionId
    );


  return {
    token,
    sessionId,
  };
}


/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post(
  '/register',

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
        existing.rows.length > 0
      ) {

        return res
          .status(409)
          .json({
            error:
              'An account with this email already exists',
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
            input.name
              .trim(),

            email,

            passwordHash,

            input.phone
              ? input.phone
                  .trim()
              : null,
          ]
        );


      const user =
        result.rows[0];


      /*
      |--------------------------------------------------------------------------
      | Shared Redis login session
      |--------------------------------------------------------------------------
      */

      const {
        token,
      } =
        await createLoginSession(
          user
        );


      /*
      |--------------------------------------------------------------------------
      | HTTP-only cookie
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

    } catch (error) {

      /*
      |--------------------------------------------------------------------------
      | Validation
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
              'Invalid registration data',

            details:
              error.issues,
          });
      }


      /*
      |--------------------------------------------------------------------------
      | PostgreSQL unique email
      |--------------------------------------------------------------------------
      */

      if (
        error?.code ===
        '23505'
      ) {

        return res
          .status(409)
          .json({
            error:
              'An account with this email already exists',
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
  '/login',

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
              'Invalid email or password',
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


      if (!passwordMatches) {

        return res
          .status(401)
          .json({
            error:
              'Invalid email or password',
          });
      }


      /*
      |--------------------------------------------------------------------------
      | Create Redis session + JWT
      |--------------------------------------------------------------------------
      */

      const {
        token,
      } =
        await createLoginSession(
          user
        );


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

    } catch (error) {

      if (
        error instanceof
        z.ZodError
      ) {

        return res
          .status(400)
          .json({
            error:
              'Invalid login data',

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
  '/me',

  requireAuth,

  async (
    req,
    res,
    next
  ) => {

    try {

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
            req.user.id,
          ]
        );


      if (
        result.rows.length ===
        0
      ) {

        return res
          .status(401)
          .json({
            error:
              'User account not found',
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

    } catch (error) {

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
  '/logout',

  requireAuth,

  async (
    req,
    res,
    next
  ) => {

    try {

      /*
      |--------------------------------------------------------------------------
      | Revoke shared session
      |--------------------------------------------------------------------------
      */

      if (
        req.user?.sessionId
      ) {

        await revokeAuthSession(
          req.user.sessionId
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Remove browser cookie
      |--------------------------------------------------------------------------
      */

      clearAuthCookie(
        res
      );


      return res.json({
        success:
          true,

        message:
          'Logged out successfully',
      });

    } catch (error) {

      /*
      |--------------------------------------------------------------------------
      | Always clear browser cookie
      |--------------------------------------------------------------------------
      */

      clearAuthCookie(
        res
      );


      return next(
        error
      );
    }
  }
);


export default router;