import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  query: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

const {
  checkStatus,
  closeMarket,
  createMarket,
  getMarketById,
  getMarketByQuestion,
  markMarketResolved,
} = await import('./marketModel.js');

describe('marketModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('createMarket inserts a market with user ownership', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'market-1', user_id: 'user-1' }] });

    const result = await createMarket('user-1', 'Q?', 'Desc', '2099-01-01T00:00:00.000Z');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO markets (user_id, question, description, closes_at)'),
      ['user-1', 'Q?', 'Desc', '2099-01-01T00:00:00.000Z']
    );
    expect(result).toEqual({ id: 'market-1', user_id: 'user-1' });
  });

  test('closeMarket updates the market status to closed', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'market-1', status: 'closed' }] });

    const result = await closeMarket('market-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'closed'"),
      ['market-1']
    );
    expect(result).toEqual({ id: 'market-1', status: 'closed' });
  });

  test('markMarketResolved updates the market status to resolved', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'market-1', status: 'resolved' }] });

    const result = await markMarketResolved('market-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining("SET status = 'resolved'"),
      ['market-1']
    );
    expect(result).toEqual({ id: 'market-1', status: 'resolved' });
  });

  test('checkStatus selects market state metadata', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'market-1', status: 'open' }] });

    const result = await checkStatus('market-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, user_id, question, status, closes_at'),
      ['market-1']
    );
    expect(result).toEqual({ id: 'market-1', status: 'open' });
  });

  test('getMarketById selects the correct question column', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'market-1', question: 'Q?' }] });

    const result = await getMarketById('market-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('question'),
      ['market-1']
    );
    expect(result).toEqual({ id: 'market-1', question: 'Q?' });
  });

  test('getMarketByQuestion looks up a market by question text', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'market-1', question: 'Q?' }] });

    const result = await getMarketByQuestion('Q?');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE question = $1'),
      ['Q?']
    );
    expect(result).toEqual({ id: 'market-1', question: 'Q?' });
  });
});
