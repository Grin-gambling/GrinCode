// Import the shared database helper.
import db from '../db/db.js';

// Shared wager columns for consistent query results.
const WAGER_COLUMNS = 'id, user_id, outcome_id, amount, odds_at_bet, status, created_at';

// Insert one bet into the wagers table.
async function createWager(userId, outcomeId, amount, oddsAtBet, client = db) {
  const result = await client.query(
    `
      -- Save the user, outcome, stake amount, and odds snapshot.
      INSERT INTO wagers (user_id, outcome_id, amount, odds_at_bet)
      VALUES ($1, $2, $3, $4)
      -- Return the final stored row.
      RETURNING ${WAGER_COLUMNS}
    `,
    [userId, outcomeId, amount, oddsAtBet]
  );

  return result.rows[0];
}

// Return all wagers for one market.
// We reach the market through the outcomes table because wagers belong to outcomes.
async function listWagersForMarket(marketId, client = db) {
  const result = await client.query(
    `
      SELECT
        w.id,
        w.user_id,
        w.outcome_id,
        w.amount,
        w.odds_at_bet,
        w.status
      -- Wagers know outcomes directly.
      FROM wagers w
      -- Outcomes connect each wager back to a market.
      JOIN outcomes o ON o.id = w.outcome_id
      WHERE o.market_id = $1
      -- Oldest first gives a stable settlement order.
      ORDER BY w.created_at ASC
    `,
    [marketId]
  );

  return result.rows;
}

// Change a wager status to "won" or "lost".
async function updateWagerStatus(wagerId, status, client = db) {
  const result = await client.query(
    `
      -- Update only the status field.
      UPDATE wagers
      SET status = $1
      WHERE id = $2
      -- Return the updated wager row.
      RETURNING ${WAGER_COLUMNS}
    `,
    [status, wagerId]
  );

  return result.rows[0];
}

// Export the wager model API.
export { createWager, listWagersForMarket, updateWagerStatus };
