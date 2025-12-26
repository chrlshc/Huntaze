'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Box,
  Text,
  BlockStack,
  InlineStack,
  Button,
  ButtonGroup,
  TextField,
  DropZone,
  Thumbnail,
  Banner,
  Divider,
  ProgressBar,
  Spinner,
  Badge,
} from '@shopify/polaris';
import { NoteIcon } from '@shopify/polaris-icons';

const endpoints = {
  ideas: '/api/content-factory/ideas',
  script: '/api/content-factory/script',
  produce: '/api/content-factory/produce',
  plannedDrafts: '/api/content-factory/planned-drafts',
  job: (jobId: string) => `/api/content-factory/jobs/${encodeURIComponent(jobId)}`,
};

const ROUTES = {
  marketing: (selectIds: string[] = []) =>
    selectIds.length
      ? `/marketing?select=${encodeURIComponent(selectIds.join(','))}`
      : '/marketing',
};

function bytesToHuman(bytes: number | undefined): string {
  if (!bytes && bytes !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let val = bytes;
  let i = 0;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i += 1;
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

interface Idea {
  id: string;
  title: string;
  angle: string;
  hook: string;
  why: string;
  selected?: boolean;
}

interface ScriptVariant {
  hook?: string;
  body?: string;
  cta?: string;
}

interface ProductionSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  requiresFile?: boolean;
}

type Mode = 'footage' | 'ideas';
type TargetPlatform = 'all' | 'tt' | 'ig' | 'rd';

type Niche = 'fitness' | 'fashion' | 'tech' | 'food' | 'lifestyle' | 'business';
type Goal = 'sell' | 'grow' | 'educate' | 'entertain';

export default function ContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>('footage');

  // Mission prefill (from The Muse)
  const [missionId, setMissionId] = useState<string | null>(null);
  const [missionIdea, setMissionIdea] = useState<string>('');
  const [missionHook, setMissionHook] = useState<string>('');
  const [missionCta, setMissionCta] = useState<string>('');
  const [captionPreset, setCaptionPreset] = useState<string>('');

  const [file, setFile] = useState<File | null>(null);
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [rejected, setRejected] = useState<File[]>([]);
  const [targets, setTargets] = useState<TargetPlatform>('all');

  const [packagingBusy, setPackagingBusy] = useState(false);
  const [packagingError, setPackagingError] = useState<string | null>(null);
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [generatedHooks, setGeneratedHooks] = useState<string[]>([]);

  const [settings, setSettings] = useState<ProductionSetting[]>([
    { id: 'auto_captions', label: 'Auto-Captions', description: 'Generate and burn-in subtitles', enabled: true },
    { id: 'smart_cuts', label: 'Smart Cuts', description: 'AI-powered clip optimization', enabled: true },
    { id: 'remove_watermark', label: 'Remove Watermark', description: 'Requires original file', enabled: false, requiresFile: true },
    { id: 'send_to_marketing', label: 'Send to Marketing', description: 'Push drafts to queue', enabled: true },
  ]);

  const [produceBusy, setProduceBusy] = useState(false);
  const [produceError, setProduceError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [createdContentIds, setCreatedContentIds] = useState<string[]>([]);

  const [niche, setNiche] = useState<Niche>('fitness');
  const [goal, setGoal] = useState<Goal>('sell');
  const [customPrompt, setCustomPrompt] = useState('');
  const [ideasBusy, setIdeasBusy] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  const [scriptBusy, setScriptBusy] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [scriptVariants, setScriptVariants] = useState<ScriptVariant[] | null>(null);

  const [plannedBusy, setPlannedBusy] = useState(false);
  const [plannedError, setPlannedError] = useState<string | null>(null);
  const [plannedIds, setPlannedIds] = useState<string[]>([]);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const hasSource = useMemo(() => !!file || !!tiktokUrl?.trim(), [file, tiktokUrl]);

  useEffect(() => {
    const mission = searchParams.get('mission');
    const idea = searchParams.get('idea');
    const hook = searchParams.get('hook');
    const cta = searchParams.get('cta');
    const platform = searchParams.get('platform');
    const preset = searchParams.get('captionPreset');

    if (mission) setMissionId(mission);
    if (idea) setMissionIdea(idea);
    if (hook) setMissionHook(hook);
    if (cta) setMissionCta(cta);
    if (preset) setCaptionPreset(preset);

    if (platform === 'tt' || platform === 'ig' || platform === 'rd') {
      setTargets(platform);
    }
  }, [searchParams]);

  const canLaunch = useMemo(() => {
    if (!hasSource) return false;
    const watermarkSetting = settings.find(s => s.id === 'remove_watermark');
    if (watermarkSetting?.enabled && !file) return false;
    return true;
  }, [hasSource, settings, file]);

  const selectedIdea = useMemo(() => ideas.find(i => i.id === selectedIdeaId), [ideas, selectedIdeaId]);

  const handleDropZoneDrop = useCallback(
    (_dropFiles: File[], acceptedFiles: File[], rejectedFiles: File[]) => {
      if (acceptedFiles?.length) {
        setFile(acceptedFiles[0]);
        setTiktokUrl('');
        setRejected([]);
      }
      if (rejectedFiles?.length) {
        setRejected(rejectedFiles);
      }
    },
    [],
  );

  const clearFile = useCallback(() => setFile(null), []);

  const onChangeTikTokUrl = useCallback((value: string) => {
    setTiktokUrl(value);
    if (value?.trim()) {
      setFile(null);
      setRejected([]);
    }
  }, []);

  const toggleSetting = useCallback((id: string, enabled: boolean) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
  }, []);

  const generatePackaging = useCallback(async () => {
    setPackagingBusy(true);
    setPackagingError(null);
    setGeneratedCaptions([]);
    setGeneratedHooks([]);

    try {
      const res = await fetch(endpoints.script, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          idea: 'Generate captions and hooks for uploaded video',
          tiktokUrl: tiktokUrl?.trim() || null,
          targets,
          variants: 3,
          mode: 'packaging',
        }),
      });

      if (!res.ok) throw new Error(await res.text() || 'Generation failed');

      const json = await res.json();
      const variants = Array.isArray(json?.variants) ? json.variants : [];

      setGeneratedHooks(variants.map((v: ScriptVariant) => v.hook || '').filter(Boolean));
      setGeneratedCaptions(variants.map((v: ScriptVariant) =>
        [v.body, v.cta].filter(Boolean).join('\n\n')
      ).filter(Boolean));
    } catch (e) {
      setPackagingError(e instanceof Error ? e.message : 'Packaging error');
    } finally {
      setPackagingBusy(false);
    }
  }, [tiktokUrl, targets]);

  const launchProduction = useCallback(async () => {
    setProduceBusy(true);
    setProduceError(null);
    setJobId(null);
    setJobStatus(null);
    setJobProgress(0);
    setCreatedContentIds([]);

    try {
      if (!canLaunch) return;

      const form = new FormData();
      if (file) form.append('file', file);
      if (tiktokUrl?.trim()) form.append('tiktokUrl', tiktokUrl.trim());
      form.append('targets', targets);
      form.append('variants', '3');

      if (missionIdea.trim()) {
        form.append('idea', missionIdea.trim());
      }

      if (missionHook.trim() || missionCta.trim()) {
        const script = {
          variants: [
            {
              hook: missionHook.trim() || undefined,
              body: undefined,
              cta: missionCta.trim() || undefined,
            },
          ],
        };
        form.append('script', JSON.stringify(script));
      }

      const options: Record<string, boolean> = {};
      settings.forEach(s => { options[s.id] = s.enabled; });
      form.append('options', JSON.stringify(options));

      if (generatedHooks.length || generatedCaptions.length) {
        form.append('packaging', JSON.stringify({ hooks: generatedHooks, captions: generatedCaptions }));
      }

      const res = await fetch(endpoints.produce, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });

      if (!res.ok) throw new Error(await res.text() || 'Production failed');

      const json = await res.json();
      setJobId(json?.jobId || null);
      setJobStatus(json?.status || 'queued');
      setJobProgress(typeof json?.progress === 'number' ? json.progress : 15);
      setCreatedContentIds(Array.isArray(json?.createdContentIds) ? json.createdContentIds : []);

      if (json?.jobId) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
          try {
            const r = await fetch(endpoints.job(json.jobId), { credentials: 'include' });
            if (!r.ok) return;
            const j = await r.json();
            if (j?.status) setJobStatus(j.status);
            if (typeof j?.progress === 'number') setJobProgress(j.progress);
            if (Array.isArray(j?.createdContentIds) && j.createdContentIds.length) {
              setCreatedContentIds(j.createdContentIds);
            }
            if (j?.status === 'finished' || j?.status === 'failed') {
              clearInterval(pollRef.current!);
              pollRef.current = null;
            }
          } catch {
          }
        }, 1800);
      }
    } catch (e) {
      setProduceError(e instanceof Error ? e.message : 'Production error');
    } finally {
      setProduceBusy(false);
    }
  }, [canLaunch, file, tiktokUrl, targets, settings, generatedHooks, generatedCaptions, missionIdea, missionHook, missionCta]);

  const generateIdeas = useCallback(async () => {
    setIdeasBusy(true);
    setIdeasError(null);
    setIdeas([]);
    setSelectedIdeaId(null);
    setScriptVariants(null);

    try {
      const res = await fetch(endpoints.ideas, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ niche, goal, prompt: customPrompt.trim() || null, count: 10 }),
      });

      if (!res.ok) throw new Error(await res.text() || 'Ideas generation failed');

      const json = await res.json();
      setIdeas(Array.isArray(json?.ideas) ? json.ideas : []);
    } catch (e) {
      setIdeasError(e instanceof Error ? e.message : 'Ideas error');
    } finally {
      setIdeasBusy(false);
    }
  }, [niche, goal, customPrompt]);

  const generateScriptFromIdea = useCallback(async () => {
    if (!selectedIdea) return;
    setScriptBusy(true);
    setScriptError(null);
    setScriptVariants(null);

    try {
      const res = await fetch(endpoints.script, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          idea: `${selectedIdea.title} - ${selectedIdea.angle}`,
          targets,
          variants: 3,
        }),
      });

      if (!res.ok) throw new Error(await res.text() || 'Script generation failed');

      const json = await res.json();
      const variants = Array.isArray(json?.variants) ? json.variants : [];
      setScriptVariants(variants.slice(0, 3));
    } catch (e) {
      setScriptError(e instanceof Error ? e.message : 'Script error');
    } finally {
      setScriptBusy(false);
    }
  }, [selectedIdea, targets]);

  const createPlannedDrafts = useCallback(async () => {
    if (!selectedIdea) return;
    setPlannedBusy(true);
    setPlannedError(null);
    setPlannedIds([]);

    try {
      const res = await fetch(endpoints.plannedDrafts, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ideaId: selectedIdea.id,
          ideaTitle: selectedIdea.title,
          variants: 3,
          targets: targets === 'all' ? ['tt', 'ig', 'rd'] : [targets],
          script: scriptVariants,
          sendToMarketing: true,
        }),
      });

      if (!res.ok) throw new Error(await res.text() || 'Planned drafts failed');

      const json = await res.json();
      const ids = Array.isArray(json?.createdContentIds) ? json.createdContentIds : [];
      setPlannedIds(ids);

      if (ids.length) {
        setTimeout(() => router.push(ROUTES.marketing(ids)), 500);
      }
    } catch (e) {
      setPlannedError(e instanceof Error ? e.message : 'Planned drafts error');
    } finally {
      setPlannedBusy(false);
    }
  }, [selectedIdea, targets, scriptVariants, router]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const marketingUrl = useMemo(() => ROUTES.marketing(createdContentIds), [createdContentIds]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
      <Box paddingBlockEnd="400">
        <InlineStack align="space-between" blockAlign="center" wrap>
          <BlockStack gap="050">
            <Text as="h1" variant="headingXl">Content Factory</Text>
            <Text as="p" tone="subdued">
              {mode === 'footage' ? 'Upload → Package → Produce → Marketing' : 'Ideas → Script → Planned Drafts → Marketing'}
            </Text>
          </BlockStack>

          <ButtonGroup variant="segmented">
            <Button pressed={mode === 'footage'} onClick={() => setMode('footage')}>
              I have footage
            </Button>
            <Button pressed={mode === 'ideas'} onClick={() => setMode('ideas')}>
              Find ideas & script
            </Button>
          </ButtonGroup>
        </InlineStack>
      </Box>

      {mode === 'footage' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
          <BlockStack gap="400">
            {(missionId || missionIdea || missionHook || missionCta) && (
              <Card>
                <BlockStack gap="200">
                  <BlockStack gap="050">
                    <Text as="h2" variant="headingMd">Mission brief</Text>
                    <Text as="p" tone="subdued">Pre-filled from THE MUSE</Text>
                  </BlockStack>

                  <Divider />

                  {missionId && (
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="span" tone="subdued">Mission</Text>
                      <Badge>{missionId}</Badge>
                    </InlineStack>
                  )}

                  {captionPreset && (
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="span" tone="subdued">Caption preset</Text>
                      <Badge>{captionPreset}</Badge>
                    </InlineStack>
                  )}

                  {missionIdea ? (
                    <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                      <BlockStack gap="100">
                        <Text as="span" fontWeight="semibold">Idea</Text>
                        <Text as="p" variant="bodySm">{missionIdea}</Text>
                      </BlockStack>
                    </Box>
                  ) : null}

                  {(missionHook || missionCta) ? (
                    <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                      <BlockStack gap="100">
                        {missionHook ? (
                          <>
                            <Text as="span" fontWeight="semibold">Hook</Text>
                            <Text as="p" variant="bodySm">{missionHook}</Text>
                          </>
                        ) : null}
                        {missionCta ? (
                          <>
                            <Text as="span" fontWeight="semibold">CTA</Text>
                            <Text as="p" variant="bodySm">{missionCta}</Text>
                          </>
                        ) : null}
                      </BlockStack>
                    </Box>
                  ) : null}
                </BlockStack>
              </Card>
            )}

            <Card>
              <BlockStack gap="300">
                <BlockStack gap="050">
                  <Text as="h2" variant="headingMd">Video Source</Text>
                  <Text as="p" tone="subdued">Upload your video or paste a link</Text>
                </BlockStack>

                <Divider />

                {rejected.length > 0 && (
                  <Banner tone="critical" title="File rejected">
                    <p>Try .mp4, .mov, or .webm</p>
                  </Banner>
                )}

                <DropZone
                  accept="video/mp4,video/quicktime,video/webm"
                  type="file"
                  allowMultiple={false}
                  onDrop={handleDropZoneDrop}
                >
                  {file ? (
                    <Box padding="300">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" blockAlign="center">
                          <Thumbnail source={NoteIcon} alt={file.name} />
                          <BlockStack gap="050">
                            <Text as="span" fontWeight="semibold">{file.name}</Text>
                            <Text as="span" tone="subdued" variant="bodySm">{bytesToHuman(file.size)}</Text>
                          </BlockStack>
                        </InlineStack>
                        <Button variant="tertiary" onClick={clearFile}>Remove</Button>
                      </InlineStack>
                    </Box>
                  ) : (
                    <DropZone.FileUpload actionTitle="Add video" actionHint="or drop to upload" />
                  )}
                </DropZone>

                <TextField
                  label="Or paste a video link"
                  placeholder="https://..."
                  value={tiktokUrl}
                  onChange={onChangeTikTokUrl}
                  autoComplete="off"
                />
              </BlockStack>
            </Card>

            {hasSource && (
              <Card>
                <BlockStack gap="300">
                  <BlockStack gap="050">
                    <Text as="h2" variant="headingMd">Packaging</Text>
                    <Text as="p" tone="subdued">Generate captions & hooks for your video</Text>
                  </BlockStack>

                  <Divider />

                  {packagingError && (
                    <Banner tone="critical" title="Error">
                      <p>{packagingError}</p>
                    </Banner>
                  )}

                  <InlineStack gap="200" align="start" blockAlign="center" wrap>
                    <ButtonGroup variant="segmented">
                      <Button pressed={targets === 'all'} onClick={() => setTargets('all')} size="slim">All</Button>
                      <Button pressed={targets === 'tt'} onClick={() => setTargets('tt')} size="slim">TikTok</Button>
                      <Button pressed={targets === 'ig'} onClick={() => setTargets('ig')} size="slim">Instagram</Button>
                      <Button pressed={targets === 'rd'} onClick={() => setTargets('rd')} size="slim">Reddit</Button>
                    </ButtonGroup>

                    <Button variant="primary" disabled={packagingBusy} onClick={generatePackaging}>
                      Generate captions & hooks
                    </Button>
                  </InlineStack>

                  {packagingBusy && (
                    <InlineStack gap="200" blockAlign="center">
                      <Spinner size="small" />
                      <Text as="p" tone="subdued">Generating…</Text>
                    </InlineStack>
                  )}

                  {generatedHooks.length > 0 && (
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">Hooks</Text>
                      {generatedHooks.map((h, i) => (
                        <Box key={i} padding="200" background="bg-surface-secondary" borderRadius="100">
                          <Text as="p" variant="bodySm">{h}</Text>
                        </Box>
                      ))}
                    </BlockStack>
                  )}

                  {generatedCaptions.length > 0 && (
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">Captions</Text>
                      {generatedCaptions.map((c, i) => (
                        <Box key={i} padding="200" background="bg-surface-secondary" borderRadius="100">
                          <Text as="p" variant="bodySm">{c}</Text>
                        </Box>
                      ))}
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
            )}
          </BlockStack>

          <div style={{ position: 'sticky', top: '24px' }}>
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="300">
                  <BlockStack gap="050">
                    <Text as="h2" variant="headingMd">Production Settings</Text>
                    <Text as="p" tone="subdued">Configure processing</Text>
                  </BlockStack>

                  <Divider />

                  <BlockStack gap="300">
                    {settings.map((s) => {
                      const disabled = s.requiresFile && !file;
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', opacity: disabled ? 0.5 : 1 }}>
                          <BlockStack gap="050">
                            <Text as="span" variant="bodyMd" fontWeight="semibold">{s.label}</Text>
                            <Text as="p" tone="subdued" variant="bodySm">{s.description}</Text>
                          </BlockStack>
                          <ButtonGroup variant="segmented">
                            <Button pressed={s.enabled} onClick={() => toggleSetting(s.id, true)} size="slim" disabled={disabled}>On</Button>
                            <Button pressed={!s.enabled} onClick={() => toggleSetting(s.id, false)} size="slim" disabled={disabled}>Off</Button>
                          </ButtonGroup>
                        </div>
                      );
                    })}
                  </BlockStack>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <BlockStack gap="050">
                    <Text as="h2" variant="headingMd">Launch Production</Text>
                    <Text as="p" tone="subdued">Create 3 drafts → Marketing</Text>
                  </BlockStack>

                  <Divider />

                  {produceError && (
                    <Banner tone="critical" title="Error">
                      <p>{produceError}</p>
                    </Banner>
                  )}

                  {jobId && (
                    <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                      <BlockStack gap="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="span" fontWeight="semibold">Job: {jobId.slice(-8)}</Text>
                          <Badge progress={jobStatus === 'finished' ? 'complete' : 'partiallyComplete'}>{jobStatus || 'queued'}</Badge>
                        </InlineStack>
                        <ProgressBar progress={Math.max(5, Math.min(100, jobProgress))} />
                      </BlockStack>
                    </Box>
                  )}

                  <Button variant="primary" fullWidth disabled={!canLaunch || produceBusy} onClick={launchProduction}>
                    {produceBusy ? 'Processing…' : 'Launch Production'}
                  </Button>

                  {jobId && (
                    <Button variant="secondary" fullWidth onClick={() => router.push(marketingUrl)}>
                      Open Marketing
                    </Button>
                  )}
                </BlockStack>
              </Card>
            </BlockStack>
          </div>
        </div>
      )}

      {mode === 'ideas' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <BlockStack gap="050">
                  <Text as="h2" variant="headingMd">Idea Lab</Text>
                  <Text as="p" tone="subdued">Generate 10 structured ideas (angle + hook + promise)</Text>
                </BlockStack>

                <Divider />

                {ideasError && (
                  <Banner tone="critical" title="Error">
                    <p>{ideasError}</p>
                  </Banner>
                )}

                <BlockStack gap="200">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" fontWeight="semibold">Niche</Text>
                    <ButtonGroup variant="segmented">
                      <Button pressed={niche === 'fitness'} onClick={() => setNiche('fitness')} size="slim">Fitness</Button>
                      <Button pressed={niche === 'fashion'} onClick={() => setNiche('fashion')} size="slim">Fashion</Button>
                      <Button pressed={niche === 'tech'} onClick={() => setNiche('tech')} size="slim">Tech</Button>
                      <Button pressed={niche === 'food'} onClick={() => setNiche('food')} size="slim">Food</Button>
                      <Button pressed={niche === 'lifestyle'} onClick={() => setNiche('lifestyle')} size="slim">Lifestyle</Button>
                    </ButtonGroup>
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodySm" fontWeight="semibold">Goal</Text>
                    <ButtonGroup variant="segmented">
                      <Button pressed={goal === 'sell'} onClick={() => setGoal('sell')} size="slim">Sell</Button>
                      <Button pressed={goal === 'grow'} onClick={() => setGoal('grow')} size="slim">Grow</Button>
                      <Button pressed={goal === 'educate'} onClick={() => setGoal('educate')} size="slim">Educate</Button>
                      <Button pressed={goal === 'entertain'} onClick={() => setGoal('entertain')} size="slim">Entertain</Button>
                    </ButtonGroup>
                  </BlockStack>
                </BlockStack>

                <TextField
                  label="Custom prompt (optional)"
                  placeholder="Add specific context..."
                  value={customPrompt}
                  onChange={setCustomPrompt}
                  autoComplete="off"
                  multiline={2}
                />

                <Button variant="primary" disabled={ideasBusy} onClick={generateIdeas}>
                  Generate 10 ideas
                </Button>

                {ideasBusy && (
                  <InlineStack gap="200" blockAlign="center">
                    <Spinner size="small" />
                    <Text as="p" tone="subdued">Generating ideas…</Text>
                  </InlineStack>
                )}

                {ideas.length > 0 && (
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingSm">Generated ideas</Text>
                      <Badge>{`${ideas.length} ideas`}</Badge>
                    </InlineStack>

                    {ideas.map((idea) => (
                      <button
                        key={idea.id}
                        type="button"
                        onClick={() => setSelectedIdeaId(idea.id)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: selectedIdeaId === idea.id ? 'var(--p-color-bg-surface-selected)' : 'var(--p-color-bg-surface-secondary)',
                          border: selectedIdeaId === idea.id ? '2px solid var(--p-color-border-emphasis)' : '1px solid var(--p-color-border)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <BlockStack gap="100">
                          <InlineStack align="space-between" blockAlign="center">
                            <Text as="span" fontWeight="semibold">{idea.title}</Text>
                            {selectedIdeaId === idea.id && <Badge tone="info">Selected</Badge>}
                          </InlineStack>
                          <Text as="p" tone="subdued" variant="bodySm">{idea.angle}</Text>
                          <Text as="p" variant="bodySm">Hook: {idea.hook}</Text>
                        </BlockStack>
                      </button>
                    ))}
                  </BlockStack>
                )}
              </BlockStack>
            </Card>

            {selectedIdea && (
              <Card>
                <BlockStack gap="300">
                  <BlockStack gap="050">
                    <Text as="h2" variant="headingMd">Script: {selectedIdea.title}</Text>
                    <Text as="p" tone="subdued">Generate Hook / Body / CTA (3 variants)</Text>
                  </BlockStack>

                  <Divider />

                  {scriptError && (
                    <Banner tone="critical" title="Error">
                      <p>{scriptError}</p>
                    </Banner>
                  )}

                  <InlineStack gap="200" align="start" blockAlign="center" wrap>
                    <ButtonGroup variant="segmented">
                      <Button pressed={targets === 'all'} onClick={() => setTargets('all')} size="slim">All</Button>
                      <Button pressed={targets === 'tt'} onClick={() => setTargets('tt')} size="slim">TikTok</Button>
                      <Button pressed={targets === 'ig'} onClick={() => setTargets('ig')} size="slim">Instagram</Button>
                      <Button pressed={targets === 'rd'} onClick={() => setTargets('rd')} size="slim">Reddit</Button>
                    </ButtonGroup>

                    <Button variant="primary" disabled={scriptBusy} onClick={generateScriptFromIdea}>
                      Generate script
                    </Button>
                  </InlineStack>

                  {scriptBusy && (
                    <InlineStack gap="200" blockAlign="center">
                      <Spinner size="small" />
                      <Text as="p" tone="subdued">Generating script…</Text>
                    </InlineStack>
                  )}

                  {scriptVariants?.length ? (
                    <BlockStack gap="200">
                      {scriptVariants.map((v, idx) => (
                        <Box key={idx} padding="300" background="bg-surface-secondary" borderRadius="200">
                          <BlockStack gap="150">
                            <Text as="p" variant="bodySm" tone="subdued">Variant {idx + 1}</Text>
                            <BlockStack gap="100">
                              <Text as="span" fontWeight="semibold">Hook:</Text>
                              <Text as="p">{v?.hook || '—'}</Text>
                            </BlockStack>
                            <BlockStack gap="100">
                              <Text as="span" fontWeight="semibold">Body:</Text>
                              <Text as="p">{v?.body || '—'}</Text>
                            </BlockStack>
                            <BlockStack gap="100">
                              <Text as="span" fontWeight="semibold">CTA:</Text>
                              <Text as="p">{v?.cta || '—'}</Text>
                            </BlockStack>
                          </BlockStack>
                        </Box>
                      ))}
                    </BlockStack>
                  ) : null}
                </BlockStack>
              </Card>
            )}
          </BlockStack>

          <div style={{ position: 'sticky', top: '24px' }}>
            <Card>
              <BlockStack gap="300">
                <BlockStack gap="050">
                  <Text as="h2" variant="headingMd">Create Planned Drafts</Text>
                  <Text as="p" tone="subdued">Push 3 drafts to Marketing (no video needed yet)</Text>
                </BlockStack>

                <Divider />

                {plannedError && (
                  <Banner tone="critical" title="Error">
                    <p>{plannedError}</p>
                  </Banner>
                )}

                {plannedIds.length > 0 && (
                  <Box padding="200" background="bg-surface-secondary" borderRadius="100">
                    <BlockStack gap="100">
                      <Text as="span" fontWeight="semibold">Created!</Text>
                      <Text as="p" tone="subdued" variant="bodySm">{plannedIds.join(', ')}</Text>
                    </BlockStack>
                  </Box>
                )}

                <BlockStack gap="100">
                  <Text as="p" variant="bodySm">
                    {selectedIdea ? `Selected: ${selectedIdea.title}` : 'Select an idea first'}
                  </Text>
                  {scriptVariants && <Text as="p" variant="bodySm" tone="subdued">Script ready ({scriptVariants.length} variants)</Text>}
                </BlockStack>

                <Button
                  variant="primary"
                  fullWidth
                  disabled={!selectedIdea || plannedBusy}
                  onClick={createPlannedDrafts}
                >
                  {plannedBusy ? 'Creating…' : 'Create 3 planned drafts'}
                </Button>

                <Button variant="secondary" fullWidth onClick={() => router.push('/marketing')}>
                  Go to Marketing
                </Button>
              </BlockStack>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
