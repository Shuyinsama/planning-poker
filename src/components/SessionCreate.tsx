import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { VotingType } from '@/types';
import { VOTING_TYPE_LABELS } from '@/types';
import { storage } from '@/lib/storage';
import { getTransport } from '@/lib/transport';

interface SessionCreateProps {
  onSessionCreated: (sessionId: string, userId: string) => void;
  onJoinExisting: (sessionId?: string) => void;
}

export function SessionCreate({ onSessionCreated, onJoinExisting }: SessionCreateProps) {
  const [sessionName, setSessionName] = useState('');
  const [userName, setUserName] = useState('');
  const [votingType, setVotingType] = useState<VotingType>('fibonacci');
  const [joinSessionCode, setJoinSessionCode] = useState('');

  const createSession = () => {
    if (!sessionName.trim() || !userName.trim()) return;
    const userId = storage.generateId();
    const sessionId = storage.generateId();
    getTransport().createSession(sessionId, sessionName, userName, userId, votingType);
    onSessionCreated(sessionId, userId);
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
          <div>
            <label className="text-sm font-medium mb-1.5 block">Voting Type</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={votingType}
              onChange={(e) => setVotingType(e.target.value as VotingType)}
            >
              {(Object.keys(VOTING_TYPE_LABELS) as VotingType[]).map((type) => (
                <option key={type} value={type}>
                  {VOTING_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={createSession} className="w-full" disabled={!sessionName.trim() || !userName.trim()}>
            Create Session
          </Button>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground mb-2">Or join an existing session:</p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter session code"
                value={joinSessionCode}
                onChange={(e) => setJoinSessionCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinSessionCode.trim() && onJoinExisting(joinSessionCode.trim())}
              />
              <Button
                variant="outline"
                onClick={() => onJoinExisting(joinSessionCode.trim())}
                disabled={!joinSessionCode.trim()}
              >
                Join
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
