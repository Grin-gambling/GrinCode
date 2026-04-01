// Create a new wager
async function createWager(user_id, outcome_id, amount, odds_at_bet, client = db) {
    const query = `
      INSERT INTO wagers (user_id, outcome_id, amount, odds_at_bet)
      VALUES ($1. $2, $3, $4)
      RETURNING id, user_id, outcome_id, amount, odds_at_bet, status, created_at
    `;
    // in this case SQL is creating a new item in TABLE outcome
  
    const result = await client.query(query, [user_id, outcome_id, amount, odds_at_bet]);
    return result.rows[0];
  }

// find 

// help to update odds for market/outcomes

// check if winner or loser (called when market closes/resolves)

// mark as win or lose, and trigger transaction