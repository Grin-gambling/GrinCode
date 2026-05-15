import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  connect: vi.fn(),
  query: vi.fn(),
};

const mockMarketModel = {
  createMarket: vi.fn(),
  checkStatus: vi.fn(),
  markMarketResolved: vi.fn(),
};

const mockOutcomeModel = {
  createOutcome: vi.fn(),
  clearWinnersForMarket: vi.fn(),
  getOutcomeById: vi.fn(),
  setWinner: vi.fn(),
};

const mockWagerModel = {
  listWagersForMarket: vi.fn(),
  updateWagerStatus: vi.fn(),
};

const mockUserModel = {
  getUserById: vi.fn(),
  updateBalance: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

vi.mock('../models/marketModel.js', () => mockMarketModel);
vi.mock('../models/outcomeModel.js', () => mockOutcomeModel);
vi.mock('../models/wagerModel.js', () => mockWagerModel);
vi.mock('../models/userModel.js', () => mockUserModel);

const {
  autoResolveExpiredMarkets,
  createMarket,
  resolveMarket,
} = await import('./marketService.js');

function createClient() {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
}

describe('marketService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('createMarket validates input before inserting', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query.mockResolvedValueOnce().mockResolvedValueOnce();

    await expect(createMarket('', 'desc', 'yes', 'no', '2099-01-01T00:00:00.000Z')).rejects.toThrow('Invalid market data');
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
  });

  test('createMarket rejects invalid close times', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query.mockResolvedValueOnce().mockResolvedValueOnce();

    await expect(createMarket('Q?', 'desc', 'yes', 'no', 'not-a-date')).rejects.toThrow('Invalid close time');
  });

  test('createMarket rejects past close times', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query.mockResolvedValueOnce().mockResolvedValueOnce();

    await expect(createMarket('Q?', 'desc', 'yes', 'no', '2000-01-01T00:00:00.000Z')).rejects.toThrow('Close time must be in the future');
  });

  test('createMarket creates the market, both outcomes, and commits', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query.mockResolvedValueOnce().mockResolvedValueOnce();
    mockMarketModel.createMarket.mockResolvedValue({ id: 'market-1', question: 'Q?' });

    const result = await createMarket(
      'Q?',
      'desc',
      'yes',
      'no',
      '2099-01-01T00:00:00.000Z'
    );

    expect(mockMarketModel.createMarket).toHaveBeenCalledWith(
      'Q?',
      'desc',
      '2099-01-01T00:00:00.000Z',
      client
    );
    expect(mockOutcomeModel.createOutcome).toHaveBeenNthCalledWith(1, 'market-1', 'yes', client);
    expect(mockOutcomeModel.createOutcome).toHaveBeenNthCalledWith(2, 'market-1', 'no', client);
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(result).toEqual({ id: 'market-1', question: 'Q?' });
  });

  test('resolveMarket requires both ids', async () => {
    await expect(resolveMarket('', '')).rejects.toMatchObject({
      message: 'Market ID and winning outcome are required',
      statusCode: 400,
    });
  });

  test('resolveMarket rejects unknown markets', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query.mockResolvedValueOnce().mockResolvedValueOnce();
    mockMarketModel.checkStatus.mockResolvedValue(null);

    await expect(resolveMarket('market-1', 'outcome-1')).rejects.toMatchObject({
      message: 'Market not found',
      statusCode: 404,
    });
  });

  test('resolveMarket rejects already resolved markets', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query.mockResolvedValueOnce().mockResolvedValueOnce();
    mockMarketModel.checkStatus.mockResolvedValue({ id: 'market-1', status: 'resolved' });

    await expect(resolveMarket('market-1', 'outcome-1')).rejects.toMatchObject({
      message: 'This market has already been resolved',
      statusCode: 400,
    });
  });

  test('resolveMarket rejects markets that have not closed yet', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'market-1', status: 'open', closes_at: '2099-01-01T00:00:00.000Z' }],
      })
      .mockResolvedValueOnce();
    mockMarketModel.checkStatus.mockResolvedValue({ id: 'market-1', status: 'open' });

    await expect(resolveMarket('market-1', 'outcome-1')).rejects.toMatchObject({
      message: 'This market cannot be resolved before it closes',
      statusCode: 400,
    });
  });

  test('resolveMarket rejects outcomes from another market', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'market-1', status: 'open', closes_at: '2000-01-01T00:00:00.000Z' }],
      })
      .mockResolvedValueOnce();
    mockMarketModel.checkStatus.mockResolvedValue({ id: 'market-1', status: 'open' });
    mockOutcomeModel.getOutcomeById.mockResolvedValue({ id: 'outcome-1', market_id: 'market-2' });

    await expect(resolveMarket('market-1', 'outcome-1')).rejects.toMatchObject({
      message: 'Winning outcome does not belong to this market',
      statusCode: 400,
    });
  });

  test('resolveMarket marks winners and losers, pays out winners, and commits', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'market-1', status: 'open', closes_at: '2000-01-01T00:00:00.000Z' }],
      })
      .mockResolvedValueOnce();
    mockMarketModel.checkStatus.mockResolvedValue({ id: 'market-1', status: 'open' });
    mockOutcomeModel.getOutcomeById.mockResolvedValue({ id: 'outcome-1', market_id: 'market-1' });
    mockWagerModel.listWagersForMarket.mockResolvedValue([
      { id: 'wager-win', user_id: 'user-1', outcome_id: 'outcome-1', amount: 20, odds_at_bet: 40 },
      { id: 'wager-lose', user_id: 'user-2', outcome_id: 'outcome-2', amount: 10, odds_at_bet: 60 },
    ]);
    mockUserModel.getUserById.mockResolvedValue({ id: 'user-1', balance: 50 });
    mockMarketModel.markMarketResolved.mockResolvedValue({ id: 'market-1', status: 'resolved' });
    client.query.mockResolvedValueOnce();

    const result = await resolveMarket('market-1', 'outcome-1');

    expect(mockOutcomeModel.clearWinnersForMarket).toHaveBeenCalledWith('market-1', client);
    expect(mockOutcomeModel.setWinner).toHaveBeenCalledWith('outcome-1', client);
    expect(mockWagerModel.updateWagerStatus).toHaveBeenNthCalledWith(1, 'wager-win', 'won', client);
    expect(mockWagerModel.updateWagerStatus).toHaveBeenNthCalledWith(2, 'wager-lose', 'lost', client);
    expect(mockUserModel.updateBalance).toHaveBeenCalledWith('user-1', 100, client);
    expect(mockMarketModel.markMarketResolved).toHaveBeenCalledWith('market-1', client);
    expect(result).toEqual({
      market: { id: 'market-1', status: 'resolved' },
      winningOutcomeId: 'outcome-1',
    });
  });

  test('resolveMarket skips payout when the winning user no longer exists', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'market-1', status: 'open', closes_at: '2000-01-01T00:00:00.000Z' }],
      })
      .mockResolvedValueOnce();
    mockMarketModel.checkStatus.mockResolvedValue({ id: 'market-1', status: 'open' });
    mockOutcomeModel.getOutcomeById.mockResolvedValue({ id: 'outcome-1', market_id: 'market-1' });
    mockWagerModel.listWagersForMarket.mockResolvedValue([
      { id: 'wager-win', user_id: 'user-1', outcome_id: 'outcome-1', amount: 20, odds_at_bet: 40 },
    ]);
    mockUserModel.getUserById.mockResolvedValue(null);
    mockMarketModel.markMarketResolved.mockResolvedValue({ id: 'market-1', status: 'resolved' });
    client.query.mockResolvedValueOnce();

    await resolveMarket('market-1', 'outcome-1');

    expect(mockUserModel.updateBalance).not.toHaveBeenCalled();
  });

  test('autoResolveExpiredMarkets resolves each expired market using the biggest pool', async () => {
    const clientOne = createClient();
    const clientTwo = createClient();

    mockDb.query
      .mockResolvedValueOnce({
        rows: [{ id: 'market-1' }, { id: 'market-2' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'outcome-2', total_amount: 50 }, { id: 'outcome-1', total_amount: 10 }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'outcome-3', total_amount: 15 }],
      });
    mockDb.connect
      .mockResolvedValueOnce(clientOne)
      .mockResolvedValueOnce(clientTwo);
    clientOne.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'market-1', status: 'open', closes_at: '2000-01-01T00:00:00.000Z' }],
      })
      .mockResolvedValueOnce();
    clientTwo.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({
        rows: [{ id: 'market-2', status: 'open', closes_at: '2000-01-01T00:00:00.000Z' }],
      })
      .mockResolvedValueOnce();
    mockMarketModel.checkStatus
      .mockResolvedValueOnce({ id: 'market-1', status: 'open' })
      .mockResolvedValueOnce({ id: 'market-2', status: 'open' });
    mockOutcomeModel.getOutcomeById
      .mockResolvedValueOnce({ id: 'outcome-2', market_id: 'market-1' })
      .mockResolvedValueOnce({ id: 'outcome-3', market_id: 'market-2' });
    mockWagerModel.listWagersForMarket
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockMarketModel.markMarketResolved
      .mockResolvedValueOnce({ id: 'market-1', status: 'resolved' })
      .mockResolvedValueOnce({ id: 'market-2', status: 'resolved' });

    await autoResolveExpiredMarkets();

    expect(mockOutcomeModel.setWinner).toHaveBeenNthCalledWith(1, 'outcome-2', clientOne);
    expect(mockOutcomeModel.setWinner).toHaveBeenNthCalledWith(2, 'outcome-3', clientTwo);
    expect(mockMarketModel.markMarketResolved).toHaveBeenNthCalledWith(1, 'market-1', clientOne);
    expect(mockMarketModel.markMarketResolved).toHaveBeenNthCalledWith(2, 'market-2', clientTwo);
  });

  test('autoResolveExpiredMarkets ignores markets with no outcomes', async () => {
    mockDb.query
      .mockResolvedValueOnce({
        rows: [{ id: 'market-1' }],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    await autoResolveExpiredMarkets();

    expect(mockDb.connect).not.toHaveBeenCalled();
  });
});
