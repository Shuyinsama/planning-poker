import { useState, useEffect, useRef } from 'react';
import type { Session, CardValue, Participant } from '@/types';
import { getTransport } from '@/lib/transport';
import type { SessionTransport } from '@/lib/transport';

export function useSession(sessionId: string | null, currentUserId?: string) {
  const [session, setSession] = useState<Session | null>(null);
  const transportRef = useRef<SessionTransport>(getTransport());

  useEffect(() => {
    if (!sessionId) return;
    return transportRef.current.subscribe(sessionId, currentUserId ?? '', setSession);
  }, [sessionId, currentUserId]);

  const selectCard = (participantId: string, card: CardValue) => {
    if (!session) return;
    transportRef.current.selectCard(session.id, participantId, card);
  };

  const revealCards = () => {
    if (!session) return;
    transportRef.current.revealCards(session.id);
  };

  const resetVoting = () => {
    if (!session) return;
    transportRef.current.resetVoting(session.id);
  };

  const addParticipant = (participant: Participant) => {
    if (!session) return;
    transportRef.current.addParticipant(session, participant);
  };

  const sendReaction = (toUserId: string, emoji: string) => {
    if (!session || !currentUserId) return;
    transportRef.current.sendReaction(session.id, currentUserId, toUserId, emoji);
  };

  return { session, selectCard, revealCards, resetVoting, addParticipant, sendReaction };
}
