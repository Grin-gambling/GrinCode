import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  query: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

const { createComment, getCommentsByMarketId } = await import('./commentModel.js');

describe('commentModel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('createComment inserts a comment and returns the saved row', async () => {
    mockDb.query.mockResolvedValue({
      rows: [{ id: 'comment-1', market_id: 'market-1', body: 'Hello' }],
    });

    const result = await createComment('market-1', 'Hello');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO comments'),
      ['market-1', 'Hello']
    );
    expect(result).toEqual({ id: 'comment-1', market_id: 'market-1', body: 'Hello' });
  });

  test('getCommentsByMarketId returns ordered comments for a market', async () => {
    mockDb.query.mockResolvedValue({
      rows: [{ id: 'comment-1' }, { id: 'comment-2' }],
    });

    const result = await getCommentsByMarketId('market-1');

    expect(mockDb.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY created_at ASC'),
      ['market-1']
    );
    expect(result).toEqual([{ id: 'comment-1' }, { id: 'comment-2' }]);
  });
});
