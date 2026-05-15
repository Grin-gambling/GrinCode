// Import the shared database helper.
import db from '../db/db.js';

// Reuse a standard vote row shape everywhere in this file.
const VOTE_COLUMNS = 'id, market_id, user_id, vote_type, created_at';

// Save one upvote or downvote for a market.
async function createVote(marketId, userId, voteType, client = db) {
  const result = await client.query(
    `
      -- Insert one vote row.
      INSERT INTO market_votes (market_id, user_id, vote_type)
      VALUES ($1, $2, $3)
      -- Return the inserted row so callers can inspect it if needed.
      RETURNING ${VOTE_COLUMNS}
    `,
    [marketId, userId, voteType]
  );

  return result.rows[0];
}

// Check whether one user has already voted on one market.
async function getVoteByMarketAndUserId(marketId, userId, client = db) {
  const result = await client.query(
    `
      -- Return the standard vote row shape.
      SELECT ${VOTE_COLUMNS}
      FROM market_votes
      -- Match the specific market/user pair.
      WHERE market_id = $1 AND user_id = $2
    `,
    [marketId, userId]
  );

  return result.rows[0];
}

// Count upvotes and downvotes for a market.
async function getVoteTotalsByMarketId(marketId, client = db) {
  const result = await client.query(
    `
      -- Count only "up" votes in the first sum.
      SELECT
        COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0)::int AS upvotes,
        -- Count only "down" votes in the second sum.
        COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)::int AS downvotes
      FROM market_votes
      WHERE market_id = $1
    `,
    [marketId]
  );

  return result.rows[0];
}

// Export the vote model API.
export { createVote, getVoteByMarketAndUserId, getVoteTotalsByMarketId };
