# Planning Poker CDK Infrastructure

This directory contains the AWS CDK infrastructure code for the Planning Poker application backend.

## Architecture

- **API Gateway WebSocket API**: Real-time bidirectional communication
- **AWS Lambda**: 8 serverless functions handling WebSocket routes
- **DynamoDB**: 2 tables (Sessions and Connections) with on-demand billing
- **IAM**: Least-privilege roles and policies

## Prerequisites

1. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```

2. **AWS CDK CLI** installed globally:
   ```bash
   npm install -g aws-cdk
   ```

3. **Bootstrap your AWS account** (one-time setup):
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/REGION
   ```

## Deployment

### 1. Install dependencies
```bash
npm install
```

Or from the root directory:
```bash
npm run cdk:install
```

### 2. Build the TypeScript code
```bash
npm run build
```

Or from the root directory:
```bash
npm run cdk:build
```

### 3. Synthesize the CloudFormation template (optional)
```bash
npm run synth
```

This generates the CloudFormation template to `cdk.out/`.

### 4. Deploy to AWS
```bash
npm run deploy
```

Or from the root directory:
```bash
npm run cdk:deploy
```

This will:
- Create DynamoDB tables
- Deploy Lambda functions
- Set up API Gateway WebSocket API
- Configure IAM roles and permissions

**Important**: Note the WebSocket URL from the output - you'll need this for the frontend configuration.

### 5. Get Stack Outputs
After deployment, retrieve the WebSocket URL:
```bash
aws cloudformation describe-stacks --stack-name PlanningPokerStack --query 'Stacks[0].Outputs'
```

## Stack Outputs

After deployment, you'll get:
- **WebSocketURL**: The WebSocket endpoint URL (wss://...)
- **SessionsTableName**: DynamoDB table name for sessions
- **ConnectionsTableName**: DynamoDB table name for connections

## Development

### View differences before deployment
```bash
npm run diff
```

### Watch mode (auto-compile on changes)
```bash
npm run watch
```

## Cleanup

To remove all resources from AWS:
```bash
npm run destroy
```

Or from the root directory:
```bash
npm run cdk:destroy
```

**Warning**: This will delete all DynamoDB tables and their data.

## Project Structure

```
cdk/
├── bin/
│   └── planning-poker.ts       # CDK app entry point
├── lib/
│   └── planning-poker-stack.ts # Main stack definition
├── lambda/
│   ├── handlers/               # Lambda function handlers
│   │   ├── connect.ts
│   │   ├── disconnect.ts
│   │   ├── createSession.ts
│   │   ├── joinSession.ts
│   │   ├── updateParticipant.ts
│   │   ├── revealCards.ts
│   │   ├── resetVoting.ts
│   │   └── heartbeat.ts
│   ├── utils/                  # Shared utilities
│   │   ├── dynamodb.ts
│   │   └── broadcast.ts
│   └── types/                  # TypeScript types
│       └── index.ts
├── cdk.json                    # CDK configuration
├── package.json
└── tsconfig.json
```

## Cost Estimation

For typical usage (< 100 users, < 1000 sessions/month):
- **DynamoDB**: ~$1-5/month (on-demand pricing)
- **API Gateway**: ~$1-3/month (WebSocket connections and messages)
- **Lambda**: ~$0-2/month (generous free tier)
- **Total**: ~$3-12/month

Most small teams will stay within AWS free tier limits.

## Troubleshooting

### Lambda bundling issues
If you encounter bundling errors, ensure you have Docker running (required for Lambda bundling).

### Permission denied
Ensure your AWS credentials have permissions to create:
- DynamoDB tables
- Lambda functions
- API Gateway APIs
- IAM roles and policies
- CloudFormation stacks

### WebSocket connection failures
Check:
1. The WebSocket URL is correct (starts with `wss://`)
2. CORS settings in API Gateway (if applicable)
3. Lambda function logs in CloudWatch

### View Lambda logs
```bash
aws logs tail /aws/lambda/PlanningPokerStack-CreateSessionHandler --follow
```

## Next Steps

After deploying the backend:
1. Copy the WebSocket URL from stack outputs
2. Configure the frontend with the WebSocket URL (see main README)
3. Build and deploy the frontend
4. Test the application with multiple browsers
