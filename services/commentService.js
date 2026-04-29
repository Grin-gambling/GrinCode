import db from '../db/db.js';
import { createComment, getCommentsByMarketId } from '../models/commentModel.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function listComments(marketId) {
  if (!marketId) {
    throw createError('Market ID is required', 400);
  }

  return getCommentsByMarketId(marketId);
}

async function addComment(marketId, body) {
  if (!marketId) {
    throw createError('Market ID is required', 400);
  }

  if (!body || !body.trim()) {
    throw createError('Comment body is required', 400);
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

    const comment = await createComment(marketId, body.trim(), client);
    await client.query('COMMIT');
    return comment;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export {
  addComment,
  listComments,
};
