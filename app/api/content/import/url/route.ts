import { NextRequest, NextResponse } from 'next/server';
import { extractContentFromUrl, validateExtractedContent } from '@/lib/services/contentExtractor';
import { createContentItem } from '@/lib/db/repositories/contentItemsRepository';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';

/**
 * POST /api/content/import/url
 * Extract content from a URL and create a draft content item
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = String(user.id);
    const body = await request.json();
    const { url } = body;

    // Validate input
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Extract content from URL
    const extractedContent = await extractContentFromUrl(url);

    // Validate extracted content
    const validation = validateExtractedContent(extractedContent);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Failed to extract sufficient content from URL',
          details: validation.errors 
        },
        { status: 422 }
      );
    }

    // Create draft content item
    const contentItem = await createContentItem({
      userId: userId,
      text: extractedContent.content || extractedContent.title || '',
      status: 'draft',
      metadata: {
        source: 'url_import',
        sourceUrl: url,
        title: extractedContent.title,
        extractedData: {
          description: extractedContent.description,
          author: extractedContent.author,
          publishedDate: extractedContent.publishedDate,
          siteName: extractedContent.siteName,
          images: extractedContent.images,
        },
      },
    });

    return NextResponse.json({
      success: true,
      contentItem,
      extractedContent,
      message: 'Content extracted successfully. Review and edit before publishing.',
    });

  } catch (error) {
    console.error('Error importing content from URL:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import content from URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
