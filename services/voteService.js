import db from '../db/db.js';
import { createVote, getVoteTotalsByMarketId } from '../models/voteModel.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function castVote(marketId, voteType) {
  if (!marketId) {
    throw createError('Market ID is required', 400);
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

    await createVote(marketId, voteType, client);
    const totals = await getVoteTotalsByMarketId(marketId, client);

    await client.query('COMMIT');
    return totals;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export {
  castVote,
};
