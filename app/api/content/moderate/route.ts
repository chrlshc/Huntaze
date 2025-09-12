import { NextRequest, NextResponse } from 'next/server';
import { contentModeration } from '@/src/services/content-moderation';

// Simple rule-sets for text compliance checks
const complianceRules = {
  instagram: {
    flaggedTerms: ['onlyfans', 'link in bio', 'dm me', 'cashapp', 'venmo'],
    dangerPatterns: [/\b(nude|naked|sex)\b/i, /\b(buy|sell|purchase)\b/i],
    riskyEmojis: ['🍆', '🍑', '💦', '🔞'],
  },
  tiktok: {
    flaggedTerms: ['onlyfans', 'link', 'dm', '18+', 'adult'],
    dangerPatterns: [/\b(spicy|naughty|dirty)\b/i],
    riskyEmojis: ['🔞', '💦', '🔥'],
  },
  reddit: {
    flaggedTerms: ['direct promotion', 'vote manipulation'],
    dangerPatterns: [/\b(upvote|karma)\b/i],
    riskyEmojis: [] as string[],
  },
};

type PlatformKey = keyof typeof complianceRules | 'onlyfans' | 'threads';

function checkPlatformCompliance(content: string, platform: PlatformKey, rules: any) {
  const risks: any[] = [];
  const lower = content.toLowerCase();

  if (rules?.flaggedTerms) {
    for (const term of rules.flaggedTerms) {
      if (lower.includes(term)) {
        risks.push({
          platform,
          severity: 'medium',
          issue: `Contains flagged term: "${term}"`,
          suggestion: `Remove or rephrase "${term}" for ${platform}`,
        });
      }
    }
  }

  if (rules?.dangerPatterns) {
    for (const pattern of rules.dangerPatterns) {
      if (pattern.test(content)) {
        risks.push({
          platform,
          severity: 'high',
          issue: 'Contains high-risk content pattern',
          suggestion: `Rephrase to avoid explicit language for ${platform}`,
        });
      }
    }
  }

  if (rules?.riskyEmojis) {
    for (const emoji of rules.riskyEmojis) {
      if (content.includes(emoji)) {
        risks.push({
          platform,
          severity: 'medium',
          issue: `Contains risky emoji: ${emoji}`,
          suggestion: `Replace with safer emojis for ${platform}`,
        });
      }
    }
  }

  return risks;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value || 'dev-user';
    const payload = await request.json();

    // Branch 1: Text compliance check
    if (payload?.content) {
      const content: string = payload.content || '';
      const platforms: PlatformKey[] = ['instagram', 'tiktok', 'reddit', 'onlyfans'];
      const risks: any[] = [];
      const platformStatus: Record<string, 'safe' | 'warning' | 'danger'> = {
        instagram: 'safe',
        tiktok: 'safe',
        reddit: 'safe',
        onlyfans: 'safe',
      };

      // Instagram and TikTok rules
      ['instagram', 'tiktok'].forEach((p) => {
        const r = checkPlatformCompliance(content, p as PlatformKey, (complianceRules as any)[p]);
        if (r.length) {
          risks.push(...r);
          platformStatus[p] = r.some((x) => x.severity === 'high') ? 'danger' : 'warning';
        }
      });

      // Reddit specific
      const rRisks = checkPlatformCompliance(content, 'reddit', complianceRules.reddit);
      if (rRisks.length) {
        risks.push(...rRisks);
        platformStatus.reddit = rRisks.some((x) => x.severity === 'high') ? 'danger' : 'warning';
      }

      // OnlyFans baseline: allow text, generally safe in this context
      platformStatus.onlyfans = 'safe';

      const overall = risks.some((r) => r.severity === 'high')
        ? 'danger'
        : risks.some((r) => r.severity === 'medium')
        ? 'warning'
        : 'safe';

      return NextResponse.json({ overall, risks, platforms: platformStatus });
    }

    // Branch 2: Existing image moderation flows
    const { imageUrl, platform, subreddit, checkCrossPlatform } = payload || {};
    if (!imageUrl || !platform) {
      return NextResponse.json({ error: 'Missing required fields: imageUrl, platform' }, { status: 400 });
    }

    if (!checkCrossPlatform) {
      const result = await contentModeration.checkImage(imageUrl, platform, subreddit);
      return NextResponse.json(result);
    }

    const xPlatforms: PlatformKey[] = ['instagram', 'tiktok', 'reddit', 'threads', 'onlyfans'];
    const results = await contentModeration.checkCrossPosting(
      imageUrl,
      platform,
      xPlatforms.filter((p) => p !== platform)
    );

    const summary = {
      safeForAll: Object.values(results).every((r: any) => r.safe),
      safePlatforms: Object.entries(results)
        .filter(([, result]: any) => result.safe)
        .map(([platform]) => platform),
      unsafePlatforms: Object.entries(results)
        .filter(([, result]: any) => !result.safe)
        .map(([platform]) => platform),
      recommendations: [] as string[],
    };

    Object.values(results).forEach((result: any) => {
      if (result.recommendations) summary.recommendations.push(...result.recommendations);
    });
    summary.recommendations = [...new Set(summary.recommendations)];

    return NextResponse.json({ results, summary, message: summary.safeForAll ? 'Content is safe for all platforms' : `Content is safe for: ${summary.safePlatforms.join(', ')}` });

  } catch (error: any) {
    console.error('Content moderation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to moderate content' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('access_token')?.value || request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { images, maxConcurrent = 5 } = await request.json();

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ 
        error: 'Missing required field: images (array)' 
      }, { status: 400 });
    }

    // Batch moderation
    const results = await contentModeration.checkBatch(images, maxConcurrent);

    // Summary statistics
    const stats = {
      total: results.length,
      safe: results.filter(r => r.safe).length,
      unsafe: results.filter(r => !r.safe).length,
      byPlatform: {} as Record<string, { safe: number; unsafe: number }>
    };

    // Calculate per-platform stats
    results.forEach(result => {
      if (!stats.byPlatform[result.platform]) {
        stats.byPlatform[result.platform] = { safe: 0, unsafe: 0 };
      }
      if (result.safe) {
        stats.byPlatform[result.platform].safe++;
      } else {
        stats.byPlatform[result.platform].unsafe++;
      }
    });

    return NextResponse.json({ results, stats });

  } catch (error: any) {
    console.error('Batch moderation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to moderate batch' 
    }, { status: 500 });
  }
}
