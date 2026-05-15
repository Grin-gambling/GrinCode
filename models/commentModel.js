// Import the shared database helper.
// This gives us `.query(...)` for normal queries and also lets callers pass in
// a transaction client instead when they want multiple steps to succeed/fail together.
import db from '../db/db.js';

// -----------------------------------------------------------------------------
// Comment model
// -----------------------------------------------------------------------------
// A "model" file should focus on database reads/writes only.
// It should NOT decide whether data is valid for the business.
// That higher-level logic belongs in the service layer.

// Keep the column list in one place so every query returns the same shape.
// This makes the file easier to maintain and easier for beginners to scan.
const COMMENT_COLUMNS = 'id, market_id, body, created_at';

// Create a new comment row for a market.
// `marketId` tells us which market the comment belongs to.
// `body` is the text the user typed.
// `client` defaults to the shared db helper, but a transaction client can be
// passed in from a service when needed.
async function createComment(marketId, body, client = db) {
  // Ask Postgres to insert the new row and immediately return the saved record.
  const result = await client.query(
    `
      -- Insert the market reference and the comment text.
      INSERT INTO comments (market_id, body)
      -- Use parameter placeholders to avoid SQL injection and keep values separate from SQL.
      VALUES ($1, $2)
      -- Return the final saved row so the caller can use it right away.
      RETURNING ${COMMENT_COLUMNS}
    `,
    [marketId, body]
  );

  // `rows[0]` is the inserted comment because INSERT ... RETURNING returns one row here.
  return result.rows[0];
}

// Fetch all comments for one market in oldest-to-newest order.
// That ordering makes comment threads stable and predictable in the UI.
async function getCommentsByMarketId(marketId, client = db) {
  const result = await client.query(
    `
      -- Return the same standard comment shape for reads.
      SELECT ${COMMENT_COLUMNS}
      -- Read from the comments table.
      FROM comments
      -- Only include comments for the requested market.
      WHERE market_id = $1
      -- Show earliest comments first so the conversation reads naturally.
      ORDER BY created_at ASC
    `,
    [marketId]
  );

  // This query can return many rows, so we return the whole array.
  return result.rows;
}

// Export the model functions so services can call them.
export { createComment, getCommentsByMarketId };
