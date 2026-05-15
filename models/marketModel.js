// Import the shared database helper used across the project.
import db from '../db/db.js';

// -----------------------------------------------------------------------------
// Market model
// -----------------------------------------------------------------------------
// This file handles raw market table access.
//
// Responsibility map:
// - create a market row
// - read market metadata
// - update market status
//
// It does NOT:
// - validate user input deeply
// - decide permissions
// - calculate payouts
// Those belong in services.

// Reuse the same selected columns across multiple queries so the code stays consistent.
const MARKET_SELECT_COLUMNS = `
  id,
  user_id,
  question,
  description,
  market_type,
  status,
  closes_at,
  created_at
`;

// Create a new market owned by a specific user.
// `userId` is the creator.
// `question` is the main market title.
// `description` is the longer explanation shown in the UI.
// `closesAt` is stored as a timezone-aware timestamp.
async function createMarket(userId, question, description, closesAt, client = db) {
  const result = await client.query(
    `
      -- Insert the creator, market text, and close time.
      INSERT INTO markets (user_id, question, description, closes_at)
      -- `$4::timestamptz` tells Postgres to treat the value as a timezone-aware timestamp.
      VALUES ($1, $2, $3, $4::timestamptz)
      -- Return the saved row in the standard market shape used by the app.
      RETURNING ${MARKET_SELECT_COLUMNS}
    `,
    [userId, question, description, closesAt]
  );

  // One inserted row comes back, so `rows[0]` is the new market.
  return result.rows[0];
}

// Move a market into the "closed" state.
// Closed means betting is over, but the winner is not finalized yet.
async function closeMarket(marketId, client = db) {
  const result = await client.query(
    `
      -- Update exactly one market by id.
      UPDATE markets
      -- Change only the status field here.
      SET status = 'closed'
      WHERE id = $1
      -- Return the updated record so callers can use the fresh state immediately.
      RETURNING ${MARKET_SELECT_COLUMNS}
    `,
    [marketId]
  );

  return result.rows[0];
}

// Move a market into the final "resolved" state.
// Resolved means the winner is known and payouts can be considered complete.
async function markMarketResolved(marketId, client = db) {
  const result = await client.query(
    `
      -- Update exactly one market by id.
      UPDATE markets
      -- Mark the market as resolved.
      SET status = 'resolved'
      WHERE id = $1
      -- Return the updated record.
      RETURNING ${MARKET_SELECT_COLUMNS}
    `,
    [marketId]
  );

  return result.rows[0];
}

// Read only the key state needed for status/ownership checks.
// This is lighter than selecting the full row when the service only needs metadata.
async function checkStatus(marketId, client = db) {
  const result = await client.query(
    `
      -- Select the minimum useful information for status-based decisions.
      SELECT id, user_id, question, status, closes_at
      FROM markets
      WHERE id = $1
    `,
    [marketId]
  );

  return result.rows[0];
}

// Load one full market by id.
async function getMarketById(marketId, client = db) {
  const result = await client.query(
    `
      -- Return the standard market shape.
      SELECT ${MARKET_SELECT_COLUMNS}
      FROM markets
      WHERE id = $1
    `,
    [marketId]
  );

  return result.rows[0];
}

// Load one market by its exact question text.
// This helper is not used much right now, but keeping it correct and readable
// prevents future bugs when somebody reaches for it later.
async function getMarketByQuestion(question, client = db) {
  const result = await client.query(
    `
      -- Return the standard market shape.
      SELECT ${MARKET_SELECT_COLUMNS}
      FROM markets
      -- Match a market by its title/question text.
      WHERE question = $1
    `,
    [question]
  );

  return result.rows[0];
}

// Export the market model API.
export {
  checkStatus,
  closeMarket,
  createMarket,
  getMarketById,
  getMarketByQuestion,
  markMarketResolved,
};
