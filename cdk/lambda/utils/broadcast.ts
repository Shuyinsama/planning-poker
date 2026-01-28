import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { getConnectionsBySession, deleteConnection } from './dynamodb';

const ENDPOINT = process.env.WEBSOCKET_ENDPOINT!;

export async function broadcastToSession(sessionId: string, message: any, excludeConnectionId?: string): Promise<void> {
  const connections = await getConnectionsBySession(sessionId);
  
  const apiGatewayClient = new ApiGatewayManagementApiClient({
    endpoint: ENDPOINT,
  });

  const sendPromises = connections
    .filter((conn) => conn.connectionId !== excludeConnectionId)
    .map(async (conn) => {
      try {
        await apiGatewayClient.send(
          new PostToConnectionCommand({
            ConnectionId: conn.connectionId,
            Data: Buffer.from(JSON.stringify(message)),
          })
        );
      } catch (error: any) {
        // If connection is stale (410 Gone), remove it
        if (error.statusCode === 410) {
          console.log(`Connection ${conn.connectionId} is stale, removing`);
          await deleteConnection(conn.connectionId);
        } else {
          console.error(`Error sending to connection ${conn.connectionId}:`, error);
        }
      }
    });

  await Promise.all(sendPromises);
}

export async function sendToConnection(connectionId: string, message: any): Promise<void> {
  const apiGatewayClient = new ApiGatewayManagementApiClient({
    endpoint: ENDPOINT,
  });

  try {
    await apiGatewayClient.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(message)),
      })
    );
  } catch (error: any) {
    if (error.statusCode === 410) {
      console.log(`Connection ${connectionId} is stale, removing`);
      await deleteConnection(connectionId);
    }
    throw error;
  }
}
