import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Participant, Reaction } from '@/types';
import { REACTION_EMOJIS } from '@/types';

interface ParticipantListProps {
  participants: Participant[];
  isRevealed: boolean;
  currentUserId: string;
  onReaction: (toUserId: string, emoji: string) => void;
}

function ReactionDisplay({ reactions }: { reactions?: Reaction[] }) {
  const [visibleReactions, setVisibleReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    if (!reactions) {
      setVisibleReactions([]);
      return;
    }

    // Filter to only show recent reactions (last 5 seconds)
    const filterReactions = () => {
      const now = Date.now();
      const recent = reactions.filter((r) => now - r.timestamp < 5000);
      setVisibleReactions(recent);
    };

    filterReactions();
    const interval = setInterval(filterReactions, 500);
    return () => clearInterval(interval);
  }, [reactions]);

  if (visibleReactions.length === 0) return null;

  return (
    <div className="flex gap-1 animate-bounce">
      {visibleReactions.map((reaction) => (
        <span key={reaction.id} className="text-lg">
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <div className="absolute right-0 top-full mt-1 z-10 bg-popover border rounded-md shadow-lg p-2 flex gap-1 flex-wrap max-w-[200px]">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          className="text-xl hover:bg-accent rounded p-1 transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export function ParticipantList({ participants, isRevealed, currentUserId, onReaction }: ParticipantListProps) {
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);

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
              className="flex items-center justify-between p-3 rounded-md border relative"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{participant.name}</span>
                <ReactionDisplay reactions={participant.reactions} />
              </div>
              <div className="flex items-center gap-2">
                {participant.isReady && !isRevealed && (
                  <span className="text-sm text-muted-foreground">🂠 Ready</span>
                )}
                {isRevealed && participant.selectedCard && (
                  <span className="text-lg font-bold">{participant.selectedCard}</span>
                )}
                {!participant.isReady && !isRevealed && (
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                )}
                {participant.id !== currentUserId && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpenPickerId(openPickerId === participant.id ? null : participant.id)}
                      className="text-lg p-1 h-auto"
                    >
                      😀
                    </Button>
                    {openPickerId === participant.id && (
                      <EmojiPicker
                        onSelect={(emoji) => onReaction(participant.id, emoji)}
                        onClose={() => setOpenPickerId(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
