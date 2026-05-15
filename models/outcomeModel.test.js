import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  query: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

const {
  changeOdds,
  clearWinnersForMarket,
  createOutcome,
  getOutcomeById,
  setWinner,
} = await import('./outcomeModel.js');

describe('outcomeModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('createOutcome inserts a market outcome', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'outcome-1', market_id: 'market-1' }] });

    const result = await createOutcome('market-1', 'Yes');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO outcomes'),
      ['market-1', 'Yes']
    );
    expect(result).toEqual({ id: 'outcome-1', market_id: 'market-1' });
  });

  test('changeOdds updates the odds value', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'outcome-1', odds: 65 }] });

    const result = await changeOdds('outcome-1', 65);

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('SET odds = $1'),
      [65, 'outcome-1']
    );
    expect(result).toEqual({ id: 'outcome-1', odds: 65 });
  });

  test('setWinner marks one outcome as the winner', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'outcome-1', is_winner: true }] });

    const result = await setWinner('outcome-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('SET is_winner = TRUE'),
      ['outcome-1']
    );
    expect(result).toEqual({ id: 'outcome-1', is_winner: true });
  });

  test('clearWinnersForMarket resets winner flags for a market', async () => {
    mockDb.query.mockResolvedValue({ rows: [] });

    await clearWinnersForMarket('market-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('SET is_winner = FALSE'),
      ['market-1']
    );
  });

  test('getOutcomeById fetches a single outcome', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'outcome-1' }] });

    const result = await getOutcomeById('outcome-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      ['outcome-1']
    );
    expect(result).toEqual({ id: 'outcome-1' });
  });
});
