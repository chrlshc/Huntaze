import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { triggerSmartSync, getFromCache, SyncType } from '@/lib/of-sync/smart-controller';

/**
 * POST /api/of/sync
 * 
 * Smart Sync API - Déclenche une synchronisation intelligente des données OF
 * 
 * Body:
 * - type: 'financials' | 'fans' | 'content'
 * - force: boolean (optionnel) - Force le refresh même si cache existe
 * 
 * Coût:
 * - Cache hit: 0$ (lecture DynamoDB)
 * - Cache miss: ~0.001$ (scrape Bright Data)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authentification (NextAuth v5)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      );
    }

    // 2. Validation du body
    const body = await req.json();
    const { type, force } = body;

    if (!type || !['financials', 'fans', 'content'].includes(type)) {
      return NextResponse.json(
        { error: "Type de sync invalide. Valeurs acceptées: financials, fans, content" }, 
        { status: 400 }
      );
    }

    // 3. Appel du Smart Controller
    const result = await triggerSmartSync(
      session.user.id, 
      type as SyncType, 
      force === true
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ API /api/of/sync Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}

/**
 * GET /api/of/sync?type=financials
 * 
 * Récupère les données depuis le cache DynamoDB (sans déclencher de scrape)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authentification (NextAuth v5)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      );
    }

    // 2. Récupération du type depuis les query params
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') as SyncType;
    const date = searchParams.get('date'); // Optionnel: date spécifique

    if (!type || !['financials', 'fans', 'content'].includes(type)) {
      return NextResponse.json(
        { error: "Type invalide. Valeurs acceptées: financials, fans, content" }, 
        { status: 400 }
      );
    }

    // 3. Lecture du cache
    const data = await getFromCache(session.user.id, type, date || undefined);

    if (!data) {
      return NextResponse.json(
        { 
          status: 'empty', 
          message: 'Aucune donnée en cache. Lancez une synchronisation.' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      type,
      data,
      cachedAt: date || new Date().toISOString().split('T')[0]
    });

  } catch (error) {
    console.error("❌ API GET /api/of/sync Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
