import type { Session, Participant, CardValue, VotingType } from '@/types';
import type { SessionTransport, SessionUpdateHandler } from '@/lib/transport';
import { WebSocketClient, type WebSocketMessage } from '@/lib/api';

export class WebSocketTransport implements SessionTransport {
  constructor(private wsClient: WebSocketClient) {}

  subscribe(sessionId: string, currentUserId: string, onUpdate: SessionUpdateHandler): () => void {
    this.wsClient.setSessionInfo(sessionId, currentUserId);

    const handler = (message: WebSocketMessage) => {
      const session: Session | undefined = message.data?.session ?? message.data;
      if (!session) return;

      switch (message.type) {
        case 'sessionCreated':
        case 'sessionJoined':
        case 'participantJoined':
        case 'participantUpdated':
        case 'cardsRevealed':
        case 'votingReset':
        case 'sessionUpdate':
        case 'reactionSent':
          if (session && typeof session === 'object' && 'id' in session) {
            onUpdate(session as Session);
          }
          break;
      }
    };

    this.wsClient.addMessageHandler(handler);

    return () => {
      this.wsClient.removeMessageHandler(handler);
    };
  }

  createSession(sessionName: string, userName: string, userId: string, votingType: VotingType): void {
    this.wsClient.createSession(sessionName, userName, userId, votingType);
  }

  joinSession(sessionId: string, userName: string, userId: string): void {
    this.wsClient.joinSession(sessionId, userName, userId);
  }

  selectCard(sessionId: string, participantId: string, card: CardValue): void {
    this.wsClient.updateParticipant(sessionId, participantId, card);
  }

  revealCards(sessionId: string): void {
    this.wsClient.revealCards(sessionId);
  }

  resetVoting(sessionId: string): void {
    this.wsClient.resetVoting(sessionId);
  }

  // No-op: joins are server-driven in WebSocket mode (server broadcasts participantJoined)
  addParticipant(_session: Session, _participant: Participant): void {}

  sendReaction(sessionId: string, fromUserId: string, toUserId: string, emoji: string): void {
    this.wsClient.sendReaction(sessionId, fromUserId, toUserId, emoji);
  }
}
