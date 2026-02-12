import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PokerCard } from '@/components/PokerCard';
import { ParticipantList } from '@/components/ParticipantList';
import type { CardValue } from '@/types';
import { FIBONACCI_VALUES, TSHIRT_VALUES } from '@/types';
import { useSession } from '@/hooks/useSession';
import { useSettings } from '@/contexts/SettingsContext';

interface SessionViewProps {
  sessionId: string;
  currentUserId: string;
}

export function SessionView({ sessionId, currentUserId }: SessionViewProps) {
  const { session, selectCard, revealCards, resetVoting } = useSession(sessionId, currentUserId);
  const { settings } = useSettings();
  const [shareLink] = useState(`${window.location.origin}?join=${sessionId}`);

  const cardValues = useMemo(() => {
    if (!session) return FIBONACCI_VALUES;
    return session.votingType === 'tshirt' ? TSHIRT_VALUES : FIBONACCI_VALUES;
  }, [session?.votingType]);

  const currentParticipant = session?.participants.find((p) => p.id === currentUserId);
  const allReady = session?.participants.every((p) => p.isReady) ?? false;

  // Auto-reveal when all participants have voted (if setting is enabled)
  useEffect(() => {
    if (session && settings.autoRevealWhenAllVoted && allReady && !session.isRevealed && session.participants.length > 0) {
      revealCards();
    }
  }, [session, settings.autoRevealWhenAllVoted, allReady, revealCards]);

  if (!session) {
    return <div>Loading session...</div>;
  }

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
                  {cardValues.map((value) => (
                    <PokerCard
                      key={value}
                      value={value as CardValue}
                      isSelected={currentParticipant?.selectedCard === value}
                      onClick={() => handleCardSelect(value as CardValue)}
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
