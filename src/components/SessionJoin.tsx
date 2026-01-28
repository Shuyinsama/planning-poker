import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { WebSocketMessage } from '@/lib/api';

interface SessionJoinProps {
  sessionId: string;
  onJoined: (userId: string) => void;
}

export function SessionJoin({ sessionId, onJoined }: SessionJoinProps) {
  const [userName, setUserName] = useState('');
  const { wsClient, isBackendAvailable, connect, addMessageHandler, removeMessageHandler } = useWebSocket();

  // Connect to WebSocket on mount
  useEffect(() => {
    if (isBackendAvailable && wsClient) {
      connect();
    }
  }, [isBackendAvailable, wsClient, connect]);

  // Handle session joined response from WebSocket
  useEffect(() => {
    if (!isBackendAvailable) return;

    const handleMessage = (message: WebSocketMessage) => {
      if (message.type === 'sessionJoined') {
        console.log('SessionJoin - Joined via WebSocket:', message.data);
        // Extract userId from the WebSocket client (it was set when joining)
        // For now, find the user by name in the participants list
        const session = message.data;
        const currentUser = session.participants.find((p: any) => p.name === userName);
        if (currentUser) {
          onJoined(currentUser.id);
        }
      } else if (message.type === 'error') {
        alert(message.data.message || 'Failed to join session');
      }
    };

    addMessageHandler(handleMessage);
    return () => removeMessageHandler(handleMessage);
  }, [isBackendAvailable, userName, onJoined, addMessageHandler, removeMessageHandler]);

  const joinSession = () => {
    if (!userName.trim()) return;

    const userId = storage.generateId();

    // Use WebSocket if available
    if (isBackendAvailable && wsClient) {
      wsClient.joinSession(sessionId, userName, userId);
    } else {
      // Fallback to localStorage
      const session = storage.getSession(sessionId);
      if (!session) {
        alert('Session not found');
        return;
      }

      const newParticipant = {
        id: userId,
        name: userName,
        isReady: false,
        lastSeen: Date.now(),
      };

      const updatedSession = {
        ...session,
        participants: [...session.participants, newParticipant],
      };

      console.log('SessionJoin - Before save, session:', session);
      console.log('SessionJoin - After update, participants:', updatedSession.participants);
      storage.saveSession(updatedSession);
      console.log('SessionJoin - Saved to storage');
      onJoined(userId);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join Planning Session</CardTitle>
          <CardDescription>Enter your name to join the session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Your Name</label>
            <Input
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinSession()}
            />
          </div>
          <Button onClick={joinSession} className="w-full" disabled={!userName.trim()}>
            Join Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
