import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
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

    // Common NodejsFunction options
    const nodejsFunctionProps = {
      runtime: Runtime.NODEJS_20_X,
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        externalModules: [], // Bundle all dependencies
      },
    };

    // Lambda function for $connect
    const connectHandler = new NodejsFunction(this, 'ConnectHandler', {
      ...nodejsFunctionProps,
      entry: path.join(__dirname, '../lambda/handlers/connect.ts'),
    });

    // Lambda function for $disconnect
    const disconnectHandler = new NodejsFunction(this, 'DisconnectHandler', {
      ...nodejsFunctionProps,
      entry: path.join(__dirname, '../lambda/handlers/disconnect.ts'),
    });

    // Lambda function for createSession
    const createSessionHandler = new NodejsFunction(this, 'CreateSessionHandler', {
      ...nodejsFunctionProps,
      entry: path.join(__dirname, '../lambda/handlers/createSession.ts'),
    });

    // Lambda function for joinSession
    const joinSessionHandler = new NodejsFunction(this, 'JoinSessionHandler', {
      ...nodejsFunctionProps,
      entry: path.join(__dirname, '../lambda/handlers/joinSession.ts'),
    });

    // Lambda function for updateParticipant
    const updateParticipantHandler = new NodejsFunction(this, 'UpdateParticipantHandler', {
      ...nodejsFunctionProps,
      entry: path.join(__dirname, '../lambda/handlers/updateParticipant.ts'),
    });

    // Lambda function for revealCards
    const revealCardsHandler = new NodejsFunction(this, 'RevealCardsHandler', {
      ...nodejsFunctionProps,
      entry: path.join(__dirname, '../lambda/handlers/revealCards.ts'),
    });

    // Lambda function for resetVoting
    const resetVotingHandler = new NodejsFunction(this, 'ResetVotingHandler', {
      ...nodejsFunctionProps,
      entry: path.join(__dirname, '../lambda/handlers/resetVoting.ts'),
    });

    // Lambda function for heartbeat
    const heartbeatHandler = new NodejsFunction(this, 'HeartbeatHandler', {
      ...nodejsFunctionProps,
      entry: path.join(__dirname, '../lambda/handlers/heartbeat.ts'),
    });

    // Lambda function for sendReaction
    const sendReactionHandler = new NodejsFunction(this, 'SendReactionHandler', {
      ...nodejsFunctionProps,
      entry: path.join(__dirname, '../lambda/handlers/sendReaction.ts'),
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
    sessionsTable.grantReadWriteData(sendReactionHandler);

    connectionsTable.grantReadWriteData(connectHandler);
    connectionsTable.grantReadWriteData(disconnectHandler);
    connectionsTable.grantReadWriteData(createSessionHandler);
    connectionsTable.grantReadWriteData(joinSessionHandler);
    connectionsTable.grantReadWriteData(updateParticipantHandler);
    connectionsTable.grantReadWriteData(revealCardsHandler);
    connectionsTable.grantReadWriteData(resetVotingHandler);
    connectionsTable.grantReadWriteData(heartbeatHandler);
    connectionsTable.grantReadWriteData(sendReactionHandler);

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

    webSocketApi.addRoute('sendReaction', {
      integration: new WebSocketLambdaIntegration('SendReactionIntegration', sendReactionHandler),
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
     revealCardsHandler, resetVotingHandler, heartbeatHandler, sendReactionHandler].forEach(handler => {
      handler.addEnvironment('WEBSOCKET_ENDPOINT', webSocketEndpoint);
    });

    // Grant Lambda functions permission to manage WebSocket connections
    [disconnectHandler, createSessionHandler, joinSessionHandler, updateParticipantHandler,
     revealCardsHandler, resetVotingHandler, heartbeatHandler, sendReactionHandler].forEach(handler => {
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
