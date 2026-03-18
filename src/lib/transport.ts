import { config } from '@/config/env';
import type { Session, Participant, CardValue, VotingType } from '@/types';
import { LocalStorageTransport } from '@/lib/transports/local';
import { WebSocketTransport } from '@/lib/transports/websocket';
import { WebSocketClient } from '@/lib/api';

export type SessionUpdateHandler = (session: Session) => void;

export interface SessionTransport {
  subscribe(sessionId: string, currentUserId: string, onUpdate: SessionUpdateHandler): () => void;
  createSession(sessionId: string, sessionName: string, userName: string, userId: string, votingType: VotingType): void;
  joinSession(sessionId: string, userName: string, userId: string): void;
  selectCard(sessionId: string, participantId: string, card: CardValue): void;
  revealCards(sessionId: string): void;
  resetVoting(sessionId: string): void;
  addParticipant(session: Session, participant: Participant): void;
  sendReaction(sessionId: string, fromUserId: string, toUserId: string, emoji: string): void;
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
  return new WebSocketTransport(new WebSocketClient(config.websocketUrl));
}
