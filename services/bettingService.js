import db from '../db/db.js';
import { createWager } from '../models/wagerModel.js';

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function placeBet(marketId, outcomeId, amount) {
  const numericAmount = Number(amount);

  if (!marketId || !outcomeId) {
    throw createError('Market ID and outcome ID are required', 400);
  }

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw createError('Bet amount must be greater than 0', 400);
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const outcomeResult = await client.query(
      `
        SELECT o.id, o.market_id, m.status
        FROM outcomes o
        JOIN markets m ON m.id = o.market_id
        WHERE o.id = $1 AND o.market_id = $2
      `,
      [outcomeId, marketId]
    );

    const outcome = outcomeResult.rows[0];

    if (!outcome) {
      throw createError('Outcome does not belong to this market', 404);
    }

    if (outcome.status !== 'open') {
      throw createError('This market is no longer open for betting', 400);
    }

    const totalsResult = await client.query(
      `
        SELECT
          COALESCE(SUM(CASE WHEN outcome_id = $2 THEN amount ELSE 0 END), 0)::float AS outcome_total,
          COALESCE(SUM(amount), 0)::float AS market_total
        FROM wagers
        WHERE outcome_id IN (
          SELECT id
          FROM outcomes
          WHERE market_id = $1
        )
      `,
      [marketId, outcomeId]
    );

    const { outcome_total: outcomeTotal, market_total: marketTotal } =
      totalsResult.rows[0];

    const impliedProbability =
      Number(marketTotal) <= 0
        ? 50
        : ((Number(outcomeTotal) + numericAmount) /
            (Number(marketTotal) + numericAmount)) *
          100;

    const oddsAtBet = Math.max(1.001, impliedProbability);

    const wager = await createWager(
      null,
      outcomeId,
      numericAmount,
      oddsAtBet,
      client
    );

    await client.query('COMMIT');

    return wager;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export {
  placeBet,
};
