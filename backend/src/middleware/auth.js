import jwt from "jsonwebtoken";

const COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME || "cw_auth";

function readCookie(req, name) {
  const header = req.headers.cookie;

  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const index = part.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

export function requireAuth(req, res, next) {
  try {
    const token = readCookie(req, COOKIE_NAME);

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const payload = jwt.verify(
      token,
      process.env.AUTH_JWT_SECRET
    );

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired session",
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
    });
  }

  next();
}
