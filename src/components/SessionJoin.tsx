import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';

interface SessionJoinProps {
  sessionId: string;
  onJoined: (userId: string) => void;
}

export function SessionJoin({ sessionId, onJoined }: SessionJoinProps) {
  const [userName, setUserName] = useState('');

  const joinSession = () => {
    if (!userName.trim()) return;

    const session = storage.getSession(sessionId);
    if (!session) {
      alert('Session not found');
      return;
    }

    const userId = storage.generateId();
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

    storage.saveSession(updatedSession);
    onJoined(userId);
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
