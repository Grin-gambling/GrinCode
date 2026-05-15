import { beforeEach, describe, expect, test, vi } from 'vitest';
import crypto from 'crypto';

const mockDb = {
  connect: vi.fn(),
  query: vi.fn(),
};

const mockUserModel = {
  createUser: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
};

vi.mock('../db/db.js', () => ({
  default: mockDb,
}));

vi.mock('../models/userModel.js', () => mockUserModel);

const {
  getUserBySessionToken,
  loginUser,
  logoutUser,
  registerUser,
} = await import('./authService.js');

function createClient() {
  return {
    query: vi.fn(),
    release: vi.fn(),
  };
}

describe('authService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('registerUser normalizes email, hashes password, creates a session, and commits', async () => {
    const client = createClient();

    mockDb.connect.mockResolvedValue(client);
    mockUserModel.getUserByEmail.mockResolvedValue(null);
    mockUserModel.createUser.mockResolvedValue({
      id: 'user-1',
      username: 'Monae',
      email: 'user@example.com',
      balance: 1000,
      created_at: '2026-05-14T00:00:00.000Z',
    });
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ rows: [{ token: 'session-token' }] })
      .mockResolvedValueOnce();

    const result = await registerUser('  Monae  ', '  USER@Example.com ', 'password123');

    expect(mockUserModel.getUserByEmail).toHaveBeenCalledWith('user@example.com');
    expect(mockUserModel.createUser).toHaveBeenCalledWith(
      'Monae',
      'user@example.com',
      expect.stringMatching(/^[0-9a-f]+:[0-9a-f]+$/),
      client
    );
    const sessionInsertCall = client.query.mock.calls[1];
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(sessionInsertCall[0]).toContain('INSERT INTO user_sessions');
    expect(sessionInsertCall[1][0]).toEqual(expect.any(String));
    expect(sessionInsertCall[1][1]).toBe('user-1');
    expect(client.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(client.release).toHaveBeenCalled();
    expect(result).toEqual({
      token: 'session-token',
      user: expect.objectContaining({ id: 'user-1', email: 'user@example.com' }),
    });
  });

  test('registerUser rejects missing required fields', async () => {
    await expect(registerUser('', '', '')).rejects.toMatchObject({
      message: 'Username, email, and password are required',
      statusCode: 400,
    });
  });

  test('registerUser rejects short passwords', async () => {
    await expect(registerUser('Monae', 'user@example.com', 'short')).rejects.toMatchObject({
      message: 'Password must be at least 8 characters long',
      statusCode: 400,
    });
  });

  test('registerUser rejects duplicate emails before opening a transaction', async () => {
    mockUserModel.getUserByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(registerUser('Monae', 'user@example.com', 'password123')).rejects.toMatchObject({
      message: 'An account with that email already exists',
      statusCode: 409,
    });

    expect(mockDb.connect).not.toHaveBeenCalled();
  });

  test('registerUser rolls back and releases the client when persistence fails', async () => {
    const client = createClient();

    mockDb.connect.mockResolvedValue(client);
    mockUserModel.getUserByEmail.mockResolvedValue(null);
    mockUserModel.createUser.mockRejectedValue(new Error('insert failed'));
    client.query.mockResolvedValueOnce().mockResolvedValueOnce();

    await expect(registerUser('Monae', 'user@example.com', 'password123')).rejects.toThrow('insert failed');

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, 'ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  test('loginUser creates a session and returns the safe user record', async () => {
    const client = createClient();
    const salt = '0123456789abcdef0123456789abcdef';
    const passwordHash = `${salt}:${crypto.scryptSync('password123', salt, 64).toString('hex')}`;

    mockDb.connect.mockResolvedValue(client);
    mockUserModel.getUserByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password_hash: passwordHash,
    });
    mockUserModel.getUserById.mockResolvedValue({
      id: 'user-1',
      username: 'Monae',
      email: 'user@example.com',
      balance: 1000,
      created_at: '2026-05-14T00:00:00.000Z',
    });
    client.query
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ rows: [{ token: 'login-token' }] })
      .mockResolvedValueOnce();

    const result = await loginUser(' USER@example.com ', 'password123');

    expect(mockUserModel.getUserByEmail).toHaveBeenCalledWith('user@example.com');
    expect(mockUserModel.getUserById).toHaveBeenCalledWith('user-1', client);
    expect(result).toEqual({
      token: 'login-token',
      user: expect.objectContaining({ id: 'user-1', username: 'Monae' }),
    });
  });

  test('loginUser rejects invalid credentials', async () => {
    mockUserModel.getUserByEmail.mockResolvedValue(null);

    await expect(loginUser('user@example.com', 'password123')).rejects.toMatchObject({
      message: 'Email or password is incorrect',
      statusCode: 401,
    });
  });

  test('loginUser rejects missing credentials', async () => {
    await expect(loginUser('', '')).rejects.toMatchObject({
      message: 'Email and password are required',
      statusCode: 400,
    });
  });

  test('getUserBySessionToken returns null when token is missing', async () => {
    await expect(getUserBySessionToken('')).resolves.toBeNull();
    expect(mockDb.query).not.toHaveBeenCalled();
  });

  test('getUserBySessionToken returns the matched user', async () => {
    mockDb.query.mockResolvedValue({
      rows: [{ id: 'user-1', username: 'Monae' }],
    });

    await expect(getUserBySessionToken('session-token')).resolves.toEqual({
      id: 'user-1',
      username: 'Monae',
    });
  });

  test('logoutUser deletes the session when a token is provided', async () => {
    mockDb.query.mockResolvedValue({ rows: [] });

    await logoutUser('session-token');

    expect(mockDb.query).toHaveBeenCalledWith(
      'DELETE FROM user_sessions WHERE token = $1',
      ['session-token']
    );
  });

  test('logoutUser is a no-op when token is missing', async () => {
    await logoutUser('');
    expect(mockDb.query).not.toHaveBeenCalled();
  });
});
