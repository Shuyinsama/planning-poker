export type CardValue = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '20' | '40' | '100' | '?' | '☕';

export interface Participant {
  id: string;
  name: string;
  selectedCard?: CardValue;
  isReady: boolean;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  participants: Participant[];
  isRevealed: boolean;
  currentUserId: string;
}

export interface StoredSessions {
  [sessionId: string]: Session;
}
