import db from '../db/db.js';
import * as marketModel from '../models/marketModel.js';
import * as outcomeModel from '../models/outcomeModel.js';
import * as wagerModel from '../models/wagerModel.js';
import { getUserById, updateBalance } from '../models/userModel.js';

/**
 * Create a market with outcomes using user input
 * USE TO CONNECT TO FRONTEND 
 * @param {string} question
 * @param {string} outcome1
 * @param {string} outcome2
 */

async function createMarket(question, description, outcome1, outcome2, closesAt) {    
    const client = await db.connect();
  
    try {
      await client.query('BEGIN');
  
      // Validate inputs
      if (!question || !description || !outcome1 || !outcome2 || !closesAt) {
        throw new Error('Invalid market data');
      }

      const parsedCloseTime = new Date(closesAt);

      if (Number.isNaN(parsedCloseTime.getTime())) {
        throw new Error('Invalid close time');
      }

      if (parsedCloseTime.getTime() <= Date.now()) {
        throw new Error('Close time must be in the future');
      }
  
      // Create market 
      const market = await marketModel.createMarket(
        question,
        description,
        parsedCloseTime.toISOString(),
        client
      );
  
      // Create outcome 1
      await outcomeModel.createOutcome(
        market.id,
        outcome1,
        client
      );

      // Create outcome 2
      await outcomeModel.createOutcome(
        market.id,
        outcome2,
        client
      );
  
      await client.query('COMMIT');
  
      return market;
  
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function resolveMarket(marketId, winningOutcomeId) {
  if (!marketId || !winningOutcomeId) {
    throw createError('Market ID and winning outcome are required', 400);
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const marketStatus = await marketModel.checkStatus(marketId, client);

    if (!marketStatus) {
      throw createError('Market not found', 404);
    }

    if (marketStatus.status === 'resolved') {
      throw createError('This market has already been resolved', 400);
    }

    const marketDetailsResult = await client.query(
      `
        SELECT id, status, closes_at
        FROM markets
        WHERE id = $1
        FOR UPDATE
      `,
      [marketId]
    );

    const market = marketDetailsResult.rows[0];

    if (!market) {
      throw createError('Market not found', 404);
    }

    if (!market.closes_at || new Date(market.closes_at).getTime() > Date.now()) {
      throw createError('This market cannot be resolved before it closes', 400);
    }

    const winningOutcome = await outcomeModel.getOutcomeById(winningOutcomeId, client);

    if (!winningOutcome || winningOutcome.market_id !== marketId) {
      throw createError('Winning outcome does not belong to this market', 400);
    }

    const wagers = await wagerModel.listWagersForMarket(marketId, client);

    await outcomeModel.clearWinnersForMarket(marketId, client);
    await outcomeModel.setWinner(winningOutcomeId, client);

    for (const wager of wagers) {
      const won = wager.outcome_id === winningOutcomeId;
      await wagerModel.updateWagerStatus(wager.id, won ? 'won' : 'lost', client);

      if (!won) {
        continue;
      }

      const payoutMultiplier = 100 / Number(wager.odds_at_bet);
      const payout = Math.max(
        Number(wager.amount),
        Math.round(Number(wager.amount) * payoutMultiplier)
      );

      const user = await getUserById(wager.user_id, client);

      if (!user) {
        continue;
      }

      await updateBalance(
        wager.user_id,
        Number(user.balance) + payout,
        client
      );
    }

    const resolvedMarket = await marketModel.markMarketResolved(marketId, client);

    await client.query('COMMIT');

    return {
      market: resolvedMarket,
      winningOutcomeId,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function autoResolveExpiredMarkets() {
  const expiredMarketsResult = await db.query(
    `
      SELECT id
      FROM markets
      WHERE status <> 'resolved'
        AND closes_at IS NOT NULL
        AND closes_at <= NOW()
      ORDER BY closes_at ASC
    `
  );

  for (const market of expiredMarketsResult.rows) {
    const outcomesResult = await db.query(
      `
        SELECT
          o.id,
          COALESCE(SUM(w.amount), 0)::float AS total_amount
        FROM outcomes o
        LEFT JOIN wagers w ON w.outcome_id = o.id
        WHERE o.market_id = $1
        GROUP BY o.id
        ORDER BY total_amount DESC, o.id ASC
      `,
      [market.id]
    );

    const winningOutcome = outcomesResult.rows[0];

    if (!winningOutcome) {
      continue;
    }

    try {
      await resolveMarket(market.id, winningOutcome.id);
    } catch (error) {
      if (error?.statusCode === 400 && error.message === 'This market has already been resolved') {
        continue;
      }

      throw error;
    }
  }
}

export { createMarket, resolveMarket, autoResolveExpiredMarkets };
