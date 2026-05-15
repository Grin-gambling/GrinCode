import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  query: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

const {
  createUser,
  deleteUser,
  getTopUsersByBalance,
  getUserByEmail,
  getUserById,
  updateBalance,
} = await import('./userModel.js');

describe('userModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('createUser inserts a safe user row', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'user-1', username: 'monae' }] });

    const result = await createUser('monae', 'm@test.com', 'hash');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      ['monae', 'm@test.com', 'hash']
    );
    expect(result).toEqual({ id: 'user-1', username: 'monae' });
  });

  test('getUserById selects the safe user shape', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'user-1' }] });

    const result = await getUserById('user-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, username, email, balance, created_at'),
      ['user-1']
    );
    expect(result).toEqual({ id: 'user-1' });
  });

  test('getUserByEmail selects the auth user shape', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'user-1', password_hash: 'hash' }] });

    const result = await getUserByEmail('m@test.com');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('password_hash'),
      ['m@test.com']
    );
    expect(result).toEqual({ id: 'user-1', password_hash: 'hash' });
  });

  test('updateBalance writes the new balance', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'user-1', balance: 900 }] });

    const result = await updateBalance('user-1', 900);

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('SET balance = $1'),
      [900, 'user-1']
    );
    expect(result).toEqual({ id: 'user-1', balance: 900 });
  });

  test('getTopUsersByBalance returns leaderboard rows', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'user-1' }] });

    const result = await getTopUsersByBalance(5);

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY balance DESC, username ASC'),
      [5]
    );
    expect(result).toEqual([{ id: 'user-1' }]);
  });

  test('deleteUser removes one user row', async () => {
    mockDb.query.mockResolvedValue({ rows: [{ id: 'user-1' }] });

    const result = await deleteUser('user-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM users'),
      ['user-1']
    );
    expect(result).toEqual({ id: 'user-1' });
  });
});
