import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Register from './Registration';

const mockOnClose = vi.fn();
const mockOnRegisterSuccess = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  backgroundColor: '#ffffff',
  textColor: 'black',
  fontSize: 18,
  onRegisterSuccess: mockOnRegisterSuccess,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('Register', () => {
  test('renders nothing when isOpen is false', () => {
    render(<Register {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Sign up to gamble today!')).not.toBeInTheDocument();
  });

  test('renders the form when isOpen is true', () => {
    render(<Register {...defaultProps} />);
    expect(screen.getByText('Sign up to gamble today!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  test('calls onClose when × is clicked', async () => {
    const user = userEvent.setup();
    render(<Register {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: '×' }));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  test('shows validation errors on empty submit', async () => {
    const user = userEvent.setup();
    render(<Register {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(await screen.findByText('*Username* is mandatory')).toBeInTheDocument();
    expect(await screen.findByText('*Email* is mandatory')).toBeInTheDocument();
  });

  test('shows error when password is too short', async () => {
    const user = userEvent.setup();
    render(<Register {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Username'), 'newuser');
    await user.type(screen.getByPlaceholderText('Email'), 'new@test.com');
    await user.type(screen.getByPlaceholderText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(await screen.findByText('*Password* must be at least 8 characters')).toBeInTheDocument();
  });

  test('calls onRegisterSuccess and onClose on successful registration', async () => {
    const user = userEvent.setup();
    const fakeUser = { id: '2', username: 'newuser', email: 'new@test.com', balance: 1000, created_at: '' };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'new-token', user: fakeUser }),
    } as Response);

    render(<Register {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Username'), 'newuser');
    await user.type(screen.getByPlaceholderText('Email'), 'new@test.com');
    await user.type(screen.getByPlaceholderText('Password'), 'securepassword');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(mockOnRegisterSuccess).toHaveBeenCalledWith('new-token', fakeUser);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test('shows error message on failed registration', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already in use' }),
    } as Response);

    const user = userEvent.setup();
    render(<Register {...defaultProps} />);
    await user.type(screen.getByPlaceholderText('Username'), 'newuser');
    await user.type(screen.getByPlaceholderText('Email'), 'taken@test.com');
    await user.type(screen.getByPlaceholderText('Password'), 'securepassword');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
  });
});