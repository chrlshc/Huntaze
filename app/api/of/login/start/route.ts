import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth';
import { enqueueLogin } from '@/lib/queue/of-sqs';
import { SecretsManagerClient, CreateSecretCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { setOfLinkStatus } from '@/lib/of/link-store';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  otp: z.string().optional(),
  userId: z.string().optional(),
});

const REGION = process.env.OF_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
const sm = new SecretsManagerClient({ region: REGION });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);
    const body = await req.json();
    const { email, password, otp, userId } = schema.parse(body);
    const effectiveUserId = userId || (session as any)?.user?.id;
    if (!effectiveUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secretName = `of/creds/${effectiveUserId}`;
    // Create or update secret
    try {
      await sm.send(new CreateSecretCommand({
        Name: secretName,
        SecretString: JSON.stringify({ email, password }),
      }));
    } catch {
      await sm.send(new PutSecretValueCommand({
        SecretId: secretName,
        SecretString: JSON.stringify({ email, password }),
      }));
    }

    await setOfLinkStatus(effectiveUserId, { state: 'LOGIN_STARTED' });
    await enqueueLogin({ userId: effectiveUserId, otp });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.issues) return NextResponse.json({ error: 'Invalid request', details: e.issues }, { status: 400 });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
