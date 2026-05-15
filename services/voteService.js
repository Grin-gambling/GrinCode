// Shared database helper.
import db from '../db/db.js';
// Vote model helpers.
import {
  createVote,
  getVoteByMarketAndUserId,
  getVoteTotalsByMarketId,
} from '../models/voteModel.js';

// Build a consistent error object with an attached HTTP status code.
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Save an upvote or downvote for one user on one market.
async function castVote(marketId, userId, voteType) {
  // Market id and user id are required to know who is voting where.
  if (!marketId || !userId) {
    throw createError('Market ID and user ID are required', 400);
  }

  // Only two vote directions are valid.
  if (voteType !== 'up' && voteType !== 'down') {
    throw createError('Vote type must be up or down', 400);
  }

  // Use a transaction so duplicate checks and inserts stay grouped.
  const client = await db.connect();

  try {
    // Start the transaction.
    await client.query('BEGIN');

    // Confirm the target market still exists.
    const marketResult = await client.query('SELECT id FROM markets WHERE id = $1', [marketId]);

    // Reject votes for missing markets.
    if (!marketResult.rows[0]) {
      throw createError('Market not found', 404);
    }

    // Check for an existing vote from the same user.
    const existingVote = await getVoteByMarketAndUserId(marketId, userId, client);

    // Enforce one vote per user per market.
    if (existingVote) {
      throw createError('You have already voted on this market', 409);
    }

    // Save the new vote.
    await createVote(marketId, userId, voteType, client);

    // Recompute totals after insertion.
    const totals = await getVoteTotalsByMarketId(marketId, client);

    // Finalize the transaction.
    await client.query('COMMIT');

    // Return the latest totals for the UI.
    return totals;
  } catch (error) {
    // Undo partial work if something failed.
    await client.query('ROLLBACK');

    // Translate a DB unique-index collision into the same duplicate-vote message.
    if (error?.code === '23505') {
      throw createError('You have already voted on this market', 409);
    }

    throw error;
  } finally {
    // Return the client to the pool.
    client.release();
  }
}

// Export the vote service API.
export { castVote };
