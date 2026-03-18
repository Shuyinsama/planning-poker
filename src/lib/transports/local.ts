import type { Session, Participant, CardValue, VotingType, Reaction } from '@/types';
import type { SessionTransport, SessionUpdateHandler } from '@/lib/transport';
import { storage } from '@/lib/storage';

export const PRESENCE_TIMEOUT = 30000;
export const HEARTBEAT_INTERVAL = 5000;
export const POLL_INTERVAL = 2000;

function cleanupInactiveParticipants(session: Session): Session {
  const now = Date.now();
  const active = session.participants.filter((p) => now - p.lastSeen < PRESENCE_TIMEOUT);
  if (active.length === session.participants.length) return session;
  return { ...session, participants: active };
}

export class LocalStorageTransport implements SessionTransport {
  subscribe(sessionId: string, currentUserId: string, onUpdate: SessionUpdateHandler): () => void {
    // Update current user's lastSeen immediately so they aren't pruned on first poll
    if (currentUserId) {
      const s = storage.getSession(sessionId);
      if (s) {
        const updated = {
          ...s,
          participants: s.participants.map((p) =>
            p.id === currentUserId ? { ...p, lastSeen: Date.now() } : p
          ),
        };
        storage.saveSession(updated);
      }
    }

    // Initial load
    const initial = storage.getSession(sessionId);
    if (initial) {
      const cleaned = cleanupInactiveParticipants(initial);
      if (cleaned !== initial) storage.saveSession(cleaned);
      onUpdate(cleaned);
    }

    const heartbeatId = currentUserId
      ? setInterval(() => {
          const s = storage.getSession(sessionId);
          if (!s) return;
          const updated = {
            ...s,
            participants: s.participants.map((p) =>
              p.id === currentUserId ? { ...p, lastSeen: Date.now() } : p
            ),
          };
          const cleaned = cleanupInactiveParticipants(updated);
          storage.saveSession(cleaned);
          onUpdate(cleaned);
        }, HEARTBEAT_INTERVAL)
      : null;

    const pollId = setInterval(() => {
      const s = storage.getSession(sessionId);
      if (s) onUpdate(s);
    }, POLL_INTERVAL);

    return () => {
      if (heartbeatId !== null) clearInterval(heartbeatId);
      clearInterval(pollId);
    };
  }

  createSession(sessionName: string, userName: string, userId: string, votingType: VotingType): void {
    const session: Session = {
      id: storage.generateId(),
      name: sessionName,
      createdAt: Date.now(),
      participants: [{ id: userId, name: userName, isReady: false, lastSeen: Date.now() }],
      isRevealed: false,
      currentUserId: userId,
      votingType,
    };
    storage.saveSession(session);
  }

  joinSession(sessionId: string, userName: string, userId: string): void {
    const session = storage.getSession(sessionId);
    if (!session) return;
    const already = session.participants.some((p) => p.id === userId);
    if (!already) {
      const updated = {
        ...session,
        participants: [
          ...session.participants,
          { id: userId, name: userName, isReady: false, lastSeen: Date.now() },
        ],
      };
      storage.saveSession(updated);
    }
  }

  selectCard(sessionId: string, participantId: string, card: CardValue): void {
    const session = storage.getSession(sessionId);
    if (!session) return;
    const updated: Session = {
      ...session,
      participants: session.participants.map((p) =>
        p.id === participantId ? { ...p, selectedCard: card, isReady: true } : p
      ),
    };
    storage.saveSession(updated);
  }

  revealCards(sessionId: string): void {
    const session = storage.getSession(sessionId);
    if (!session) return;
    storage.saveSession({ ...session, isRevealed: true });
  }

  resetVoting(sessionId: string): void {
    const session = storage.getSession(sessionId);
    if (!session) return;
    const updated: Session = {
      ...session,
      isRevealed: false,
      participants: session.participants.map((p) => ({
        ...p,
        selectedCard: undefined,
        isReady: false,
      })),
    };
    storage.saveSession(updated);
  }

  addParticipant(session: Session, participant: Participant): void {
    const updated: Session = {
      ...session,
      participants: [...session.participants, participant],
    };
    storage.saveSession(updated);
  }

  sendReaction(sessionId: string, fromUserId: string, toUserId: string, emoji: string): void {
    const session = storage.getSession(sessionId);
    if (!session) return;
    const reaction: Reaction = {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      fromUserId,
      toUserId,
      timestamp: Date.now(),
    };
    const now = Date.now();
    const updated: Session = {
      ...session,
      participants: session.participants.map((p) => {
        if (p.id !== toUserId) return p;
        const recent = (p.reactions ?? []).filter((r) => now - r.timestamp < 10000);
        return { ...p, reactions: [...recent, reaction] };
      }),
    };
    storage.saveSession(updated);
  }
}
