# Security Token Management System

This module provides a comprehensive security token management system for the Huntaze platform, ensuring that all production environment variables are properly secured with cryptographically strong tokens.

## Features

- **Cryptographically Secure Token Generation**: Uses Node.js crypto module for generating high-entropy tokens
- **Token Validation**: Comprehensive validation including entropy checking, format validation, and pattern detection
- **Backup & Restore**: Encrypted backup system for token disaster recovery
- **Security Auditing**: Complete security health monitoring and compliance checking
- **CLI Tools**: Interactive command-line tools for token management

## Quick Start

### Generate New Security Tokens

```bash
# Interactive token generation
node scripts/generate-security-tokens.js

# Test token generation
node scripts/test-token-generation.js

# Validate current tokens
node scripts/validate-security-tokens.js
```

### Programmatic Usage

```typescript
import { 
  securityTokenGenerator, 
  securityTokenService,
  tokenBackupService 
} from './lib/security';

// Generate new tokens
const tokens = securityTokenGenerator.generateSecurityTokens();

// Validate existing tokens
const validation = await securityTokenService.validateProductionTokens();

// Create backup
const backupId = await tokenBackupService.createBackup(tokens, 'production');

// Check security health
const health = await securityTokenService.getSecurityHealthStatus();
```

## Components

### SecurityTokenGenerator

Generates cryptographically secure tokens with the following features:

- **Minimum 32 characters length**
- **High entropy (>128 bits)**
- **Character diversity requirements**
- **Pattern detection to avoid predictable sequences**
- **Prefix identification for token type**

```typescript
const tokens = securityTokenGenerator.generateSecurityTokens();
// Returns: { adminToken, debugToken, generatedAt, entropy }

const validation = securityTokenGenerator.validateTokenFormat(token);
// Returns: { isValid, errors, entropy, length }
```

### TokenBackupService

Provides encrypted backup and restore functionality:

- **AES-256-CBC encryption**
- **Integrity verification with checksums**
- **Metadata tracking for quick listing**
- **Automatic cleanup of old backups**

```typescript
// Create backup
const backupId = await tokenBackupService.createBackup(tokens, 'production');

// Restore from backup
const restoredTokens = await tokenBackupService.restoreFromBackup(backupId);

// List available backups
const backups = await tokenBackupService.listBackups();
```

### SecurityTokenService

High-level service for token management and security monitoring:

- **Production token validation**
- **Automatic rotation recommendations**
- **Security health scoring**
- **Configuration auditing**

```typescript
// Validate current production tokens
const validation = await securityTokenService.validateProductionTokens();

// Check if rotation is needed
const rotationCheck = await securityTokenService.shouldRotateTokens();

// Get security health status
const health = await securityTokenService.getSecurityHealthStatus();

// Rotate tokens with backup
const result = await securityTokenService.rotateSecurityTokens(true);
```

## Security Requirements

### Token Requirements

All security tokens must meet the following criteria:

1. **Length**: Minimum 32 characters
2. **Entropy**: Minimum 128 bits of Shannon entropy
3. **Character Diversity**: At least 3 of 4 character types (uppercase, lowercase, numbers, symbols)
4. **No Common Patterns**: No repeated sequences or predictable patterns
5. **No Default Values**: No placeholder or default token values

### Environment Variables

The following environment variables are required:

- `ADMIN_TOKEN`: Administrative access token
- `DEBUG_TOKEN`: Debug mode access token
- `TOKEN_ENCRYPTION_KEY`: Encryption key for backup storage

### Security Scoring

The system calculates a security score (0-100) based on:

- **Token Validity** (50 points): Both tokens must be valid
- **Entropy Bonus** (20 points): Higher entropy tokens get more points
- **Length Bonus** (15 points): Longer tokens are more secure
- **Error Penalty** (5 points per error): Deducted for validation errors

## CLI Tools

### Generate Security Tokens

```bash
node scripts/generate-security-tokens.js
```

Interactive menu with options:
1. Generate new security tokens
2. Validate existing tokens
3. Create backup of current tokens
4. Restore tokens from backup
5. List available backups

### Validate Security Tokens

```bash
node scripts/validate-security-tokens.js
```

Comprehensive validation report including:
- Current token validation
- Rotation assessment
- Configuration audit
- Security health status
- Token generation test

### Test Token Generation

```bash
node scripts/test-token-generation.js
```

Quick test to verify token generation functionality.

## Security Best Practices

### Token Management

1. **Regular Rotation**: Rotate tokens every 90 days
2. **Secure Storage**: Never commit tokens to version control
3. **Access Control**: Limit access to token generation tools
4. **Monitoring**: Monitor token usage and audit access logs
5. **Backup Strategy**: Maintain encrypted backups for disaster recovery

### Environment Security

1. **Environment Isolation**: Use different tokens for different environments
2. **Encryption at Rest**: Ensure environment variables are encrypted
3. **Access Logging**: Log all token access and modifications
4. **Principle of Least Privilege**: Grant minimal necessary permissions

### Incident Response

1. **Immediate Rotation**: Rotate tokens immediately if compromise is suspected
2. **Audit Trail**: Maintain complete audit trail of token operations
3. **Backup Recovery**: Use backups for quick recovery from incidents
4. **Security Assessment**: Perform security assessment after incidents

## Error Handling

The system provides comprehensive error handling for:

- **Token Generation Failures**: Fallback mechanisms and retry logic
- **Validation Errors**: Clear error messages with remediation steps
- **Backup Failures**: Integrity checking and corruption detection
- **Environment Issues**: Missing variables and configuration problems

## Monitoring and Alerting

### Security Health Monitoring

The system continuously monitors:

- Token validity and strength
- Configuration compliance
- Backup status and integrity
- Security score trends

### Alert Conditions

Alerts are triggered for:

- **Critical**: Missing tokens, default values, or security score < 50
- **High**: Low entropy, common patterns, or security score < 75
- **Medium**: Character diversity issues or missing backups
- **Low**: Recommendations for improvement

## Integration

### AWS Amplify Integration

The system integrates with AWS Amplify for:

- Environment variable management
- Secure deployment processes
- Configuration validation
- Rollback capabilities

### CI/CD Integration

Include token validation in your CI/CD pipeline:

```bash
# Pre-deployment validation
node scripts/validate-security-tokens.js

# Fail deployment if tokens are invalid
if [ $? -ne 0 ]; then
  echo "❌ Security token validation failed"
  exit 1
fi
```

## Troubleshooting

### Common Issues

1. **Module Not Found**: Ensure TypeScript is compiled to JavaScript
2. **Permission Denied**: Check file permissions for CLI scripts
3. **Encryption Errors**: Verify TOKEN_ENCRYPTION_KEY is set
4. **Backup Corruption**: Use integrity validation to detect issues

### Debug Mode

Enable debug logging:

```bash
DEBUG=security:* node scripts/generate-security-tokens.js
```

### Recovery Procedures

1. **Lost Tokens**: Restore from most recent backup
2. **Corrupted Backup**: Use backup integrity validation
3. **Environment Issues**: Use configuration audit to identify problems
4. **Security Breach**: Follow incident response procedures

## Contributing

When contributing to the security token system:

1. **Security Review**: All changes require security review
2. **Test Coverage**: Maintain 100% test coverage for security functions
3. **Documentation**: Update documentation for all changes
4. **Audit Trail**: Maintain complete audit trail of modifications

## License

This security token management system is part of the Huntaze platform and is subject to the same licensing terms.