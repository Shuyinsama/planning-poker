import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocketTransport } from './websocket';
import type { WebSocketClient, MessageHandler } from '@/lib/api';
import type { Session } from '@/types';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session1',
    name: 'Test',
    createdAt: Date.now(),
    participants: [],
    isRevealed: false,
    currentUserId: 'user1',
    votingType: 'fibonacci',
    ...overrides,
  };
}

function makeMockWsClient(): jest.Mocked<WebSocketClient> {
  const handlers: Set<MessageHandler> = new Set();
  return {
    addMessageHandler: vi.fn((h: MessageHandler) => handlers.add(h)),
    removeMessageHandler: vi.fn((h: MessageHandler) => handlers.delete(h)),
    setSessionInfo: vi.fn(),
    createSession: vi.fn(),
    joinSession: vi.fn(),
    updateParticipant: vi.fn(),
    revealCards: vi.fn(),
    resetVoting: vi.fn(),
    sendReaction: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    isConnected: vi.fn(),
    // Expose handlers set for test triggering
    _handlers: handlers,
  } as unknown as jest.Mocked<WebSocketClient> & { _handlers: Set<MessageHandler> };
}

describe('WebSocketTransport', () => {
  let mockWsClient: ReturnType<typeof makeMockWsClient>;
  let transport: WebSocketTransport;

  beforeEach(() => {
    mockWsClient = makeMockWsClient();
    transport = new WebSocketTransport(mockWsClient as unknown as WebSocketClient);
  });

  describe('subscribe', () => {
    it('registers a handler and calls onUpdate when a WS message arrives', () => {
      const onUpdate = vi.fn();
      transport.subscribe('session1', 'user1', onUpdate);

      expect(mockWsClient.setSessionInfo).toHaveBeenCalledWith('session1', 'user1');
      expect(mockWsClient.addMessageHandler).toHaveBeenCalledTimes(1);

      const session = makeSession();
      const client = mockWsClient as unknown as { _handlers: Set<MessageHandler> };
      client._handlers.forEach((h) => h({ type: 'sessionUpdate', data: session }));

      expect(onUpdate).toHaveBeenCalledWith(session);
    });

    it('cleanup deregisters the handler', () => {
      const onUpdate = vi.fn();
      const cleanup = transport.subscribe('session1', 'user1', onUpdate);

      cleanup();

      expect(mockWsClient.removeMessageHandler).toHaveBeenCalledTimes(1);
      // Handler removed — firing messages should not call onUpdate
      const client = mockWsClient as unknown as { _handlers: Set<MessageHandler> };
      const session = makeSession();
      client._handlers.forEach((h) => h({ type: 'sessionUpdate', data: session }));
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('calls onUpdate for all handled message types', () => {
      const onUpdate = vi.fn();
      transport.subscribe('session1', 'user1', onUpdate);

      const session = makeSession();
      const client = mockWsClient as unknown as { _handlers: Set<MessageHandler> };
      const messageTypes = [
        'sessionCreated', 'sessionJoined', 'participantJoined', 'participantUpdated',
        'cardsRevealed', 'votingReset', 'sessionUpdate', 'reactionSent',
      ] as const;

      for (const type of messageTypes) {
        client._handlers.forEach((h) => h({ type, data: session }));
      }

      expect(onUpdate).toHaveBeenCalledTimes(messageTypes.length);
    });
  });

  describe('selectCard', () => {
    it('calls wsClient.updateParticipant with correct arguments', () => {
      transport.selectCard('session1', 'user1', '5');
      expect(mockWsClient.updateParticipant).toHaveBeenCalledWith('session1', 'user1', '5');
    });
  });

  describe('revealCards', () => {
    it('calls wsClient.revealCards with correct arguments', () => {
      transport.revealCards('session1');
      expect(mockWsClient.revealCards).toHaveBeenCalledWith('session1');
    });
  });

  describe('resetVoting', () => {
    it('calls wsClient.resetVoting with correct arguments', () => {
      transport.resetVoting('session1');
      expect(mockWsClient.resetVoting).toHaveBeenCalledWith('session1');
    });
  });

  describe('sendReaction', () => {
    it('calls wsClient.sendReaction with correct arguments', () => {
      transport.sendReaction('session1', 'user1', 'user2', '👍');
      expect(mockWsClient.sendReaction).toHaveBeenCalledWith('session1', 'user1', 'user2', '👍');
    });
  });

  describe('addParticipant', () => {
    it('is a no-op (joins are server-driven)', () => {
      const session = makeSession();
      const participant = { id: 'user2', name: 'Bob', isReady: false, lastSeen: Date.now() };
      // Should not throw
      expect(() => transport.addParticipant(session, participant)).not.toThrow();
    });
  });
});
