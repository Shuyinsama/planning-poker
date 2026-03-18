import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { storage } from '@/lib/storage';
import { getTransport } from '@/lib/transport';

interface SessionJoinProps {
  sessionId: string;
  onJoined: (userId: string) => void;
  onNewSession: () => void;
  onJoinDifferent: (sessionId?: string) => void;
}

export function SessionJoin({ sessionId, onJoined, onNewSession, onJoinDifferent }: SessionJoinProps) {
  const [userName, setUserName] = useState('');
  const [joinSessionCode, setJoinSessionCode] = useState('');

  const joinSession = () => {
    if (!userName.trim()) return;
    const userId = storage.generateId();
    getTransport().joinSession(sessionId, userName, userId);
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
          <p className="text-sm text-muted-foreground">Session code: <code className="bg-muted px-1 rounded">{sessionId}</code></p>
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

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground mb-2">Or join a different session:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter session code"
                value={joinSessionCode}
                onChange={(e) => setJoinSessionCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinSessionCode.trim() && onJoinDifferent(joinSessionCode.trim())}
              />
              <Button
                variant="outline"
                onClick={() => onJoinDifferent(joinSessionCode.trim())}
                disabled={!joinSessionCode.trim()}
              >
                Join
              </Button>
            </div>
          </div>

          <Button onClick={onNewSession} variant="ghost" className="w-full">
            Create New Session Instead
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
