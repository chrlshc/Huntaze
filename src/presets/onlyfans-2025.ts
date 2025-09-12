export type NicheId =
  | 'gfe'
  | 'softglam'
  | 'travel'
  | 'cosplay'
  | 'fitness'
  | 'dominatrix'
  | 'feet'
  | 'milf'
  | 'alt'
  | 'gamer'
  | 'couple';

export interface NichePreset {
  niche: NicheId;
  tone: 'flirty' | 'friendly' | 'professional' | 'casual' | 'playful';
  traits: string[];
  contentTypes: ('text' | 'voice' | 'photo' | 'video' | 'custom requests')[];
  price: string; // monthly sub price as string for UI
  ppvPriceBands?: string[];
  dmSequences: Record<'day1'|'day2'|'day3'|'day4'|'day5'|'day6'|'day7', string>;
  cadence: { postsPerWeek: number; storiesPerWeek: number; dmCheckinsPerDay: number };
  upsellMenu: { name: string; price: string; eta: string }[];
  freeVsPaidRatio?: string;
  platforms: { instagram: string; tiktok: string; reddit: string; onlyfans: string };
  kpis: { subConvRate: string; ppvAttachRate: string; monthlyChurn: string };
  complianceNotes: string[];
  confidence: 'high' | 'medium' | 'low';
}

export const presets: Record<NicheId, NichePreset> = {
  gfe: {
    niche: 'gfe',
    tone: 'flirty',
    traits: ['Affectionate','Caring','Intimate','Personal','Romantic'],
    contentTypes: ['text','voice','photo','video','custom requests'],
    price: '9.99',
    ppvPriceBands: ['$5–$12','$13–$25','$26–$50'],
    dmSequences: {
      day1: "Hey babe! 💕 Thanks for subscribing! I'm so excited you're here with me. Check your messages - I've got a little welcome surprise for you 😘",
      day2: "Good morning handsome 🌅 Hope you slept well thinking about me... I've been thinking about you too 💭 Want to see what I'm wearing today?",
      day3: "Missing you already baby 🥺 I filmed something special just for you last night... Should I send it? It's a little naughty 😈",
      day4: "You've been so sweet to me 💖 I want to do something special for YOU. What's your biggest fantasy? I might make it come true...",
      day5: "Halfway through the week and I can't stop thinking about our conversations 💕 You make me feel so special... Want a voice message?",
      day6: "Almost the weekend babe! 🎉 I'm planning something extra spicy for my favorite subscribers. Hope you're ready 🔥",
      day7: "One week together! 💕 You've made me so happy. I have a special offer just for you... interested in being my VIP? 👑",
    },
    cadence: { postsPerWeek: 5, storiesPerWeek: 10, dmCheckinsPerDay: 3 },
    upsellMenu: [
      { name: 'Good morning message', price: '$8', eta: 'same day' },
      { name: 'Girlfriend experience bundle', price: '$25', eta: '24h' },
      { name: 'Custom boyfriend roleplay', price: '$55', eta: '48h' },
    ],
    freeVsPaidRatio: 'Free 60% teasers / 40% GFE content behind paywall',
    platforms: {
      instagram: 'stories 2x/day, reels 4x/week girlfriend aesthetic',
      tiktok: 'couple trends, morning routines 3x/week',
      reddit: 'relationship advice subs, gfe communities 2x/week',
      onlyfans: 'daily check-ins + weekly date nights',
    },
    kpis: { subConvRate: '1.5–3%', ppvAttachRate: '35–55%', monthlyChurn: '15–20%' },
    complianceNotes: [
      'IG/TikTok: no explicit intimate content',
      'Reddit: SFW relationship advice only',
      'OF: emotional connection focus',
    ],
    confidence: 'high',
  },
  softglam: {
    niche: 'softglam',
    tone: 'friendly',
    traits: ['Elegant','Sophisticated','Aesthetic','Classy','Artistic'],
    contentTypes: ['photo','video','text','custom requests'],
    price: '7.99',
    ppvPriceBands: ['$3–$8','$9–$18','$19–$35'],
    dmSequences: {
      day1: 'Welcome beautiful! ✨ So happy to have you in my aesthetic space. I\'ve prepared something dreamy for you 🌸',
      day2: 'Good morning lovely 🌅 Starting my day with some soft lighting and thinking of content for you... What aesthetic speaks to you?',
      day3: "Creating magic today ✨ Just finished a golden hour shoot and the results are *chef's kiss* Want a preview? 📸",
      day4: "Your support means everything 💕 I'm curating something special - a behind-the-scenes aesthetic bundle. Interested?",
      day5: 'Soft vibes only today 🤍 Working on some dreamy content... Do you prefer natural light or moody shadows?',
      day6: "Weekend aesthetic loading... 🌙 I've got some ethereal content ready. Should I share the magic?",
      day7: "Week one complete! ✨ You've been amazing. Ready to upgrade to my VIP aesthetic experience? 👑",
    },
    cadence: { postsPerWeek: 4, storiesPerWeek: 7, dmCheckinsPerDay: 2 },
    upsellMenu: [
      { name: 'Aesthetic photo bundle', price: '$12', eta: '24h' },
      { name: 'Behind-the-scenes content', price: '$28', eta: '48h' },
      { name: 'Custom aesthetic shoot', price: '$65', eta: '72h' },
    ],
    freeVsPaidRatio: 'Free 70% aesthetic teasers / 30% premium content',
    platforms: {
      instagram: 'aesthetic reels 3x/week, photo carousels 2x/week',
      tiktok: 'aesthetic trends, get ready with me 4x/week',
      reddit: 'photography subs, aesthetic communities 2x/week',
      onlyfans: 'curated aesthetic feed + premium shoots',
    },
    kpis: { subConvRate: '1–2.5%', ppvAttachRate: '25–40%', monthlyChurn: '12–18%' },
    complianceNotes: [
      'IG/TikTok: focus on artistic value',
      'Reddit: photography communities',
      'OF: tasteful premium content',
    ],
    confidence: 'medium',
  },
  travel: {
    niche: 'travel',
    tone: 'casual',
    traits: ['Adventurous','Free-spirited','Cultured','Spontaneous','Worldly'],
    contentTypes: ['photo','video','text','voice'],
    price: '9.99',
    ppvPriceBands: ['$5–$12','$13–$25','$26–$45'],
    dmSequences: {
      day1: 'Welcome to my journey! ✈️ So excited to share my adventures with you. First stop: exclusive content just for you! 🌍',
      day2: 'Good morning from paradise! 🏖️ Waking up to amazing views and thinking about what content to create for you today...',
      day3: 'Adventure update! 🗺️ Just discovered this incredible hidden spot... Want to see what I discovered? It\'s worth the unlock 😉',
      day4: "Missing home but loving the journey with you! 💕 I've captured some intimate travel moments... Should I share them?",
      day5: 'Local culture is incredible! 🌸 Learning so much and feeling so free... Want to experience this freedom with me?',
      day6: 'Weekend wanderlust! 🌄 Planning something special for my travel companions. Ready for an exclusive adventure?',
      day7: 'One week of adventures together! 🗺️ You\'ve been the best travel buddy. Want to upgrade to VIP access? ✈️',
    },
    cadence: { postsPerWeek: 4, storiesPerWeek: 8, dmCheckinsPerDay: 2 },
    upsellMenu: [
      { name: 'Travel photo set', price: '$15', eta: '24h' },
      { name: 'Adventure video bundle', price: '$35', eta: '48h' },
      { name: 'Custom travel experience', price: '$75', eta: '72h' },
    ],
    freeVsPaidRatio: 'Free 65% travel teasers / 35% intimate travel content',
    platforms: {
      instagram: 'travel reels 3x/week, destination stories daily',
      tiktok: 'travel tips, adventure content 4x/week',
      reddit: 'travel subs, destination guides 3x/week',
      onlyfans: 'exclusive travel diaries + intimate adventures',
    },
    kpis: { subConvRate: '1.5–3%', ppvAttachRate: '30–45%', monthlyChurn: '15–22%' },
    complianceNotes: [
      'IG/TikTok: focus on destinations and culture',
      'Reddit: travel advice communities',
      'OF: intimate travel experiences',
    ],
    confidence: 'medium',
  },
  cosplay: {
    niche: 'cosplay',
    tone: 'playful',
    traits: ['Creative','Playful','Nerdy','Detailed','Fantasy-focused'],
    contentTypes: ['photo','video','custom requests','voice'],
    price: '15.00',
    ppvPriceBands: ['$8–$15','$16–$35','$36–$79'],
    dmSequences: {
      day1: 'Welcome to my fantasy world! ✨ So excited to have a new player in my realm. I\'ve got a special character introduction for you! 🎭',
      day2: 'Good morning adventurer! ⚔️ Working on a new cosplay today... Any character requests? I love bringing fantasies to life! 🌟',
      day3: 'Costume fitting day! 👗 This new outfit is... revealing. Want a behind-the-scenes peek at the magic? 🪄',
      day4: "You've been such a loyal fan! 💕 I'm creating a custom roleplay scenario... What's your favorite fantasy setting? 🏰",
      day5: 'Character development time! 📚 Studying my next role and getting into character... Want to be part of the story? ✨',
      day6: 'Weekend quest begins! 🗡️ I\'ve prepared an epic adventure for my VIP members. Ready to join the party? 🎲',
      day7: 'Level up time! 🆙 You\'ve completed week one! Ready for exclusive guild access with premium adventures? 👑',
    },
    cadence: { postsPerWeek: 5, storiesPerWeek: 8, dmCheckinsPerDay: 2 },
    upsellMenu: [
      { name: 'Cosplay photo set', price: '$18', eta: '24h' },
      { name: 'Roleplay video bundle', price: '$45', eta: '48h' },
      { name: 'Custom character creation', price: '$85', eta: '72h' },
    ],
    freeVsPaidRatio: 'Free 55% costume teasers / 45% full cosplay content',
    platforms: {
      instagram: 'cosplay reveals 3x/week, WIP stories daily',
      tiktok: 'transformation videos, cosplay trends 4x/week',
      reddit: 'cosplay communities, character subs 3x/week',
      onlyfans: 'complete transformations + roleplay scenarios',
    },
    kpis: { subConvRate: '2–4%', ppvAttachRate: '45–65%', monthlyChurn: '10–18%' },
    complianceNotes: [
      'IG/TikTok: focus on craftsmanship and transformation',
      'Reddit: cosplay communities only',
      'OF: fantasy roleplay content',
    ],
    confidence: 'high',
  },
  fitness: {
    niche: 'fitness',
    tone: 'professional',
    traits: ['Motivational','Strong','Dedicated','Healthy','Inspiring'],
    contentTypes: ['video','photo','text','custom requests'],
    price: '12.99',
    ppvPriceBands: ['$5–$12','$13–$28','$29–$55'],
    dmSequences: {
      day1: 'Welcome to the fitness family! 💪 Ready to start this journey together? I\'ve got a special welcome workout for you! 🏋️‍♀️',
      day2: 'Morning workout complete! ☀️ Feeling so energized... Want to see how I cool down? It gets a little steamy 😉 💦',
      day3: 'Leg day was intense! 🍑 My muscles are so pumped... Want to see the results? I\'ll show you my post-workout routine 🔥',
      day4: "Your support keeps me motivated! 💕 I'm creating a personalized workout plan... What are your fitness goals? 🎯",
      day5: 'Flexibility training today! 🤸‍♀️ Working on some advanced poses... These positions require dedication. Want to see? 😘',
      day6: 'Weekend warrior mode! ⚡ Planning an intense training session for my dedicated followers. Ready to sweat with me? 💦',
      day7: 'One week stronger! 💪 You\'ve been amazing support. Ready to unlock my VIP training program? It\'s... intensive 🔥',
    },
    cadence: { postsPerWeek: 6, storiesPerWeek: 10, dmCheckinsPerDay: 2 },
    upsellMenu: [
      { name: 'Workout video set', price: '$15', eta: '24h' },
      { name: 'Personal training bundle', price: '$40', eta: '48h' },
      { name: 'Custom fitness plan', price: '$75', eta: '72h' },
    ],
    freeVsPaidRatio: 'Free 60% workout teasers / 40% premium fitness content',
    platforms: {
      instagram: 'workout reels 4x/week, progress posts 2x/week',
      tiktok: 'fitness tips, transformation content 5x/week',
      reddit: 'fitness subs, workout communities 3x/week',
      onlyfans: 'complete workouts + recovery sessions',
    },
    kpis: { subConvRate: '2–3.5%', ppvAttachRate: '30–50%', monthlyChurn: '12–20%' },
    complianceNotes: [
      'IG/TikTok: focus on actual fitness value',
      'Reddit: fitness communities and progress',
      'OF: premium workout content',
    ],
    confidence: 'high',
  },
  dominatrix: {
    niche: 'dominatrix',
    tone: 'professional',
    traits: ['Dominant','Confident','Commanding','Experienced','Strict'],
    contentTypes: ['video','photo','text','voice','custom requests'],
    price: '19.99',
    ppvPriceBands: ['$15–$25','$26–$55','$56–$150'],
    dmSequences: {
      day1: 'Welcome, pet. You\'ve entered my domain now. Read my rules carefully - I expect complete obedience. Your first task awaits. 👑',
      day2: "Good morning, slave. I trust you've been thinking about yesterday's commands? Time for your daily training session. Are you ready to serve?",
      day3: "Your dedication hasn't gone unnoticed. I have something... special planned for devoted subs like you. But it comes with a price. 💰",
      day4: 'Impressive submission so far. I\'m considering you for my inner circle... but first, you must prove your worthiness through tribute.',
      day5: 'Midweek check-in, pet. How are you handling my training? I have some advanced techniques to share with my best students... 🔗',
      day6: 'Weekend punishment protocols activate. I\'ve prepared an intensive session for my dedicated subs. Think you can handle it? ⛓️',
      day7: 'One week of service complete. You\'ve shown potential. Ready to advance to my VIP dungeon program? The real training begins now. 🏴‍☠️',
    },
    cadence: { postsPerWeek: 4, storiesPerWeek: 6, dmCheckinsPerDay: 3 },
    upsellMenu: [
      { name: 'Training task video', price: '$25', eta: '24h' },
      { name: 'Domination session bundle', price: '$75', eta: '48h' },
      { name: 'Custom punishment scenario', price: '$150', eta: '72h' },
    ],
    freeVsPaidRatio: 'Free 40% tease content / 60% premium domination content',
    platforms: {
      instagram: 'aesthetic power poses, lifestyle 2x/week',
      tiktok: 'confidence content, power themes 2x/week',
      reddit: 'BDSM education subs, lifestyle communities 2x/week',
      onlyfans: 'full domination content + personal training',
    },
    kpis: { subConvRate: '3–5%', ppvAttachRate: '55–75%', monthlyChurn: '8–15%' },
    complianceNotes: [
      'IG/TikTok: lifestyle and confidence only',
      'Reddit: education and safe practices',
      'OF: consensual BDSM content only',
    ],
    confidence: 'medium',
  },
  feet: {
    niche: 'feet',
    tone: 'flirty',
    traits: ['Teasing','Sensual','Detail-focused','Fetish-aware','Artistic'],
    contentTypes: ['photo','video','custom requests','voice'],
    price: '9.99',
    ppvPriceBands: ['$3–$8','$9–$20','$21–$45'],
    dmSequences: {
      day1: 'Welcome, foot lover! 👣 So happy you appreciate the finer details... I\'ve got something soft and pretty for you to start with 💕',
      day2: 'Good morning! Just finished my pedicure... the color is so pretty! Want to see how they look? Fresh and soft for you 💅',
      day3: 'Leg day at the gym! My legs are so toned and smooth now... Want to see the results? I think you\'ll appreciate them 🦵✨',
      day4: "You've been such a sweet admirer! I'm thinking of doing a custom pose just for you... Any special requests? 👠",
      day5: 'Barefoot and beautiful today! The lighting is perfect for some artistic shots... Should I share my favorites with you? 📸',
      day6: 'Weekend relaxation time! My feet deserve some pampering... Want to watch me take care of them? It\'s quite the show 🛁',
      day7: 'One week of appreciation! You clearly have excellent taste 😘 Ready for VIP access to my exclusive collection? 👑',
    },
    cadence: { postsPerWeek: 4, storiesPerWeek: 7, dmCheckinsPerDay: 2 },
    upsellMenu: [
      { name: 'Feet photo set', price: '$12', eta: '24h' },
      { name: 'Leg worship video', price: '$25', eta: '48h' },
      { name: 'Custom pose request', price: '$45', eta: '48h' },
    ],
    freeVsPaidRatio: 'Free 75% tease content / 25% premium detailed content',
    platforms: {
      instagram: 'aesthetic shots, pedicure content 3x/week',
      tiktok: 'shoe collections, self-care 3x/week',
      reddit: 'feet appreciation subs, artistic communities 4x/week',
      onlyfans: 'detailed photography + custom content',
    },
    kpis: { subConvRate: '1–2.5%', ppvAttachRate: '25–45%', monthlyChurn: '18–25%' },
    complianceNotes: [
      'IG/TikTok: artistic and self-care focus',
      'Reddit: appreciation communities only',
      'OF: detailed fetish content',
    ],
    confidence: 'medium',
  },
  milf: {
    niche: 'milf',
    tone: 'friendly',
    traits: ['Mature','Experienced','Nurturing','Confident','Sophisticated'],
    contentTypes: ['photo','video','text','voice','custom requests'],
    price: '19.99',
    ppvPriceBands: ['$10–$20','$21–$40','$41–$85'],
    dmSequences: {
      day1: "Hello sweetie! 💕 Mom's so happy you're here with me. I've prepared something special to welcome you to the family... 😘",
      day2: "Good morning honey! Just getting out of bed... my hair's a mess but I thought you might like this natural look 🌅",
      day3: "The house is so quiet today... gives mommy time to think about naughty things... Want to know what's on my mind? 😉",
      day4: "You've been such a good boy this week! Mommy wants to reward you... I have some very special treats in mind 🍯",
      day5: 'Feeling so maternal today... there\'s something about taking care of my boys that makes me feel alive 💖',
      day6: 'Weekend plans: just me, some wine, and quality time with my favorite subscribers... Care to join mommy? 🍷',
      day7: 'One week with mommy! You\'ve been perfect, darling. Ready for some exclusive family time? VIP access awaits... 👑',
    },
    cadence: { postsPerWeek: 4, storiesPerWeek: 6, dmCheckinsPerDay: 3 },
    upsellMenu: [
      { name: "Mommy's morning routine", price: '$18', eta: '24h' },
      { name: 'Nurturing experience bundle', price: '$50', eta: '48h' },
      { name: 'Custom mommy roleplay', price: '$95', eta: '72h' },
    ],
    freeVsPaidRatio: 'Free 50% lifestyle content / 50% mature premium content',
    platforms: {
      instagram: 'lifestyle, mature aesthetic 2x/week',
      tiktok: 'mom life, confidence content 3x/week',
      reddit: 'mature communities, lifestyle subs 2x/week',
      onlyfans: 'mature experience + nurturing roleplay',
    },
    kpis: { subConvRate: '2.5–4.5%', ppvAttachRate: '40–60%', monthlyChurn: '10–18%' },
    complianceNotes: [
      'IG/TikTok: mature lifestyle focus',
      'Reddit: age-appropriate communities',
      'OF: mature audience content',
    ],
    confidence: 'high',
  },
  alt: {
    niche: 'alt',
    tone: 'casual',
    traits: ['Alternative','Edgy','Artistic','Independent','Dark-aesthetic'],
    contentTypes: ['photo','video','text','custom requests'],
    price: '14.99',
    ppvPriceBands: ['$8–$15','$16–$30','$31–$65'],
    dmSequences: {
      day1: 'Welcome to the dark side... 🖤 Glad you appreciate the aesthetic. I\'ve got something beautifully twisted for you to start with ⚰️',
      day2: 'Morning ritual complete... candles, music, and dark thoughts 🕯️ Want to see what inspires my darkness today?',
      day3: "Shooting new content in my favorite cemetery... the atmosphere is perfect for what I have in mind 💀 Interested in the results?",
      day4: 'Your support feeds my dark soul 🖤 I\'m creating something exclusively twisted... What darkness calls to you? 🌙',
      day5: "Black lace and moonlight... the perfect combination for tonight's shoot. My shadows are calling your name 👻",
      day6: 'Weekend séance with my inner circle... the spirits have whispered some very interesting requests 🔮 Want to hear them?',
      day7: 'One week in the coven! 🖤 You\'ve proven yourself worthy... Ready to join my inner circle of darkness? 🌑',
    },
    cadence: { postsPerWeek: 4, storiesPerWeek: 8, dmCheckinsPerDay: 2 },
    upsellMenu: [
      { name: 'Dark aesthetic set', price: '$16', eta: '24h' },
      { name: 'Gothic experience bundle', price: '$38', eta: '48h' },
      { name: 'Custom dark fantasy', price: '$75', eta: '72h' },
    ],
    freeVsPaidRatio: 'Free 65% aesthetic tease / 35% dark premium content',
    platforms: {
      instagram: 'gothic aesthetic, alternative fashion 3x/week',
      tiktok: 'alt fashion, makeup tutorials 4x/week',
      reddit: 'goth communities, alternative lifestyle 3x/week',
      onlyfans: 'complete dark aesthetic + intimate gothic content',
    },
    kpis: { subConvRate: '2–4%', ppvAttachRate: '35–55%', monthlyChurn: '12–20%' },
    complianceNotes: [
      'IG/TikTok: focus on fashion and artistic aesthetic',
      'Reddit: alternative communities',
      'OF: dark themed content',
    ],
    confidence: 'medium',
  },
  gamer: {
    niche: 'gamer',
    tone: 'casual',
    traits: ['Nerdy','Competitive','Tech-savvy','Playful','Skilled'],
    contentTypes: ['video','photo','text','voice','custom requests'],
    price: '35.00',
    ppvPriceBands: ['$10–$20','$21–$40','$41–$80'],
    dmSequences: {
      day1: 'Player 2 has joined! 🎮 Welcome to my gaming den... I\'ve got an exclusive gameplay session just for you. Ready to play? ⚡',
      day2: 'Morning gaming session loading... ☀️ My setup is ready and I\'m feeling competitive. Want to see how I warm up? 😉🕹️',
      day3: 'Boss battle complete! 🏆 Celebrating with some victory content... these wins always make me feel so... energized 💦',
      day4: "You've been an amazing co-op partner! 💕 I'm working on some custom gameplay for my favorite players... What's your request? 🎯",
      day5: 'New game dropped and I\'m learning the controls... some positions are quite challenging 😉 Want to help me practice?',
      day6: 'Weekend raid planned with my VIP guild members! ⚔️ Epic loot and exclusive content await... Ready to join the party? 🎉',
      day7: 'Achievement unlocked: One week gaming together! 🏅 You\'ve proven yourself worthy of my legendary tier access... Interested? 👑',
    },
    cadence: { postsPerWeek: 5, storiesPerWeek: 10, dmCheckinsPerDay: 2 },
    upsellMenu: [
      { name: 'Gaming setup tour', price: '$22', eta: '24h' },
      { name: 'Victory celebration bundle', price: '$55', eta: '48h' },
      { name: 'Custom gaming roleplay', price: '$120', eta: '72h' },
    ],
    freeVsPaidRatio: 'Free 55% gaming content / 45% exclusive gaming experience',
    platforms: {
      instagram: 'gaming setup, achievement posts 3x/week',
      tiktok: 'gaming tips, reaction content 5x/week',
      reddit: 'gaming subs, tech communities 4x/week',
      onlyfans: 'exclusive gaming sessions + celebration content',
    },
    kpis: { subConvRate: '3–6%', ppvAttachRate: '45–65%', monthlyChurn: '8–15%' },
    complianceNotes: [
      'IG/TikTok: actual gaming content and skills',
      'Reddit: gaming communities and reviews',
      'OF: gaming-themed premium content',
    ],
    confidence: 'high',
  },
  couple: {
    niche: 'couple',
    tone: 'friendly',
    traits: ['Intimate','Authentic','Passionate','Connected','Real'],
    contentTypes: ['video','photo','text','voice','custom requests'],
    price: '14.99',
    ppvPriceBands: ['$8–$18','$19–$35','$36–$75'],
    dmSequences: {
      day1: 'Welcome to our love story! 💕 We\'re so excited to share our intimate journey with you. Check out our welcome surprise! 👫',
      day2: 'Good morning from both of us! ☀️ Just waking up together and feeling so connected... Want to see our morning routine? 😘',
      day3: 'Date night was incredible... 🌙 The chemistry between us was off the charts. Should we share what happened after? 😉',
      day4: "You've been amazing support for our relationship! 💖 We're planning something special for our favorite fans... Any requests? 💑",
      day5: 'Couple\'s workout session complete! 💪 We love staying fit together... our cooldown routine gets quite steamy 💦',
      day6: 'Weekend plans: just us, privacy, and all the time in the world... 🏠 Want to be part of our intimate weekend? 😉',
      day7: 'One week sharing our love with you! 💕 You\'ve been incredible. Ready for VIP access to our most intimate moments? 👑',
    },
    cadence: { postsPerWeek: 4, storiesPerWeek: 8, dmCheckinsPerDay: 2 },
    upsellMenu: [
      { name: "Couple's photo set", price: '$20', eta: '24h' },
      { name: 'Intimate moments bundle', price: '$45', eta: '48h' },
      { name: 'Custom couple experience', price: '$85', eta: '72h' },
    ],
    freeVsPaidRatio: 'Free 60% relationship content / 40% intimate couple content',
    platforms: {
      instagram: 'couple goals, relationship content 3x/week',
      tiktok: 'couple trends, relationship tips 4x/week',
      reddit: 'relationship subs, couple communities 2x/week',
      onlyfans: 'authentic intimate couple content',
    },
    kpis: { subConvRate: '2.5–4%', ppvAttachRate: '35–55%', monthlyChurn: '12–18%' },
    complianceNotes: [
      'IG/TikTok: relationship goals and lifestyle',
      'Reddit: relationship advice communities',
      'OF: authentic couple intimacy',
    ],
    confidence: 'medium',
  },
};

