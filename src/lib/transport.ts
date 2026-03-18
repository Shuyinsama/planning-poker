import { config } from '@/config/env';
import type { Session, Participant, CardValue, VotingType } from '@/types';
import { LocalStorageTransport } from '@/lib/transports/local';

export type SessionUpdateHandler = (session: Session) => void;

export interface SessionTransport {
  subscribe(sessionId: string, currentUserId: string, onUpdate: SessionUpdateHandler): () => void;
  createSession(sessionName: string, userName: string, userId: string, votingType: VotingType): void;
  joinSession(sessionId: string, userName: string, userId: string): void;
  selectCard(sessionId: string, participantId: string, card: CardValue): void;
  revealCards(sessionId: string): void;
  resetVoting(sessionId: string): void;
  addParticipant(session: Session, participant: Participant): void;
  sendReaction(sessionId: string, fromUserId: string, toUserId: string, emoji: string): void;
}

// Stub implementation — no-op methods, used as a placeholder until real transports are wired in
class StubTransport implements SessionTransport {
  subscribe(_sessionId: string, _currentUserId: string, _onUpdate: SessionUpdateHandler): () => void {
    return () => {};
  }
  createSession(_sessionName: string, _userName: string, _userId: string, _votingType: VotingType): void {}
  joinSession(_sessionId: string, _userName: string, _userId: string): void {}
  selectCard(_sessionId: string, _participantId: string, _card: CardValue): void {}
  revealCards(_sessionId: string): void {}
  resetVoting(_sessionId: string): void {}
  addParticipant(_session: Session, _participant: Participant): void {}
  sendReaction(_sessionId: string, _fromUserId: string, _toUserId: string, _emoji: string): void {}
}

// Test seam — allows tests to inject a mock transport
let overrideTransport: SessionTransport | null = null;

export function setTransport(t: SessionTransport | null): void {
  overrideTransport = t;
}

export function getTransport(): SessionTransport {
  if (overrideTransport !== null) {
    return overrideTransport;
  }
  if (!config.websocketUrl) {
    return new LocalStorageTransport();
  }
  // WebSocketTransport will be returned here once US-003 is implemented.
  return new StubTransport();
}
