const db = require('../db/db');

// The way this works is basically const query is a bit of SQL input
// The rest of it is just details of that market, and what we return I guess


// Create a new market
async function createMarket(question, market_type) {
  const query = `
    INSERT INTO markets (question, market_type)
    VALUES ($1, $2)
    RETURNING id, question, market_type, status, created_at
  `;
  // in this case SQL is creating a new item in TABLE users

  const values = [question, market_type];
  const result = await db.query(query, values);

  return result.rows[0];
}

// adjust odd function (hard)

// resolve/close function

// check status

// all the different search variations

// Get market by ID
async function getMarketById(marketID) {
    const query = `
      SELECT id, qustion, market_type, status, created_at
      FROM markets
      WHERE id = $1
    `;
    // here we are searching the TABLE by their id
  
    const result = await db.query(query, [marketID]);
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
  
    const result = await db.query(query, [question]);
    return result.rows[0];
  }






