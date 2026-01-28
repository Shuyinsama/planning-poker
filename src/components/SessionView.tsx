import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PokerCard } from '@/components/PokerCard';
import { ParticipantList } from '@/components/ParticipantList';
import type { CardValue } from '@/types';
import { useSession } from '@/hooks/useSession';

const CARD_VALUES: CardValue[] = ['0', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕'];

interface SessionViewProps {
  sessionId: string;
  currentUserId: string;
}

export function SessionView({ sessionId, currentUserId }: SessionViewProps) {
  const { session, selectCard, revealCards, resetVoting } = useSession(sessionId);
  const [shareLink] = useState(`${window.location.origin}?join=${sessionId}`);

  if (!session) {
    return <div>Loading session...</div>;
  }

  const currentParticipant = session.participants.find((p) => p.id === currentUserId);
  const allReady = session.participants.every((p) => p.isReady);

  const handleCardSelect = (value: CardValue) => {
    if (currentParticipant && !session.isRevealed) {
      selectCard(currentUserId, value);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{session.name}</CardTitle>
            <CardDescription>Session ID: {session.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={copyShareLink} variant="outline">
                Copy Share Link
              </Button>
              {allReady && !session.isRevealed && (
                <Button onClick={revealCards}>Reveal Cards</Button>
              )}
              {session.isRevealed && (
                <Button onClick={resetVoting} variant="secondary">
                  New Round
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 justify-center">
                  {CARD_VALUES.map((value) => (
                    <PokerCard
                      key={value}
                      value={value}
                      isSelected={currentParticipant?.selectedCard === value}
                      isRevealed={session.isRevealed}
                      onClick={() => handleCardSelect(value)}
                      disabled={session.isRevealed}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <ParticipantList participants={session.participants} isRevealed={session.isRevealed} />
          </div>
        </div>
      </div>
    </div>
  );
}
