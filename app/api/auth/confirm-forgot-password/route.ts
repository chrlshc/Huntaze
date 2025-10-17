import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CognitoIdentityProviderClient, ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(12),
  // The UI may send `password`; accept either
  newPassword: z.string().min(8).optional(),
  password: z.string().min(8).optional(),
});

const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID || process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '';
const cip = new CognitoIdentityProviderClient({ region });

export async function POST(req: Request) {
  try {
    const parsed = schema.parse(await req.json());
    const email = parsed.email;
    const code = parsed.code;
    const newPassword = parsed.newPassword || parsed.password!;

    await cip.send(
      new ConfirmForgotPasswordCommand({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const codeName = err?.name || 'UnknownError';
    const map: Record<string, number> = {
      CodeMismatchException: 400,
      ExpiredCodeException: 400,
      InvalidPasswordException: 400,
      UserNotFoundException: 404,
      LimitExceededException: 429,
      TooManyRequestsException: 429,
    };
    return NextResponse.json({ error: codeName }, { status: map[codeName] ?? 500 });
  }
}
