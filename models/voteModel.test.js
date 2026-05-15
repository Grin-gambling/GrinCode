import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  query: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

const {
  createVote,
  getVoteByMarketAndUserId,
  getVoteTotalsByMarketId,
} = await import('./voteModel.js');

describe('voteModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('createVote inserts a vote row', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'vote-1', vote_type: 'up' }] });

    const result = await createVote('market-1', 'user-1', 'up');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO market_votes'),
      ['market-1', 'user-1', 'up']
    );
    expect(result).toEqual({ id: 'vote-1', vote_type: 'up' });
  });

  test('getVoteByMarketAndUserId fetches one market/user vote pair', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'vote-1' }] });

    const result = await getVoteByMarketAndUserId('market-1', 'user-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE market_id = $1 AND user_id = $2'),
      ['market-1', 'user-1']
    );
    expect(result).toEqual({ id: 'vote-1' });
  });

  test('getVoteTotalsByMarketId returns aggregate totals', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ upvotes: 2, downvotes: 1 }] });

    const result = await getVoteTotalsByMarketId('market-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining("vote_type = 'up'"),
      ['market-1']
    );
    expect(result).toEqual({ upvotes: 2, downvotes: 1 });
  });
});
