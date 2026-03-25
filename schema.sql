-- Enable UUID generation
-- Done running, only used to initialize databases and tables used to store
-- users, markets (which are the bets people create), outcomes, 
-- wagers which are what users place, and transactions to moniter point movement
-- each comes with a unique ID, and other fields
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS (important info is username, password and balance)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ID
  username TEXT UNIQUE NOT NULL, -- username
  email TEXT UNIQUE NOT NULL, -- email
  password_hash TEXT NOT NULL, -- password
  balance NUMERIC(12,2) DEFAULT 0 CHECK (balance >= 0), -- points currently
  created_at TIMESTAMP DEFAULT NOW() -- time created
);


-- MARKETS (important info is the question)
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ID
  question TEXT NOT NULL, -- title
  market_type TEXT NOT NULL CHECK (market_type IN ('binary', 'multiple_choice')), -- type of bet
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'resolved')), -- open closed resolved
  created_at TIMESTAMP DEFAULT NOW() -- time created
);


-- OUTCOMES (important info are odds and market reference)
CREATE TABLE outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ID
  market_id UUID REFERENCES markets(id) ON DELETE CASCADE, -- what market it's part of
  label TEXT NOT NULL, -- what the bet is for
  odds NUMERIC(6,3) NOT NULL CHECK (odds > 1), -- odds
  is_winner BOOLEAN DEFAULT FALSE -- did this win yet
);


-- WAGERS (important info are user that made, what outcome, odds)
CREATE TABLE wagers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ID
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- which user made the wager
  outcome_id UUID REFERENCES outcomes(id) ON DELETE CASCADE, -- what outcome they picked
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0), -- how much they bet
  odds_at_bet NUMERIC(6,3) NOT NULL CHECK (odds_at_bet > 1), -- what were the odds when placed
  status TEXT NOT NULL DEFAULT 'pending' -- whether it's been concluded yet, and result
    CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMP DEFAULT NOW() -- time created
);


-- TRANSACTIONS (all important I guess)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ID
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- who made it
  amount NUMERIC(12,2) NOT NULL, -- how much money
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'bet', 'payout')), -- why this transaction
  reference_id UUID, -- the ID of the wager
  created_at TIMESTAMP DEFAULT NOW() -- time created
);


-- INDEXES 

CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_events_created_by ON events(created_by);

CREATE INDEX idx_markets_event_id ON markets(event_id);

CREATE INDEX idx_outcomes_market_id ON outcomes(market_id);

CREATE INDEX idx_wagers_user_id ON wagers(user_id);
CREATE INDEX idx_wagers_outcome_id ON wagers(outcome_id);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
