import jwt from 'jsonwebtoken';

import {
  authSessionExists,
} from '../services/authSessionStore.js';


/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ||
  'cw_auth';


/*
|--------------------------------------------------------------------------
| READ COOKIE
|--------------------------------------------------------------------------
*/

function readCookie(
  req,
  name
) {

  /*
  |--------------------------------------------------------------------------
  | cookie-parser
  |--------------------------------------------------------------------------
  */

  if (
    req.cookies &&
    typeof req.cookies[name] ===
      'string'
  ) {
    return req.cookies[name];
  }


  /*
  |--------------------------------------------------------------------------
  | Raw Cookie fallback
  |--------------------------------------------------------------------------
  */

  const header =
    req.headers.cookie;


  if (!header) {
    return null;
  }


  for (
    const part
    of header.split(';')
  ) {

    const index =
      part.indexOf('=');


    if (index === -1) {
      continue;
    }


    const key =
      part
        .slice(
          0,
          index
        )
        .trim();


    const value =
      part
        .slice(
          index + 1
        )
        .trim();


    if (key === name) {

      try {
        return decodeURIComponent(
          value
        );

      } catch {
        return value;
      }
    }
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| REQUIRE AUTHENTICATION
|--------------------------------------------------------------------------
*/

export async function requireAuth(
  req,
  res,
  next
) {

  try {

    /*
    |--------------------------------------------------------------------------
    | JWT cookie
    |--------------------------------------------------------------------------
    */

    const token =
      readCookie(
        req,
        COOKIE_NAME
      );


    if (!token) {

      return res
        .status(401)
        .json({
          error:
            'Authentication required',
        });
    }


    /*
    |--------------------------------------------------------------------------
    | Verify JWT
    |--------------------------------------------------------------------------
    */

    const secret =
      process.env
        .AUTH_JWT_SECRET;


    if (!secret) {

      console.error(
        '[AUTH] AUTH_JWT_SECRET is not configured'
      );


      return res
        .status(500)
        .json({
          error:
            'Authentication service unavailable',
        });
    }


    const payload =
      jwt.verify(
        token,
        secret
      );


    /*
    |--------------------------------------------------------------------------
    | Backward compatibility
    |--------------------------------------------------------------------------
    |
    | Existing JWTs created before Redis-session support do not contain sid.
    |
    | We accept them until they naturally expire.
    |
    | New JWTs always contain sid.
    |
    |--------------------------------------------------------------------------
    */

    if (payload.sid) {

      const active =
        await authSessionExists(
          payload.sid
        );


      if (!active) {

        return res
          .status(401)
          .json({
            error:
              'Session expired or revoked',
          });
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Attach authenticated user
    |--------------------------------------------------------------------------
    */

    req.user = {
      id:
        payload.sub,

      email:
        payload.email,

      role:
        payload.role ||
        'user',

      sessionId:
        payload.sid ||
        null,
    };


    return next();

  } catch (error) {

    if (
      error?.name ===
      'TokenExpiredError'
    ) {

      return res
        .status(401)
        .json({
          error:
            'Session expired',
        });
    }


    return res
      .status(401)
      .json({
        error:
          'Invalid or expired session',
      });
  }
}


/*
|--------------------------------------------------------------------------
| REQUIRE ADMIN
|--------------------------------------------------------------------------
*/

export function requireAdmin(
  req,
  res,
  next
) {

  if (!req.user) {

    return res
      .status(401)
      .json({
        error:
          'Authentication required',
      });
  }


  if (
    req.user.role !==
    'admin'
  ) {

    return res
      .status(403)
      .json({
        error:
          'Forbidden',
      });
  }


  return next();
}