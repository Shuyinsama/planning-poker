export type CardValue = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '20' | '40' | '100' | '?' | '☕';

export interface Participant {
  id: string;
  name: string;
  selectedCard?: CardValue;
  isReady: boolean;
  lastSeen: number;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  participants: Participant[];
  isRevealed: boolean;
}

export interface Connection {
  connectionId: string;
  sessionId: string;
  participantId: string;
  ttl: number;
}

export interface WebSocketMessage {
  action: string;
  data?: any;
}

export interface CreateSessionMessage {
  sessionName: string;
  userName: string;
  userId: string;
}

export interface JoinSessionMessage {
  sessionId: string;
  userName: string;
  userId: string;
}

export interface UpdateParticipantMessage {
  sessionId: string;
  participantId: string;
  selectedCard?: CardValue;
  isReady?: boolean;
}

export interface RevealCardsMessage {
  sessionId: string;
}

export interface ResetVotingMessage {
  sessionId: string;
}

export interface HeartbeatMessage {
  sessionId: string;
  participantId: string;
}
