# Planning Poker Application

A real-time Planning Poker application built with React, TypeScript, and shadcn/ui. This application enables teams to perform agile estimation sessions with full session storage and guest user access.

## Features

- 🎯 **Session Management**: Create and join planning poker sessions
- 👥 **Guest Access**: No authentication required - join with just a name
- 🃏 **Fibonacci Cards**: Standard Fibonacci sequence (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89) plus ? and ☕
- 💾 **Local Storage**: All session data persists in browser localStorage
- 🔗 **Share Links**: Easy session sharing via URL
- 🎨 **Modern UI**: Built with shadcn/ui and Tailwind CSS
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **shadcn/ui** for beautiful, accessible components
- **Tailwind CSS** for styling
- **localStorage** for session persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd planning-poker-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

### Creating a Session

1. Enter your name
2. Enter a session name
3. Click "Create Session"
4. Share the URL with your team members

### Joining a Session

1. Open the shared link (e.g., `https://app.example.com?join=abc123`)
2. Enter your name
3. Click "Join Session"

### Running a Planning Session

1. Each participant selects a card
2. Once all participants are ready, click "Reveal Cards"
3. View all estimates together
4. Click "New Round" to reset and start another estimation

## AWS Deployment

This application can be easily deployed to AWS using multiple methods:

### Option 1: AWS Amplify (Recommended)

AWS Amplify provides the easiest deployment with automatic CI/CD:

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket)
2. Go to AWS Amplify Console
3. Click "New app" > "Host web app"
4. Connect your repository
5. Amplify will automatically detect the `amplify.yml` configuration
6. Click "Save and Deploy"

Your app will be live with a URL like: `https://main.d123456789.amplifyapp.com`

### Option 2: AWS CloudFormation (S3 + CloudFront)

For full control over infrastructure:

1. Ensure AWS CLI is installed and configured:
```bash
aws configure
```

2. Deploy the CloudFormation stack:
```bash
aws cloudformation create-stack \
  --stack-name planning-poker \
  --template-body file://aws-infrastructure.yml \
  --capabilities CAPABILITY_IAM
```

3. Wait for stack creation:
```bash
aws cloudformation wait stack-create-complete --stack-name planning-poker
```

4. Get the outputs:
```bash
aws cloudformation describe-stacks --stack-name planning-poker --query 'Stacks[0].Outputs'
```

5. Build and deploy:
```bash
npm run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME --delete
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

### Option 3: Manual Deployment Script

1. Update `deploy-aws.sh` with your S3 bucket and CloudFront distribution ID
2. Run the deployment script:
```bash
./deploy-aws.sh
```

## Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── ParticipantList.tsx # Participant list display
│   ├── PokerCard.tsx       # Individual poker card
│   ├── SessionCreate.tsx   # Session creation form
│   ├── SessionJoin.tsx     # Guest join form
│   └── SessionView.tsx     # Main session interface
├── hooks/
│   └── useSession.ts       # Session management hook
├── lib/
│   ├── storage.ts          # localStorage utilities
│   └── utils.ts            # Utility functions
├── types/
│   └── index.ts            # TypeScript type definitions
├── App.tsx                 # Main app component
└── main.tsx                # App entry point
```

## Environment Variables

This application doesn't require any environment variables. All session data is stored locally in the browser.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Limitations

- Sessions are stored only in the browser's localStorage
- No real-time synchronization between browsers (sessions must be manually refreshed)
- Sessions are not shared across devices
- Maximum localStorage size varies by browser (typically 5-10MB)

## Future Enhancements

- Real-time synchronization using WebSockets or Firebase
- Session history and analytics
- Export results to CSV/PDF
- Custom card decks
- Timer for estimation rounds
- Admin controls for session management

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
