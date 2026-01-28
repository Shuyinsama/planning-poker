import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSession, putSession } from '../utils/dynamodb';
import { broadcastToSession } from '../utils/broadcast';
import { ResetVotingMessage } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('ResetVoting event:', JSON.stringify(event, null, 2));

  try {
    const body: ResetVotingMessage = JSON.parse(event.body || '{}');
    const { sessionId } = body;

    if (!sessionId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing sessionId' }),
      };
    }

    const session = await getSession(sessionId);

    if (!session) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Session not found' }),
      };
    }

    // Reset all participants
    const updatedSession = {
      ...session,
      isRevealed: false,
      participants: session.participants.map((p) => ({
        ...p,
        selectedCard: undefined,
        isReady: false,
      })),
    };

    await putSession(updatedSession);

    // Broadcast to all participants
    await broadcastToSession(sessionId, {
      type: 'votingReset',
      data: updatedSession,
    });

    console.log(`Voting reset in session ${sessionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error resetting voting:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to reset voting' }),
    };
  }
}
