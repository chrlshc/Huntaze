import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CognitoIdentityProviderClient, ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';

export const runtime = 'nodejs';

const schema = z.object({ email: z.string().email() });
const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID || process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '';

const cip = new CognitoIdentityProviderClient({ region });

export async function POST(req: Request) {
  try {
    const { email } = schema.parse(await req.json());

    await cip.send(
      new ForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: email,
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const code = err?.name || 'UnknownError';
    const map: Record<string, number> = {
      UserNotFoundException: 404,
      InvalidParameterException: 400,
      LimitExceededException: 429,
      TooManyRequestsException: 429,
    };
    return NextResponse.json({ error: code }, { status: map[code] ?? 500 });
  }
}

