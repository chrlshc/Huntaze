import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { NextRequest } from 'next/server';

// Create verifiers for both access and ID tokens
const accessTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
});

const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
  tokenUse: 'id',
  clientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
});

export interface CognitoUser {
  sub: string;
  username?: string;
  email?: string;
  groups?: string[];
  scope?: string;
  exp: number;
  iat: number;
  tokenUse: 'access' | 'id';
}

export interface VerificationResult {
  valid: boolean;
  user?: CognitoUser;
  error?: string;
}

/**
 * Verify a Cognito JWT token
 * @param token The JWT token to verify
 * @param tokenType Which token type to verify (access or id)
 * @returns Verification result with user data if valid
 */
export async function verifyCognitoToken(
  token: string,
  tokenType: 'access' | 'id' = 'access'
): Promise<VerificationResult> {
  try {
    const verifier = tokenType === 'access' ? accessTokenVerifier : idTokenVerifier;
    const payload = await verifier.verify(token);
    
    return {
      valid: true,
      user: {
        sub: payload.sub,
        username: payload.username || payload['cognito:username'],
        email: payload.email,
        groups: payload['cognito:groups'],
        scope: payload.scope,
        exp: payload.exp,
        iat: payload.iat,
        tokenUse: tokenType,
      }
    };
  } catch (error: any) {
    console.error(`[CognitoVerify] Token verification failed:`, error.message);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Extract and verify token from request
 * @param request The NextRequest object
 * @param tokenType Which token type to verify
 * @returns Verification result with user data if valid
 */
export async function verifyRequestToken(
  request: NextRequest,
  tokenType: 'access' | 'id' = 'access'
): Promise<VerificationResult> {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyCognitoToken(token, tokenType);
  }
  
  // Check cookies
  const cookieName = tokenType === 'access' ? 'accessToken' : 'idToken';
  const token = request.cookies.get(cookieName)?.value;
  
  if (!token) {
    return {
      valid: false,
      error: 'No token provided'
    };
  }
  
  return verifyCognitoToken(token, tokenType);
}

/**
 * Middleware to protect API routes
 * Usage: const user = await requireAuth(request);
 */
export async function requireAuth(
  request: NextRequest,
  options: {
    tokenType?: 'access' | 'id';
    requiredGroups?: string[];
    requiredScopes?: string[];
  } = {}
): Promise<CognitoUser> {
  const { tokenType = 'access', requiredGroups = [], requiredScopes = [] } = options;
  
  const result = await verifyRequestToken(request, tokenType);
  
  if (!result.valid || !result.user) {
    throw new Error(result.error || 'Unauthorized');
  }
  
  // Check required groups
  if (requiredGroups.length > 0) {
    const userGroups = result.user.groups || [];
    const hasRequiredGroup = requiredGroups.some(group => userGroups.includes(group));
    if (!hasRequiredGroup) {
      throw new Error('Insufficient permissions');
    }
  }
  
  // Check required scopes (for access tokens)
  if (requiredScopes.length > 0 && tokenType === 'access') {
    const userScopes = result.user.scope?.split(' ') || [];
    const hasRequiredScope = requiredScopes.every(scope => userScopes.includes(scope));
    if (!hasRequiredScope) {
      throw new Error('Insufficient scope');
    }
  }
  
  return result.user;
}

// Test function to verify different error scenarios
export async function testTokenVerification() {
  const testCases = [
    {
      name: 'Expired token',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid',
      expected: 'Token expired'
    },
    {
      name: 'Invalid audience',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJ3cm9uZy1jbGllbnQtaWQifQ.invalid',
      expected: 'Token not issued for this audience'
    },
    {
      name: 'Wrong issuer',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3dyb25nLXBvb2wuY29tIn0.invalid',
      expected: 'Token not issued by correct user pool'
    }
  ];
  
  const results = [];
  for (const testCase of testCases) {
    const result = await verifyCognitoToken(testCase.token);
    results.push({
      test: testCase.name,
      passed: !result.valid && result.error?.includes(testCase.expected),
      error: result.error
    });
  }
  
  return results;
}