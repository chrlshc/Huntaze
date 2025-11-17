#!/bin/bash

# Install Git Hooks for Layout Cleanup Validation
# This script automates the setup of Husky and pre-commit hooks

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "  Git Hooks Installation"
echo "=========================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo -e "${RED}✗ Error: Not a git repository${NC}"
  echo "  Please run this script from the root of your git repository"
  exit 1
fi

echo -e "${CYAN}→ Checking dependencies...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Error: Node.js is not installed${NC}"
  echo "  Please install Node.js 18+ to continue"
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ Error: npm is not installed${NC}"
  echo "  Please install npm to continue"
  exit 1
fi

echo -e "${GREEN}✓ Dependencies OK${NC}"
echo ""

# Check if husky is installed
echo -e "${CYAN}→ Checking Husky installation...${NC}"

if ! npm list husky --depth=0 &> /dev/null; then
  echo -e "${YELLOW}⚠ Husky not found in devDependencies${NC}"
  echo -e "${CYAN}→ Installing Husky...${NC}"
  npm install --save-dev husky
  echo -e "${GREEN}✓ Husky installed${NC}"
else
  echo -e "${GREEN}✓ Husky already installed${NC}"
fi

echo ""

# Initialize Husky (creates .husky directory)
echo -e "${CYAN}→ Initializing Husky...${NC}"

# For Husky v9+, we just need to ensure the directory exists
if [ ! -d ".husky" ]; then
  mkdir -p .husky
  echo -e "${GREEN}✓ Created .husky directory${NC}"
else
  echo -e "${GREEN}✓ .husky directory exists${NC}"
fi

# Create the _/ directory for husky.sh if it doesn't exist
if [ ! -d ".husky/_" ]; then
  mkdir -p .husky/_
  
  # Create husky.sh
  cat > .husky/_/husky.sh << 'EOF'
#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."

  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi

  if [ -f ~/.huskyrc ]; then
    debug "sourcing ~/.huskyrc"
    . ~/.huskyrc
  fi

  export readonly husky_skip_init=1
  sh -e "$0" "$@"
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    echo "husky - $hook_name hook exited with code $exitCode (error)"
  fi

  exit $exitCode
fi
EOF
  
  chmod +x .husky/_/husky.sh
  echo -e "${GREEN}✓ Created husky.sh${NC}"
fi

echo ""

# Create pre-commit hook
echo -e "${CYAN}→ Creating pre-commit hook...${NC}"

cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Validating build before commit..."

# Run build validation
npm run build:validate

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build failed! Fix errors before committing."
  echo "💡 Check .kiro/build-logs/ for details"
  echo "⚠️  Use 'git commit --no-verify' to bypass (not recommended)"
  echo ""
  exit 1
fi

echo "✅ Build successful! Proceeding with commit..."
exit 0
EOF

chmod +x .husky/pre-commit
echo -e "${GREEN}✓ Pre-commit hook created${NC}"

echo ""

# Test the hook
echo -e "${CYAN}→ Testing hook installation...${NC}"

if [ -x ".husky/pre-commit" ]; then
  echo -e "${GREEN}✓ Pre-commit hook is executable${NC}"
else
  echo -e "${RED}✗ Pre-commit hook is not executable${NC}"
  exit 1
fi

# Check if build:validate script exists
if npm run build:validate --help &> /dev/null || grep -q "build:validate" package.json; then
  echo -e "${GREEN}✓ build:validate script found${NC}"
else
  echo -e "${YELLOW}⚠ Warning: build:validate script not found in package.json${NC}"
  echo "  The hook may not work correctly until this script is added"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Git hooks installed successfully!${NC}"
echo "=========================================="
echo ""
echo "What's next?"
echo ""
echo "  1. The pre-commit hook will now run automatically"
echo "  2. It validates your build before each commit"
echo "  3. If the build fails, the commit will be blocked"
echo ""
echo "Useful commands:"
echo ""
echo "  ${CYAN}npm run build:validate${NC}"
echo "    Manually validate your build"
echo ""
echo "  ${CYAN}git commit --no-verify${NC}"
echo "    Bypass validation (not recommended)"
echo ""
echo "  ${CYAN}npm run hooks:log-bypass${NC}"
echo "    Log a bypass attempt for tracking"
echo ""
echo "For more information, see:"
echo "  ${CYAN}scripts/layout-cleanup/README.md${NC}"
echo ""
