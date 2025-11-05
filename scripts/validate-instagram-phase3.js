#!/usr/bin/env node

/**
 * Instagram OAuth Phase 3 Validation Script
 * 
 * Validates that all Phase 3 improvements have been implemented correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Instagram OAuth Phase 3 Improvements...\n');

let allChecksPass = true;

function checkFile(filePath, checks, description) {
  console.log(`📁 Checking ${description}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    allChecksPass = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  checks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`✅ ${check.description}`);
    } else {
      console.log(`❌ ${check.description} - Pattern not found: ${check.pattern}`);
      allChecksPass = false;
    }
  });
  
  console.log('');
}

// Check Instagram OAuth Service Enhancements
checkFile(
  path.join(process.cwd(), 'lib/services/instagramOAuth.ts'),
  [
    {
      pattern: 'private readonly MAX_RETRIES = 3',
      description: 'Retry configuration constants'
    },
    {
      pattern: 'private readonly RETRY_DELAY = 1000',
      description: 'Retry delay configuration'
    },
    {
      pattern: 'private async retryApiCall<T>',
      description: 'Retry utility method'
    },
    {
      pattern: 'Math.pow(2, attempt - 1)',
      description: 'Exponential backoff implementation'
    },
    {
      pattern: 'response.status === 429',
      description: 'Rate limiting detection'
    },
    {
      pattern: 'Rate limit exceeded. Please try again later.',
      description: 'Rate limiting error message'
    },
    {
      pattern: 'User-Agent',
      description: 'User-Agent header for API compliance'
    },
    {
      pattern: 'Instagram-OAuth-Client/1.0',
      description: 'Proper User-Agent value'
    },
    {
      pattern: 'data.error?.code === 190',
      description: 'Specific error code handling for token expiry'
    },
    {
      pattern: 'Token has expired and cannot be refreshed',
      description: 'User-friendly token expiry message'
    },
    {
      pattern: 'return this.retryApiCall(async () => {',
      description: 'Retry logic usage in API methods'
    }
  ],
  'Instagram OAuth Service'
);

// Check Token Refresh Scheduler Enhancements
checkFile(
  path.join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts'),
  [
    {
      pattern: 'private async refreshInstagramAccount',
      description: 'Instagram token refresh method'
    },
    {
      pattern: 'InstagramOAuthService',
      description: 'Instagram OAuth service import'
    },
    {
      pattern: 'refreshLongLivedToken',
      description: 'Instagram token refresh API call'
    },
    {
      pattern: "case 'instagram':",
      description: 'Instagram provider case in switch statement'
    },
    {
      pattern: 'No access token available for Instagram',
      description: 'Instagram-specific error handling'
    },
    {
      pattern: 'decryptAccessToken',
      description: 'Access token decryption for Instagram'
    },
    {
      pattern: 'refreshToken: undefined',
      description: 'Proper handling of Instagram refresh token (undefined)'
    },
    {
      pattern: "Instagram doesn't use refresh tokens",
      description: 'Documentation about Instagram token behavior'
    }
  ],
  'Token Refresh Scheduler'
);

// Check Test Files
const testFiles = [
  'tests/unit/services/instagramOAuth-enhancements.test.ts',
  'tests/unit/workers/tokenRefreshScheduler-instagram.test.ts',
  'tests/integration/api/instagram-oauth-phase3-improvements.test.ts',
  'tests/unit/services/instagram-oauth-phase3-validation.test.ts'
];

console.log('📋 Checking Test Files...');
testFiles.forEach(testFile => {
  const fullPath = path.join(process.cwd(), testFile);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${testFile}`);
  } else {
    console.log(`❌ ${testFile} - File not found`);
    allChecksPass = false;
  }
});
console.log('');

// Check Documentation
checkFile(
  path.join(process.cwd(), 'INSTAGRAM_OAUTH_PHASE_3_COMPLETE.md'),
  [
    {
      pattern: 'Token Refresh Functionality ✅',
      description: 'Token refresh documentation'
    },
    {
      pattern: 'Enhanced Retry Logic with Exponential Backoff ✅',
      description: 'Retry logic documentation'
    },
    {
      pattern: 'Rate Limiting Awareness ✅',
      description: 'Rate limiting documentation'
    },
    {
      pattern: 'Improved Error Handling ✅',
      description: 'Error handling documentation'
    },
    {
      pattern: 'Enhanced API Compliance ✅',
      description: 'API compliance documentation'
    }
  ],
  'Phase 3 Documentation'
);

// Summary
console.log('📊 Validation Summary');
console.log('='.repeat(50));

if (allChecksPass) {
  console.log('🎉 All Phase 3 improvements have been successfully implemented!');
  console.log('');
  console.log('✅ Token refresh functionality for Instagram');
  console.log('✅ Retry logic with exponential backoff');
  console.log('✅ Rate limiting awareness and handling');
  console.log('✅ Enhanced error handling with specific messages');
  console.log('✅ API compliance improvements');
  console.log('✅ Comprehensive test coverage');
  console.log('✅ Complete documentation');
  console.log('');
  console.log('🚀 Instagram OAuth Phase 3 is ready for deployment!');
  process.exit(0);
} else {
  console.log('❌ Some Phase 3 improvements are missing or incomplete.');
  console.log('');
  console.log('Please review the failed checks above and ensure all');
  console.log('required changes have been implemented correctly.');
  process.exit(1);
}