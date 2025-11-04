# AWS Amplify Environment Variables Core Services

This directory contains the core services and utilities for managing AWS Amplify environment variables.

## Services

- `cliManager.ts` - CLI management interface
- `validationEngine.ts` - Variable validation engine
- `securityHandler.ts` - Security and masking utilities
- `syncService.ts` - Environment synchronization service
- `monitoringSystem.ts` - Monitoring and alerting system

## Types

- `types.ts` - Core TypeScript interfaces and types
- `errors.ts` - Error handling classes and interfaces

## Utils

- `awsCliWrapper.ts` - AWS CLI wrapper functions
- `configParser.ts` - Configuration file parsing utilities
- `logger.ts` - Logging utilities

## Usage

```typescript
import { CLIManager } from './cliManager';
import { ValidationEngine } from './validationEngine';

const cliManager = new CLIManager();
const validator = new ValidationEngine();

// Set variables
await cliManager.setVariables('app123', 'staging', { KEY: 'value' });

// Validate configuration
const result = await validator.validateConfiguration('app123', 'staging');
```