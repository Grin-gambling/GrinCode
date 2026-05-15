import express from 'express';
import cors from 'cors';
import db from './db/db.js';
import { addComment, listComments } from './services/commentService.js';
import { placeBet } from './services/bettingService.js';
import { autoResolveExpiredMarkets, createMarket, resolveMarket } from './services/marketService.js';
import { castVote } from './services/voteService.js';
import {
  getUserBySessionToken,
  loginUser,
  logoutUser,
  registerUser,
} from './services/authService.js';
import { getTopUsersByBalance, updateBalance } from './models/userModel.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

async function ensureSupportTables() {
  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS closes_at TIMESTAMP
  `);

  await db.query(`
    ALTER TABLE markets
    ALTER COLUMN closes_at TYPE TIMESTAMPTZ
    USING closes_at AT TIME ZONE 'UTC'
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS market_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    ALTER TABLE market_votes
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE
  `);

  await db.query(`
    DELETE FROM market_votes
    WHERE user_id IS NULL
  `);

  await db.query(`
    ALTER TABLE market_votes
    ALTER COLUMN user_id SET NOT NULL
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_comments_market_id
    ON comments(market_id)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_market_votes_market_id
    ON market_votes(market_id)
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_market_votes_market_user_unique
    ON market_votes(market_id, user_id)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
    ON user_sessions(user_id)
  `);
}

async function authMiddleware(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization || '';
    const token = authorizationHeader.startsWith('Bearer ')
      ? authorizationHeader.slice(7).trim()
      : '';

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await getUserBySessionToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const authResult = await registerUser(username, email, password);
    res.status(201).json(authResult);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const authResult = await loginUser(email, password);
    res.json(authResult);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/me/balance', authMiddleware, async (req, res) => {
  try {
    const numericBalance = Math.floor(Number(req.body.balance));

    if (!Number.isFinite(numericBalance) || numericBalance < 0) {
      return res.status(400).json({ error: 'Balance must be a non-negative number' });
    }

    const updatedUserBalance = await updateBalance(req.user.id, numericBalance);

    res.json({
      user: {
        ...req.user,
        balance: Number(updatedUserBalance.balance),
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    const authorizationHeader = req.headers.authorization || '';
    const token = authorizationHeader.slice(7).trim();
    await logoutUser(token);
    res.status(204).send();
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/markets', authMiddleware, async (req, res) => {
  try {
    const { question, description, outcome1, outcome2, closesAt } = req.body;

    const market = await createMarket(
      req.user.id,
      question,
      description,
      outcome1,
      outcome2,
      closesAt
    );

    res.status(201).json(market);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/markets', async (req, res) => {
  try {
    await autoResolveExpiredMarkets();

    const result = await db.query(`
      SELECT
        m.id,
        m.question,
        m.description,
        CASE
          WHEN m.status = 'resolved' THEN 'resolved'
          WHEN m.closes_at IS NOT NULL AND m.closes_at <= NOW() THEN 'closed'
          ELSE m.status
        END AS status,
        m.closes_at,
        winner.id AS winning_outcome_id,
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
      LEFT JOIN outcomes winner ON winner.market_id = m.id AND winner.is_winner = TRUE
      LEFT JOIN wagers w ON o.id = w.outcome_id
      GROUP BY m.id, m.question, m.description, m.status, m.closes_at, m.created_at, winner.id, o.id, o.label
      ORDER BY m.created_at DESC, o.label ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const users = await getTopUsersByBalance(10);
    res.json(users);
  } catch (err) {
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

app.post('/api/markets/:marketId/votes', authMiddleware, async (req, res) => {
  try {
    const totals = await castVote(
      req.params.marketId,
      req.user.id,
      req.body.voteType
    );
    res.status(201).json(totals);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/markets/:marketId/bets', authMiddleware, async (req, res) => {
  try {
    const { marketId } = req.params;
    const { outcomeId, amount } = req.body;

    const wager = await placeBet(req.user.id, marketId, outcomeId, amount);
    res.status(201).json(wager);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

app.post('/api/markets/:marketId/resolve', authMiddleware, async (req, res) => {
  try {
    const resolved = await resolveMarket(
      req.params.marketId,
      req.body.winningOutcomeId
    );

    res.status(200).json(resolved);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

await ensureSupportTables();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
