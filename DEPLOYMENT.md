# Planning Poker - AWS Deployment Guide

This guide walks you through deploying the Planning Poker application with an AWS serverless backend.

## Overview

The application now supports two modes:
1. **Local Development** (localStorage) - No backend required
2. **Production** (AWS Backend) - Real-time WebSocket with DynamoDB

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```
3. **AWS CDK CLI** installed globally:
   ```bash
   npm install -g aws-cdk
   ```
4. **Node.js 18+** and npm

## Step 1: Bootstrap AWS CDK (First Time Only)

If you haven't used CDK in your AWS account before:

```bash
cdk bootstrap aws://YOUR-ACCOUNT-ID/YOUR-REGION
```

Replace `YOUR-ACCOUNT-ID` with your AWS account ID and `YOUR-REGION` with your preferred region (e.g., `us-east-1`).

## Step 2: Deploy the Backend

### Install CDK dependencies
```bash
npm run cdk:install
```

### Build the CDK project
```bash
npm run cdk:build
```

### Preview the changes (optional)
```bash
npm run cdk:synth
```

### Deploy to AWS
```bash
npm run cdk:deploy
```

This will:
- Create 2 DynamoDB tables (Sessions and Connections)
- Deploy 9 Lambda functions
- Set up API Gateway WebSocket API
- Configure IAM roles and permissions

**Important**: When prompted, review the IAM changes and type `y` to approve.

### Save the WebSocket URL

After deployment completes, you'll see output similar to:

```
Outputs:
PlanningPokerStack.WebSocketURL = wss://abc123xyz.execute-api.us-east-1.amazonaws.com/production
PlanningPokerStack.SessionsTableName = PlanningPokerStack-SessionsTable...
PlanningPokerStack.ConnectionsTableName = PlanningPokerStack-ConnectionsTable...
```

**Copy the WebSocketURL** - you'll need it for the frontend configuration.

## Step 3: Configure the Frontend

### Update .env.production

Copy the example file and add your WebSocket URL:

```bash
cp .env.production.example .env.production
```

Then edit `.env.production` and add your WebSocket URL:

```bash
VITE_WEBSOCKET_URL=wss://YOUR-WEBSOCKET-URL-HERE
```

For example:
```bash
VITE_WEBSOCKET_URL=wss://abc123xyz.execute-api.us-east-1.amazonaws.com/production
```

## Step 4: Build the Frontend

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## Step 5: Deploy the Frontend

You have several options:

### Option A: AWS Amplify (Easiest)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
3. Click "New app" > "Host web app"
4. Connect your repository
5. Add environment variable:
   - Key: `VITE_WEBSOCKET_URL`
   - Value: Your WebSocket URL from Step 2
6. Deploy!

### Option B: S3 + CloudFront (Using existing setup)

Update `deploy-aws.sh` with your S3 bucket and CloudFront distribution ID, then:

```bash
./deploy-aws.sh
```

### Option C: Manual S3 Upload

```bash
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete
```

## Step 6: Test the Application

1. Open your deployed frontend URL in one browser
2. Create a new session
3. Open the same URL in a different browser (or incognito mode)
4. Join the session using the session ID
5. Both browsers should see real-time updates!

### Testing Checklist

- [ ] Create a session
- [ ] Join from another browser
- [ ] See other participants in real-time
- [ ] Select a card
- [ ] Reveal cards
- [ ] Reset voting
- [ ] Verify presence/heartbeat (participants stay connected)

## Troubleshooting

### WebSocket Connection Fails

**Check the WebSocket URL:**
```bash
echo $VITE_WEBSOCKET_URL
```

Should start with `wss://` (not `ws://` or `https://`).

**Check browser console** for connection errors.

**Verify deployment:**
```bash
aws cloudformation describe-stacks --stack-name PlanningPokerStack --query 'Stacks[0].Outputs'
```

### Session Not Found

**Check Lambda logs:**
```bash
aws logs tail /aws/lambda/PlanningPokerStack-CreateSessionHandler --follow
```

**Check DynamoDB table:**
```bash
aws dynamodb scan --table-name $(aws cloudformation describe-stacks --stack-name PlanningPokerStack --query 'Stacks[0].Outputs[?OutputKey==`SessionsTableName`].OutputValue' --output text)
```

### Participants Not Updating

**Verify heartbeat is working** - check browser console for heartbeat messages.

**Check WebSocket messages:**
Look for `WebSocket message sent` and `WebSocket message received` in console.

### Environment Variable Not Set

**During build:**
```bash
VITE_WEBSOCKET_URL=wss://your-url npm run build
```

**Verify in production build:**
```bash
grep -r "wss://" dist/
```

## Local Development (Without Backend)

To develop locally without deploying the backend:

```bash
npm run dev
```

The app will use localStorage as a fallback. Sessions won't be shared across browsers, but all functionality will work for single-browser testing.

## Cleanup / Teardown

To remove all AWS resources:

```bash
npm run cdk:destroy
```

**Warning**: This will permanently delete:
- All DynamoDB tables and session data
- All Lambda functions
- API Gateway WebSocket API

## Cost Estimation

For typical usage (< 100 users, < 1000 sessions/month):

| Service | Estimated Cost |
|---------|----------------|
| DynamoDB | $1-5/month |
| API Gateway WebSocket | $1-3/month |
| Lambda | $0-2/month |
| **Total** | **$3-12/month** |

Most small teams will stay within AWS Free Tier limits for the first 12 months.

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ WebSocket
       ▼
┌─────────────┐
│   API GW    │
│  WebSocket  │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐
│   Lambda    │─────▶│  DynamoDB   │
│  Functions  │      │   Tables    │
└─────────────┘      └─────────────┘
```

## Additional Resources

- [CDK README](./cdk/README.md) - Detailed CDK documentation
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [API Gateway WebSocket APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)

## Support

For issues or questions:
1. Check browser console for errors
2. Check AWS CloudWatch logs for Lambda functions
3. Verify DynamoDB tables contain data
4. Review the [troubleshooting section](#troubleshooting)
