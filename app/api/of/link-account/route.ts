import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/security/crypto';
import { z } from 'zod';

// Headers CORS pour autoriser OnlyFans
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://onlyfans.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Schema de validation strict
const LinkAccountSchema = z.object({
  cookies: z.string().min(10).refine(
    (val) => val.includes('sess='),
    { message: 'Session cookie (sess=) manquant' }
  ),
  user_agent: z.string().min(10),
});

// Gérer la requête "Preflight" (OPTIONS) envoyée par Safari
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    // 🛡️ SÉCURITÉ: Authentification OBLIGATOIRE via session
    const session = await getServerSession();

    if (!session?.user?.id) {
      console.warn(
        `🚨 Tentative d'accès non autorisé à link-account depuis IP: ${req.headers.get('x-forwarded-for') || 'unknown'}`
      );
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Conversion sécurisée de l'ID session
    const authenticatedUserId = parseInt(session.user.id, 10);
    if (isNaN(authenticatedUserId)) {
      return NextResponse.json(
        { error: 'Invalid Session ID' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🛡️ SÉCURITÉ: Validation des inputs avec Zod
    const body = await req.json();
    const validation = LinkAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten() },
        { status: 400, headers: corsHeaders }
      );
    }

    const { cookies, user_agent } = validation.data;

    // Extraction de l'auth_id pour les logs
    const authIdMatch = cookies.match(/auth_id=([0-9]+)/);
    const authId = authIdMatch ? authIdMatch[1] : null;

    // 🛡️ SÉCURITÉ: Chiffrement des cookies avant stockage
    const encryptedCookies = encrypt(cookies);

    // 🛡️ SÉCURITÉ: Utilise UNIQUEMENT l'ID de la session, JAMAIS du body
    await prisma.users.update({
      where: { id: authenticatedUserId },
      data: {
        of_cookies: encryptedCookies,
        of_user_agent: user_agent,
        of_auth_id: authId,
        of_linked_at: new Date(),
      },
    });

    console.log(`✅ OnlyFans relié pour User ${authenticatedUserId} (AuthID: ${authId})`);

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    console.error('🔥 Erreur critique dans link-account:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
