import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import * as path from 'path';

export class PlanningPokerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    // Add GSI for querying connections by sessionId
    connectionsTable.addGlobalSecondaryIndex({
      indexName: 'sessionId-index',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
    });

    // Lambda execution role environment variables
    const lambdaEnvironment = {
      SESSIONS_TABLE: sessionsTable.tableName,
      CONNECTIONS_TABLE: connectionsTable.tableName,
    };

    // Lambda function for $connect
    const connectHandler = new lambda.Function(this, 'ConnectHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'connect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/handlers'), {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash', '-c',
            'cp -r . /asset-output && cd /asset-output && npm install --production'
          ],
        },
      }),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda function for $disconnect
    const disconnectHandler = new lambda.Function(this, 'DisconnectHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'disconnect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda function for createSession
    const createSessionHandler = new lambda.Function(this, 'CreateSessionHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/createSession.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda function for joinSession
    const joinSessionHandler = new lambda.Function(this, 'JoinSessionHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/joinSession.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda function for updateParticipant
    const updateParticipantHandler = new lambda.Function(this, 'UpdateParticipantHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/updateParticipant.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda function for revealCards
    const revealCardsHandler = new lambda.Function(this, 'RevealCardsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/revealCards.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda function for resetVoting
    const resetVotingHandler = new lambda.Function(this, 'ResetVotingHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/resetVoting.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Lambda function for heartbeat
    const heartbeatHandler = new lambda.Function(this, 'HeartbeatHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/heartbeat.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
    });

    // Grant DynamoDB permissions
    sessionsTable.grantReadWriteData(connectHandler);
    sessionsTable.grantReadWriteData(disconnectHandler);
    sessionsTable.grantReadWriteData(createSessionHandler);
    sessionsTable.grantReadWriteData(joinSessionHandler);
    sessionsTable.grantReadWriteData(updateParticipantHandler);
    sessionsTable.grantReadWriteData(revealCardsHandler);
    sessionsTable.grantReadWriteData(resetVotingHandler);
    sessionsTable.grantReadWriteData(heartbeatHandler);

    connectionsTable.grantReadWriteData(connectHandler);
    connectionsTable.grantReadWriteData(disconnectHandler);
    connectionsTable.grantReadWriteData(createSessionHandler);
    connectionsTable.grantReadWriteData(joinSessionHandler);
    connectionsTable.grantReadWriteData(updateParticipantHandler);
    connectionsTable.grantReadWriteData(revealCardsHandler);
    connectionsTable.grantReadWriteData(resetVotingHandler);
    connectionsTable.grantReadWriteData(heartbeatHandler);

    // WebSocket API
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'PlanningPokerWebSocketApi', {
      apiName: 'PlanningPokerWebSocketApi',
      description: 'WebSocket API for Planning Poker',
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration('ConnectIntegration', connectHandler),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler),
      },
    });

    // Add routes
    webSocketApi.addRoute('createSession', {
      integration: new WebSocketLambdaIntegration('CreateSessionIntegration', createSessionHandler),
    });

    webSocketApi.addRoute('joinSession', {
      integration: new WebSocketLambdaIntegration('JoinSessionIntegration', joinSessionHandler),
    });

    webSocketApi.addRoute('updateParticipant', {
      integration: new WebSocketLambdaIntegration('UpdateParticipantIntegration', updateParticipantHandler),
    });

    webSocketApi.addRoute('revealCards', {
      integration: new WebSocketLambdaIntegration('RevealCardsIntegration', revealCardsHandler),
    });

    webSocketApi.addRoute('resetVoting', {
      integration: new WebSocketLambdaIntegration('ResetVotingIntegration', resetVotingHandler),
    });

    webSocketApi.addRoute('heartbeat', {
      integration: new WebSocketLambdaIntegration('HeartbeatIntegration', heartbeatHandler),
    });

    // WebSocket Stage
    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'ProductionStage', {
      webSocketApi,
      stageName: 'production',
      autoDeploy: true,
    });

    // Add WebSocket endpoint to Lambda environment
    const webSocketEndpoint = `https://${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/${webSocketStage.stageName}`;
    
    [disconnectHandler, createSessionHandler, joinSessionHandler, updateParticipantHandler, 
     revealCardsHandler, resetVotingHandler, heartbeatHandler].forEach(handler => {
      handler.addEnvironment('WEBSOCKET_ENDPOINT', webSocketEndpoint);
    });

    // Grant Lambda functions permission to manage WebSocket connections
    [disconnectHandler, createSessionHandler, joinSessionHandler, updateParticipantHandler,
     revealCardsHandler, resetVotingHandler, heartbeatHandler].forEach(handler => {
      handler.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/${webSocketStage.stageName}/POST/@connections/*`
        ],
      }));
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebSocketURL', {
      value: `wss://${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/${webSocketStage.stageName}`,
      description: 'WebSocket URL for the Planning Poker API',
    });

    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: sessionsTable.tableName,
      description: 'DynamoDB Sessions Table Name',
    });

    new cdk.CfnOutput(this, 'ConnectionsTableName', {
      value: connectionsTable.tableName,
      description: 'DynamoDB Connections Table Name',
    });
  }
}
