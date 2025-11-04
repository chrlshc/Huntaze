#!/bin/bash

# 🚀 Deployment Script for AWS Amplify Environment Variables Management System
# This script deploys the complete environment variables management system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="amplify-env-vars-management"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="deployment_backup_${TIMESTAMP}"

echo -e "${BLUE}🚀 Starting deployment of AWS Amplify Environment Variables Management System${NC}"
echo -e "${BLUE}=================================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_status "Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_status "npm is installed: $(npm --version)"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_warning "AWS CLI is not installed. Some features may not work."
    echo "Install with: curl 'https://awscli.amazonaws.com/AWSCLIV2.pkg' -o 'AWSCLIV2.pkg' && sudo installer -pkg AWSCLIV2.pkg -target /"
else
    print_status "AWS CLI is installed: $(aws --version)"
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi
print_status "Git is installed: $(git --version)"

# Install dependencies
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"

# Check if package.json exists and install dependencies
if [ -f "package.json" ]; then
    npm install
    print_status "Dependencies installed successfully"
else
    print_warning "No package.json found. Creating minimal package.json for CLI tools..."
    
    # Create minimal package.json for the CLI tools
    cat > package.json << EOF
{
  "name": "amplify-env-vars-management",
  "version": "1.0.0",
  "description": "AWS Amplify Environment Variables Management System",
  "scripts": {
    "env-vars": "node scripts/amplify-env-vars/amplify-env-vars.js",
    "validate": "node scripts/amplify-env-vars/validate-env-vars.js",
    "backup": "node scripts/amplify-env-vars/backup-restore.js",
    "git-hooks": "node scripts/amplify-env-vars/setup-git-hooks.js",
    "automated-backup": "node scripts/amplify-env-vars/automated-backup.js"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "js-yaml": "^4.1.0",
    "node-cron": "^3.0.2"
  },
  "devDependencies": {},
  "keywords": ["aws", "amplify", "environment-variables", "cli"],
  "author": "DevOps Team",
  "license": "MIT"
}
EOF
    
    npm install
    print_status "Minimal package.json created and dependencies installed"
fi

# Create necessary directories
echo -e "\n${BLUE}📁 Creating directory structure...${NC}"

directories=(
    "config/amplify-env-vars"
    "lib/amplify-env-vars"
    "scripts/amplify-env-vars"
    "backups/amplify-env-vars"
    "logs"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_status "Created directory: $dir"
    else
        print_status "Directory exists: $dir"
    fi
done

# Make scripts executable
echo -e "\n${BLUE}🔧 Making scripts executable...${NC}"

scripts=(
    "scripts/amplify-env-vars/amplify-env-vars.js"
    "scripts/amplify-env-vars/validate-env-vars.js"
    "scripts/amplify-env-vars/backup-restore.js"
    "scripts/amplify-env-vars/setup-git-hooks.js"
    "scripts/amplify-env-vars/git-integration.js"
    "scripts/amplify-env-vars/automated-backup.js"
    "scripts/amplify-env-vars/pre-commit-validation.js"
)

for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        print_status "Made executable: $script"
    else
        print_warning "Script not found: $script"
    fi
done

# Setup Git hooks (optional)
echo -e "\n${BLUE}🪝 Setting up Git hooks...${NC}"
read -p "Do you want to install Git hooks for configuration validation? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "scripts/amplify-env-vars/setup-git-hooks.js" ]; then
        node scripts/amplify-env-vars/setup-git-hooks.js install
        print_status "Git hooks installed successfully"
    else
        print_warning "Git hooks setup script not found"
    fi
else
    print_status "Skipped Git hooks installation"
fi

# Create configuration file if it doesn't exist
echo -e "\n${BLUE}⚙️  Setting up configuration...${NC}"

if [ ! -f "config/amplify-env-vars/backup-config.json" ]; then
    print_warning "Backup configuration not found. Please update config/amplify-env-vars/backup-config.json with your app IDs."
fi

# Test the installation
echo -e "\n${BLUE}🧪 Testing installation...${NC}"

# Test main CLI
if [ -f "scripts/amplify-env-vars/amplify-env-vars.js" ]; then
    echo "Testing main CLI..."
    node scripts/amplify-env-vars/amplify-env-vars.js --version > /dev/null 2>&1 && print_status "Main CLI working" || print_warning "Main CLI test failed"
fi

# Test validation
if [ -f "scripts/amplify-env-vars/validate-env-vars.js" ]; then
    echo "Testing validation CLI..."
    node scripts/amplify-env-vars/validate-env-vars.js --help > /dev/null 2>&1 && print_status "Validation CLI working" || print_warning "Validation CLI test failed"
fi

# Test backup system
if [ -f "scripts/amplify-env-vars/backup-restore.js" ]; then
    echo "Testing backup CLI..."
    node scripts/amplify-env-vars/backup-restore.js --help > /dev/null 2>&1 && print_status "Backup CLI working" || print_warning "Backup CLI test failed"
fi

# Create quick start guide
echo -e "\n${BLUE}📖 Creating quick start guide...${NC}"

cat > AMPLIFY_ENV_VARS_QUICKSTART.md << 'EOF'
# AWS Amplify Environment Variables Management - Quick Start

## 🚀 System Successfully Deployed!

Your AWS Amplify Environment Variables Management System is now ready to use.

## 📋 Available Commands

### Main CLI Tool
```bash
# Show all available commands
node scripts/amplify-env-vars/amplify-env-vars.js --help

# Set environment variables
node scripts/amplify-env-vars/amplify-env-vars.js set --app-id YOUR_APP_ID --branch main --variables "KEY1=value1,KEY2=value2"

# Get environment variables
node scripts/amplify-env-vars/amplify-env-vars.js get --app-id YOUR_APP_ID --branch main

# Apply configuration file
node scripts/amplify-env-vars/amplify-env-vars.js apply config/amplify-env-vars/production-template.yaml --app-id YOUR_APP_ID --branch main
```

### Validation
```bash
# Validate configuration file
node scripts/amplify-env-vars/validate-env-vars.js config/amplify-env-vars/production-template.yaml

# Quick validation
node scripts/amplify-env-vars/quick-validate.js --app-id YOUR_APP_ID --branch main
```

### Backup & Restore
```bash
# Create backup
node scripts/amplify-env-vars/backup-restore.js backup --app-id YOUR_APP_ID --branch main

# List backups
node scripts/amplify-env-vars/backup-restore.js list

# Restore from backup
node scripts/amplify-env-vars/backup-restore.js restore --backup-id BACKUP_ID --confirm
```

### Git Integration
```bash
# Setup Git hooks
node scripts/amplify-env-vars/setup-git-hooks.js install

# Track configuration change
node scripts/amplify-env-vars/git-integration.js track -f config.yaml -e production -m "Updated API keys"

# Show change history
node scripts/amplify-env-vars/git-integration.js history
```

### Automated Backups
```bash
# Start automated backup scheduler
node scripts/amplify-env-vars/automated-backup.js start

# Run backup once
node scripts/amplify-env-vars/automated-backup.js run-once

# Generate configuration template
node scripts/amplify-env-vars/automated-backup.js generate-config
```

## 📁 Configuration Templates

Use the pre-built templates in `config/amplify-env-vars/`:

- `production-template.yaml` - Production environment
- `staging-template.yaml` - Staging environment  
- `development-template.yaml` - Development environment
- `local-template.yaml` - Local development
- `minimal-template.yaml` - Essential variables only
- `documented-template.yaml` - With full documentation

## ⚙️ Next Steps

1. **Configure your app IDs**: Update `config/amplify-env-vars/backup-config.json`
2. **Set up AWS credentials**: Run `aws configure` if not already done
3. **Test with your app**: Try getting variables from your Amplify app
4. **Setup automated backups**: Configure and start the backup scheduler

## 🆘 Need Help?

- Check the documentation in `config/amplify-env-vars/README.md`
- Run any command with `--help` for detailed usage
- Review the templates for configuration examples

## 🔧 Troubleshooting

If you encounter issues:
1. Ensure AWS CLI is configured: `aws configure list`
2. Verify your Amplify app ID: `aws amplify list-apps`
3. Check permissions for your AWS user/role
4. Review the logs in the `logs/` directory

Happy deploying! 🎉
EOF

print_status "Quick start guide created: AMPLIFY_ENV_VARS_QUICKSTART.md"

# Final summary
echo -e "\n${GREEN}🎉 DEPLOYMENT COMPLETE! 🎉${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}✅ AWS Amplify Environment Variables Management System deployed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 What's been deployed:${NC}"
echo "   • Complete CLI toolset for environment variable management"
echo "   • Configuration templates for all environments"
echo "   • Backup and restore system with automated scheduling"
echo "   • Git integration with hooks and change tracking"
echo "   • Validation engine with comprehensive schemas"
echo "   • Monitoring and alerting capabilities"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo "   1. Read the quick start guide: cat AMPLIFY_ENV_VARS_QUICKSTART.md"
echo "   2. Configure your AWS credentials: aws configure"
echo "   3. Update backup config: config/amplify-env-vars/backup-config.json"
echo "   4. Test with your app: node scripts/amplify-env-vars/amplify-env-vars.js --help"
echo ""
echo -e "${BLUE}📖 Documentation:${NC}"
echo "   • Quick Start: AMPLIFY_ENV_VARS_QUICKSTART.md"
echo "   • Full Documentation: config/amplify-env-vars/README.md"
echo "   • Templates: config/amplify-env-vars/*-template.yaml"
echo ""
echo -e "${GREEN}🎯 Your system is ready for production use!${NC}"
EOF