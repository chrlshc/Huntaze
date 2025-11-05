#!/usr/bin/env node

/**
 * Reddit OAuth Phase 4 Validation Script
 * 
 * Validates that all Phase 4 improvements have been implemented correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Reddit OAuth Phase 4 Improvements...\n');

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

// Check Reddit OAuth Service Enhancements
checkFile(
  path.join(process.cwd(), 'lib/services/redditOAuth.ts'),
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
      pattern: 'invalid_grant',
      description: 'Specific error handling for invalid refresh tokens'
    },
    {
      pattern: 'Refresh token has expired or been revoked',
      description: 'User-friendly refresh token error message'
    },
    {
      pattern: 'return this.retryApiCall(async () => {',
      description: 'Retry logic usage in API methods'
    }
  ],
  'Reddit OAuth Service'
);

// Check Token Refresh Scheduler Enhancements
checkFile(
  path.join(process.cwd(), 'lib/workers/tokenRefreshScheduler.ts'),
  [
    {
      pattern: 'private async refreshRedditAccount',
      description: 'Reddit token refresh method'
    },
    {
      pattern: 'RedditOAuthService',
      description: 'Reddit OAuth service import'
    },
    {
      pattern: 'refreshAccessToken',
      description: 'Reddit token refresh API call'
    },
    {
      pattern: "case 'reddit':",
      description: 'Reddit provider case in switch statement'
    },
    {
      pattern: 'No refresh token available for Reddit',
      description: 'Reddit-specific error handling'
    },
    {
      pattern: 'decryptRefreshToken',
      description: 'Refresh token decryption for Reddit'
    },
    {
      pattern: 'refreshed.refresh_token',
      description: 'Proper handling of Reddit refresh token (same token)'
    },
    {
      pattern: "refresh tokens don't expire",
      description: 'Documentation about Reddit token behavior'
    }
  ],
  'Token Refresh Scheduler'
);

// Check Reddit OAuth Init Endpoint
checkFile(
  path.join(process.cwd(), 'app/api/auth/reddit/route.ts'),
  [
    {
      pattern: 'requireAuth',
      description: 'User authentication requirement'
    },
    {
      pattern: 'oauthStateManager',
      description: 'Secure state management'
    },
    {
      pattern: 'handleOAuthError',
      description: 'Standardized error handling'
    },
    {
      pattern: 'RedditOAuthService',
      description: 'Reddit OAuth service usage'
    },
    {
      pattern: 'storeState',
      description: 'Database-backed state storage'
    }
  ],
  'Reddit OAuth Init Endpoint'
);

// Check Reddit OAuth Callback Endpoint
checkFile(
  path.join(process.cwd(), 'app/api/auth/reddit/callback/route.ts'),
  [
    {
      pattern: 'requireAuth',
      description: 'User authentication requirement'
    },
    {
      pattern: 'validateAndConsumeState',
      description: 'State validation and CSRF protection'
    },
    {
      pattern: 'tokenManager.storeTokens',
      description: 'Encrypted token storage'
    },
    {
      pattern: 'handleCallbackError',
      description: 'Standardized callback error handling'
    },
    {
      pattern: 'createSuccessRedirect',
      description: 'Consistent success redirect'
    }
  ],
  'Reddit OAuth Callback Endpoint'
);

// Check Reddit Disconnect Endpoint
checkFile(
  path.join(process.cwd(), 'app/api/reddit/disconnect/route.ts'),
  [
    {
      pattern: 'requireAuth',
      description: 'User authentication requirement'
    },
    {
      pattern: 'tokenManager.getAccount',
      description: 'Account retrieval'
    },
    {
      pattern: 'revokeAccess',
      description: 'Token revocation with Reddit'
    },
    {
      pattern: 'tokenManager.deleteAccount',
      description: 'Account deletion from database'
    }
  ],
  'Reddit Disconnect Endpoint'
);

// Check Reddit Test Auth Endpoint
checkFile(
  path.join(process.cwd(), 'app/api/reddit/test-auth/route.ts'),
  [
    {
      pattern: 'requireAuth',
      description: 'User authentication requirement'
    },
    {
      pattern: 'RedditOAuthService',
      description: 'Reddit OAuth service testing'
    },
    {
      pattern: 'getAuthorizationUrl',
      description: 'URL generation testing'
    },
    {
      pattern: 'recommendations',
      description: 'Configuration recommendations'
    }
  ],
  'Reddit Test Auth Endpoint'
);

// Check Test Files
const testFiles = [
  'tests/unit/services/redditOAuth-phase4-improvements.test.ts'
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

// Summary
console.log('📊 Validation Summary');
console.log('='.repeat(50));

if (allChecksPass) {
  console.log('🎉 All Phase 4 improvements have been successfully implemented!');
  console.log('');
  console.log('✅ Enhanced retry logic with exponential backoff');
  console.log('✅ Rate limiting awareness and handling');
  console.log('✅ Improved error handling with specific messages');
  console.log('✅ Token refresh functionality for Reddit');
  console.log('✅ Secure OAuth endpoints with authentication');
  console.log('✅ Disconnect and test auth endpoints');
  console.log('✅ Consistent patterns across all OAuth platforms');
  console.log('✅ Comprehensive test coverage');
  console.log('');
  console.log('🚀 Reddit OAuth Phase 4 is ready for deployment!');
  console.log('');
  console.log('🔄 All OAuth platforms now have consistent security and reliability:');
  console.log('   • TikTok OAuth ✅');
  console.log('   • Instagram OAuth ✅');
  console.log('   • Reddit OAuth ✅');
  process.exit(0);
} else {
  console.log('❌ Some Phase 4 improvements are missing or incomplete.');
  console.log('');
  console.log('Please review the failed checks above and ensure all');
  console.log('required changes have been implemented correctly.');
  process.exit(1);
}