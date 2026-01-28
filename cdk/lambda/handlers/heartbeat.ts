import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { updateParticipant } from '../utils/dynamodb';
import { HeartbeatMessage } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Heartbeat event:', JSON.stringify(event, null, 2));

  try {
    const body: HeartbeatMessage = JSON.parse(event.body || '{}');
    const { sessionId, participantId } = body;

    if (!sessionId || !participantId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Update participant's lastSeen timestamp
    await updateParticipant(sessionId, participantId, {
      lastSeen: Date.now(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update heartbeat' }),
    };
  }
}
