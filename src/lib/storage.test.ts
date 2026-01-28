import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from './storage';
import type { Session } from '@/types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getSessions', () => {
    it('should return empty object when no sessions exist', () => {
      const sessions = storage.getSessions();
      expect(sessions).toEqual({});
    });

    it('should return stored sessions', () => {
      const mockSessions = {
        'session1': { id: 'session1', name: 'Test' } as Session,
      };
      localStorage.setItem('planning-poker-sessions', JSON.stringify(mockSessions));

      const sessions = storage.getSessions();
      expect(sessions).toEqual(mockSessions);
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('planning-poker-sessions', 'invalid-json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const sessions = storage.getSessions();
      expect(sessions).toEqual({});
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getSession', () => {
    it('should return null when session does not exist', () => {
      const session = storage.getSession('non-existent');
      expect(session).toBeNull();
    });

    it('should return the requested session', () => {
      const mockSession: Session = {
        id: 'session1',
        name: 'Test Session',
        createdAt: Date.now(),
        participants: [],
        isRevealed: false,
        currentUserId: 'user1',
      };
      localStorage.setItem('planning-poker-sessions', JSON.stringify({
        'session1': mockSession,
      }));

      const session = storage.getSession('session1');
      expect(session).toEqual(mockSession);
    });
  });

  describe('saveSession', () => {
    it('should save a new session', () => {
      const mockSession: Session = {
        id: 'session1',
        name: 'Test Session',
        createdAt: Date.now(),
        participants: [],
        isRevealed: false,
        currentUserId: 'user1',
      };

      storage.saveSession(mockSession);

      const saved = storage.getSession('session1');
      expect(saved).toEqual(mockSession);
    });

    it('should update an existing session', () => {
      const mockSession: Session = {
        id: 'session1',
        name: 'Original',
        createdAt: Date.now(),
        participants: [],
        isRevealed: false,
        currentUserId: 'user1',
      };

      storage.saveSession(mockSession);

      const updatedSession = { ...mockSession, name: 'Updated' };
      storage.saveSession(updatedSession);

      const saved = storage.getSession('session1');
      expect(saved?.name).toBe('Updated');
    });

    it('should handle localStorage errors', () => {
      const mockSession: Session = {
        id: 'session1',
        name: 'Test',
        createdAt: Date.now(),
        participants: [],
        isRevealed: false,
        currentUserId: 'user1',
      };

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      storage.saveSession(mockSession);

      expect(consoleSpy).toHaveBeenCalled();

      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('deleteSession', () => {
    it('should delete an existing session', () => {
      const mockSession: Session = {
        id: 'session1',
        name: 'Test',
        createdAt: Date.now(),
        participants: [],
        isRevealed: false,
        currentUserId: 'user1',
      };

      storage.saveSession(mockSession);
      expect(storage.getSession('session1')).toBeTruthy();

      storage.deleteSession('session1');
      expect(storage.getSession('session1')).toBeNull();
    });

    it('should handle deleting non-existent session', () => {
      storage.deleteSession('non-existent');
      expect(storage.getSessions()).toEqual({});
    });

    it('should handle localStorage errors', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      storage.deleteSession('session1');

      expect(consoleSpy).toHaveBeenCalled();

      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = storage.generateId();
      const id2 = storage.generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});
