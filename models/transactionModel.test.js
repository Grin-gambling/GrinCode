import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  query: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

const { createTransaction, listTransactionsByUserId } = await import('./transactionModel.js');

describe('transactionModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('createTransaction inserts an audit row', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'txn-1', user_id: 'user-1' }] });

    const result = await createTransaction('user-1', 25, 'bet', 'wager-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO transactions'),
      ['user-1', 25, 'bet', 'wager-1']
    );
    expect(result).toEqual({ id: 'txn-1', user_id: 'user-1' });
  });

  test('listTransactionsByUserId returns newest-first history', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'txn-2' }, { id: 'txn-1' }] });

    const result = await listTransactionsByUserId('user-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY created_at DESC'),
      ['user-1']
    );
    expect(result).toEqual([{ id: 'txn-2' }, { id: 'txn-1' }]);
  });
});
