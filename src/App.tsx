import { useEffect, useState } from 'react';
import { SessionCreate } from '@/components/SessionCreate';
import { SessionJoin } from '@/components/SessionJoin';
import { SessionView } from '@/components/SessionView';

type AppState = 'create' | 'join' | 'session';

function App() {
  const [appState, setAppState] = useState<AppState>('create');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinSessionId = params.get('join');

    if (joinSessionId) {
      setSessionId(joinSessionId);
      setAppState('join');
    }
  }, []);

  const handleSessionCreated = (newSessionId: string, newUserId: string) => {
    setSessionId(newSessionId);
    setUserId(newUserId);
    setAppState('session');
    window.history.pushState({}, '', `?join=${newSessionId}`);
  };

  const handleJoined = (newUserId: string) => {
    setUserId(newUserId);
    setAppState('session');
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
