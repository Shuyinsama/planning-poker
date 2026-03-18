# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend Development
```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript compile + Vite production build
npm run lint         # ESLint
npm run preview      # Preview production build locally
```

### Testing
```bash
npm test             # Vitest in watch mode
npm run test:run     # Run tests once (CI mode)
npm run test:coverage # Run with coverage report (80% thresholds enforced)
npm run test:ui      # Vitest with browser UI dashboard
```

### CDK Infrastructure
```bash
npm run cdk:install  # Install CDK dependencies
npm run cdk:build    # Compile CDK TypeScript
npm run cdk:synth    # Synthesize CloudFormation templates
npm run cdk:deploy   # Deploy to AWS
npm run cdk:diff     # Preview infrastructure changes
npm run cdk:destroy  # Tear down AWS resources
```

## Architecture

### Dual-Mode Operation

The app runs in two modes depending on whether `VITE_WEBSOCKET_URL` is set:

- **Local mode** (default): Session data stored in `localStorage`, presence simulated with polling. No backend needed.
- **Production mode**: Real-time WebSocket via AWS API Gateway, DynamoDB persistence, 9 Lambda handlers.

The switch happens in `src/config/env.ts` — if `VITE_WEBSOCKET_URL` is empty, `useSession` falls back to localStorage operations instead of WebSocket calls.

### Frontend

State flows: `App.tsx` manages top-level screen state (`create | join | session`). `useSession` (hook) owns all session state, WebSocket message handling, presence heartbeat (5s interval), and inactive participant cleanup (30s timeout). `useWebSocket` (hook) manages the WebSocket connection lifecycle with 5-attempt exponential backoff reconnection. `src/lib/api.ts` is the `WebSocketClient` class that queues messages and exposes typed methods.

Path alias: `@/` maps to `src/`.

### Backend (CDK in `cdk/`)

- **`cdk/lib/planning-poker-stack.ts`**: Defines all infrastructure — two DynamoDB tables (`Sessions`, `Connections`), 9 Lambda functions, API Gateway WebSocket API, routes, and IAM grants.
- **`cdk/lambda/handlers/`**: One file per WebSocket route (`connect`, `disconnect`, `createSession`, `joinSession`, `updateParticipant`, `revealCards`, `resetVoting`, `heartbeat`, `sendReaction`).
- **`cdk/lambda/utils/dynamodb.ts`**: All DynamoDB operations.
- **`cdk/lambda/utils/broadcast.ts`**: Sends messages back to connected WebSocket clients via API Gateway Management API.

DynamoDB schema: `SessionsTable` keyed by `sessionId` with TTL; `ConnectionsTable` keyed by `connectionId` with a GSI on `sessionId` for fan-out broadcasting.

### Data Model

```typescript
Session { id, name, createdAt, participants: Participant[], isRevealed, votingType }
Participant { id, name, selectedCard?, isReady, lastSeen, reactions? }
// votingType: 'fibonacci' | 'tshirt'
```

### Testing

Tests live alongside source files as `*.test.ts(x)`. Coverage is configured with Istanbul via Vite; thresholds are 80% across branches/functions/lines/statements.
