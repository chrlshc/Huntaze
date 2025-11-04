#!/bin/bash

# Setup script for Staging Login CLI
# Makes the CLI tool executable and adds helpful aliases

set -e

echo "🚀 Setting up Staging Login CLI..."

# Make the CLI script executable
chmod +x scripts/staging-login-cli.js

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    echo "Please install Node.js and try again"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Test the CLI script
echo "🧪 Testing CLI script..."
if node scripts/staging-login-cli.js --help > /dev/null 2>&1; then
    echo "✅ CLI script is working"
else
    echo "❌ CLI script test failed"
    exit 1
fi

# Create package.json scripts if they don't exist
if [ -f "package.json" ]; then
    echo "📦 Adding npm scripts to package.json..."
    
    # Check if scripts section exists and add our commands
    if ! grep -q '"staging:diagnose"' package.json; then
        # Create a temporary file with the new scripts
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        pkg.scripts = pkg.scripts || {};
        pkg.scripts['staging:diagnose'] = 'node scripts/staging-login-cli.js --diagnose';
        pkg.scripts['staging:validate'] = 'node scripts/staging-login-cli.js --validate';
        pkg.scripts['staging:fix'] = 'node scripts/staging-login-cli.js --fix';
        pkg.scripts['staging:rollback'] = 'node scripts/staging-login-cli.js --rollback';
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
        echo "✅ Added npm scripts to package.json"
    else
        echo "ℹ️  npm scripts already exist in package.json"
    fi
fi

# Create a simple wrapper script for easier access
cat > staging-fix << 'EOF'
#!/bin/bash
# Staging Login Fix - Quick Access Script
node scripts/staging-login-cli.js "$@"
EOF

chmod +x staging-fix

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Available commands:"
echo ""
echo "Direct CLI usage:"
echo "  node scripts/staging-login-cli.js --diagnose    # Run full diagnostic"
echo "  node scripts/staging-login-cli.js --validate    # Validate fix"
echo "  node scripts/staging-login-cli.js --fix         # Show fix instructions"
echo "  node scripts/staging-login-cli.js --help        # Show help"
echo ""
echo "Quick wrapper:"
echo "  ./staging-fix --diagnose                        # Same as above"
echo "  ./staging-fix --validate                        # Same as above"
echo ""
if [ -f "package.json" ]; then
echo "npm scripts:"
echo "  npm run staging:diagnose                        # Run diagnostic"
echo "  npm run staging:validate                        # Validate fix"
echo "  npm run staging:fix                             # Show fix guide"
echo ""
fi
echo "🚀 Ready to diagnose and fix staging login issues!"
echo ""
echo "💡 Quick start:"
echo "   ./staging-fix --diagnose"