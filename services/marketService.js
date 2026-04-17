import db from '../db/db.js';
import * as marketModel from '../models/marketModel.js';
import * as outcomeModel from '../models/outcomeModel.js';

/**
 * Create a market with outcomes using user input
 * USE TO CONNECT TO FRONTEND 
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

export { createMarket };