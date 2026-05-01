import db from '../db/db.js';

async function createUser(username, email, passwordHash, client = db) {
  const query = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, balance, created_at
  `;

  const result = await client.query(query, [username, email, passwordHash]);
  return result.rows[0];
}

async function getUserById(userId, client = db) {
  const query = `
    SELECT id, username, email, balance, created_at
    FROM users
    WHERE id = $1
  `;

  const result = await client.query(query, [userId]);
  return result.rows[0];
}

async function getUserByEmail(email, client = db) {
  const query = `
    SELECT id, username, email, password_hash, balance, created_at
    FROM users
    WHERE email = $1
  `;

  const result = await client.query(query, [email]);
  return result.rows[0];
}

async function updateBalance(userId, newBalance, client = db) {
  const query = `
    UPDATE users
    SET balance = $1
    WHERE id = $2
    RETURNING id, balance
  `;

  const result = await client.query(query, [newBalance, userId]);
  return result.rows[0];
}

async function deleteUser(userId, client = db) {
  const query = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id
  `;

  const result = await client.query(query, [userId]);
  return result.rows[0];
}

export {
  createUser,
  getUserById,
  getUserByEmail,
  updateBalance,
  deleteUser,
};
