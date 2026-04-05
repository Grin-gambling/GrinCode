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
async function changeOdds(marketID, odds) {
  const query = `
    UPDATE outcomes
    SET odds = odds
    WHERE id = marketID
    RETURNING id, market_id, label, odds, is_winner
  `;
  // go in to table, find the one with the ID and set to new odds

  const result = await client.query(query, [marketID, odds]);
  return result.rows[0];
}

// make winner
async function changeOdds(marketID) {
  const query = `
    UPDATE outcomes
    SET is_winner = 'FALSE'
    WHERE id = marketID
    RETURNING id, market_id, label, odds, is_winner
  `;
  // go in to table, find the one with the ID and set to winner

  const result = await client.query(query, [marketID]);
  return result.rows[0];
}