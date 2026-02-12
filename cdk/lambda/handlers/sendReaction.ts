import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSession, updateParticipant } from '../utils/dynamodb';
import { broadcastToSession } from '../utils/broadcast';
import { SendReactionMessage, Reaction } from '../types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('SendReaction event:', JSON.stringify(event, null, 2));

  try {
    const body: SendReactionMessage = JSON.parse(event.body || '{}');
    const { sessionId, fromUserId, toUserId, emoji } = body;

    if (!sessionId || !fromUserId || !toUserId || !emoji) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const session = await getSession(sessionId);
    if (!session) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Session not found' }),
      };
    }

    // Find the target participant
    const targetParticipant = session.participants.find((p) => p.id === toUserId);
    if (!targetParticipant) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Participant not found' }),
      };
    }

    // Create the reaction
    const reaction: Reaction = {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      fromUserId,
      toUserId,
      timestamp: Date.now(),
    };

    // Update participant with new reaction
    const existingReactions = targetParticipant.reactions || [];
    // Keep only recent reactions (last 10 seconds) and add new one
    const recentReactions = existingReactions.filter(
      (r) => Date.now() - r.timestamp < 10000
    );
    const updatedReactions = [...recentReactions, reaction];

    const updatedSession = await updateParticipant(sessionId, toUserId, {
      reactions: updatedReactions,
    });

    if (!updatedSession) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update participant' }),
      };
    }

    // Broadcast to all participants in the session
    await broadcastToSession(sessionId, {
      type: 'reactionSent',
      data: updatedSession,
    });

    console.log(`Reaction ${emoji} sent from ${fromUserId} to ${toUserId} in session ${sessionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error sending reaction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send reaction' }),
    };
  }
}
