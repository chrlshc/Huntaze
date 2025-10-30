# ⚖️ HUNTAZE - Conformité Légale et Technique

## 🚨 DÉCISIONS CRITIQUES - RÉSUMÉ EXÉCUTIF

### ❌ CE QU'ON NE PEUT PAS FAIRE

1. **OnlyFans - Pas d'envoi automatique de messages**
   - ❌ Bots qui répondent automatiquement = INTERDIT par OnlyFans ToS
   - ✅ Scraping et APIs non-officielles = Utilisés (risque assumé)
   - ✅ Solution: IA "human-in-the-loop" (suggestions uniquement, pas d'envoi auto)

2. **Azure OpenAI - Pas de chatbot érotique**
   - ❌ Chatbots érotiques/romantiques = INTERDIT par Microsoft
   - ✅ Solution: IA pour modération, idéation PG-13, CTA non-sexuels

3. **Stripe - Pas de vente de contenu adulte**
   - ❌ Vente de contenu adulte = INTERDIT par Stripe
   - ✅ Solution: Stripe uniquement pour abonnement SaaS Huntaze

4. **Instagram/TikTok - Contenu PG-13 uniquement**
   - ❌ Nudité/contenu explicite = INTERDIT
   - ✅ Solution: Teasers non-explicites, APIs officielles uniquement

5. **UK Online Safety Act - Pas de service pornographique**
   - ❌ Héberger/afficher contenu explicite public = Vérification d'âge requise
   - ✅ Solution: Pas de contenu explicite côté Huntaze, déléguer à OnlyFans

---

## 📋 TABLE DES MATIÈRES

1. [OnlyFans & Automatisation](#onlyfans--automatisation)
2. [Instagram/TikTok Marketing](#instagramtiktok-marketing)
3. [Paiements Stripe](#paiements-stripe)
4. [Azure OpenAI](#azure-openai)
5. [UK Online Safety Act](#uk-online-safety-act)
6. [Sécurité S3/CloudFront](#sécurité-s3cloudfront)
7. [Architecture de Conformité](#architecture-de-conformité)

---

## 🔴 1. OnlyFans & Automatisation

### Règles OnlyFans

**Source:** [Reuters - OnlyFans ToS](https://www.reuters.com/)

**Interdictions:**
- ❌ Bots automatiques dans la messagerie
- ❌ Réponses automatiques sans intervention humaine
- ❌ Automation de masse

**Approche Huntaze:**
- ✅ Scraping de données (pour synchronisation)
- ✅ APIs non-officielles (si nécessaire pour fonctionnalités)
- ⚠️ Risque assumé: Possible suspension si détecté

### ✅ Solution Huntaze: Human-in-the-Loop

**Architecture:**
```
Message OnlyFans reçu
         ↓
Huntaze analyse avec IA
         ↓
IA génère SUGGESTION de réponse
         ↓
Créateur VOIT la suggestion
         ↓
Créateur VALIDE/MODIFIE
         ↓
Créateur ENVOIE manuellement
```

**Implémentation:**
```typescript
// ❌ INTERDIT - Envoi automatique
async function autoReplyToFan(message: Message) {
  const reply = await ai.generateReply(message);
  await onlyfans.sendMessage(reply); // INTERDIT !
}

// ✅ AUTORISÉ - Suggestion avec validation humaine
async function suggestReplyToFan(message: Message) {
  const suggestion = await ai.generateReply(message);
  
  // Afficher la suggestion au créateur
  return {
    originalMessage: message,
    suggestedReply: suggestion,
    status: 'pending_human_approval',
    // Créateur doit cliquer "Envoyer" manuellement
  };
}
```

**UI/UX:**
```tsx
function MessageInbox() {
  const { messages, suggestions } = useMessages();

  return (
    <div>
      {messages.map(msg => (
        <MessageCard key={msg.id}>
          <div className="message">{msg.content}</div>
          
          {/* IA Suggestion */}
          <div className="ai-suggestion">
            <label>💡 Suggestion IA:</label>
            <textarea 
              value={suggestions[msg.id]} 
              onChange={handleEdit}
            />
            
            {/* Créateur DOIT cliquer pour envoyer */}
            <Button onClick={() => handleManualSend(msg.id)}>
              ✅ Valider et Envoyer
            </Button>
          </div>
        </MessageCard>
      ))}
    </div>
  );
}
```

**Documentation utilisateur:**
```markdown
⚠️ IMPORTANT: Conformité OnlyFans

Huntaze vous aide à rédiger vos messages, mais VOUS devez:
1. Lire chaque suggestion
2. Modifier si nécessaire
3. Cliquer "Envoyer" manuellement

Huntaze ne peut PAS envoyer de messages automatiquement.
C'est interdit par OnlyFans et pourrait entraîner la suspension de votre compte.

⚠️ NOTE TECHNIQUE:
Huntaze utilise le scraping pour synchroniser vos données OnlyFans.
Bien que non officiellement supporté par OnlyFans, c'est nécessaire
pour offrir nos fonctionnalités. Risque de suspension si détecté.
```

---

## 📱 2. Instagram/TikTok Marketing

### Instagram - APIs Officielles Uniquement

**Source:** [Facebook Developers](https://developers.facebook.com/)

**Règles:**
- ✅ Instagram Graph API (comptes professionnels)
- ✅ Messenger Platform (messaging avec auth)
- ❌ Scraping
- ❌ Auto-spam
- ❌ Contenu explicite

**Implémentation:**
```typescript
// Configuration Instagram API
const instagramConfig = {
  apiVersion: 'v18.0',
  permissions: [
    'instagram_basic',
    'instagram_content_publish',
    'pages_read_engagement',
    'pages_manage_posts',
  ],
  // Pas de permissions messaging sans revue Meta
};

// ✅ Publication de contenu PG-13
async function publishInstagramPost(content: Content) {
  // Vérifier que le contenu est PG-13
  const isCompliant = await moderateContent(content);
  
  if (!isCompliant) {
    throw new Error('Contenu non conforme Instagram (nudité détectée)');
  }
  
  // Publier via API officielle
  return await instagram.createMediaPost({
    image_url: content.imageUrl,
    caption: content.caption,
    // Pas de contenu explicite
  });
}
```

### TikTok - Content Posting API

**Source:** [TikTok for Developers](https://developers.tiktok.com/)

**Règles:**
- ✅ Content Posting API officiel
- ✅ Scopes: video.upload, video.publish
- ✅ Audit requis pour restrictions
- ❌ Contenu explicite

**Implémentation:**
```typescript
// Configuration TikTok API
const tiktokConfig = {
  apiVersion: 'v2',
  scopes: [
    'video.upload',
    'video.publish',
    'user.info.basic',
  ],
  // Audit Meta requis
};

// ✅ Upload vidéo PG-13
async function uploadTikTokVideo(video: Video) {
  // Modération automatique
  const isCompliant = await moderateVideo(video);
  
  if (!isCompliant) {
    throw new Error('Vidéo non conforme TikTok');
  }
  
  // Upload via API officielle
  return await tiktok.uploadVideo({
    video_url: video.url,
    caption: video.caption,
    privacy_level: 'PUBLIC_TO_EVERYONE',
  });
}
```

### Modération de Contenu

```typescript
// Service de modération automatique
class ContentModerationService {
  async moderateImage(imageUrl: string): Promise<ModerationResult> {
    // Utiliser Azure Content Moderator ou AWS Rekognition
    const result = await azureContentModerator.analyzeImage(imageUrl);
    
    return {
      isCompliant: !result.isAdultContent && !result.isRacyContent,
      categories: result.categories,
      confidence: result.confidence,
      reason: result.isAdultContent ? 'Nudité détectée' : null,
    };
  }
  
  async moderateVideo(videoUrl: string): Promise<ModerationResult> {
    // Analyser les frames clés
    const frames = await extractKeyFrames(videoUrl);
    const results = await Promise.all(
      frames.map(frame => this.moderateImage(frame))
    );
    
    return {
      isCompliant: results.every(r => r.isCompliant),
      frames: results,
    };
  }
}
```

---

## 💳 3. Paiements Stripe

### Règles Stripe

**Source:** [Stripe Prohibited Businesses](https://stripe.com/legal/restricted-businesses)

**Interdit:**
- ❌ Vente de contenu adulte
- ❌ Services pour adultes
- ❌ Marketplace de contenu adulte

**Autorisé:**
- ✅ Abonnement SaaS (Huntaze)
- ✅ Facturation B2B

### ✅ Solution: Séparation Stricte

**Architecture:**
```
HUNTAZE (SaaS Platform)
├── Stripe Account
│   └── Abonnements créateurs
│       ├── Plan Free: $0/mois
│       ├── Plan Pro: $29/mois
│       └── Plan Enterprise: $99/mois
│
ONLYFANS (Content Platform)
└── OnlyFans Payment System
    └── Revenus créateurs
        ├── Abonnements fans
        ├── PPV
        └── Tips
```

**Implémentation:**
```typescript
// ✅ AUTORISÉ - Abonnement SaaS Huntaze
async function createHuntazeSubscription(creator: Creator) {
  return await stripe.subscriptions.create({
    customer: creator.stripeCustomerId,
    items: [{
      price: 'price_huntaze_pro_monthly', // $29/mois
    }],
    metadata: {
      service: 'huntaze_saas',
      type: 'software_subscription',
      // PAS de contenu adulte
    },
  });
}

// ❌ INTERDIT - Ne JAMAIS faire ça
async function sellAdultContent(content: Content) {
  // NE PAS utiliser Stripe pour vendre du contenu adulte
  throw new Error('Utiliser OnlyFans pour la monétisation du contenu');
}
```

**Documentation légale:**
```markdown
## Séparation des Paiements

### Huntaze (via Stripe)
- Abonnement au logiciel Huntaze
- Facturation mensuelle/annuelle
- Services SaaS uniquement

### OnlyFans (via OnlyFans)
- Revenus du contenu créateur
- Abonnements fans
- PPV et tips
- Huntaze ne touche PAS ces paiements
```

---

**📖 Suite dans:** `HUNTAZE_COMPLIANCE_TECHNICAL.md`
