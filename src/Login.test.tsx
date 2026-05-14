import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Login from './Login';

const mockOnClose = vi.fn();
const mockOnLoginSuccess = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  backgroundColor: '#ffffff',
  textColor: 'black',
  fontSize: 18,
  onLoginSuccess: mockOnLoginSuccess,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('Login', () => {
  test('renders nothing when isOpen is false', () => {
    render(<Login {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Welcome back!')).not.toBeInTheDocument();
  });

  test('renders the form when isOpen is true', () => {
    render(<Login {...defaultProps} />);
    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  test('calls onClose when × is clicked', async () => {
    const user = userEvent.setup();
    render(<Login {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: '×' }));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  test('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    render(<Login {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('*Email* is mandatory')).toBeInTheDocument();
    expect(await screen.findByText('*Password* is mandatory')).toBeInTheDocument();
  });

  test('shows error message on failed login', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    } as Response);

    render(<Login {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Email'), 'bad@test.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  test('calls onLoginSuccess with token and user on successful login', async () => {
    const user = userEvent.setup();
    const fakeUser = { id: '1', username: 'alice', email: 'alice@test.com', balance: 500, created_at: '' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'fake-token', user: fakeUser }),
    } as Response);

    render(<Login {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Email'), 'alice@test.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith('fake-token', fakeUser);
    });
  });

  test('shows generic error when server returns no message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    const user = userEvent.setup();
    render(<Login {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Email'), 'x@x.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Login failed')).toBeInTheDocument();
  });
});