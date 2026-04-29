import express from 'express';
import cors from 'cors';
import db from './db/db.js';
import { addComment, listComments } from './services/commentService.js';
import { placeBet } from './services/bettingService.js';
import { createMarket } from './services/marketService.js';
import { castVote } from './services/voteService.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

async function ensureSupportTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS market_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
      vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_comments_market_id
    ON comments(market_id)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_market_votes_market_id
    ON market_votes(market_id)
  `);
}

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
        COALESCE(SUM(w.amount), 0)::float AS total_amount,
        (
          SELECT COUNT(*)
          FROM market_votes mv
          WHERE mv.market_id = m.id AND mv.vote_type = 'up'
        )::int AS total_upvotes,
        (
          SELECT COUNT(*)
          FROM market_votes mv
          WHERE mv.market_id = m.id AND mv.vote_type = 'down'
        )::int AS total_downvotes
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

app.get('/api/markets/:marketId/comments', async (req, res) => {
  try {
    const comments = await listComments(req.params.marketId);
    res.json(comments);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/markets/:marketId/comments', async (req, res) => {
  try {
    const comment = await addComment(req.params.marketId, req.body.body);
    res.status(201).json(comment);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/markets/:marketId/votes', async (req, res) => {
  try {
    const totals = await castVote(req.params.marketId, req.body.voteType);
    res.status(201).json(totals);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
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

await ensureSupportTables();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
