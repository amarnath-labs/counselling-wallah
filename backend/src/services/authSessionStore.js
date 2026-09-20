import crypto from 'node:crypto';

import {
  redisCommand,
  redisEnabled,
} from './redisCache.js';

const SESSION_PREFIX =
  'cw:auth:session:v1:';

const DEFAULT_SESSION_TTL_SECONDS =
  7 * 24 * 60 * 60;

function buildSessionKey(sessionId) {
  return (
    SESSION_PREFIX +
    String(sessionId || '')
  );
}

export function createSessionId() {
  return crypto
    .randomBytes(32)
    .toString('hex');
}

export async function createAuthSession({
  sessionId,
  userId,
  ttlSeconds = DEFAULT_SESSION_TTL_SECONDS,
}) {
  if (!sessionId) {
    throw new Error(
      'sessionId is required'
    );
  }

  if (!redisEnabled()) {
    return true;
  }

  const ttl =
    Math.max(
      60,
      Math.floor(
        Number(ttlSeconds) ||
        DEFAULT_SESSION_TTL_SECONDS
      )
    );

  const payload =
    JSON.stringify({
      userId:
        String(userId),

      createdAt:
        new Date().toISOString(),
    });

  const result =
    await redisCommand([
      'SET',
      buildSessionKey(sessionId),
      payload,
      'EX',
      ttl,
    ]);

  return result === 'OK';
}

export async function authSessionExists(
  sessionId
) {
  if (!sessionId) {
    return false;
  }

  if (!redisEnabled()) {
    return true;
  }

  const value =
    await redisCommand([
      'GET',
      buildSessionKey(sessionId),
    ]);

  return (
    typeof value === 'string' &&
    value.length > 0
  );
}

export async function refreshAuthSession(
  sessionId,
  ttlSeconds = DEFAULT_SESSION_TTL_SECONDS
) {
  if (
    !sessionId ||
    !redisEnabled()
  ) {
    return true;
  }

  const ttl =
    Math.max(
      60,
      Math.floor(
        Number(ttlSeconds) ||
        DEFAULT_SESSION_TTL_SECONDS
      )
    );

  const result =
    await redisCommand([
      'EXPIRE',
      buildSessionKey(sessionId),
      ttl,
    ]);

  return Number(result) === 1;
}

export async function revokeAuthSession(
  sessionId
) {
  if (!sessionId) {
    return true;
  }

  if (!redisEnabled()) {
    return true;
  }

  await redisCommand([
    'DEL',
    buildSessionKey(sessionId),
  ]);

  return true;
}

export function authSessionStoreEnabled() {
  return redisEnabled();
}
