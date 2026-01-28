import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getConnection, deleteConnection, getSession, updateParticipant } from '../utils/dynamodb';
import { broadcastToSession } from '../utils/broadcast';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Disconnect event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId!;

  try {
    // Get connection details
    const connection = await getConnection(connectionId);
    
    if (connection) {
      // Update participant's lastSeen to mark them as potentially offline
      // Don't remove them immediately - let the presence timeout handle it
      const session = await getSession(connection.sessionId);
      
      if (session) {
        await updateParticipant(connection.sessionId, connection.participantId, {
          lastSeen: Date.now() - 60000, // Set lastSeen to 1 minute ago to speed up cleanup
        });

        // Broadcast updated session to others
        await broadcastToSession(connection.sessionId, {
          type: 'sessionUpdate',
          data: session,
        }, connectionId);
      }

      // Delete the connection
      await deleteConnection(connectionId);
    }

    console.log(`Connection ${connectionId} disconnected`);

    return {
      statusCode: 200,
      body: 'Disconnected',
    };
  } catch (error) {
    console.error('Error handling disconnect:', error);
    return {
      statusCode: 500,
      body: 'Failed to disconnect',
    };
  }
}
