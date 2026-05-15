import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  connect: vi.fn(),
};

const mockWagerModel = {
  createWager: vi.fn(),
};

const mockUserModel = {
  updateBalance: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

vi.mock('../models/wagerModel.js', () => mockWagerModel);
vi.mock('../models/userModel.js', () => mockUserModel);

const { placeBet } = await import('./bettingService.js');

function createClient() {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
}

describe('bettingService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('placeBet creates the wager, deducts balance, and commits', async () => {
    const client = createClient();

    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'outcome-1', market_id: 'market-1', status: 'open', closes_at: null }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'user-1', balance: 100 }],
      })
      .mockResolvedValueOnce({
        rows: [{ outcome_total: 20, market_total: 50 }],
      })
      .mockResolvedValueOnce();
    mockWagerModel.createWager.mockResolvedValue({
      id: 'wager-1',
      outcome_id: 'outcome-1',
      amount: 10,
      odds_at_bet: 50,
    });
    mockUserModel.updateBalance.mockResolvedValue({ id: 'user-1', balance: 90 });

    const result = await placeBet('user-1', 'market-1', 'outcome-1', 10);

    expect(mockWagerModel.createWager).toHaveBeenCalledWith(
      'user-1',
      'outcome-1',
      10,
      50,
      client
    );
    expect(mockUserModel.updateBalance).toHaveBeenCalledWith('user-1', 90, client);
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(result).toEqual({
      id: 'wager-1',
      outcome_id: 'outcome-1',
      amount: 10,
      odds_at_bet: 50,
      userBalance: 90,
    });
  });

  test('placeBet rejects missing identifiers', async () => {
    await expect(placeBet('', 'market-1', 'outcome-1', 10)).rejects.toMatchObject({
      message: 'User ID, market ID, and outcome ID are required',
      statusCode: 400,
    });
  });

  test('placeBet rejects non-positive amounts', async () => {
    await expect(placeBet('user-1', 'market-1', 'outcome-1', 0)).rejects.toMatchObject({
      message: 'Bet amount must be greater than 0',
      statusCode: 400,
    });
  });

  test('placeBet rejects outcomes from another market', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce();

    await expect(placeBet('user-1', 'market-1', 'outcome-1', 10)).rejects.toMatchObject({
      message: 'Outcome does not belong to this market',
      statusCode: 404,
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  });

  test('placeBet rejects closed markets', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'outcome-1', market_id: 'market-1', status: 'resolved', closes_at: null }],
      })
      .mockResolvedValueOnce();

    await expect(placeBet('user-1', 'market-1', 'outcome-1', 10)).rejects.toMatchObject({
      message: 'This market is no longer open for betting',
      statusCode: 400,
    });
  });

  test('placeBet rejects expired markets even if status is open', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{
          id: 'outcome-1',
          market_id: 'market-1',
          status: 'open',
          closes_at: '2000-01-01T00:00:00.000Z',
        }],
      })
      .mockResolvedValueOnce();

    await expect(placeBet('user-1', 'market-1', 'outcome-1', 10)).rejects.toMatchObject({
      message: 'This market is no longer open for betting',
      statusCode: 400,
    });
  });

  test('placeBet rejects missing users', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'outcome-1', market_id: 'market-1', status: 'open', closes_at: null }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce();

    await expect(placeBet('user-1', 'market-1', 'outcome-1', 10)).rejects.toMatchObject({
      message: 'User not found',
      statusCode: 404,
    });
  });

  test('placeBet rejects insufficient balance', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'outcome-1', market_id: 'market-1', status: 'open', closes_at: null }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'user-1', balance: 5 }],
      })
      .mockResolvedValueOnce();

    await expect(placeBet('user-1', 'market-1', 'outcome-1', 10)).rejects.toMatchObject({
      message: 'Not enough acorns to place this bet',
      statusCode: 400,
    });
  });

  test('placeBet applies the minimum odds floor when implied probability is tiny', async () => {
    const client = createClient();

    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'outcome-1', market_id: 'market-1', status: 'open', closes_at: null }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'user-1', balance: 100 }],
      })
      .mockResolvedValueOnce({
        rows: [{ outcome_total: 0, market_total: 10000 }],
      })
      .mockResolvedValueOnce();
    mockWagerModel.createWager.mockResolvedValue({
      id: 'wager-1',
      outcome_id: 'outcome-1',
      amount: 1,
      odds_at_bet: 1.001,
    });
    mockUserModel.updateBalance.mockResolvedValue({ id: 'user-1', balance: 99 });

    await placeBet('user-1', 'market-1', 'outcome-1', 1);

    expect(mockWagerModel.createWager).toHaveBeenCalledWith(
      'user-1',
      'outcome-1',
      1,
      1.001,
      client
    );
  });
});
