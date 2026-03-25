const db = require('../db/db');

// The way this works is basically const query is a bit of SQL input
// The rest of it is just details of that user, and what we return I guess


// Create a new user
async function createUser(username, email, passwordHash) {
  const query = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, balance, created_at
  `;
  // in this case SQL is creating a new item in TABLE users

  const values = [username, email, passwordHash];
  const result = await db.query(query, values);

  return result.rows[0];
}


// Get user by ID
async function getUserById(userId) {
  const query = `
    SELECT id, username, email, balance, created_at
    FROM users
    WHERE id = $1
  `;
  // here we are searching the TABLE by their id

  const result = await db.query(query, [userId]);
  return result.rows[0];
}


// Get user by email (for login)

async function getUserByEmail(email) {
  const query = `
    SELECT *
    FROM users
    WHERE email = $1
  `;
  // here we are searching the TABLE by their email

  const result = await db.query(query, [email]);
  return result.rows[0];
}


// Update user balance 
async function updateBalance(userId, newBalance) {
  const query = `
    UPDATE users
    SET balance = $1
    WHERE id = $2
    RETURNING id, balance
  `;
  // here we are searching the TABLE by their id
  // would probably not be called from here I guess, most likely
  // to be called from either wager or outcome

  const result = await db.query(query, [newBalance, userId]);
  return result.rows[0];
}



// Delete user (prob not going to need to use but good to have)
async function deleteUser(userId) {
  const query = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id
  `;
  // deleting from TABLE by id 

  const result = await db.query(query, [userId]);
  return result.rows[0];
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateBalance,
  adjustBalance,
  deleteUser,
};