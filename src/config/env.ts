// Environment configuration
export const config = {
  // WebSocket API URL from AWS CDK deployment
  // Set VITE_WEBSOCKET_URL environment variable in production
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || '',
  
  // Use localStorage as fallback when WebSocket URL is not configured (local development)
  useLocalStorage: !import.meta.env.VITE_WEBSOCKET_URL,
  
  // Enable debug logging
  debug: import.meta.env.DEV,
};

export function isBackendAvailable(): boolean {
  return !!config.websocketUrl && !config.useLocalStorage;
}
