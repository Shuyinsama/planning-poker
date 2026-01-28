import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Connect event:', JSON.stringify(event, null, 2));

  const connectionId = event.requestContext.connectionId!;

  console.log(`New connection: ${connectionId}`);

  return {
    statusCode: 200,
    body: 'Connected',
  };
}
