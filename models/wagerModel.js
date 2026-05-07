import db from '../db/db.js';

// Create a new wager
async function createWager(user_id, outcome_id, amount, odds_at_bet, client = db) {
  const query = `
    INSERT INTO wagers (user_id, outcome_id, amount, odds_at_bet)
    VALUES ($1, $2, $3, $4)
    RETURNING id, user_id, outcome_id, amount, odds_at_bet, status, created_at
  `;

  const result = await client.query(query, [
    user_id,
    outcome_id,
    amount,
    odds_at_bet,
  ]);

  return result.rows[0];
}

async function listWagersForMarket(marketId, client = db) {
  const query = `
    SELECT
      w.id,
      w.user_id,
      w.outcome_id,
      w.amount,
      w.odds_at_bet,
      w.status
    FROM wagers w
    JOIN outcomes o ON o.id = w.outcome_id
    WHERE o.market_id = $1
    ORDER BY w.created_at ASC
  `;

  const result = await client.query(query, [marketId]);
  return result.rows;
}

async function updateWagerStatus(wagerId, status, client = db) {
  const query = `
    UPDATE wagers
    SET status = $1
    WHERE id = $2
    RETURNING id, user_id, outcome_id, amount, odds_at_bet, status, created_at
  `;

  const result = await client.query(query, [status, wagerId]);
  return result.rows[0];
}

export {
  createWager,
  listWagersForMarket,
  updateWagerStatus,
};
