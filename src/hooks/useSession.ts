import { useState, useEffect } from 'react';
import type { Session, Participant, CardValue } from '@/types';
import { storage } from '@/lib/storage';

export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (sessionId) {
      const loadedSession = storage.getSession(sessionId);
      setSession(loadedSession);
    }
  }, [sessionId]);

  const updateSession = (updatedSession: Session) => {
    setSession(updatedSession);
    storage.saveSession(updatedSession);
  };

  const selectCard = (participantId: string, card: CardValue) => {
    if (!session) return;

    const updatedSession = {
      ...session,
      participants: session.participants.map((p) =>
        p.id === participantId ? { ...p, selectedCard: card, isReady: true } : p
      ),
    };
    updateSession(updatedSession);
  };

  const revealCards = () => {
    if (!session) return;
    updateSession({ ...session, isRevealed: true });
  };

  const resetVoting = () => {
    if (!session) return;

    const updatedSession = {
      ...session,
      isRevealed: false,
      participants: session.participants.map((p) => ({
        ...p,
        selectedCard: undefined,
        isReady: false,
      })),
    };
    updateSession(updatedSession);
  };

  const addParticipant = (participant: Participant) => {
    if (!session) return;

    const updatedSession = {
      ...session,
      participants: [...session.participants, participant],
    };
    updateSession(updatedSession);
  };

  return {
    session,
    selectCard,
    revealCards,
    resetVoting,
    addParticipant,
  };
}
