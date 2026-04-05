const db = require('../db/db');

// The way this works is basically const query is a bit of SQL input
// The rest of it is just details of that market, and what we return I guess


// Create a new market 
async function createMarket(question, description, client = db) {
  const query = `
    INSERT INTO markets (question, description)
    VALUES ($1, $2)
    RETURNING id, user_id, question, market_type, status, created_at
  `;

  const result = await client.query(query, [question, description]);
  return result.rows[0];
}

// resolve/close function
async function resolveMarket(marketID) {
  const query = `
    UPDATE markets
    SET status = 'closed'
    WHERE id = marketID
    RETURNING id, user_id, question, market_type, status, created_at
  `;
  // go in to table, find the one with the ID and set to closed

  const result = await client.query(query, [marketID]);
  return result.rows[0];
}

// check status
async function checkStatus(marketID) {
  const query = `
    SELECT id, question, status
    FROM markets
    WHERE id = $1
  `;
  // go in to table, find the one with the ID and check if closed or not

  const result = await client.query(query, [marketID]);
  return result.rows[0];
}

// all the different search variations

// Get market by ID
async function getMarketById(marketID) {
    const query = `
      SELECT id, qustion, market_type, status, created_at
      FROM markets
      WHERE id = $1
    `;
    // here we are searching the TABLE by their id
  
    const result = await client.query(query, [marketID]);
    return result.rows[0];
  }

// Get market by question 
async function getMarketByQuestion(question) {
    const query = `
      SELECT id, qustion, market_type, status, created_at
      FROM markets
      WHERE question = $1
    `;
    // here we are searching the TABLE by the question
  
    const result = await client.query(query, [question]);
    return result.rows[0];
  }






