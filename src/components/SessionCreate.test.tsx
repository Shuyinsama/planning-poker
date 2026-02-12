import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionCreate } from './SessionCreate';
import { storage } from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  storage: {
    generateId: vi.fn(),
    saveSession: vi.fn(),
  },
}));

describe('SessionCreate', () => {
  const mockOnSessionCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.generateId).mockReturnValue('test-id');
  });

  it('should render form inputs', () => {
    render(<SessionCreate onSessionCreated={mockOnSessionCreated} />);
    
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/sprint 24 planning/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create session/i })).toBeInTheDocument();
  });

  it('should have disabled button when fields are empty', () => {
    render(<SessionCreate onSessionCreated={mockOnSessionCreated} />);
    
    const button = screen.getByRole('button', { name: /create session/i });
    expect(button).toBeDisabled();
  });

  it('should enable button when both fields are filled', async () => {
    const user = userEvent.setup();
    render(<SessionCreate onSessionCreated={mockOnSessionCreated} />);
    
    await user.type(screen.getByPlaceholderText(/enter your name/i), 'John');
    await user.type(screen.getByPlaceholderText(/sprint 24 planning/i), 'Sprint 1');
    
    const button = screen.getByRole('button', { name: /create session/i });
    expect(button).not.toBeDisabled();
  });

  it('should create session and call callback', async () => {
    const user = userEvent.setup();
    render(<SessionCreate onSessionCreated={mockOnSessionCreated} />);
    
    await user.type(screen.getByPlaceholderText(/enter your name/i), 'John');
    await user.type(screen.getByPlaceholderText(/sprint 24 planning/i), 'Sprint 1');
    await user.click(screen.getByRole('button', { name: /create session/i }));
    
    expect(storage.saveSession).toHaveBeenCalled();
    expect(mockOnSessionCreated).toHaveBeenCalledWith('test-id', 'test-id');
  });

  it('should create session on Enter key in session name field', async () => {
    const user = userEvent.setup();
    render(<SessionCreate onSessionCreated={mockOnSessionCreated} />);
    
    await user.type(screen.getByPlaceholderText(/enter your name/i), 'John');
    const sessionInput = screen.getByPlaceholderText(/sprint 24 planning/i);
    await user.type(sessionInput, 'Sprint 1{Enter}');
    
    expect(storage.saveSession).toHaveBeenCalled();
    expect(mockOnSessionCreated).toHaveBeenCalled();
  });

  it('should not create session with only whitespace', async () => {
    const user = userEvent.setup();
    render(<SessionCreate onSessionCreated={mockOnSessionCreated} />);
    
    await user.type(screen.getByPlaceholderText(/enter your name/i), '   ');
    await user.type(screen.getByPlaceholderText(/sprint 24 planning/i), '   ');
    
    const button = screen.getByRole('button', { name: /create session/i });
    expect(button).toBeDisabled();
  });

  it('should generate unique IDs for session and user', async () => {
    const user = userEvent.setup();
    // userId is generated first, then sessionId in the implementation
    vi.mocked(storage.generateId).mockReturnValueOnce('user-456').mockReturnValueOnce('session-123');
    
    render(<SessionCreate onSessionCreated={mockOnSessionCreated} />);
    
    await user.type(screen.getByPlaceholderText(/enter your name/i), 'John');
    await user.type(screen.getByPlaceholderText(/sprint 24 planning/i), 'Sprint 1');
    await user.click(screen.getByRole('button', { name: /create session/i }));
    
    expect(storage.generateId).toHaveBeenCalledTimes(2);
    expect(mockOnSessionCreated).toHaveBeenCalledWith('session-123', 'user-456');
  });
});
