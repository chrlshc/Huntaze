# AWS Amplify Environment Variables Management Scripts

This directory contains CLI tools for managing AWS Amplify environment variables programmatically.

## Scripts

- `amplify-env-vars.js` - Main CLI script for variable management
- `validate-amplify-env-vars.js` - Validation and health check script
- `compare-environments.js` - Environment comparison utility
- `backup-restore.js` - Backup and restore utilities

## Usage

All scripts require AWS CLI to be configured with appropriate permissions for AWS Amplify.

```bash
# Set environment variables
node scripts/amplify-env-vars/amplify-env-vars.js set --app-id APP123 --branch staging --vars "KEY1=value1,KEY2=value2"

# Validate configuration
node scripts/amplify-env-vars/validate-amplify-env-vars.js --app-id APP123 --branch staging

# Compare environments
node scripts/amplify-env-vars/compare-environments.js --app-id APP123 --source staging --target production
```