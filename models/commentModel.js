import db from '../db/db.js';

async function createComment(marketId, body, client = db) {
  const query = `
    INSERT INTO comments (market_id, body)
    VALUES ($1, $2)
    RETURNING id, market_id, body, created_at
  `;

  const result = await client.query(query, [marketId, body]);
  return result.rows[0];
}

async function getCommentsByMarketId(marketId, client = db) {
  const query = `
    SELECT id, market_id, body, created_at
    FROM comments
    WHERE market_id = $1
    ORDER BY created_at ASC
  `;

  const result = await client.query(query, [marketId]);
  return result.rows;
}

export {
  createComment,
  getCommentsByMarketId,
};
