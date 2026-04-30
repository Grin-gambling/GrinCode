import db from '../db/db.js';

async function createVote(marketId, voteType, client = db) {
  const query = `
    INSERT INTO market_votes (market_id, vote_type)
    VALUES ($1, $2)
    RETURNING id, market_id, vote_type, created_at
  `;

  const result = await client.query(query, [marketId, voteType]);
  return result.rows[0];
}

async function getVoteTotalsByMarketId(marketId, client = db) {
  const query = `
    SELECT
      COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0)::int AS upvotes,
      COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0)::int AS downvotes
    FROM market_votes
    WHERE market_id = $1
  `;

  const result = await client.query(query, [marketId]);
  return result.rows[0];
}

export {
  createVote,
  getVoteTotalsByMarketId,
};
