import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionJoin } from './SessionJoin';
import { storage } from '@/lib/storage';
import type { Session } from '@/types';

vi.mock('@/lib/storage', () => ({
  storage: {
    generateId: vi.fn(),
    getSession: vi.fn(),
    saveSession: vi.fn(),
  },
}));

describe('SessionJoin', () => {
  const mockOnJoined = vi.fn();
  const mockOnNewSession = vi.fn();
  const mockOnJoinDifferent = vi.fn();
  const mockSession: Session = {
    id: 'session-123',
    name: 'Test Session',
    createdAt: Date.now(),
    participants: [],
    isRevealed: false,
    currentUserId: 'user-1',
    votingType: 'fibonacci',
  };
  const defaultProps = {
    sessionId: 'session-123',
    onJoined: mockOnJoined,
    onNewSession: mockOnNewSession,
    onJoinDifferent: mockOnJoinDifferent,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.generateId).mockReturnValue('new-user-id');
    vi.mocked(storage.getSession).mockReturnValue(mockSession);
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
    
    expect(storage.getSession).toHaveBeenCalledWith('session-123');
    expect(storage.saveSession).toHaveBeenCalled();
    expect(mockOnJoined).toHaveBeenCalledWith('new-user-id');
  });

  it('should join session on Enter key', async () => {
    const user = userEvent.setup();
    render(<SessionJoin {...defaultProps} />);
    
    const input = screen.getByPlaceholderText(/enter your name/i);
    await user.type(input, 'Jane{Enter}');
    
    expect(storage.saveSession).toHaveBeenCalled();
    expect(mockOnJoined).toHaveBeenCalled();
  });

  it('should show alert when session not found', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(storage.getSession).mockReturnValue(null);
    
    const user = userEvent.setup();
    render(<SessionJoin {...defaultProps} sessionId="invalid-session" />);
    
    await user.type(screen.getByPlaceholderText(/enter your name/i), 'Jane');
    await user.click(screen.getByRole('button', { name: /join session/i }));
    
    expect(alertSpy).toHaveBeenCalledWith('Session not found');
    expect(mockOnJoined).not.toHaveBeenCalled();
    
    alertSpy.mockRestore();
  });

  it('should not join with only whitespace in name', async () => {
    const user = userEvent.setup();
    render(<SessionJoin {...defaultProps} />);
    
    await user.type(screen.getByPlaceholderText(/enter your name/i), '   ');
    
    const button = screen.getByRole('button', { name: /join session/i });
    expect(button).toBeDisabled();
  });

  it('should add participant to existing session', async () => {
    const sessionWithParticipants: Session = {
      ...mockSession,
      participants: [
        { id: 'user-1', name: 'Alice', isReady: false, lastSeen: Date.now() },
      ],
    };
    vi.mocked(storage.getSession).mockReturnValue(sessionWithParticipants);
    
    const user = userEvent.setup();
    render(<SessionJoin {...defaultProps} />);
    
    await user.type(screen.getByPlaceholderText(/enter your name/i), 'Bob');
    await user.click(screen.getByRole('button', { name: /join session/i }));
    
    expect(storage.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        participants: expect.arrayContaining([
          expect.objectContaining({ name: 'Alice' }),
          expect.objectContaining({ name: 'Bob' }),
        ]),
      })
    );
  });
});
