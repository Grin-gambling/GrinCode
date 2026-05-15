-- ============================================================================
-- GrinCode database schema
-- ============================================================================
-- Read this file from top to bottom like a story:
-- 1. create the UUID extension
-- 2. create the main tables
-- 3. connect those tables with foreign keys
-- 4. add indexes for the most common lookups
--
-- This schema is the backbone for the app's market lifecycle:
--
--   users -> create markets -> markets own outcomes
--      |                          |
--      |                          +-> wagers reference outcomes
--      |                          +-> comments reference markets
--      |                          +-> votes reference markets
--      |
--      +-> sessions authenticate requests
--      +-> transactions provide an audit trail for point movement
--
-- Relationship sketch:
--
--   users
--    |  \
--    |   \__ user_sessions
--    |
--    +------ markets ------ comments
--    |           |
--    |           +------ outcomes ------ wagers
--    |
--    +------ market_votes
--    |
--    +------ transactions
--
-- Design notes:
-- - UUIDs are used for every top-level entity.
-- - TIMESTAMPTZ is used for market close times because closing behavior is
--   time-sensitive and should be timezone-safe.
-- - Cascading deletes keep dependent records from becoming orphaned.
-- ============================================================================

-- Turn on the extension that gives Postgres the `gen_random_uuid()` function.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users store identity, auth data, and the current acorn balance.
CREATE TABLE users (
  -- Unique primary key for each user.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Display name chosen by the user. Must be unique.
  username TEXT UNIQUE NOT NULL,
  -- Email address used for login. Must be unique.
  email TEXT UNIQUE NOT NULL,
  -- Secure password hash, never plaintext.
  password_hash TEXT NOT NULL,
  -- Current acorn balance. The check prevents negative stored balances.
  balance NUMERIC(12, 0) NOT NULL DEFAULT 1000 CHECK (balance >= 0),
  -- Timestamp for account creation.
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Markets are the top-level betting objects created by users.
CREATE TABLE markets (
  -- Unique primary key for each market.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The user who created the market. Cascade delete removes their markets if the user is removed.
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  -- Short title/question shown in the UI.
  question TEXT NOT NULL,
  -- Longer explanation of the bet.
  description TEXT NOT NULL,
  -- Market format. Right now the app mainly uses binary.
  market_type TEXT NOT NULL DEFAULT 'binary'
    CHECK (market_type IN ('binary', 'multiple_choice')),
  -- Lifecycle state for the market.
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'resolved')),
  -- When betting should stop.
  closes_at TIMESTAMPTZ,
  -- Timestamp for market creation.
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Outcomes define the available sides/options for a market.
CREATE TABLE outcomes (
  -- Unique primary key for each outcome.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Parent market for this outcome.
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  -- Human-readable label like "Yes" or "No".
  label TEXT NOT NULL,
  -- Stored odds number used by the app's calculations.
  odds NUMERIC(6, 3) NOT NULL DEFAULT 50 CHECK (odds > 1),
  -- Whether this outcome has been marked as the winner.
  is_winner BOOLEAN NOT NULL DEFAULT FALSE
);

-- Wagers snapshot the user's bet and the implied odds at placement time.
CREATE TABLE wagers (
  -- Unique primary key for each wager.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- User who placed the bet.
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Outcome the user selected.
  outcome_id UUID NOT NULL REFERENCES outcomes(id) ON DELETE CASCADE,
  -- Amount staked on this wager.
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  -- Odds snapshot saved at the moment the wager was placed.
  odds_at_bet NUMERIC(6, 3) NOT NULL CHECK (odds_at_bet > 1),
  -- Settlement result for this wager.
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'won', 'lost')),
  -- Timestamp for when the wager was placed.
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transactions are the future-proof audit log for balance movement.
CREATE TABLE transactions (
  -- Unique primary key for each transaction.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- User whose balance changed.
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Amount moved in the transaction.
  amount NUMERIC(12, 2) NOT NULL,
  -- Why the balance changed.
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bet', 'payout')),
  -- Optional reference to the related entity, such as a wager.
  reference_id UUID,
  -- Timestamp for the audit event.
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Comments allow discussion on a market.
CREATE TABLE comments (
  -- Unique primary key for each comment.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Parent market for this comment.
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  -- The comment text itself.
  body TEXT NOT NULL,
  -- Timestamp for when the comment was created.
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sessions map bearer tokens to authenticated users.
CREATE TABLE user_sessions (
  -- Random bearer token used by the client.
  token TEXT PRIMARY KEY,
  -- User who owns the token.
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Timestamp for when the session was created.
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Votes capture market sentiment independently of wager amounts.
CREATE TABLE market_votes (
  -- Unique primary key for each vote.
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Market being voted on.
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  -- User casting the vote.
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Only two vote directions are valid in the current app.
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  -- Timestamp for when the vote was created.
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Index strategy
-- ============================================================================
-- These indexes target the hottest read paths in the app:
-- - leaderboard lookups
-- - market -> outcome/wager fan-out
-- - user history lookups
-- - comment / vote / session lookups
-- ============================================================================

-- Speeds up username lookups.
CREATE INDEX idx_users_username ON users(username);

-- Speeds up market queries by creator.
CREATE INDEX idx_markets_user_id ON markets(user_id);
-- Helps queries that scan by market status and close time.
CREATE INDEX idx_markets_status_closes_at ON markets(status, closes_at);

-- Speeds up fetching all outcomes for one market.
CREATE INDEX idx_outcomes_market_id ON outcomes(market_id);

-- Speeds up fetching a user's wagers.
CREATE INDEX idx_wagers_user_id ON wagers(user_id);
-- Speeds up fetching wagers for a particular outcome.
CREATE INDEX idx_wagers_outcome_id ON wagers(outcome_id);

-- Speeds up account-history style reads.
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Speeds up comment-thread reads per market.
CREATE INDEX idx_comments_market_id ON comments(market_id);

-- Speeds up market vote totals and lookups.
CREATE INDEX idx_market_votes_market_id ON market_votes(market_id);
-- Enforces one vote per user per market.
CREATE UNIQUE INDEX idx_market_votes_market_user_unique
  ON market_votes(market_id, user_id);

-- Speeds up session cleanup and user-session lookups.
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
