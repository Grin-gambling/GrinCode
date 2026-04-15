const db = require('../db/db');
const marketModel = require('../models/marketModel');
const outcomeModel = require('../models/outcomeModel');


createMarket("Will Yousseff Show up", "What that says", "No way", "somehow yes")


/**
 * Create a market with outcomes using user input
 * USE TO CONNECT TO FRONTEND 
 * @param {string} question
 * @param {string} outcome1
 * @param {string} outcome2
 */

async function createMarket(question, content, outcome1, outcome2) {    
    const client = await db.connect();
  
    try {
      await client.query('BEGIN');
  
      // Validate inputs
      if (!question || !content) {
        throw new Error('Invalid market data');
      }
  
      // Create market 
      const market = await marketModel.createMarket(
        question,
        content,
        client
      );
  
      // Create outcome 1
      await outcomeModel.createOutcome(
        market.id,
        outcome1,
        client
      );

      // Create outcome 2
      await outcomeModel.createOutcome(
        market.id,
        outcome2,
        client
      );
  
      await client.query('COMMIT');
  
      return market;
  
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

module.exports = {
  createMarket,
};