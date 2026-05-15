// Import the shared database helper.
import db from '../db/db.js';

// -----------------------------------------------------------------------------
// Transaction model
// -----------------------------------------------------------------------------
// This table is the audit trail for balance movement.
// The current app does not rely on it heavily yet, but having a clean model now
// makes future accounting features much easier to build safely.

// Shared transaction column list.
const TRANSACTION_COLUMNS = `
  id,
  user_id,
  amount,
  type,
  reference_id,
  created_at
`;

// Create one audit record.
// `type` explains why the balance moved.
// `referenceId` can point to a related wager or other entity.
async function createTransaction(userId, amount, type, referenceId = null, client = db) {
  const result = await client.query(
    `
      -- Save one transaction event.
      INSERT INTO transactions (user_id, amount, type, reference_id)
      VALUES ($1, $2, $3, $4)
      -- Return the saved row for immediate use.
      RETURNING ${TRANSACTION_COLUMNS}
    `,
    [userId, amount, type, referenceId]
  );

  return result.rows[0];
}

// List a user's transaction history from newest to oldest.
async function listTransactionsByUserId(userId, client = db) {
  const result = await client.query(
    `
      -- Return the standard transaction shape.
      SELECT ${TRANSACTION_COLUMNS}
      FROM transactions
      WHERE user_id = $1
      -- Most recent activity first is usually best for account history screens.
      ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows;
}

// Export the transaction model API.
export { createTransaction, listTransactionsByUserId };
