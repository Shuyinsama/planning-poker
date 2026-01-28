import { useEffect, useRef, useCallback, useState } from 'react';
import { getWebSocketClient } from '@/lib/api';
import type { MessageHandler } from '@/lib/api';
import { config, isBackendAvailable } from '@/config/env';

export function useWebSocket() {
  const wsClient = useRef(getWebSocketClient());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    if (!wsClient.current || !isBackendAvailable()) {
      if (config.debug) console.log('WebSocket not available, using localStorage fallback');
      return;
    }

    try {
      await wsClient.current.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err);
      setError(err as Error);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsClient.current) {
      wsClient.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  const addMessageHandler = useCallback((handler: MessageHandler) => {
    if (wsClient.current) {
      wsClient.current.addMessageHandler(handler);
    }
  }, []);

  const removeMessageHandler = useCallback((handler: MessageHandler) => {
    if (wsClient.current) {
      wsClient.current.removeMessageHandler(handler);
    }
  }, []);

  // Check connection status periodically
  useEffect(() => {
    if (!wsClient.current) return;

    const checkConnection = setInterval(() => {
      const connected = wsClient.current?.isConnected() || false;
      setIsConnected(connected);
    }, 1000);

    return () => clearInterval(checkConnection);
  }, []);

  return {
    wsClient: wsClient.current,
    isConnected,
    error,
    connect,
    disconnect,
    addMessageHandler,
    removeMessageHandler,
    isBackendAvailable: isBackendAvailable(),
  };
}
