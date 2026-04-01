const db = require('../db/db');
const marketModel = require('../models/marketModel');
const outcomeModel = require('../models/outcomeModel');

/**
 * Create a market with outcomes using user input yay
 * @param {string} question
 * @param {string} outcome1
 * @param {string} outcome2
 */

async function createMarket(question, description, outcome1, outcome2) {    
    const client = await db.connect();
  
    try {
      await client.query('BEGIN');
  
      // Validate inputs
      if (!question || !description) {
        throw new Error('Invalid market data');
      }
  
      // Create market 
      const market = await marketModel.createMarket(
        question,
        description,
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