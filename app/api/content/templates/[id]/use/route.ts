import { NextRequest, NextResponse } from 'next/server';
import { templatesRepository } from '@/lib/db/repositories/templatesRepository';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: templateId } = await params;
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }
    await templatesRepository.incrementUsage(templateId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Increment template usage error:', error);
    return NextResponse.json(
      { error: { code: 'UPDATE_FAILED', message: 'Failed to update template usage' } },
      { status: 500 }
    );
  }
}
