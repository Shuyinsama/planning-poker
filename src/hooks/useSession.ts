import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, Participant, CardValue } from '@/types';
import { storage } from '@/lib/storage';

const PRESENCE_TIMEOUT = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 5000; // 5 seconds

export function useSession(sessionId: string | null, currentUserId?: string) {
  const [session, setSession] = useState<Session | null>(null);
  const heartbeatRef = useRef<number | undefined>(undefined);
  const cleanupRef = useRef<number | undefined>(undefined);

  // Clean up inactive participants
  const cleanupInactiveParticipants = useCallback((currentSession: Session) => {
    const now = Date.now();
    const activeParticipants = currentSession.participants.filter(
      (p) => now - p.lastSeen < PRESENCE_TIMEOUT
    );

    if (activeParticipants.length !== currentSession.participants.length) {
      return {
        ...currentSession,
        participants: activeParticipants,
      };
    }
    return currentSession;
  }, []);

  // Update current user's presence
  const updatePresence = useCallback(() => {
    if (!sessionId || !currentUserId) return;

    const currentSession = storage.getSession(sessionId);
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      participants: currentSession.participants.map((p) =>
        p.id === currentUserId ? { ...p, lastSeen: Date.now() } : p
      ),
    };

    const cleanedSession = cleanupInactiveParticipants(updatedSession);
    storage.saveSession(cleanedSession);
    setSession(cleanedSession);
  }, [sessionId, currentUserId, cleanupInactiveParticipants]);

  // Set up presence heartbeat and polling
  useEffect(() => {
    if (sessionId) {
      // Load initial session state
      const loadedSession = storage.getSession(sessionId);
      console.log('useSession - Initial load for sessionId:', sessionId);
      console.log('useSession - Loaded session:', loadedSession);
      if (loadedSession) {
        const cleanedSession = cleanupInactiveParticipants(loadedSession);
        console.log('useSession - After cleanup, participants:', cleanedSession.participants);
        setSession(cleanedSession);
        if (cleanedSession !== loadedSession) {
          storage.saveSession(cleanedSession);
        }
      }

      if (currentUserId) {
        // Initial presence update for current user
        updatePresence();

        // Send heartbeat every 5 seconds
        heartbeatRef.current = window.setInterval(updatePresence, HEARTBEAT_INTERVAL);
      }

      // Poll for changes every 2 seconds (for all users)
      cleanupRef.current = window.setInterval(() => {
        const currentSession = storage.getSession(sessionId);
        console.log('useSession - Polling update, participants:', currentSession?.participants.length || 0);
        if (currentSession) {
          const cleanedSession = cleanupInactiveParticipants(currentSession);
          setSession(cleanedSession);
        }
      }, 2000);

      // Cleanup on unmount
      return () => {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        if (cleanupRef.current) clearInterval(cleanupRef.current);

        // Mark user as inactive when leaving (only if we have a userId)
        if (currentUserId) {
          const currentSession = storage.getSession(sessionId);
          if (currentSession) {
            const updatedSession = {
              ...currentSession,
              participants: currentSession.participants.filter(
                (p) => p.id !== currentUserId
              ),
            };
            storage.saveSession(updatedSession);
          }
        }
      };
    }
  }, [sessionId, currentUserId, updatePresence, cleanupInactiveParticipants]);

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
