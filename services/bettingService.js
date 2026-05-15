// Shared database helper.
import db from '../db/db.js';
// Wager persistence helper.
import { createWager } from '../models/wagerModel.js';
// User balance update helper.
import { updateBalance } from '../models/userModel.js';

// -----------------------------------------------------------------------------
// Betting service
// -----------------------------------------------------------------------------
// This service handles the business rules for placing a wager.
//
// Workflow:
// 1. Validate request data.
// 2. Confirm the chosen outcome belongs to the chosen market.
// 3. Confirm the market is still open.
// 4. Lock the user's balance row.
// 5. Compute the implied odds snapshot.
// 6. Create the wager row.
// 7. Decrease the user's balance.

// Build a consistent error object with an attached HTTP status code.
function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Place one bet for one user on one outcome.
async function placeBet(userId, marketId, outcomeId, amount) {
  // Convert incoming amount to a number once at the top.
  const numericAmount = Number(amount);

  // The three ids are required to know who is betting on what.
  if (!userId || !marketId || !outcomeId) {
    throw createError('User ID, market ID, and outcome ID are required', 400);
  }

  // Stake must be a real positive number.
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw createError('Bet amount must be greater than 0', 400);
  }

  // Use a transaction because creating a wager and debiting balance must stay in sync.
  const client = await db.connect();

  try {
    // Start the transaction.
    await client.query('BEGIN');

    // Read the chosen outcome and the parent market state together.
    const outcomeResult = await client.query(
      `
        -- Return outcome identity plus the parent market status/close time.
        SELECT o.id, o.market_id, m.status, m.closes_at
        FROM outcomes o
        JOIN markets m ON m.id = o.market_id
        WHERE o.id = $1 AND o.market_id = $2
      `,
      [outcomeId, marketId]
    );

    // Pull out the first row because we expect either one matching outcome or none.
    const outcome = outcomeResult.rows[0];

    // Reject unknown outcomes or outcomes that belong to a different market.
    if (!outcome) {
      throw createError('Outcome does not belong to this market', 404);
    }

    // Betting is allowed only on open markets.
    if (outcome.status !== 'open') {
      throw createError('This market is no longer open for betting', 400);
    }

    // Even if status is still open, the close timestamp can still disallow new bets.
    if (outcome.closes_at && new Date(outcome.closes_at).getTime() <= Date.now()) {
      throw createError('This market is no longer open for betting', 400);
    }

    // Lock the user row so balance changes do not race with other concurrent updates.
    const userResult = await client.query(
      `
        -- Load the balance for the exact user placing the bet.
        SELECT id, balance
        FROM users
        WHERE id = $1
        -- FOR UPDATE prevents concurrent transactions from modifying this row at the same time.
        FOR UPDATE
      `,
      [userId]
    );

    // We expect either one user row or no user row.
    const user = userResult.rows[0];

    // Reject missing users early.
    if (!user) {
      throw createError('User not found', 404);
    }

    // Prevent users from spending more acorns than they own.
    if (Number(user.balance) < numericAmount) {
      throw createError('Not enough acorns to place this bet', 400);
    }

    // Gather current betting totals so we can snapshot the implied odds at bet time.
    const totalsResult = await client.query(
      `
        -- Sum only the selected outcome for one figure...
        SELECT
          COALESCE(SUM(CASE WHEN outcome_id = $2 THEN amount ELSE 0 END), 0)::float AS outcome_total,
          -- ...and sum every wager in the market for the full pool figure.
          COALESCE(SUM(amount), 0)::float AS market_total
        FROM wagers
        -- A market's wagers are reached through its outcomes.
        WHERE outcome_id IN (
          SELECT id
          FROM outcomes
          WHERE market_id = $1
        )
      `,
      [marketId, outcomeId]
    );

    // Rename the row fields into clearer local variables.
    const { outcome_total: outcomeTotal, market_total: marketTotal } = totalsResult.rows[0];

    // Convert the market totals into a simple implied-probability style number.
    // If nobody has bet yet, start at an even 50/50 default.
    const impliedProbability =
      Number(marketTotal) <= 0
        ? 50
        : ((Number(outcomeTotal) + numericAmount) / (Number(marketTotal) + numericAmount)) * 100;

    // Keep a tiny floor above 1 so it still satisfies the DB check constraint.
    const oddsAtBet = Math.max(1.001, impliedProbability);

    // Save the wager record first.
    const wager = await createWager(userId, outcomeId, numericAmount, oddsAtBet, client);
    // Then debit the user's current balance by the stake amount.
    const updatedUser = await updateBalance(
      userId,
      Number(user.balance) - numericAmount,
      client
    );

    // Finish the transaction.
    await client.query('COMMIT');

    // Return the wager plus the updated balance for the UI.
    return {
      ...wager,
      userBalance: Number(updatedUser.balance),
    };
  } catch (error) {
    // Undo any partial writes if a step fails.
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Return the client to the pool.
    client.release();
  }
}

// Export the betting service API.
export { placeBet };
