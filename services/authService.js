import crypto from 'crypto';
import db from '../db/db.js';
import {
  createUser,
  getUserByEmail,
  getUserById,
} from '../models/userModel.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  const [salt, originalKey] = storedHash.split(':');

  if (!salt || !originalKey) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(
    Buffer.from(originalKey, 'hex'),
    Buffer.from(derivedKey, 'hex')
  );
}

async function createSession(userId, client = db) {
  const token = crypto.randomBytes(48).toString('hex');

  const result = await client.query(
    `
      INSERT INTO user_sessions (token, user_id)
      VALUES ($1, $2)
      RETURNING token
    `,
    [token, userId]
  );

  return result.rows[0].token;
}

async function registerUser(username, email, password) {
  const trimmedUsername = username?.trim();
  const normalizedEmail = email ? normalizeEmail(email) : '';

  if (!trimmedUsername || !normalizedEmail || !password) {
    throw createError('Username, email, and password are required', 400);
  }

  if (password.length < 8) {
    throw createError('Password must be at least 8 characters long', 400);
  }

  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw createError('An account with that email already exists', 409);
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const user = await createUser(
      trimmedUsername,
      normalizedEmail,
      hashPassword(password),
      client
    );

    const token = await createSession(user.id, client);

    await client.query('COMMIT');

    return {
      token,
      user,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function loginUser(email, password) {
  const normalizedEmail = email ? normalizeEmail(email) : '';

  if (!normalizedEmail || !password) {
    throw createError('Email and password are required', 400);
  }

  const user = await getUserByEmail(normalizedEmail);

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw createError('Email or password is incorrect', 401);
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const token = await createSession(user.id, client);
    const safeUser = await getUserById(user.id, client);
    await client.query('COMMIT');

    return {
      token,
      user: safeUser,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getUserBySessionToken(token) {
  if (!token) {
    return null;
  }

  const result = await db.query(
    `
      SELECT u.id, u.username, u.email, u.balance, u.created_at
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = $1
    `,
    [token]
  );

  return result.rows[0] || null;
}

async function logoutUser(token) {
  if (!token) {
    return;
  }

  await db.query('DELETE FROM user_sessions WHERE token = $1', [token]);
}

export {
  getUserBySessionToken,
  loginUser,
  logoutUser,
  registerUser,
};
