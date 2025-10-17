import { NextRequest, NextResponse } from 'next/server';
import { verifyCognitoToken, testTokenVerification } from '@/lib/auth/cognito-verify';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  try {
    const { testCase } = await request.json();
    
    // Run predefined test cases
    if (testCase === 'all') {
      const results = await testTokenVerification();
      return NextResponse.json({ 
        success: true, 
        results 
      });
    }
    
    // Test specific scenarios
    let testToken: string;
    let expectedError: string;
    
    switch (testCase) {
      case 'expired':
        // Create an expired token
        const secret = new TextEncoder().encode('test-secret');
        testToken = await new SignJWT({
          sub: 'test-user',
          exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        })
          .setProtectedHeader({ alg: 'HS256' })
          .sign(secret);
        expectedError = 'expired';
        break;
        
      case 'wrong-audience':
        testToken = await new SignJWT({
          sub: 'test-user',
          aud: 'wrong-client-id',
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: `https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${process.env.NEXT_PUBLIC_USER_POOL_ID}`,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .sign(new TextEncoder().encode('test-secret'));
        expectedError = 'audience';
        break;
        
      case 'wrong-issuer':
        testToken = await new SignJWT({
          sub: 'test-user',
          aud: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
          exp: Math.floor(Date.now() / 1000) + 3600,
          iss: 'https://cognito-idp.us-west-2.amazonaws.com/us-west-2_WRONGPOOL',
        })
          .setProtectedHeader({ alg: 'HS256' })
          .sign(new TextEncoder().encode('test-secret'));
        expectedError = 'issuer';
        break;
        
      case 'valid':
        // For testing, return instructions
        return NextResponse.json({
          success: false,
          message: 'To test with a valid token, login first and use the accessToken from cookies',
          instruction: 'POST /api/auth/test-jwt with { "token": "<your-access-token>" }'
        });
        
      default:
        return NextResponse.json({
          error: 'Invalid test case',
          validCases: ['expired', 'wrong-audience', 'wrong-issuer', 'valid', 'all']
        }, { status: 400 });
    }
    
    // Verify the test token
    const result = await verifyCognitoToken(testToken);
    
    return NextResponse.json({
      testCase,
      expectedError,
      result,
      passed: !result.valid && result.error?.toLowerCase().includes(expectedError)
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message
    }, { status: 500 });
  }
}

// Test with a provided token
export async function PUT(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({
        error: 'Token required'
      }, { status: 400 });
    }
    
    const result = await verifyCognitoToken(token);
    
    return NextResponse.json({
      result,
      tokenInfo: result.valid ? {
        userId: result.user?.sub,
        username: result.user?.username,
        groups: result.user?.groups,
        expires: new Date(result.user?.exp! * 1000).toISOString(),
        remainingTime: `${Math.round((result.user?.exp! * 1000 - Date.now()) / 1000)} seconds`
      } : null
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: 'Verification failed',
      message: error.message
    }, { status: 500 });
  }
}