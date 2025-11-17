# Huntaze - AI Platform for Content Creators
<!-- Deployment: 2025-08-27 -->

## Overview

Huntaze is an AI-powered platform designed to help content creators manage and optimize their social media presence. The platform provides intelligent onboarding, content management, analytics, and automation tools.

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- AWS account (for SES email service)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/huntaze.git
cd huntaze

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:init

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Documentation

### Core Features
- **Authentication & Onboarding**: Seamless user registration with smart onboarding flow
- **Social Media Integration**: Connect Instagram, TikTok, Reddit, and more
- **AI-Powered Content**: Generate and optimize content with AI assistance
- **Analytics Dashboard**: Track performance across all platforms
- **Campaign Management**: Plan and schedule content campaigns

### Developer Guides
- [Authentication Setup](docs/AUTH_SETUP.md) - Complete authentication system guide
- [Authentication Flow](docs/AUTH_FLOW.md) - User authentication and onboarding flow
- [API Reference](docs/API_REFERENCE.md) - Complete API documentation
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [Database Migrations](migrations/README.md) - Database schema changes

### User Guides
- [Getting Started](docs/quick-start-guide.md) - First steps with Huntaze
- [Social Media Setup](docs/SOCIAL_MEDIA_SETUP.md) - Connect your social accounts
- [Onboarding Guide](docs/of-onboarding.md) - Complete the onboarding process

## Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with connection pooling
- **Authentication**: NextAuth.js v4
- **Email**: AWS SES
- **Deployment**: AWS Amplify

### Key Components
- `/app` - Next.js application routes and pages
- `/components` - Reusable React components
- `/lib` - Core business logic and utilities
- `/hooks` - Custom React hooks
- `/types` - TypeScript type definitions
- `/migrations` - Database migration scripts

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Building for Production

```bash
# Validate configuration
npm run build:validate

# Build the application
npm run build

# Verify build output
npm run build:verify
```

### Code Quality

```bash
# Run linter
npm run lint

# Run type checking
npm run type-check

# Format code
npm run format
```

## Environment Variables

Key environment variables required:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret

# Email
FROM_EMAIL=noreply@huntaze.com
AWS_REGION=us-east-1

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

See `.env.example` for complete list.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions:
- Check the [documentation](docs/)
- Review [troubleshooting guides](docs/BUILD_TROUBLESHOOTING.md)
- Open an issue on GitHub

## License

Proprietary - All rights reserved
