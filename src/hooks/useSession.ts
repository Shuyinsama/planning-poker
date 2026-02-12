import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, Participant, CardValue, Reaction } from '@/types';
import { storage } from '@/lib/storage';
import { useWebSocket } from './useWebSocket';
import type { WebSocketMessage } from '@/lib/api';

const PRESENCE_TIMEOUT = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 5000; // 5 seconds

export function useSession(sessionId: string | null, currentUserId?: string) {
  const [session, setSession] = useState<Session | null>(null);
  const heartbeatRef = useRef<number | undefined>(undefined);
  const cleanupRef = useRef<number | undefined>(undefined);
  const { wsClient, isBackendAvailable, addMessageHandler, removeMessageHandler } = useWebSocket();

  // Clean up inactive participants (localStorage fallback only)
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

  // Update current user's presence (localStorage fallback only)
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

  // Handle WebSocket messages
  useEffect(() => {
    if (!isBackendAvailable || !sessionId) return;

    const handleMessage = (message: WebSocketMessage) => {
      console.log('useSession - WebSocket message:', message);
      
      switch (message.type) {
        case 'sessionCreated':
        case 'sessionJoined':
        case 'participantJoined':
        case 'participantUpdated':
        case 'cardsRevealed':
        case 'votingReset':
        case 'sessionUpdate':
        case 'reactionSent':
          setSession(message.data);
          break;
        case 'error':
          console.error('WebSocket error:', message.data);
          break;
      }
    };

    addMessageHandler(handleMessage);

    return () => {
      removeMessageHandler(handleMessage);
    };
  }, [isBackendAvailable, sessionId, addMessageHandler, removeMessageHandler]);

  // Set up presence heartbeat and polling (localStorage fallback)
  useEffect(() => {
    if (sessionId) {
      // If using backend, no need for localStorage polling
      if (isBackendAvailable) {
        console.log('useSession - Using WebSocket backend');
        return;
      }

      console.log('useSession - Using localStorage fallback');

      // Update presence FIRST for current user before any cleanup
      if (currentUserId) {
        const currentSession = storage.getSession(sessionId);
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            participants: currentSession.participants.map((p) =>
              p.id === currentUserId ? { ...p, lastSeen: Date.now() } : p
            ),
          };
          storage.saveSession(updatedSession);
        }
      }

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

        // Don't immediately remove participant on unmount to avoid issues with React StrictMode
        // The presence timeout mechanism will naturally clean up inactive participants
      };
    }
  }, [sessionId, currentUserId, updatePresence, cleanupInactiveParticipants, isBackendAvailable]);

  const updateSession = (updatedSession: Session) => {
    // Optimistic update
    setSession(updatedSession);
    
    // Fallback to localStorage if backend not available
    if (!isBackendAvailable) {
      storage.saveSession(updatedSession);
    }
  };

  const selectCard = (participantId: string, card: CardValue) => {
    if (!session) return;

    // Use WebSocket if available
    if (isBackendAvailable && wsClient) {
      wsClient.updateParticipant(session.id, participantId, card, true);
    } else {
      // Fallback to localStorage
      const updatedSession = {
        ...session,
        participants: session.participants.map((p) =>
          p.id === participantId ? { ...p, selectedCard: card, isReady: true } : p
        ),
      };
      updateSession(updatedSession);
    }
  };

  const revealCards = () => {
    if (!session) return;
    
    // Use WebSocket if available
    if (isBackendAvailable && wsClient) {
      wsClient.revealCards(session.id);
    } else {
      // Fallback to localStorage
      updateSession({ ...session, isRevealed: true });
    }
  };

  const resetVoting = () => {
    if (!session) return;

    // Use WebSocket if available
    if (isBackendAvailable && wsClient) {
      wsClient.resetVoting(session.id);
    } else {
      // Fallback to localStorage
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
    }
  };

  const addParticipant = (participant: Participant) => {
    if (!session) return;

    // For WebSocket, this should happen via joinSession message
    // This is primarily for localStorage fallback
    if (!isBackendAvailable) {
      const updatedSession = {
        ...session,
        participants: [...session.participants, participant],
      };
      updateSession(updatedSession);
    }
  };

  const sendReaction = (toUserId: string, emoji: string) => {
    if (!session || !currentUserId) return;

    const reaction: Reaction = {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      fromUserId: currentUserId,
      toUserId,
      timestamp: Date.now(),
    };

    // Use WebSocket if available
    if (isBackendAvailable && wsClient) {
      wsClient.sendReaction(session.id, currentUserId, toUserId, emoji);
    } else {
      // Fallback to localStorage
      const updatedSession = {
        ...session,
        participants: session.participants.map((p) => {
          if (p.id === toUserId) {
            const existingReactions = p.reactions || [];
            // Keep only recent reactions (last 10 seconds) and add new one
            const recentReactions = existingReactions.filter(
              (r) => Date.now() - r.timestamp < 10000
            );
            return { ...p, reactions: [...recentReactions, reaction] };
          }
          return p;
        }),
      };
      updateSession(updatedSession);
    }
  };

  return {
    session,
    selectCard,
    revealCards,
    resetVoting,
    addParticipant,
    sendReaction,
    isBackendAvailable,
  };
}
