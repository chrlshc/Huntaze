'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Text,
  BlockStack,
  Box,
  InlineStack,
  ButtonGroup,
  Button,
  IndexTable,
  useIndexResourceState,
  useBreakpoints,
  Badge,
  Divider,
  Banner,
  Spinner,
} from '@shopify/polaris';

function formatDateTime(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const ROUTES = {
  contentList: '/marketing/content',
  contentDetails: (id: string) => `/marketing/content/${id}`,
};

function platformLabel(p: Platform): string {
  const labels: Record<Platform, string> = {
    all: 'All platforms',
    tt: 'TikTok',
    ig: 'Instagram',
    rd: 'Reddit',
  };
  return labels[p] || p;
}

interface QueueItem {
  [key: string]: unknown;
  id: string;
  title: string;
  scheduledAt?: string;
  platforms: string[];
  status: 'scheduled' | 'uploading' | 'processing' | 'posted' | 'failed';
  lastUpdateAt?: string;
}

interface AIResultItem {
  id: string;
  title?: string;
  hooks?: string[];
  captions?: string[];
  repurpose?: { summary?: string };
  draft?: { caption?: string };
}

interface AIResult {
  items: AIResultItem[];
}

type Platform = 'all' | 'tt' | 'ig' | 'rd';
type AIMode = 'pack' | 'captions' | 'hooks' | 'repurpose' | 'triage';

export default function MarketingPage() {
  const router = useRouter();
  const breakpoints = useBreakpoints();

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [platform, setPlatform] = useState<Platform>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Content Operator state
  const [aiMode, setAiMode] = useState<AIMode>('pack');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const filteredQueue = useMemo(() => {
    if (platform === 'all') return queue;
    return queue.filter((item) => item.platforms.includes(platform));
  }, [queue, platform]);

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
  } = useIndexResourceState(filteredQueue);

  const selectedCount = allResourcesSelected ? filteredQueue.length : selectedResources.length;
  const hasFailedSelected = useMemo(() => {
    const ids = new Set(selectedResources);
    return filteredQueue.some((i) => ids.has(i.id) && i.status === 'failed');
  }, [filteredQueue, selectedResources]);

  // Queue stats for badges
  const stats = useMemo(() => {
    const c = { failed: 0, processing: 0, scheduled: 0, posted: 0 };
    for (const q of queue) {
      const s = (q.status || '').toLowerCase() as keyof typeof c;
      if (c[s] !== undefined) c[s] += 1;
    }
    return c;
  }, [queue]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/marketing-war-room/state');
      if (!res.ok) throw new Error('Failed to load state');
      const data = await res.json();
      setQueue(data.queue ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runAction = useCallback(
    async (action: 'post_now' | 'schedule' | 'cancel' | 'retry_failed') => {
      if (!selectedResources.length) return;
      setBusy(true);
      try {
        const res = await fetch('/api/warroom/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ids: selectedResources }),
        });
        if (!res.ok) throw new Error('Action failed');
        await fetchData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action error');
      } finally {
        setBusy(false);
      }
    },
    [selectedResources, fetchData],
  );

  const promotedBulkActions = useMemo(
    () => [
      { content: 'Post now', onAction: () => runAction('post_now') },
      { content: 'Schedule', onAction: () => runAction('schedule') },
    ],
    [runAction],
  );

  const bulkActions = useMemo(
    () => [
      { content: 'Cancel', onAction: () => runAction('cancel') },
      { content: 'Retry failed', onAction: () => runAction('retry_failed'), disabled: !hasFailedSelected },
    ],
    [runAction, hasFailedSelected],
  );

  const statusBadge = (status: QueueItem['status']) => {
    const map: Record<QueueItem['status'], { progress: 'complete' | 'partiallyComplete' | 'incomplete'; tone?: 'critical' }> = {
      posted: { progress: 'complete' },
      processing: { progress: 'partiallyComplete' },
      uploading: { progress: 'partiallyComplete' },
      scheduled: { progress: 'incomplete' },
      failed: { progress: 'incomplete', tone: 'critical' },
    };
    const cfg = map[status] ?? { progress: 'incomplete' };
    return <Badge progress={cfg.progress} tone={cfg.tone}>{status}</Badge>;
  };

  const rowMarkup = filteredQueue.map((item, idx) => {
    const detailsUrl = ROUTES.contentDetails(item.id);
    return (
      <IndexTable.Row
        id={item.id}
        key={item.id}
        position={idx}
        selected={selectedResources.includes(item.id)}
        tone={item.status === 'failed' ? 'critical' : undefined}
      >
        <IndexTable.Cell>
          <a
            data-primary-link
            href={detailsUrl}
            onClick={(e) => {
              e.preventDefault();
              router.push(detailsUrl);
            }}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <BlockStack gap="050">
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                {item.title}
              </Text>
              <Text as="span" tone="subdued" variant="bodySm">
                {item.id}
              </Text>
            </BlockStack>
          </a>
        </IndexTable.Cell>
        <IndexTable.Cell>{item.platforms.join(', ')}</IndexTable.Cell>
        <IndexTable.Cell>{statusBadge(item.status)}</IndexTable.Cell>
        <IndexTable.Cell>{formatDateTime(item.scheduledAt)}</IndexTable.Cell>
        <IndexTable.Cell>{formatDateTime(item.lastUpdateAt)}</IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  // AI Content Operator
  const runAi = useCallback(async () => {
    if (!selectedResources.length) return;

    setAiBusy(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/warroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mode: aiMode,
          platform,
          ids: selectedResources,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `AI request failed (${res.status})`);
      }

      const json = await res.json();
      setAiResult(json);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI action failed');
    } finally {
      setAiBusy(false);
    }
  }, [aiMode, platform, selectedResources]);

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op
    }
  }, []);

  return (
    <Box paddingBlockEnd="400">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="h1" variant="headingXl">Marketing</Text>
        <Button variant="primary" onClick={() => router.push('/content')}>
          + Content Factory
        </Button>
      </InlineStack>
      <Box paddingBlockStart="400">
      <BlockStack gap="400">
        {error ? (
          <Banner tone="critical" title="Something went wrong">
            <p>{error}</p>
          </Banner>
        ) : null}

        {/* Execution Card */}
        <Card>
          <BlockStack gap="300">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                Execution
              </Text>
              <Text as="p" tone="subdued">
                Select content → choose platforms → run
              </Text>
            </BlockStack>

            <InlineStack gap="200" align="start" blockAlign="center" wrap>
              <ButtonGroup variant="segmented">
                <Button pressed={platform === 'all'} onClick={() => setPlatform('all')}>
                  All
                </Button>
                <Button pressed={platform === 'tt'} onClick={() => setPlatform('tt')}>
                  TikTok
                </Button>
                <Button pressed={platform === 'ig'} onClick={() => setPlatform('ig')}>
                  Instagram
                </Button>
                <Button pressed={platform === 'rd'} onClick={() => setPlatform('rd')}>
                  Reddit
                </Button>
              </ButtonGroup>

              <Text as="p" tone="subdued">{selectedCount} selected</Text>
            </InlineStack>

            <InlineStack align="end">
              <ButtonGroup>
                <Button
                  variant="secondary"
                  tone="critical"
                  disabled={!selectedCount || busy}
                  onClick={() => runAction('cancel')}
                >
                  Cancel
                </Button>

                <Button
                  variant="secondary"
                  disabled={!selectedCount || busy || !hasFailedSelected}
                  onClick={() => runAction('retry_failed')}
                >
                  Retry
                </Button>

                <Button
                  variant="secondary"
                  disabled={!selectedCount || busy}
                  onClick={() => runAction('schedule')}
                >
                  Schedule
                </Button>

                <Button
                  variant="primary"
                  disabled={!selectedCount || busy}
                  onClick={() => runAction('post_now')}
                >
                  Post now
                </Button>
              </ButtonGroup>
            </InlineStack>

            {busy ? (
              <InlineStack gap="200" align="end" blockAlign="center">
                <Spinner size="small" />
                <Text as="p" tone="subdued">Executing…</Text>
              </InlineStack>
            ) : null}
          </BlockStack>
        </Card>

        {/* Content Queue Card */}
        <Card padding="0">
          <Box padding="400">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <BlockStack gap="050">
                <Text as="h2" variant="headingMd">
                  Content Queue
                </Text>
                <Text as="p" tone="subdued">
                  Multi-select rows to trigger bulk actions.
                </Text>
              </BlockStack>

              <InlineStack gap="200" align="end" blockAlign="center" wrap>
                {stats.failed > 0 && <Badge tone="critical" progress="incomplete">{`Failed ${stats.failed}`}</Badge>}
                {stats.processing > 0 && <Badge progress="partiallyComplete">{`Processing ${stats.processing}`}</Badge>}
                {stats.scheduled > 0 && <Badge progress="incomplete">{`Scheduled ${stats.scheduled}`}</Badge>}
                {stats.posted > 0 && <Badge progress="complete">{`Posted ${stats.posted}`}</Badge>}
                <Button variant="secondary" disabled={loading || busy} onClick={fetchData}>
                  Refresh
                </Button>
              </InlineStack>
            </InlineStack>
          </Box>

          <Divider />

          <Box>
            {loading ? (
              <Box padding="400">
                <InlineStack gap="200" blockAlign="center">
                  <Spinner />
                  <Text as="p" tone="subdued">Loading queue…</Text>
                </InlineStack>
              </Box>
            ) : (
              <IndexTable
                condensed={breakpoints.smDown}
                resourceName={{ singular: 'content', plural: 'contents' }}
                itemCount={filteredQueue.length}
                selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
                onSelectionChange={handleSelectionChange}
                promotedBulkActions={promotedBulkActions}
                bulkActions={bulkActions}
                headings={[
                  { title: 'Content' },
                  { title: 'Platforms' },
                  { title: 'Status' },
                  { title: 'Scheduled' },
                  { title: 'Last update' },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            )}
          </Box>
        </Card>

        {/* AI Content Operator Card */}
        <Card>
          <BlockStack gap="300">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">AI Content Operator</Text>
              <Text as="p" tone="subdued">
                Turn selected content into publish-ready drafts (hooks, captions, repurpose plan) → then open Content to apply.
              </Text>
            </BlockStack>

            <InlineStack gap="200" align="start" blockAlign="center" wrap>
              <ButtonGroup variant="segmented">
                <Button pressed={aiMode === 'pack'} onClick={() => setAiMode('pack')}>Pack</Button>
                <Button pressed={aiMode === 'captions'} onClick={() => setAiMode('captions')}>Captions</Button>
                <Button pressed={aiMode === 'hooks'} onClick={() => setAiMode('hooks')}>Hooks</Button>
                <Button pressed={aiMode === 'repurpose'} onClick={() => setAiMode('repurpose')}>Repurpose</Button>
                <Button pressed={aiMode === 'triage'} onClick={() => setAiMode('triage')}>Fix failed</Button>
              </ButtonGroup>

              <Text as="p" tone="subdued">{selectedCount} selected</Text>
            </InlineStack>

            <InlineStack gap="200" align="end" blockAlign="center">
              <Button variant="secondary" onClick={() => router.push(ROUTES.contentList)}>
                Open Content
              </Button>

              <Button
                variant="primary"
                disabled={!selectedCount || aiBusy}
                onClick={runAi}
              >
                Generate
              </Button>
            </InlineStack>

            {aiBusy && (
              <InlineStack gap="200" align="end" blockAlign="center">
                <Spinner size="small" />
                <Text as="p" tone="subdued">Generating…</Text>
              </InlineStack>
            )}

            {aiError && (
              <Banner tone="critical" title="AI action failed">
                <p>{aiError}</p>
                <p>Implement <code>POST /api/ai/warroom</code> to return actionable suggestions for the selected IDs.</p>
              </Banner>
            )}

            {aiResult?.items?.length ? (
              <BlockStack gap="300">
                <Divider />

                {aiResult.items.map((it) => {
                  const detailsUrl = ROUTES.contentDetails(it.id);
                  const primaryText =
                    it?.draft?.caption ||
                    it?.captions?.[0] ||
                    it?.hooks?.[0] ||
                    (it?.repurpose?.summary ? it.repurpose.summary : '');

                  return (
                    <Box key={it.id} padding="300" background="bg-surface-secondary" borderRadius="200">
                      <InlineStack align="space-between" blockAlign="start" gap="300" wrap>
                        <BlockStack gap="050">
                          <Text as="h3" variant="headingSm">{it.title || it.id}</Text>
                          <Text as="p" tone="subdued" variant="bodySm">
                            Generated for: {platformLabel(platform)} • Mode: {aiMode}
                          </Text>
                        </BlockStack>

                        <InlineStack gap="200" align="end">
                          <Button variant="secondary" onClick={() => router.push(detailsUrl)}>Open</Button>
                          <Button
                            variant="secondary"
                            disabled={!primaryText}
                            onClick={() => copyText(primaryText)}
                          >
                            Copy
                          </Button>
                        </InlineStack>
                      </InlineStack>

                      {primaryText ? (
                        <Box paddingBlockStart="200">
                          <Text as="p" variant="bodyMd">{primaryText}</Text>
                        </Box>
                      ) : (
                        <Box paddingBlockStart="200">
                          <Text as="p" tone="subdued">No preview text returned. Return captions/hooks in the API response.</Text>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </BlockStack>
            ) : null}
          </BlockStack>
        </Card>
      </BlockStack>
      </Box>
    </Box>
  );
}
