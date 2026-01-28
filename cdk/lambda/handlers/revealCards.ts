import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { updateSession } from '../utils/dynamodb';
import { broadcastToSession } from '../utils/broadcast';
import { RevealCardsMessage } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('RevealCards event:', JSON.stringify(event, null, 2));

  try {
    const body: RevealCardsMessage = JSON.parse(event.body || '{}');
    const { sessionId } = body;

    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing sessionId' }),
      };
    }

    const updatedSession = await updateSession(sessionId, { isRevealed: true });

    if (!updatedSession) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Session not found' }),
      };
    }

    // Broadcast to all participants
    await broadcastToSession(sessionId, {
      type: 'cardsRevealed',
      data: updatedSession,
    });

    console.log(`Cards revealed in session ${sessionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error revealing cards:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to reveal cards' }),
    };
  }
}
