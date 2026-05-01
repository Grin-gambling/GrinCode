import db from '../db/db.js';
import {
  createVote,
  getVoteByMarketAndUserId,
  getVoteTotalsByMarketId,
} from '../models/voteModel.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function castVote(marketId, userId, voteType) {
  if (!marketId || !userId) {
    throw createError('Market ID and user ID are required', 400);
  }

  if (voteType !== 'up' && voteType !== 'down') {
    throw createError('Vote type must be up or down', 400);
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const marketResult = await client.query(
      'SELECT id FROM markets WHERE id = $1',
      [marketId]
    );

    if (!marketResult.rows[0]) {
      throw createError('Market not found', 404);
    }

    const existingVote = await getVoteByMarketAndUserId(marketId, userId, client);

    if (existingVote) {
      throw createError('You have already voted on this market', 409);
    }

    await createVote(marketId, userId, voteType, client);
    const totals = await getVoteTotalsByMarketId(marketId, client);

    await client.query('COMMIT');
    return totals;
  } catch (error) {
    await client.query('ROLLBACK');

    if (error?.code === '23505') {
      throw createError('You have already voted on this market', 409);
    }

    throw error;
  } finally {
    client.release();
  }
}

export {
  castVote,
};
