import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Participant } from '@/types';

interface ParticipantListProps {
  participants: Participant[];
  isRevealed: boolean;
}

export function ParticipantList({ participants, isRevealed }: ParticipantListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-3 rounded-md border"
            >
              <span className="font-medium">{participant.name}</span>
              <div className="flex items-center gap-2">
                {participant.isReady && !isRevealed && (
                  <span className="text-sm text-muted-foreground">✓ Ready</span>
                )}
                {isRevealed && participant.selectedCard && (
                  <span className="text-lg font-bold">{participant.selectedCard}</span>
                )}
                {!participant.isReady && !isRevealed && (
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
