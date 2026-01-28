import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSession, addParticipantToSession, saveConnection } from '../utils/dynamodb';
import { sendToConnection, broadcastToSession } from '../utils/broadcast';
import { Participant, JoinSessionMessage } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('JoinSession event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId!;

  try {
    const body: JoinSessionMessage = JSON.parse(event.body || '{}');
    const { sessionId, userName, userId } = body;

    if (!sessionId || !userName || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Check if session exists
    const session = await getSession(sessionId);
    if (!session) {
      await sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Session not found' },
      });
      
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Session not found' }),
      };
    }

    // Create participant
    const participant: Participant = {
      id: userId,
      name: userName,
      isReady: false,
      lastSeen: Date.now(),
    };

    // Add participant to session
    const updatedSession = await addParticipantToSession(sessionId, participant);

    if (!updatedSession) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to join session' }),
      };
    }

    // Save connection mapping
    await saveConnection({
      connectionId,
      sessionId,
      participantId: userId,
      ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    });

    // Send updated session to the new participant
    await sendToConnection(connectionId, {
      type: 'sessionJoined',
      data: updatedSession,
    });

    // Broadcast to all other participants
    await broadcastToSession(sessionId, {
      type: 'participantJoined',
      data: updatedSession,
    }, connectionId);

    console.log(`User ${userName} joined session ${sessionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error joining session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to join session' }),
    };
  }
}
