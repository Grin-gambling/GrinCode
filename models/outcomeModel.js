// Import the shared database helper.
import db from '../db/db.js';

// -----------------------------------------------------------------------------
// Outcome model
// -----------------------------------------------------------------------------
// Outcomes are the possible sides of a market, like "Yes" and "No".
// This file only stores and updates raw outcome rows.

// Reuse one shared list of columns so all outcome queries return the same shape.
const OUTCOME_COLUMNS = 'id, market_id, label, odds, is_winner';

// Insert one outcome for a market.
// Example: market "Will it rain?" might get outcomes "Yes" and "No".
async function createOutcome(marketId, label, client = db) {
  const result = await client.query(
    `
      -- Save the market relationship and the outcome label.
      INSERT INTO outcomes (market_id, label)
      VALUES ($1, $2)
      -- Return the inserted outcome row.
      RETURNING ${OUTCOME_COLUMNS}
    `,
    [marketId, label]
  );

  return result.rows[0];
}

// Update the displayed odds for one outcome.
// This helper is available even though the current app does not use it much yet.
async function changeOdds(outcomeId, newOdds, client = db) {
  const result = await client.query(
    `
      -- Modify just the odds value.
      UPDATE outcomes
      SET odds = $1
      WHERE id = $2
      RETURNING ${OUTCOME_COLUMNS}
    `,
    [newOdds, outcomeId]
  );

  return result.rows[0];
}

// Mark exactly one outcome as the winner.
// The service is responsible for clearing any previous winner first.
async function setWinner(outcomeId, client = db) {
  const result = await client.query(
    `
      -- Flip the winning flag on for this outcome.
      UPDATE outcomes
      SET is_winner = TRUE
      WHERE id = $1
      RETURNING ${OUTCOME_COLUMNS}
    `,
    [outcomeId]
  );

  return result.rows[0];
}

// Reset every outcome on a market so none of them are winners.
// This is a safety step before setting the final winner.
async function clearWinnersForMarket(marketId, client = db) {
  await client.query(
    `
      -- Clear the winner flag for all outcomes tied to one market.
      UPDATE outcomes
      SET is_winner = FALSE
      WHERE market_id = $1
    `,
    [marketId]
  );
}

// Fetch one outcome by id.
async function getOutcomeById(outcomeId, client = db) {
  const result = await client.query(
    `
      -- Return the standard outcome shape.
      SELECT ${OUTCOME_COLUMNS}
      FROM outcomes
      WHERE id = $1
    `,
    [outcomeId]
  );

  return result.rows[0];
}

// Export the outcome model API.
export {
  changeOdds,
  clearWinnersForMarket,
  createOutcome,
  getOutcomeById,
  setWinner,
};
