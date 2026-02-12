import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { putSession, saveConnection } from '../utils/dynamodb';
import { sendToConnection } from '../utils/broadcast';
import { Session, Participant, CreateSessionMessage } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('CreateSession event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId!;

  try {
    const body: CreateSessionMessage = JSON.parse(event.body || '{}');
    const { sessionName, userName, userId, votingType = 'fibonacci' } = body;

    if (!sessionName || !userName || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Generate session ID
    const sessionId = Math.random().toString(36).substring(2, 9);

    // Create participant
    const participant: Participant = {
      id: userId,
      name: userName,
      isReady: false,
      lastSeen: Date.now(),
    };

    // Create session
    const session: Session = {
      id: sessionId,
      name: sessionName,
      createdAt: Date.now(),
      participants: [participant],
      isRevealed: false,
      votingType,
    };

    // Save session to DynamoDB
    await putSession(session);

    // Save connection mapping
    await saveConnection({
      connectionId,
      sessionId,
      participantId: userId,
      ttl: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    });

    // Send response back to creator
    await sendToConnection(connectionId, {
      type: 'sessionCreated',
      data: session,
    });

    console.log(`Session ${sessionId} created by ${userName}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, sessionId }),
    };
  } catch (error) {
    console.error('Error creating session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create session' }),
    };
  }
}
