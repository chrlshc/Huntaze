import { NextRequest, NextResponse } from 'next/server';
import { templatesRepository } from '@/lib/db/repositories/templatesRepository';
import { getServerSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const templates = await templatesRepository.find({ userId, category, search, limit, offset });
    const mostUsed = await templatesRepository.getMostUsed(5);

    return NextResponse.json({ success: true, data: { templates, mostUsed } });

  } catch (error: any) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: { code: 'FETCH_FAILED', message: 'Failed to fetch templates' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, category, structure, isPublic } = body;

    if (!name || !category || !structure) {
      return NextResponse.json(
        { error: { code: 'MISSING_FIELDS', message: 'Name, category, and structure are required' } },
        { status: 400 }
      );
    }

    const template = await templatesRepository.create({ userId, name, description, category, structure, isPublic: isPublic || false });

    return NextResponse.json({ success: true, data: template });

  } catch (error: any) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: { code: 'CREATE_FAILED', message: 'Failed to create template' } },
      { status: 500 }
    );
  }
}
