import { useEffect, useState } from 'react';
import { SessionCreate } from '@/components/SessionCreate';
import { SessionJoin } from '@/components/SessionJoin';
import { SessionView } from '@/components/SessionView';
import { storage } from '@/lib/storage';

type AppState = 'create' | 'join' | 'session';

const SESSION_STATE_KEY = 'planning-poker-user-state';

interface UserState {
  sessionId: string;
  userId: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>('create');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Save user state to localStorage
  const saveUserState = (sessionId: string, userId: string) => {
    const userState: UserState = { sessionId, userId };
    localStorage.setItem(SESSION_STATE_KEY, JSON.stringify(userState));
  };

  // Load user state from localStorage
  const loadUserState = (): UserState | null => {
    try {
      const stored = localStorage.getItem(SESSION_STATE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinSessionId = params.get('join');

    // Try to restore previous session state
    const savedState = loadUserState();

    if (joinSessionId) {
      // Check if we have a saved state for this session
      if (savedState && savedState.sessionId === joinSessionId) {
        // Verify the session still exists
        const session = storage.getSession(joinSessionId);
        if (session) {
          setSessionId(joinSessionId);
          setUserId(savedState.userId);
          setAppState('session');
          return;
        }
      }
      // Otherwise, show join screen
      setSessionId(joinSessionId);
      setAppState('join');
    } else if (savedState) {
      // If we have a saved state but no URL param, redirect to that session
      const session = storage.getSession(savedState.sessionId);
      if (session) {
        window.history.pushState({}, '', `?join=${savedState.sessionId}`);
        setSessionId(savedState.sessionId);
        setUserId(savedState.userId);
        setAppState('session');
      }
    }
  }, []);

  const handleSessionCreated = (newSessionId: string, newUserId: string) => {
    setSessionId(newSessionId);
    setUserId(newUserId);
    setAppState('session');
    saveUserState(newSessionId, newUserId);
    window.history.pushState({}, '', `?join=${newSessionId}`);
  };

  const handleJoined = (newUserId: string) => {
    if (!sessionId) return;
    setUserId(newUserId);
    setAppState('session');
    saveUserState(sessionId, newUserId);
  };

  if (appState === 'create') {
    return <SessionCreate onSessionCreated={handleSessionCreated} />;
  }

  if (appState === 'join' && sessionId) {
    return <SessionJoin sessionId={sessionId} onJoined={handleJoined} />;
  }

  if (appState === 'session' && sessionId && userId) {
    return <SessionView sessionId={sessionId} currentUserId={userId} />;
  }

  return <div>Loading...</div>;
}

export default App;
