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
// search for variations

// resolve if win or lose

// something to talk to market about odds