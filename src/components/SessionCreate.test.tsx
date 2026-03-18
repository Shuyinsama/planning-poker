import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionCreate } from './SessionCreate';
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

describe('SessionCreate', () => {
  let mockTransport: SessionTransport;
  const mockOnSessionCreated = vi.fn();
  const mockOnJoinExisting = vi.fn();
  const defaultProps = {
    onSessionCreated: mockOnSessionCreated,
    onJoinExisting: mockOnJoinExisting,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransport = makeMockTransport();
    setTransport(mockTransport);
  });

  afterEach(() => {
    setTransport(null);
  });

  it('should render form inputs', () => {
    render(<SessionCreate {...defaultProps} />);

    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/sprint 24 planning/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create session/i })).toBeInTheDocument();
  });

  it('should have disabled button when fields are empty', () => {
    render(<SessionCreate {...defaultProps} />);

    const button = screen.getByRole('button', { name: /create session/i });
    expect(button).toBeDisabled();
  });

  it('should enable button when both fields are filled', async () => {
    const user = userEvent.setup();
    render(<SessionCreate {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/enter your name/i), 'John');
    await user.type(screen.getByPlaceholderText(/sprint 24 planning/i), 'Sprint 1');

    const button = screen.getByRole('button', { name: /create session/i });
    expect(button).not.toBeDisabled();
  });

  it('should create session and call callback', async () => {
    const user = userEvent.setup();
    render(<SessionCreate {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/enter your name/i), 'John');
    await user.type(screen.getByPlaceholderText(/sprint 24 planning/i), 'Sprint 1');
    await user.click(screen.getByRole('button', { name: /create session/i }));

    expect(mockTransport.createSession).toHaveBeenCalledWith(
      expect.any(String),
      'Sprint 1',
      'John',
      expect.any(String),
      'fibonacci',
    );
    expect(mockOnSessionCreated).toHaveBeenCalledWith(expect.any(String), expect.any(String));
  });

  it('should create session on Enter key in session name field', async () => {
    const user = userEvent.setup();
    render(<SessionCreate {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/enter your name/i), 'John');
    const sessionInput = screen.getByPlaceholderText(/sprint 24 planning/i);
    await user.type(sessionInput, 'Sprint 1{Enter}');

    expect(mockTransport.createSession).toHaveBeenCalled();
    expect(mockOnSessionCreated).toHaveBeenCalled();
  });

  it('should not create session with only whitespace', async () => {
    const user = userEvent.setup();
    render(<SessionCreate {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/enter your name/i), '   ');
    await user.type(screen.getByPlaceholderText(/sprint 24 planning/i), '   ');

    const button = screen.getByRole('button', { name: /create session/i });
    expect(button).toBeDisabled();
  });

  it('should pass sessionId and userId to onSessionCreated', async () => {
    const user = userEvent.setup();
    render(<SessionCreate {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/enter your name/i), 'John');
    await user.type(screen.getByPlaceholderText(/sprint 24 planning/i), 'Sprint 1');
    await user.click(screen.getByRole('button', { name: /create session/i }));

    const [sessionId, userId] = mockOnSessionCreated.mock.calls[0];
    expect(typeof sessionId).toBe('string');
    expect(typeof userId).toBe('string');
    // sessionId passed to transport matches what was passed to callback
    const transportCall = vi.mocked(mockTransport.createSession).mock.calls[0];
    expect(transportCall[0]).toBe(sessionId);
    expect(transportCall[3]).toBe(userId);
  });
});
