'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Text,
  BlockStack,
  Box,
  InlineStack,
  Button,
  Badge,
  Divider,
  Banner,
  Spinner,
  TextField,
} from '@shopify/polaris';
import { ArrowLeftIcon } from '@shopify/polaris-icons';

interface ContentItem {
  id: string;
  title: string;
  scheduledAt?: string;
  platforms: string[];
  status: 'scheduled' | 'uploading' | 'processing' | 'posted' | 'failed';
  lastUpdateAt?: string;
  caption?: string;
  mediaUrl?: string;
  error?: string;
}

export default function ContentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;

  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketing-war-room/content/${contentId}`);
      if (!res.ok) throw new Error('Failed to load content');
      const data = await res.json();
      setContent(data);
      setCaption(data.caption || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSave = useCallback(async () => {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/marketing-war-room/content/${contentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      });
      if (!res.ok) throw new Error('Failed to save');
      await fetchContent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [content, contentId, caption, fetchContent]);

  const statusBadge = (status: ContentItem['status']) => {
    const map: Record<ContentItem['status'], { progress: 'complete' | 'partiallyComplete' | 'incomplete'; tone?: 'critical' }> = {
      posted: { progress: 'complete' },
      processing: { progress: 'partiallyComplete' },
      uploading: { progress: 'partiallyComplete' },
      scheduled: { progress: 'incomplete' },
      failed: { progress: 'incomplete', tone: 'critical' },
    };
    const cfg = map[status] ?? { progress: 'incomplete' };
    return <Badge progress={cfg.progress} tone={cfg.tone}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Box padding="400">
        <InlineStack gap="200" blockAlign="center">
          <Spinner />
          <Text as="p" tone="subdued">Loading content…</Text>
        </InlineStack>
      </Box>
    );
  }

  if (error || !content) {
    return (
      <Box padding="400">
        <BlockStack gap="400">
          <Button icon={ArrowLeftIcon} onClick={() => router.push('/marketing')}>
            Back to Marketing
          </Button>
          <Banner tone="critical" title="Error loading content">
            <p>{error || 'Content not found'}</p>
            <Box paddingBlockStart="200">
              <Button onClick={fetchContent}>Retry</Button>
            </Box>
          </Banner>
        </BlockStack>
      </Box>
    );
  }

  return (
    <Box paddingBlockEnd="400">
      <InlineStack gap="200" blockAlign="center">
        <Button icon={ArrowLeftIcon} variant="tertiary" onClick={() => router.push('/marketing')}>
          Back
        </Button>
        <Text as="h1" variant="headingXl">{content.title}</Text>
      </InlineStack>

      <Box paddingBlockStart="400">
        <BlockStack gap="400">
          {/* Status Card */}
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">Status</Text>
                {statusBadge(content.status)}
              </InlineStack>

              <Divider />

              <BlockStack gap="200">
                <InlineStack gap="400">
                  <BlockStack gap="050">
                    <Text as="p" tone="subdued" variant="bodySm">ID</Text>
                    <Text as="p" variant="bodyMd">{content.id}</Text>
                  </BlockStack>

                  <BlockStack gap="050">
                    <Text as="p" tone="subdued" variant="bodySm">Platforms</Text>
                    <Text as="p" variant="bodyMd">{(content.platforms ?? []).join(', ') || '—'}</Text>
                  </BlockStack>

                  {content.scheduledAt && (
                    <BlockStack gap="050">
                      <Text as="p" tone="subdued" variant="bodySm">Scheduled</Text>
                      <Text as="p" variant="bodyMd">
                        {new Date(content.scheduledAt).toLocaleString()}
                      </Text>
                    </BlockStack>
                  )}
                </InlineStack>

                {content.error && (
                  <Banner tone="critical" title="Error">
                    <p>{content.error}</p>
                  </Banner>
                )}
              </BlockStack>
            </BlockStack>
          </Card>

          {/* Caption Editor Card */}
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Caption</Text>

              <TextField
                label="Caption"
                labelHidden
                value={caption}
                onChange={setCaption}
                multiline={4}
                autoComplete="off"
                placeholder="Enter caption for this content..."
              />

              <InlineStack align="end">
                <Button
                  variant="primary"
                  disabled={saving || caption === content.caption}
                  onClick={handleSave}
                  loading={saving}
                >
                  Save Caption
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>

          {/* Media Preview Card */}
          {content.mediaUrl && (
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">Media Preview</Text>
                <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                  <Text as="p" tone="subdued" variant="bodySm">
                    Media URL: {content.mediaUrl}
                  </Text>
                </Box>
              </BlockStack>
            </Card>
          )}

          {/* Actions Card */}
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">Actions</Text>

              <InlineStack gap="200">
                <Button
                  variant="primary"
                  disabled={content.status === 'posted' || content.status === 'processing'}
                >
                  Post Now
                </Button>
                <Button variant="secondary">
                  Schedule
                </Button>
                {content.status === 'failed' && (
                  <Button variant="secondary">
                    Retry
                  </Button>
                )}
                <Button variant="secondary" tone="critical">
                  Delete
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </BlockStack>
      </Box>
    </Box>
  );
}
