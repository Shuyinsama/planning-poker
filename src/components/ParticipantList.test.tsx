import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ParticipantList } from './ParticipantList';
import type { Participant } from '@/types';

describe('ParticipantList', () => {
  const mockParticipants: Participant[] = [
    {
      id: '1',
      name: 'Alice',
      selectedCard: '5',
      isReady: true,
      lastSeen: Date.now(),
    },
    {
      id: '2',
      name: 'Bob',
      isReady: false,
      lastSeen: Date.now(),
    },
  ];

  it('should render participant count', () => {
    render(<ParticipantList participants={mockParticipants} isRevealed={false} />);
    expect(screen.getByText(/Participants \(2\)/i)).toBeInTheDocument();
  });

  it('should render all participant names', () => {
    render(<ParticipantList participants={mockParticipants} isRevealed={false} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should show ready status when participant is ready but not revealed', () => {
    render(<ParticipantList participants={mockParticipants} isRevealed={false} />);
    expect(screen.getByText(/🂠 Ready/i)).toBeInTheDocument();
  });

  it('should show thinking status when participant is not ready', () => {
    render(<ParticipantList participants={mockParticipants} isRevealed={false} />);
    expect(screen.getByText(/Thinking.../i)).toBeInTheDocument();
  });

  it('should show selected cards when revealed', () => {
    render(<ParticipantList participants={mockParticipants} isRevealed={true} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not show ready status when revealed', () => {
    render(<ParticipantList participants={mockParticipants} isRevealed={true} />);
    expect(screen.queryByText(/🂠 Ready/i)).not.toBeInTheDocument();
  });

  it('should handle empty participant list', () => {
    render(<ParticipantList participants={[]} isRevealed={false} />);
    expect(screen.getByText(/Participants \(0\)/i)).toBeInTheDocument();
  });

  it('should handle participants without selected cards', () => {
    const participants: Participant[] = [
      {
        id: '1',
        name: 'Charlie',
        isReady: true,
        lastSeen: Date.now(),
      },
    ];
    render(<ParticipantList participants={participants} isRevealed={true} />);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    // Should not show a card value, only participant count is visible
    const participantRow = screen.getByText('Charlie').closest('div');
    expect(participantRow).toBeInTheDocument();
  });
});
