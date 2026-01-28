import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Session } from '@/types';
import { storage } from '@/lib/storage';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { WebSocketMessage } from '@/lib/api';

interface SessionCreateProps {
  onSessionCreated: (sessionId: string, userId: string) => void;
}

export function SessionCreate({ onSessionCreated }: SessionCreateProps) {
  const [sessionName, setSessionName] = useState('');
  const [userName, setUserName] = useState('');
  const { wsClient, isBackendAvailable, connect, addMessageHandler, removeMessageHandler } = useWebSocket();

  // Connect to WebSocket on mount
  useEffect(() => {
    if (isBackendAvailable && wsClient) {
      connect();
    }
  }, [isBackendAvailable, wsClient, connect]);

  // Handle session created response from WebSocket
  useEffect(() => {
    if (!isBackendAvailable) return;

    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === 'sessionCreated') {
        const session: Session = message.data;
        console.log('SessionCreate - Session created via WebSocket:', session);
        // Find the current user's ID from the session
        const currentUser = session.participants[0];
        if (currentUser) {
          wsClient?.setSessionInfo(session.id, currentUser.id);
          onSessionCreated(session.id, currentUser.id);
        }
      }
    };

    addMessageHandler(handleMessage);
    return () => removeMessageHandler(handleMessage);
  }, [isBackendAvailable, wsClient, onSessionCreated, addMessageHandler, removeMessageHandler]);

  const createSession = () => {
    if (!sessionName.trim() || !userName.trim()) return;

    const userId = storage.generateId();

    // Use WebSocket if available
    if (isBackendAvailable && wsClient) {
      wsClient.createSession(sessionName, userName, userId);
    } else {
      // Fallback to localStorage
      const sessionId = storage.generateId();
      const newSession: Session = {
        id: sessionId,
        name: sessionName,
        createdAt: Date.now(),
        participants: [
          {
            id: userId,
            name: userName,
            isReady: false,
            lastSeen: Date.now(),
          },
        ],
        isRevealed: false,
        currentUserId: userId,
      };

      storage.saveSession(newSession);
      console.log('SessionCreate - Created session (localStorage):', newSession);
      console.log('SessionCreate - Participants:', newSession.participants);
      onSessionCreated(sessionId, userId);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Planning Poker</CardTitle>
          <CardDescription>Create a new estimation session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Your Name</label>
            <Input
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createSession()}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Session Name</label>
            <Input
              placeholder="e.g., Sprint 24 Planning"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createSession()}
            />
          </div>
          <Button onClick={createSession} className="w-full" disabled={!sessionName.trim() || !userName.trim()}>
            Create Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
