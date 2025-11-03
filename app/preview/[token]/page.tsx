import { query } from '@/lib/db/index';
import { notFound } from 'next/navigation';

interface PreviewPageProps {
  params: Promise<{ token: string }>;
}

async function getContentByPreviewToken(token: string) {
  const result = await query(
    `SELECT 
      ci.id,
      ci.text,
      ci.category,
      ci.created_at,
      ci.metadata,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'platform', cp.platform
          )
        ) FILTER (WHERE cp.platform IS NOT NULL),
        '[]'
      ) as platforms,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', ma.id,
            'type', ma.type,
            'url', ma.original_url,
            'thumbnail_url', ma.thumbnail_url
          )
        ) FILTER (WHERE ma.id IS NOT NULL),
        '[]'
      ) as media
    FROM content_items ci
    LEFT JOIN content_platforms cp ON ci.id = cp.content_id
    LEFT JOIN content_media cm ON ci.id = cm.content_id
    LEFT JOIN media_assets ma ON cm.media_id = ma.id
    WHERE ci.metadata->>'preview_token' IS NOT NULL
      AND ci.metadata->'preview_token'->>'token' = $1
    GROUP BY ci.id`,
    [token]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const content = result.rows[0];
  
  // Check if preview link has expired
  if (content.metadata?.preview_token?.expires_at) {
    const expiresAt = new Date(content.metadata.preview_token.expires_at);
    if (expiresAt < new Date()) {
      return null;
    }
  }

  return content;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { token } = await params;
  const content = await getContentByPreviewToken(token);

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Content Preview</h1>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Read-only
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            This is a preview link. You can view the content but cannot make changes.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Content</h2>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{content.text}</p>
            </div>
          </div>

          {/* Media */}
          {content.media && content.media.length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-semibold mb-2">Media</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {content.media.map((media: any) => (
                  <div key={media.id} className="relative aspect-square">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt="Content media"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover rounded-lg"
                        controls
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platforms */}
          {content.platforms && content.platforms.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-2">Target Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {content.platforms.map((p: any, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize"
                  >
                    {p.platform}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-medium mb-1">⚠️ Preview Link</p>
          <p>
            This preview link will expire and cannot be used to edit the content.
            If you need to make changes, please contact the content creator.
          </p>
        </div>
      </div>
    </div>
  );
}
