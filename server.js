import express from 'express';
import cors from 'cors';
import db from './db/db.js';
import { placeBet } from './services/bettingService.js';
import { createMarket } from './services/marketService.js';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/markets', async (req, res) => {
  try {
    const { question, description, outcome1, outcome2 } = req.body;

    const market = await createMarket(
      question,
      description,
      outcome1,
      outcome2
    );

    res.status(201).json(market);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/markets', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        m.id,
        m.question,
        m.description,
        o.id AS outcome_id,
        o.label,
        COALESCE(SUM(w.amount), 0)::float AS total_amount
      FROM markets m
      JOIN outcomes o ON m.id = o.market_id
      LEFT JOIN wagers w ON o.id = w.outcome_id
      GROUP BY m.id, m.question, m.description, m.created_at, o.id, o.label
      ORDER BY m.created_at DESC, o.label ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/markets/:marketId/bets', async (req, res) => {
  try {
    const { marketId } = req.params;
    const { outcomeId, amount } = req.body;

    const wager = await placeBet(marketId, outcomeId, amount);
    res.status(201).json(wager);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
