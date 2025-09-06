// Example: How to use Reddit automation with templates and rules

import { redditAutomation } from '@/lib/marketing/reddit-automation';
import { 
  getTemplateByNiche, 
  formatFirstComment, 
  buildUTMLink 
} from '@/lib/marketing/reddit-templates';
import { 
  findEasySubreddits, 
  validateRedditPost 
} from '@/lib/marketing/reddit-rules-loader';

// Example 1: Generate content for a specific niche
async function postForFitnessCreator() {
  const niche = 'fitness';
  const myOnlyFansLink = 'https://onlyfans.com/fitgirl123';
  const currentKarma = 250;
  
  // Find suitable subreddits based on karma
  const easySubreddits = findEasySubreddits(currentKarma);
  console.log('Subreddits you can post in:', easySubreddits);
  
  // Generate a safe title (English)
  const titleEN = redditAutomation.generateSafeTitle(niche);
  
  console.log('Generated title (EN):');
  console.log('EN:', titleEN);
  
  // Generate A/B test variations
  const variations = redditAutomation.generateTitleVariations(niche, 3);
  console.log('\nA/B test variations:', variations);
  
  // Choose a subreddit and validate the post
  const targetSub = 'FitGirls';
  const validation = validateRedditPost(targetSub, titleEN, {
    hasLink: false, // Links in first comment
    nsfw: true,
    accountAge: 90,
    karma: currentKarma
  });
  
  if (!validation.valid) {
    console.error('Post validation failed:', validation.errors);
    return;
  }
  
  // Generate first comment with UTM tracking
  const trackedLink = buildUTMLink(
    myOnlyFansLink,
    'reddit',
    'comment',
    targetSub.toLowerCase()
  );
  
  const firstComment = formatFirstComment(niche, trackedLink, targetSub);
  console.log('\nFirst comment:', firstComment);
  
  // Pre-flight check
  const preflightCheck = await redditAutomation.preflightCheck(targetSub, {
    title: titleEN,
    hasLink: false,
    hasMedia: true,
    nsfw: true
  });
  
  console.log('\nPre-flight check:');
  console.log('Can post:', preflightCheck.canPost);
  console.log('Risk level:', preflightCheck.risk);
  console.log('Warnings:', preflightCheck.warnings);
}

// Example 2: Content preview for Latina creator (EN only)
async function multiLanguageCampaign() {
  const niche = 'latina';
  
  // Get all templates for this niche
  const template = getTemplateByNiche(niche);
  if (!template) return;
  
  console.log('\nLatina creator campaign (EN):');
  console.log('Available tags:', template.tags);
  
  // Show a few examples in English
  console.log('\nEN Content:');
  console.log('Titles:', template.titles.slice(0, 3));
  console.log('First comment:', template.firstComments[0]);
}

// Example 3: Find best subreddits for a niche
async function findBestSubredditsForNiche() {
  const niche = 'cosplay';
  const currentKarma = 500;
  
  const suggestions = await redditAutomation.findBestSubreddits(niche, currentKarma);
  
  console.log('\nBest subreddits for cosplay creators:');
  suggestions.forEach(sub => {
    console.log(`- r/${sub.name}`);
    console.log(`  Subscribers: ${sub.subscribers.toLocaleString()}`);
    console.log(`  Difficulty: ${sub.difficulty}`);
    console.log(`  Avg upvotes: ${sub.avgUpvotes}`);
    console.log(`  Conversion rate: ${sub.conversionRate.toFixed(1)}%`);
  });
}

// Example 4: Batch generate content for week
async function generateWeeklyContent() {
  const niches = ['amateur', 'petite', 'goth'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  console.log('\nWeekly Reddit posting schedule:');
  
  daysOfWeek.forEach((day, index) => {
    const niche = niches[index % niches.length];
    const title = redditAutomation.generateSafeTitle(niche);
    
    console.log(`\n${day}:`);
    console.log(`  Niche: ${niche}`);
    console.log(`  Title: ${title}`);
    console.log(`  Best time: 10pm EST`);
  });
}

// Run examples
(async () => {
  console.log('=== Reddit Automation Examples ===\n');
  
  await postForFitnessCreator();
  await multiLanguageCampaign();
  await findBestSubredditsForNiche();
  await generateWeeklyContent();
})();

// Example output:
/*
=== Reddit Automation Examples ===

Subreddits you can post in: ['OnlyFansPromotions', 'NSFW_Social', 'thick', 'LatinasGW']
Generated titles:
EN: [F] Gym gains and more 💪
FR: [F] Séance terminée, temps de se détendre
ES: [F] Ganancias en el gym y más 💪

A/B test variations: [
  '[F] Gym gains and more 💪',
  '[F] Gains au gym et ailleurs 💪',
  '[F] Ganancias en el gym y más 💪'
]

First comment: Hey fit fam! 💪 Private workouts and more → https://onlyfans.com/fitgirl123?utm_source=reddit&utm_medium=comment&utm_campaign=fitgirls | Nutrition tips included!

Pre-flight check:
Can post: true
Risk level: 0.1
Warnings: ['VERIFICATION_REQUIRED: Complete before posting']

Latina creator campaign:
Available tags: ['latina', 'brazilian', 'colombian', 'mexican']

EN Content:
Titles: ['[F] Spicy Latina to spice up your day 🌶️', '[F] Straight from Brazil with love', '[F] Caliente and ready']
First comment: Hola papi! 🔥 Come taste the Latin flavor → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Very hot content!

ES Content:
Titles: ['[F] Latina picante para animar tu día 🌶️', '[F] Directo desde Brasil con amor', '[F] Caliente y lista']
First comment: Hola papi! 🔥 Ven a probar el sabor latino → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Contenido muy caliente!

FR Content:
Titles: ['[F] Latina épicée pour pimenter ta journée 🌶️', '[F] Directement du Brésil avec amour', '[F] Caliente et prête']
First comment: Hola papi! 🔥 Viens goûter à la saveur latine → {link}?utm_source=reddit&utm_medium=comment&utm_campaign={subreddit} | Contenu muy caliente!

Best subreddits for cosplay creators:
- r/altgonewild
  Subscribers: 234,567
  Difficulty: easy
  Avg upvotes: 234
  Conversion rate: 3.2%
...
*/
