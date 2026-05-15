import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  connect: vi.fn(),
};

const mockVoteModel = {
  createVote: vi.fn(),
  getVoteByMarketAndUserId: vi.fn(),
  getVoteTotalsByMarketId: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

vi.mock('../models/voteModel.js', () => mockVoteModel);

const { castVote } = await import('./voteService.js');

function createClient() {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
}

describe('voteService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('castVote requires market and user ids', async () => {
    await expect(castVote('', '', 'up')).rejects.toMatchObject({
      message: 'Market ID and user ID are required',
      statusCode: 400,
    });
  });

  test('castVote requires a valid vote type', async () => {
    await expect(castVote('market-1', 'user-1', 'sideways')).rejects.toMatchObject({
      message: 'Vote type must be up or down',
      statusCode: 400,
    });
  });

  test('castVote persists a vote, returns totals, and commits', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ rows: [{ id: 'market-1' }] })
      .mockResolvedValueOnce();
    mockVoteModel.getVoteByMarketAndUserId.mockResolvedValue(null);
    mockVoteModel.getVoteTotalsByMarketId.mockResolvedValue({ upvotes: 3, downvotes: 1 });

    const result = await castVote('market-1', 'user-1', 'up');

    expect(mockVoteModel.createVote).toHaveBeenCalledWith('market-1', 'user-1', 'up', client);
    expect(result).toEqual({ upvotes: 3, downvotes: 1 });
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
  });

  test('castVote rejects unknown markets', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce();

    await expect(castVote('market-1', 'user-1', 'up')).rejects.toMatchObject({
      message: 'Market not found',
      statusCode: 404,
    });
  });

  test('castVote rejects duplicate votes found before insert', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ rows: [{ id: 'market-1' }] })
      .mockResolvedValueOnce();
    mockVoteModel.getVoteByMarketAndUserId.mockResolvedValue({ id: 'vote-1' });

    await expect(castVote('market-1', 'user-1', 'up')).rejects.toMatchObject({
      message: 'You have already voted on this market',
      statusCode: 409,
    });
  });

  test('castVote translates unique constraint collisions into a duplicate-vote error', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ rows: [{ id: 'market-1' }] })
      .mockResolvedValueOnce();
    mockVoteModel.getVoteByMarketAndUserId.mockResolvedValue(null);
    mockVoteModel.createVote.mockRejectedValue({ code: '23505' });

    await expect(castVote('market-1', 'user-1', 'up')).rejects.toMatchObject({
      message: 'You have already voted on this market',
      statusCode: 409,
    });

    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  });
});
