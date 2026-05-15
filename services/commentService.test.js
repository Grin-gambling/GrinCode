import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockDb = {
  connect: vi.fn(),
};

const mockCommentModel = {
  createComment: vi.fn(),
  getCommentsByMarketId: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

vi.mock('../models/commentModel.js', () => mockCommentModel);

const { addComment, listComments } = await import('./commentService.js');

function createClient() {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
}

describe('commentService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('listComments requires a market id', async () => {
    await expect(listComments('')).rejects.toMatchObject({
      message: 'Market ID is required',
      statusCode: 400,
    });
  });

  test('listComments delegates to the model', async () => {
    mockCommentModel.getCommentsByMarketId.mockResolvedValue([{ id: 'comment-1' }]);

    await expect(listComments('market-1')).resolves.toEqual([{ id: 'comment-1' }]);
    expect(mockCommentModel.getCommentsByMarketId).toHaveBeenCalledWith('market-1');
  });

  test('addComment trims the body, persists the comment, and commits', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ rows: [{ id: 'market-1' }] })
      .mockResolvedValueOnce();
    mockCommentModel.createComment.mockResolvedValue({
      id: 'comment-1',
      market_id: 'market-1',
      body: 'hello there',
    });

    const result = await addComment('market-1', '  hello there  ');

    expect(mockCommentModel.createComment).toHaveBeenCalledWith('market-1', 'hello there', client);
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(result).toEqual({
      id: 'comment-1',
      market_id: 'market-1',
      body: 'hello there',
    });
  });

  test('addComment requires a market id', async () => {
    await expect(addComment('', 'body')).rejects.toMatchObject({
      message: 'Market ID is required',
      statusCode: 400,
    });
  });

  test('addComment requires a non-empty body', async () => {
    await expect(addComment('market-1', '   ')).rejects.toMatchObject({
      message: 'Comment body is required',
      statusCode: 400,
    });
  });

  test('addComment rejects unknown markets and rolls back', async () => {
    const client = createClient();
    mockDb.connect.mockResolvedValue(client);
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce();

    await expect(addComment('market-1', 'hello')).rejects.toMatchObject({
      message: 'Market not found',
      statusCode: 404,
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
