// Create a new transaction
async function createTransaction(user_id, amount, type, reference_id, client = db) {
    const query = `
      INSERT INTO transactions (user_id, amount, type, reference_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, amount, type, reference_is, created_at
    `;
    // in this case SQL is creating a new item in TABLE outcome
  
    const result = await client.query(query, [user_id, amount, type, reference_id]);
    return result.rows[0];
  }

// search variations

// execute (when bet finishes or when bet is placed), talks to user

module.exports = {
  createTransaction,
};

