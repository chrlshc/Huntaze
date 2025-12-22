import { PrismaClient } from '@prisma/client';
import { knowledgeService } from '../src/lib/knowledge/service';

// Type definitions until we run the migration
type KnowledgeKind = 'CHAT_CLOSER_PLAY' | 'VIRAL_STRUCTURE' | 'EDITING_RULESET' | 'ANALYTICS_PLAYBOOK' | 'TREND_TEMPLATE';
type KnowledgeSource = 'USER_HISTORY' | 'CURATED' | 'IMPORTED' | 'PARTNER_DATA';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Knowledge Base...');

  // Clear existing knowledge items
  await prisma.$executeRaw`TRUNCATE TABLE "KnowledgeBaseItem" CASCADE;`;

  // 1. Chat Closer Plays
  console.log('Adding Chat Closer Plays...');
  await knowledgeService.addChatCloserPlay({
    creatorId: 1, // Assuming user with ID 1 exists
    fanMessage: "how much for a custom video?",
    creatorReply: "Hey! Custom videos start at $50 for 5 minutes. I can make it extra special just for you 💕 Want me to tell you what I include?",
    outcome: {
      revenue: 50,
      conversion: true,
      platform: 'onlyfans',
    },
    niche: 'lifestyle',
  });

  await knowledgeService.addChatCloserPlay({
    creatorId: 1,
    fanMessage: "do you do foot content?",
    creatorReply: "I do! My foot content is some of my most popular 🦶 I have a special package this week - 10 custom photos for $30. Sound good?",
    outcome: {
      revenue: 30,
      conversion: true,
      platform: 'onlyfans',
    },
    niche: 'lifestyle',
  });

  await knowledgeService.addChatCloserPlay({
    creatorId: 1,
    fanMessage: "can i get a free preview?",
    creatorReply: "I'd love to show you what you're getting! Check my free posts for teasers, then unlock the full experience in my DMs 😏 Trust me, it's worth it",
    outcome: {
      revenue: 0,
      conversion: false,
      platform: 'onlyfans',
    },
    niche: 'lifestyle',
  });

  // 2. Viral Structures
  console.log('Adding Viral Structures...');
  await knowledgeService.addViralStructure({
    creatorId: 1,
    transcript: "Stop scrolling if you love coffee as much as I do ☕ This morning routine changed my life. First, I grind fresh beans... then I add oat milk... and finally... the perfect foam art. Comment 'COFFEE' for part 2!",
    metrics: {
      views: 125000,
      likes: 8500,
      shares: 1200,
      comments: 3400,
      retention: [0.95, 0.88, 0.82, 0.75, 0.68, 0.60],
    },
    metadata: {
      platform: 'tiktok',
      niche: 'lifestyle',
      duration: 15,
      hook: "Stop scrolling if you love coffee as much as I do ☕",
      cta: "Comment 'COFFEE' for part 2!",
    },
  });

  await knowledgeService.addViralStructure({
    creatorId: 1,
    transcript: "POV: You just got home from the gym 🏋️‍♀️ Watch me transform from workout mode to glam in 30 seconds... 1... 2... 3... ✨ Who else loves a good glow up?",
    metrics: {
      views: 89000,
      likes: 6200,
      shares: 890,
      comments: 2100,
      retention: [0.92, 0.85, 0.78, 0.70, 0.65],
    },
    metadata: {
      platform: 'tiktok',
      niche: 'fitness',
      duration: 12,
      hook: "POV: You just got home from the gym 🏋️‍♀️",
      cta: "Who else loves a good glow up?",
    },
  });

  // 3. Editing Rulesets
  console.log('Adding Editing Rulesets...');
  await knowledgeService.addEditingRuleset({
    contentType: 'lifestyle_vlog',
    rules: {
      maxShotLength: 3,
      cutSilencesThreshold: 0.5,
      captionStyle: 'clean_white',
      pacing: 1.2,
      punchInCadence: 8,
    },
    performance: {
      retention: 0.75,
      completion: 0.82,
      engagement: 0.068,
    },
    platform: 'tiktok',
  });

  await knowledgeService.addEditingRuleset({
    contentType: 'fitness_demo',
    rules: {
      maxShotLength: 2,
      cutSilencesThreshold: 0.3,
      captionStyle: 'bold_yellow',
      pacing: 1.5,
      punchInCadence: 5,
    },
    performance: {
      retention: 0.82,
      completion: 0.78,
      engagement: 0.089,
    },
    platform: 'instagram',
  });

  // 4. Analytics Playbooks
  console.log('Adding Analytics Playbooks...');
  await knowledgeService.addAnalyticsPlaybook({
    creatorId: 1,
    situation: "Revenue dropped 30% this week",
    action: "Send limited-time 20% discount to top 10% fans + post urgency content",
    outcome: {
      revenueChange: 45,
      engagementChange: 25,
      retentionChange: 10,
    },
    timeframe: "3 days",
    conditions: ["revenue_drop > 20%", "month_end"],
  });

  await knowledgeService.addAnalyticsPlaybook({
    creatorId: 1,
    situation: "New follower growth slowed down",
    action: "Post 3 viral-style videos with trending audio + run follower growth campaign",
    outcome: {
      revenueChange: 15,
      engagementChange: 60,
      retentionChange: 5,
    },
    timeframe: "7 days",
    conditions: ["follower_growth < 2%", "content_frequency < 3/week"],
  });

  // 5. Trend Templates
  console.log('Adding Trend Templates...');
  await knowledgeService.addTrendTemplate({
    trendName: "Glow Up Transition",
    structure: {
      hook: "Wait for the drop... ✨",
      body: [
        "Before shot (casual)",
        "Hand over camera",
        "Dramatic transition",
        "After shot (glam)",
        "Confident pose",
      ],
      cta: "Your turn! Show me your glow up",
      duration: 10,
    },
    examples: [
      "Morning routine glow up",
      "Workout to glam",
      "Casual to date night",
    ],
    niche: 'lifestyle',
    platform: 'tiktok',
    source: 'CURATED',
  });

  await knowledgeService.addTrendTemplate({
    trendName: "3 Tips Format",
    structure: {
      hook: "3 tips that changed my life forever:",
      body: [
        "Tip 1 with text overlay",
        "Tip 2 with demo",
        "Tip 3 with result",
      ],
      cta: "Which tip was your favorite? 1, 2, or 3?",
      duration: 20,
    },
    examples: [
      "3 fitness tips",
      "3 skincare secrets",
      "3 productivity hacks",
    ],
    niche: 'fitness',
    platform: 'instagram',
    source: 'CURATED',
  });

  // 6. Partner Data (simulated)
  console.log('Adding Partner Data...');
  await knowledgeService.addViralStructure({
    creatorId: undefined, // Global knowledge
    transcript: "Here's why you're not making money on OF... You're missing these 3 things. 1: Consistency. 2: Engagement. 3: Premium content. Want the full breakdown?",
    metrics: {
      views: 450000,
      likes: 28000,
      shares: 4200,
      comments: 8900,
      retention: [0.94, 0.89, 0.84, 0.79, 0.74, 0.69],
    },
    metadata: {
      platform: 'tiktok',
      niche: 'business',
      duration: 18,
      hook: "Here's why you're not making money on OF...",
      cta: "Want the full breakdown?",
    },
  });

  console.log('✅ Knowledge Base seeded successfully!');
  console.log('\n📊 Summary:');
  const counts = await prisma.$queryRaw<Array<{ kind: string; _count: bigint }>>`
    SELECT kind, COUNT(*) as _count 
    FROM "KnowledgeBaseItem" 
    GROUP BY kind
  `;
  
  counts.forEach((count: any) => {
    console.log(`  ${count.kind}: ${count._count} items`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding knowledge base:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
