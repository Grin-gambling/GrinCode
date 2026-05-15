// Import the shared database helper.
import db from '../db/db.js';

// -----------------------------------------------------------------------------
// User model
// -----------------------------------------------------------------------------
// This model intentionally has two user shapes:
// - safe user rows: okay to return to the app
// - auth user rows: include `password_hash`, only for secure auth logic

// Safe columns exclude the password hash.
const SAFE_USER_COLUMNS = 'id, username, email, balance, created_at';
// Auth columns include the password hash for login/registration flows.
const AUTH_USER_COLUMNS = 'id, username, email, password_hash, balance, created_at';

// Create a new user account.
async function createUser(username, email, passwordHash, client = db) {
  const result = await client.query(
    `
      -- Save the new account details.
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      -- Return only the safe user shape.
      RETURNING ${SAFE_USER_COLUMNS}
    `,
    [username, email, passwordHash]
  );

  return result.rows[0];
}

// Fetch one safe user row by id.
async function getUserById(userId, client = db) {
  const result = await client.query(
    `
      -- Select the safe user fields only.
      SELECT ${SAFE_USER_COLUMNS}
      FROM users
      WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0];
}

// Fetch one auth row by email.
// This is used during login and registration checks.
async function getUserByEmail(email, client = db) {
  const result = await client.query(
    `
      -- Select the auth shape because password verification needs the hash.
      SELECT ${AUTH_USER_COLUMNS}
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  return result.rows[0];
}

// Replace a user's balance with a new value.
// The caller is responsible for calculating the new balance correctly.
async function updateBalance(userId, newBalance, client = db) {
  const result = await client.query(
    `
      -- Update the balance column only.
      UPDATE users
      SET balance = $1
      WHERE id = $2
      -- Return the user id and updated balance as confirmation.
      RETURNING id, balance
    `,
    [newBalance, userId]
  );

  return result.rows[0];
}

// Return the richest users for the leaderboard.
async function getTopUsersByBalance(limit = 10, client = db) {
  const result = await client.query(
    `
      -- Only the fields the leaderboard needs.
      SELECT id, username, balance
      FROM users
      -- Highest balance first; tie-break by username for stable ordering.
      ORDER BY balance DESC, username ASC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

// Delete a user account by id.
// This helper is mostly useful for tests, admin flows, or future cleanup tools.
async function deleteUser(userId, client = db) {
  const result = await client.query(
    `
      -- Remove exactly one user.
      DELETE FROM users
      WHERE id = $1
      -- Return the deleted id so the caller knows whether something was removed.
      RETURNING id
    `,
    [userId]
  );

  return result.rows[0];
}

// Export the user model API.
export {
  createUser,
  deleteUser,
  getTopUsersByBalance,
  getUserByEmail,
  getUserById,
  updateBalance,
};
