import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  query: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

const { createWager, listWagersForMarket, updateWagerStatus } = await import('./wagerModel.js');

describe('wagerModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('createWager inserts a wager row', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'wager-1', amount: 10 }] });

    const result = await createWager('user-1', 'outcome-1', 10, 55);

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO wagers'),
      ['user-1', 'outcome-1', 10, 55]
    );
    expect(result).toEqual({ id: 'wager-1', amount: 10 });
  });

  test('listWagersForMarket joins outcomes back to the market', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'wager-1' }] });

    const result = await listWagersForMarket('market-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('JOIN outcomes o ON o.id = w.outcome_id'),
      ['market-1']
    );
    expect(result).toEqual([{ id: 'wager-1' }]);
  });

  test('updateWagerStatus writes the new wager status', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'wager-1', status: 'won' }] });

    const result = await updateWagerStatus('wager-1', 'won');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('SET status = $1'),
      ['won', 'wager-1']
    );
    expect(result).toEqual({ id: 'wager-1', status: 'won' });
  });
});
