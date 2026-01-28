import type { Session, StoredSessions } from '@/types';

const STORAGE_KEY = 'planning-poker-sessions';

export const storage = {
  getSessions(): StoredSessions {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error reading from storage:', error);
      return {};
    }
  },

  getSession(sessionId: string): Session | null {
    const sessions = this.getSessions();
    return sessions[sessionId] || null;
  },

  saveSession(session: Session): void {
    try {
      const sessions = this.getSessions();
      sessions[session.id] = session;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  },

  deleteSession(sessionId: string): void {
    try {
      const sessions = this.getSessions();
      delete sessions[sessionId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error deleting from storage:', error);
    }
  },

  generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  },
};
