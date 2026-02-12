export type VotingType = 'fibonacci' | 'tshirt';

export type FibonacciCardValue = '0' | '1' | '2' | '3' | '5' | '8' | '13' | '20' | '40' | '100' | '?' | '☕';
export type TShirtCardValue = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '?' | '☕';
export type CardValue = FibonacciCardValue | TShirtCardValue;

export const FIBONACCI_VALUES: FibonacciCardValue[] = ['0', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕'];
export const TSHIRT_VALUES: TShirtCardValue[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'];

export const VOTING_TYPE_LABELS: Record<VotingType, string> = {
  fibonacci: 'Fibonacci (0, 1, 2, 3, 5, 8...)',
  tshirt: 'T-Shirt Sizes (XS, S, M, L...)',
};

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
  currentUserId: string;
  votingType: VotingType;
}

export interface StoredSessions {
  [sessionId: string]: Session;
}
