import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionJoin } from './SessionJoin';
import { setTransport } from '@/lib/transport';
import type { SessionTransport } from '@/lib/transport';

function makeMockTransport(): SessionTransport {
  return {
    subscribe: vi.fn(() => () => {}),
    createSession: vi.fn(),
    joinSession: vi.fn(),
    selectCard: vi.fn(),
    revealCards: vi.fn(),
    resetVoting: vi.fn(),
    addParticipant: vi.fn(),
    sendReaction: vi.fn(),
  };
}

describe('SessionJoin', () => {
  let mockTransport: SessionTransport;
  const mockOnJoined = vi.fn();
  const mockOnNewSession = vi.fn();
  const mockOnJoinDifferent = vi.fn();
  const defaultProps = {
    sessionId: 'session-123',
    onJoined: mockOnJoined,
    onNewSession: mockOnNewSession,
    onJoinDifferent: mockOnJoinDifferent,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransport = makeMockTransport();
    setTransport(mockTransport);
  });

  afterEach(() => {
    setTransport(null);
  });

  it('should render join form', () => {
    render(<SessionJoin {...defaultProps} />);

    expect(screen.getByText(/join planning session/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join session/i })).toBeInTheDocument();
  });

  it('should have disabled button when name is empty', () => {
    render(<SessionJoin {...defaultProps} />);

    const button = screen.getByRole('button', { name: /join session/i });
    expect(button).toBeDisabled();
  });

  it('should enable button when name is entered', async () => {
    const user = userEvent.setup();
    render(<SessionJoin {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/enter your name/i), 'Jane');

    const button = screen.getByRole('button', { name: /join session/i });
    expect(button).not.toBeDisabled();
  });

  it('should join session and call callback', async () => {
    const user = userEvent.setup();
    render(<SessionJoin {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/enter your name/i), 'Jane');
    await user.click(screen.getByRole('button', { name: /join session/i }));

    expect(mockTransport.joinSession).toHaveBeenCalledWith('session-123', 'Jane', expect.any(String));
    expect(mockOnJoined).toHaveBeenCalledWith(expect.any(String));
  });

  it('should join session on Enter key', async () => {
    const user = userEvent.setup();
    render(<SessionJoin {...defaultProps} />);

    const input = screen.getByPlaceholderText(/enter your name/i);
    await user.type(input, 'Jane{Enter}');

    expect(mockTransport.joinSession).toHaveBeenCalled();
    expect(mockOnJoined).toHaveBeenCalled();
  });

  it('should not join with only whitespace in name', async () => {
    const user = userEvent.setup();
    render(<SessionJoin {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/enter your name/i), '   ');

    const button = screen.getByRole('button', { name: /join session/i });
    expect(button).toBeDisabled();
  });

  it('should pass correct sessionId and userId to transport', async () => {
    const user = userEvent.setup();
    render(<SessionJoin {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/enter your name/i), 'Bob');
    await user.click(screen.getByRole('button', { name: /join session/i }));

    const [calledSessionId, calledName, calledUserId] = vi.mocked(mockTransport.joinSession).mock.calls[0];
    expect(calledSessionId).toBe('session-123');
    expect(calledName).toBe('Bob');
    expect(typeof calledUserId).toBe('string');
    expect(mockOnJoined).toHaveBeenCalledWith(calledUserId);
  });
});
