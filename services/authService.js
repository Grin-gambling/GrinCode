// Node's crypto library is used for secure password hashing and random session tokens.
import crypto from 'crypto';
// Shared database helper.
import db from '../db/db.js';
// User model helpers used by auth flows.
import { createUser, getUserByEmail, getUserById } from '../models/userModel.js';

// -----------------------------------------------------------------------------
// Auth service
// -----------------------------------------------------------------------------
// This is where authentication business rules live.
//
// Main flows:
// register
//   -> validate fields
//   -> normalize email
//   -> hash password
//   -> create user
//   -> create session token
//
// login
//   -> normalize email
//   -> verify password
//   -> create session token
//
// session lookup
//   -> map bearer token back to a safe user object

// Build a consistent error object that routes can map to HTTP status codes.
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Normalize email input so different capitalization/spaces do not create duplicates.
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// Convert a plaintext password into a salted hash string.
// Format: "salt:derivedKey"
function hashPassword(password) {
  // Create a random salt so identical passwords do not hash to the same stored value.
  const salt = crypto.randomBytes(16).toString('hex');
  // Use scrypt, which is designed for password hashing.
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  // Store both pieces because verification needs the original salt.
  return `${salt}:${derivedKey}`;
}

// Check whether the supplied plaintext password matches the stored hash string.
function verifyPassword(password, storedHash) {
  // Split the stored string back into its salt and hashed key parts.
  const [salt, originalKey] = storedHash.split(':');

  // If the stored format is broken, treat it as a failed password check.
  if (!salt || !originalKey) {
    return false;
  }

  // Recompute the derived key from the incoming password using the original salt.
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  // Use a timing-safe comparison to reduce side-channel leakage.
  return crypto.timingSafeEqual(
    Buffer.from(originalKey, 'hex'),
    Buffer.from(derivedKey, 'hex')
  );
}

// Create a new bearer-token session for a user.
async function createSession(userId, client = db) {
  // Generate a long random token so session guessing is impractical.
  const token = crypto.randomBytes(48).toString('hex');
  // Save the token -> user mapping in the database.
  const result = await client.query(
    `
      -- Store one active session token.
      INSERT INTO user_sessions (token, user_id)
      VALUES ($1, $2)
      -- Return the token so the caller can send it back to the client.
      RETURNING token
    `,
    [token, userId]
  );

  return result.rows[0].token;
}

// Register a brand-new account and immediately create a signed-in session.
async function registerUser(username, email, password) {
  // Trim the username because surrounding spaces should not matter.
  const trimmedUsername = username?.trim();
  // Normalize the email to avoid duplicates like A@B.com vs a@b.com.
  const normalizedEmail = email ? normalizeEmail(email) : '';

  // All three fields are required.
  if (!trimmedUsername || !normalizedEmail || !password) {
    throw createError('Username, email, and password are required', 400);
  }

  // Enforce a minimum password length for basic account safety.
  if (password.length < 8) {
    throw createError('Password must be at least 8 characters long', 400);
  }

  // Check whether another account already owns this email.
  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw createError('An account with that email already exists', 409);
  }

  // Open a dedicated transaction client because user creation and session creation
  // should succeed or fail together.
  const client = await db.connect();

  try {
    // Start the database transaction.
    await client.query('BEGIN');

    // Save the user with a securely hashed password.
    const user = await createUser(
      trimmedUsername,
      normalizedEmail,
      hashPassword(password),
      client
    );

    // Create a session token for the new account immediately after creation.
    const token = await createSession(user.id, client);

    // Finalize the transaction.
    await client.query('COMMIT');

    // Return both the token and safe user object to the route.
    return { token, user };
  } catch (error) {
    // Undo any partial writes if something failed.
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Always return the client to the pool.
    client.release();
  }
}

// Log a user in by verifying credentials and creating a new session token.
async function loginUser(email, password) {
  // Normalize the incoming email in the same way registration does.
  const normalizedEmail = email ? normalizeEmail(email) : '';

  // Both fields are required.
  if (!normalizedEmail || !password) {
    throw createError('Email and password are required', 400);
  }

  // Look up the account by email.
  const user = await getUserByEmail(normalizedEmail);

  // Reject unknown accounts and bad passwords with the same message.
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw createError('Email or password is incorrect', 401);
  }

  // Open a transaction client so session creation and safe-user lookup stay grouped.
  const client = await db.connect();

  try {
    // Start the transaction.
    await client.query('BEGIN');

    // Create a new session token for this login event.
    const token = await createSession(user.id, client);
    // Fetch the safe user shape to return to the frontend.
    const safeUser = await getUserById(user.id, client);

    // Finalize the transaction.
    await client.query('COMMIT');

    // Return login payload.
    return { token, user: safeUser };
  } catch (error) {
    // Undo any partial writes if the transaction fails.
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Return the client to the pool.
    client.release();
  }
}

// Convert a bearer token into the currently signed-in user.
async function getUserBySessionToken(token) {
  // Missing token means "no signed-in user".
  if (!token) {
    return null;
  }

  // Join sessions to users so we can return the safe user row directly.
  const result = await db.query(
    `
      -- Select the safe user fields only.
      SELECT u.id, u.username, u.email, u.balance, u.created_at
      -- Start from stored session tokens.
      FROM user_sessions s
      -- Join to the owning user account.
      JOIN users u ON u.id = s.user_id
      -- Match the provided token exactly.
      WHERE s.token = $1
    `,
    [token]
  );

  // Return the user when found, otherwise null.
  return result.rows[0] || null;
}

// Delete a session token to log the user out.
async function logoutUser(token) {
  // Missing token means there is nothing to delete.
  if (!token) {
    return;
  }

  // Remove the session row so the token stops authenticating requests.
  await db.query('DELETE FROM user_sessions WHERE token = $1', [token]);
}

// Export the auth service API.
export { getUserBySessionToken, loginUser, logoutUser, registerUser };
