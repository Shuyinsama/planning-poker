import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Session, Connection, Participant } from '../types';

const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE = process.env.SESSIONS_TABLE!;
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE!;

export async function getSession(sessionId: string): Promise<Session | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: SESSIONS_TABLE,
      Key: { sessionId },
    })
  );
  return result.Item as Session | null;
}

export async function putSession(session: Session): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: SESSIONS_TABLE,
      Item: {
        ...session,
        ttl: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days TTL
      },
    })
  );
}

export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const updatedSession = { ...session, ...updates };
  await putSession(updatedSession);
  return updatedSession;
}

export async function addParticipantToSession(
  sessionId: string,
  participant: Participant
): Promise<Session | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  // Check if participant already exists
  const existingIndex = session.participants.findIndex((p) => p.id === participant.id);
  
  if (existingIndex >= 0) {
    // Update existing participant
    session.participants[existingIndex] = { ...session.participants[existingIndex], ...participant };
  } else {
    // Add new participant
    session.participants.push(participant);
  }

  await putSession(session);
  return session;
}

export async function updateParticipant(
  sessionId: string,
  participantId: string,
  updates: Partial<Participant>
): Promise<Session | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  const participantIndex = session.participants.findIndex((p) => p.id === participantId);
  if (participantIndex === -1) return null;

  session.participants[participantIndex] = {
    ...session.participants[participantIndex],
    ...updates,
  };

  await putSession(session);
  return session;
}

export async function saveConnection(connection: Connection): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: connection,
    })
  );
}

export async function deleteConnection(connectionId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    })
  );
}

export async function getConnection(connectionId: string): Promise<Connection | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId },
    })
  );
  return result.Item as Connection | null;
}

export async function getConnectionsBySession(sessionId: string): Promise<Connection[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: CONNECTIONS_TABLE,
      IndexName: 'sessionId-index',
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
      },
    })
  );
  return result.Items as Connection[] || [];
}
