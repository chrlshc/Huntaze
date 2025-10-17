'use client';

import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { CookieStorage } from 'aws-amplify/utils';

// Mock configuration for development
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-1_mock123',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || 'mockclient123',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    }
  }
};

export default function AmplifyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Configure cookie storage for session persistence
    const cookieStorage = new CookieStorage({
      domain: window.location.hostname,
      path: '/',
      expires: 30, // 30 days
      secure: window.location.protocol === 'https:',
      sameSite: 'lax',
    });

    // Set token provider to use cookies
    cognitoUserPoolsTokenProvider.setKeyValueStorage(cookieStorage);

    // Configure Amplify
    try {
      Amplify.configure(amplifyConfig);
      console.log('Amplify configured with session persistence');
    } catch (error) {
      console.error('Error configuring Amplify:', error);
    }
  }, []);

  return <>{children}</>;
}