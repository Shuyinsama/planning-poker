import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageTransport, PRESENCE_TIMEOUT, HEARTBEAT_INTERVAL, POLL_INTERVAL } from './local';
import { storage } from '@/lib/storage';
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

describe('LocalStorageTransport', () => {
  let transport: LocalStorageTransport;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    transport = new LocalStorageTransport();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('subscribe', () => {
    it('calls onUpdate on each poll tick with current storage state', () => {
      const session = makeSession({ participants: [{ id: 'user1', name: 'Alice', isReady: false, lastSeen: Date.now() }] });
      storage.saveSession(session);

      const onUpdate = vi.fn();
      transport.subscribe('session1', 'user1', onUpdate);

      // Initial call happens immediately
      expect(onUpdate).toHaveBeenCalledTimes(1);

      // After one POLL_INTERVAL tick, another call
      vi.advanceTimersByTime(POLL_INTERVAL);
      expect(onUpdate).toHaveBeenCalledTimes(2);
      expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'session1' }));
    });

    it('cleanup clears both intervals, no more onUpdate calls', () => {
      const session = makeSession({ participants: [{ id: 'user1', name: 'Alice', isReady: false, lastSeen: Date.now() }] });
      storage.saveSession(session);

      const onUpdate = vi.fn();
      const cleanup = transport.subscribe('session1', 'user1', onUpdate);

      cleanup();
      const callsBefore = onUpdate.mock.calls.length;

      vi.advanceTimersByTime(POLL_INTERVAL * 5 + HEARTBEAT_INTERVAL * 2);
      expect(onUpdate.mock.calls.length).toBe(callsBefore);
    });

    it('removes inactive participant after PRESENCE_TIMEOUT via heartbeat', () => {
      const now = Date.now();
      const session = makeSession({
        participants: [
          { id: 'user1', name: 'Alice', isReady: false, lastSeen: now },
          { id: 'user2', name: 'Bob', isReady: false, lastSeen: now - PRESENCE_TIMEOUT - 1 },
        ],
      });
      storage.saveSession(session);

      const onUpdate = vi.fn();
      transport.subscribe('session1', 'user1', onUpdate);

      // Advance past a heartbeat tick
      vi.advanceTimersByTime(HEARTBEAT_INTERVAL);

      const lastCall: Session = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
      expect(lastCall.participants.map((p) => p.id)).not.toContain('user2');
      expect(lastCall.participants.map((p) => p.id)).toContain('user1');
    });
  });

  describe('selectCard', () => {
    it('produces correct session state', () => {
      const session = makeSession({
        participants: [{ id: 'user1', name: 'Alice', isReady: false, lastSeen: Date.now() }],
      });
      storage.saveSession(session);

      transport.selectCard('session1', 'user1', '5');

      const saved = storage.getSession('session1')!;
      const participant = saved.participants.find((p) => p.id === 'user1')!;
      expect(participant.selectedCard).toBe('5');
      expect(participant.isReady).toBe(true);
    });
  });

  describe('revealCards', () => {
    it('sets isRevealed to true', () => {
      storage.saveSession(makeSession({ isRevealed: false }));
      transport.revealCards('session1');
      expect(storage.getSession('session1')!.isRevealed).toBe(true);
    });
  });

  describe('resetVoting', () => {
    it('clears all selectedCard values and sets isRevealed to false', () => {
      const session = makeSession({
        isRevealed: true,
        participants: [
          { id: 'user1', name: 'Alice', isReady: true, selectedCard: '5', lastSeen: Date.now() },
          { id: 'user2', name: 'Bob', isReady: true, selectedCard: '8', lastSeen: Date.now() },
        ],
      });
      storage.saveSession(session);

      transport.resetVoting('session1');

      const saved = storage.getSession('session1')!;
      expect(saved.isRevealed).toBe(false);
      saved.participants.forEach((p) => {
        expect(p.selectedCard).toBeUndefined();
        expect(p.isReady).toBe(false);
      });
    });
  });

  describe('sendReaction', () => {
    it('filters reactions older than 10000ms before saving', () => {
      const oldTimestamp = Date.now() - 15000;
      const session = makeSession({
        participants: [
          {
            id: 'user1',
            name: 'Alice',
            isReady: false,
            lastSeen: Date.now(),
            reactions: [{ id: 'old', emoji: '👍', fromUserId: 'user2', toUserId: 'user1', timestamp: oldTimestamp }],
          },
          { id: 'user2', name: 'Bob', isReady: false, lastSeen: Date.now() },
        ],
      });
      storage.saveSession(session);

      transport.sendReaction('session1', 'user2', 'user1', '🎉');

      const saved = storage.getSession('session1')!;
      const alice = saved.participants.find((p) => p.id === 'user1')!;
      // Old reaction filtered out, only new one remains
      expect(alice.reactions).toHaveLength(1);
      expect(alice.reactions![0].emoji).toBe('🎉');
    });
  });
});
