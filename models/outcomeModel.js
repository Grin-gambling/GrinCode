import db from '../db/db.js';

// Create a new market
async function createOutcome(market_id, label, client = db) {
    const query = `
      INSERT INTO outcomes (market_id, label)
      VALUES ($1, $2)
      RETURNING id, market_id, label, odds, is_winner
    `;
    // in this case SQL is creating a new item in TABLE outcome
  
    const result = await client.query(query, [market_id, label]);
    return result.rows[0];
  }

// resolve if win or lose

// change odds
async function changeOdds(outcomeID, newOdds, client = db) {
  const query = `
    UPDATE outcomes
    SET odds = $1
    WHERE id = $2
    RETURNING id, market_id, label, odds, is_winner
  `;

  const result = await client.query(query, [newOdds, outcomeID]);
  return result.rows[0];
}

// set winner
async function setWinner(outcomeID, client = db) {
  const query = `
    UPDATE outcomes
    SET is_winner = TRUE
    WHERE id = $1
    RETURNING id, market_id, label, odds, is_winner
  `;

  const result = await client.query(query, [outcomeID]);
  return result.rows[0];
}

export {
  createOutcome,
  changeOdds,
  setWinner,
};
