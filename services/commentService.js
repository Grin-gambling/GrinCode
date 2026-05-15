// Shared database helper.
import db from '../db/db.js';
// Comment model helpers.
import { createComment, getCommentsByMarketId } from '../models/commentModel.js';

// Build a consistent error object with an attached HTTP status code.
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Read all comments for one market.
async function listComments(marketId) {
  // Market id is required to know which thread to load.
  if (!marketId) {
    throw createError('Market ID is required', 400);
  }

  // Delegate the raw read to the model layer.
  return getCommentsByMarketId(marketId);
}

// Add one new comment to a market.
async function addComment(marketId, body) {
  // Market id is required to attach the comment to the right market.
  if (!marketId) {
    throw createError('Market ID is required', 400);
  }

  // Empty or whitespace-only comments are not allowed.
  if (!body || !body.trim()) {
    throw createError('Comment body is required', 400);
  }

  // Use a transaction so existence check and insert are grouped together.
  const client = await db.connect();

  try {
    // Start the transaction.
    await client.query('BEGIN');

    // Confirm the market still exists before inserting a comment for it.
    const marketResult = await client.query('SELECT id FROM markets WHERE id = $1', [marketId]);

    // Reject comments for unknown markets.
    if (!marketResult.rows[0]) {
      throw createError('Market not found', 404);
    }

    // Save the trimmed comment text.
    const comment = await createComment(marketId, body.trim(), client);

    // Finalize the transaction.
    await client.query('COMMIT');

    // Return the saved comment row.
    return comment;
  } catch (error) {
    // Undo any partial work if the transaction fails.
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Return the client to the pool.
    client.release();
  }
}

// Export the comment service API.
export { addComment, listComments };
