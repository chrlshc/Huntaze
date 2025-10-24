import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/services/auth-service';
import { AIContentService, ContentGenerationRequest } from '@/lib/services/ai-content-service';
import { prisma } from '@/lib/db';

const generateContentSchema = z.object({
  prompt: z.string().min(10, 'Le prompt doit contenir au moins 10 caractères'),
  type: z.enum(['post', 'story', 'caption', 'ideas']),
  tone: z.enum(['professional', 'casual', 'creative', 'humorous']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  language: z.string().optional().default('fr'),
  stream: z.boolean().optional().default(false)
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const user = await AuthService.getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = generateContentSchema.parse(body);

    // Vérifier les limites d'usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageCount = await prisma.contentAsset.count({
      where: {
        userId: user.sub,
        createdAt: {
          gte: new Date(currentMonth + '-01'),
          lt: new Date(new Date(currentMonth + '-01').getFullYear(), new Date(currentMonth + '-01').getMonth() + 1, 1)
        }
      }
    });

    const usageLimits = AIContentService.validateUsageLimits(user.subscription, usageCount);
    if (!usageLimits.allowed) {
      return NextResponse.json(
        { 
          error: 'Limite d\'usage atteinte',
          details: {
            current: usageCount,
            limit: usageLimits.limit,
            subscription: user.subscription
          }
        },
        { status: 429 }
      );
    }

    const contentRequest: ContentGenerationRequest = {
      prompt: validatedData.prompt,
      type: validatedData.type,
      tone: validatedData.tone,
      length: validatedData.length,
      language: validatedData.language
    };

    // Si streaming demandé, retourner un stream SSE
    if (validatedData.stream) {
      const stream = await AIContentService.generateContentStream(contentRequest);
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      });
    }

    // Génération synchrone
    const result = await AIContentService.generateContent(contentRequest);

    // Sauvegarder le contenu généré
    const contentAsset = await prisma.contentAsset.create({
      data: {
        userId: user.sub,
        title: `${validatedData.type} - ${new Date().toLocaleDateString()}`,
        content: result.content,
        type: validatedData.type.toUpperCase() as any,
        metadata: {
          prompt: validatedData.prompt,
          generationMetadata: result.metadata,
          tone: validatedData.tone,
          length: validatedData.length,
          language: validatedData.language
        }
      }
    });

    return NextResponse.json({
      id: contentAsset.id,
      content: result.content,
      metadata: result.metadata,
      usage: {
        current: usageCount + 1,
        remaining: usageLimits.remaining > 0 ? usageLimits.remaining - 1 : -1,
        limit: usageLimits.limit
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la génération de contenu:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération de contenu' },
      { status: 500 }
    );
  }
}

// Support des requêtes OPTIONS pour CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}