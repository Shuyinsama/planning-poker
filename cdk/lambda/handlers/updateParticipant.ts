import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { updateParticipant as updateParticipantInDb } from '../utils/dynamodb';
import { broadcastToSession } from '../utils/broadcast';
import { UpdateParticipantMessage } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('UpdateParticipant event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId!;

  try {
    const body: UpdateParticipantMessage = JSON.parse(event.body || '{}');
    const { sessionId, participantId, selectedCard, isReady } = body;

    if (!sessionId || !participantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const updates: any = { lastSeen: Date.now() };
    if (selectedCard !== undefined) updates.selectedCard = selectedCard;
    if (isReady !== undefined) updates.isReady = isReady;

    const updatedSession = await updateParticipantInDb(sessionId, participantId, updates);

    if (!updatedSession) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Session or participant not found' }),
      };
    }

    // Broadcast to all participants in the session
    await broadcastToSession(sessionId, {
      type: 'participantUpdated',
      data: updatedSession,
    });

    console.log(`Participant ${participantId} updated in session ${sessionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error updating participant:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update participant' }),
    };
  }
}
