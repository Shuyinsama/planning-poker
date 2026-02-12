import { config } from '@/config/env';
import type { CardValue, VotingType } from '@/types';

export type WebSocketMessageType =
  | 'sessionCreated'
  | 'sessionJoined'
  | 'participantJoined'
  | 'participantUpdated'
  | 'cardsRevealed'
  | 'votingReset'
  | 'sessionUpdate'
  | 'reactionSent'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
}

export type MessageHandler = (message: WebSocketMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyClosed = false;
  private messageQueue: string[] = [];
  private heartbeatInterval: number | null = null;
  private sessionId: string | null = null;
  private participantId: string | null = null;

  private url: string;
  
  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isIntentionallyClosed = false;
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        if (config.debug) console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
        resolve();
      };

      this.ws.onclose = (event) => {
        if (config.debug) console.log('WebSocket closed', event);
        this.stopHeartbeat();

        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
          if (config.debug) console.log(`Reconnecting in ${delay}ms...`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        }
      };

      this.ws.onerror = (error) => {
        if (config.debug) console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (config.debug) console.log('WebSocket message received:', message);
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    });
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(action: string, data: any): void {
    const message = JSON.stringify({ action, ...data });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      if (config.debug) console.log('WebSocket message sent:', { action, data });
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
      if (config.debug) console.log('Message queued:', { action, data });
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(message);
        if (config.debug) console.log('Queued message sent:', message);
      }
    }
  }

  addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  // Session operations
  createSession(sessionName: string, userName: string, userId: string, votingType: VotingType = 'fibonacci'): void {
    this.sessionId = null; // Will be set when we receive sessionCreated
    this.participantId = userId;
    this.send('createSession', { sessionName, userName, userId, votingType });
  }

  joinSession(sessionId: string, userName: string, userId: string): void {
    this.sessionId = sessionId;
    this.participantId = userId;
    this.send('joinSession', { sessionId, userName, userId });
    this.startHeartbeat();
  }

  updateParticipant(sessionId: string, participantId: string, selectedCard?: CardValue, isReady?: boolean): void {
    this.send('updateParticipant', { sessionId, participantId, selectedCard, isReady });
  }

  revealCards(sessionId: string): void {
    this.send('revealCards', { sessionId });
  }

  resetVoting(sessionId: string): void {
    this.send('resetVoting', { sessionId });
  }

  sendReaction(sessionId: string, fromUserId: string, toUserId: string, emoji: string): void {
    this.send('sendReaction', { sessionId, fromUserId, toUserId, emoji });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = window.setInterval(() => {
      if (this.sessionId && this.participantId) {
        this.send('heartbeat', {
          sessionId: this.sessionId,
          participantId: this.participantId,
        });
      }
    }, 5000); // Send heartbeat every 5 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  setSessionInfo(sessionId: string, participantId: string): void {
    this.sessionId = sessionId;
    this.participantId = participantId;
    this.startHeartbeat();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient | null {
  if (!config.websocketUrl) {
    return null;
  }

  if (!wsClient) {
    wsClient = new WebSocketClient(config.websocketUrl);
  }

  return wsClient;
}

export function resetWebSocketClient(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}
