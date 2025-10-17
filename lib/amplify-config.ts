import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  const region = process.env.NEXT_PUBLIC_AWS_REGION!;
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID!;
  const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!;

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: 'code',
        userAttributes: {
          email: {
            required: true,
          },
        },
        passwordFormat: {
          minLength: 14,
          requireNumbers: true,
          requireSpecialCharacters: true,
          requireUppercase: true,
          requireLowercase: true,
        },
      },
    },
    ssr: true, // important pour Next.js App Router
  });
}