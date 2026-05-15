// Shared database helper.
import db from '../db/db.js';
// Market persistence helpers.
import * as marketModel from '../models/marketModel.js';
// Outcome persistence helpers.
import * as outcomeModel from '../models/outcomeModel.js';
// Wager persistence helpers.
import * as wagerModel from '../models/wagerModel.js';
// User read/update helpers for payouts.
import { getUserById, updateBalance } from '../models/userModel.js';

// -----------------------------------------------------------------------------
// Market service
// -----------------------------------------------------------------------------
// This is the main business-rules layer for markets.
//
// Conceptual diagram:
//
// create flow
//   user request
//      -> validate
//      -> create market
//      -> create two outcomes
//
// resolve flow
//   closed market
//      -> verify winner belongs to market
//      -> mark outcome winner
//      -> mark wagers won/lost
//      -> pay winners
//      -> mark market resolved

// Build a consistent error object with an attached HTTP status code.
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Parse and validate the close time sent from the frontend.
function parseCloseTime(closesAt) {
  // Convert the incoming value to a Date once so all later checks use the same object.
  const parsedCloseTime = new Date(closesAt);

  // Reject impossible dates like "abc".
  if (Number.isNaN(parsedCloseTime.getTime())) {
    throw new Error('Invalid close time');
  }

  // Markets must close in the future, not the past or present.
  if (parsedCloseTime.getTime() <= Date.now()) {
    throw new Error('Close time must be in the future');
  }

  // Store the final value in a stable ISO format.
  return parsedCloseTime.toISOString();
}

// Convert a winning wager into its payout amount.
function calculatePayout(amount, oddsAtBet) {
  // Lower odds mean a larger payout multiplier, based on the app's current formula.
  const payoutMultiplier = 100 / Number(oddsAtBet);
  // Never pay less than the original amount staked.
  return Math.max(Number(amount), Math.round(Number(amount) * payoutMultiplier));
}

// Create a brand-new binary market.
async function createMarket(userId, question, description, outcome1, outcome2, closesAt) {
  // Open a transaction client because market creation is a multi-step write.
  const client = await db.connect();

  try {
    // Start the transaction.
    await client.query('BEGIN');

    // All required fields must exist before anything is written.
    if (!userId || !question || !description || !outcome1 || !outcome2 || !closesAt) {
      throw new Error('Invalid market data');
    }

    // Validate and normalize the closing timestamp.
    const closeTimeIso = parseCloseTime(closesAt);
    // Save the market row first.
    const market = await marketModel.createMarket(
      userId,
      question,
      description,
      closeTimeIso,
      client
    );

    // Create the first binary option.
    await outcomeModel.createOutcome(market.id, outcome1, client);
    // Create the second binary option.
    await outcomeModel.createOutcome(market.id, outcome2, client);

    // Finalize the transaction.
    await client.query('COMMIT');

    // Return the new market row.
    return market;
  } catch (error) {
    // Undo any partial work if market creation fails.
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Return the client to the pool.
    client.release();
  }
}

// Resolve a closed market by choosing the winning outcome.
async function resolveMarket(marketId, winningOutcomeId) {
  // Both ids are required for resolution.
  if (!marketId || !winningOutcomeId) {
    throw createError('Market ID and winning outcome are required', 400);
  }

  // Use a transaction because resolution updates several tables and balances.
  const client = await db.connect();

  try {
    // Start the transaction.
    await client.query('BEGIN');

    // Load lightweight market state first.
    const marketStatus = await marketModel.checkStatus(marketId, client);

    // Reject unknown markets.
    if (!marketStatus) {
      throw createError('Market not found', 404);
    }

    // Prevent double-resolution.
    if (marketStatus.status === 'resolved') {
      throw createError('This market has already been resolved', 400);
    }

    // Lock the market row to prevent concurrent resolution races.
    const marketDetailsResult = await client.query(
      `
        -- Lock the exact market row being resolved.
        SELECT id, status, closes_at
        FROM markets
        WHERE id = $1
        FOR UPDATE
      `,
      [marketId]
    );

    // Pull out the single market row.
    const market = marketDetailsResult.rows[0];

    // If the row disappeared between checks, treat it as missing.
    if (!market) {
      throw createError('Market not found', 404);
    }

    // Markets can only be resolved once they have truly closed.
    if (!market.closes_at || new Date(market.closes_at).getTime() > Date.now()) {
      throw createError('This market cannot be resolved before it closes', 400);
    }

    // Confirm the nominated winner exists.
    const winningOutcome = await outcomeModel.getOutcomeById(winningOutcomeId, client);

    // Reject winners that are not part of this market.
    if (!winningOutcome || winningOutcome.market_id !== marketId) {
      throw createError('Winning outcome does not belong to this market', 400);
    }

    // Gather all wagers that must be settled for this market.
    const wagers = await wagerModel.listWagersForMarket(marketId, client);

    // Clear old winner flags first as a safety measure.
    await outcomeModel.clearWinnersForMarket(marketId, client);
    // Set the final winning outcome.
    await outcomeModel.setWinner(winningOutcomeId, client);

    // Process each wager one by one.
    for (const wager of wagers) {
      // A wager wins only if it points at the winning outcome.
      const won = wager.outcome_id === winningOutcomeId;

      // Update the wager result to won or lost.
      await wagerModel.updateWagerStatus(wager.id, won ? 'won' : 'lost', client);

      // Losing wagers are done after the status update.
      if (!won) {
        continue;
      }

      // Load the user who placed the winning wager.
      const user = await getUserById(wager.user_id, client);

      // If the user no longer exists, skip payout rather than crashing the whole resolution.
      if (!user) {
        continue;
      }

      // Credit the winner's balance with the computed payout.
      await updateBalance(
        wager.user_id,
        Number(user.balance) + calculatePayout(wager.amount, wager.odds_at_bet),
        client
      );
    }

    // Mark the market as fully resolved after wagers are settled.
    const resolvedMarket = await marketModel.markMarketResolved(marketId, client);

    // Finalize the transaction.
    await client.query('COMMIT');

    // Return the resolved state and chosen winner.
    return {
      market: resolvedMarket,
      winningOutcomeId,
    };
  } catch (error) {
    // Undo partial settlement work if something fails.
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Return the client to the pool.
    client.release();
  }
}

// Automatically resolve every market that has passed its close time.
async function autoResolveExpiredMarkets() {
  // Find all markets that should no longer accept bets and are not already resolved.
  const expiredMarketsResult = await db.query(
    `
      -- We only need the ids here.
      SELECT id
      FROM markets
      WHERE status <> 'resolved'
        AND closes_at IS NOT NULL
        AND closes_at <= NOW()
      ORDER BY closes_at ASC
    `
  );

  // Process each expired market separately.
  for (const market of expiredMarketsResult.rows) {
    // Pick the outcome with the largest total amount staked.
    const outcomesResult = await db.query(
      `
        -- Return each outcome id plus the total amount bet on it.
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

    // The first row wins because the SQL sorts highest pool first.
    const winningOutcome = outcomesResult.rows[0];

    // Markets with no outcomes cannot be resolved automatically.
    if (!winningOutcome) {
      continue;
    }

    try {
      // Reuse the normal resolution logic so auto-resolution behaves exactly the same.
      await resolveMarket(market.id, winningOutcome.id);
    } catch (error) {
      // If another process resolved it first, skip quietly.
      if (
        error?.statusCode === 400 &&
        error.message === 'This market has already been resolved'
      ) {
        continue;
      }

      throw error;
    }
  }
}

// Export the market service API.
export { autoResolveExpiredMarkets, createMarket, resolveMarket };
