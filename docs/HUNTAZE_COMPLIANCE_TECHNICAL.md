# 🔒 HUNTAZE - Conformité Technique

## 📋 TABLE DES MATIÈRES

1. [Azure OpenAI - Restrictions](#azure-openai---restrictions)
2. [UK Online Safety Act](#uk-online-safety-act)
3. [Sécurité S3/CloudFront](#sécurité-s3cloudfront)
4. [Architecture de Conformité](#architecture-de-conformité)
5. [Checklist de Conformité](#checklist-de-conformité)

---

## 🤖 1. Azure OpenAI - Restrictions

### Règles Microsoft

**Source:** [Microsoft Learn - Code of Conduct](https://learn.microsoft.com/azure/ai-services/openai/concepts/code-of-conduct)

**Interdit:**
- ❌ Chatbots érotiques/romantiques
- ❌ Génération de contenu sexuel explicite
- ❌ Contournement des filtres de contenu

**Autorisé:**
- ✅ Modération de contenu
- ✅ Summarization
- ✅ Idéation PG-13
- ✅ CTA non-sexuels
- ✅ Structuration de texte

### ✅ Solution: Usage Conforme

**Cas d'usage autorisés:**
```typescript
// ✅ AUTORISÉ - Idéation de contenu marketing PG-13
async function generateMarketingIdeas(profile: CreatorProfile) {
  const prompt = `
    Génère 5 idées de posts Instagram pour promouvoir un compte OnlyFans.
    
    Contraintes:
    - Contenu PG-13 (pas de nudité, pas explicite)
    - Focus sur la personnalité et le lifestyle
    - Call-to-action subtil
    - Conforme aux règles Instagram
    
    Profil: ${profile.niche}
  `;
  
  return await azureOpenAI.generateText(prompt);
}

// ✅ AUTORISÉ - Structuration de message
async function improveMessageStructure(message: string) {
  const prompt = `
    Améliore la structure de ce message pour le rendre plus engageant.
    Garde le ton professionnel et amical.
    
    Message: ${message}
  `;
  
  return await azureOpenAI.generateText(prompt);
}

// ✅ AUTORISÉ - Modération de contenu
async function moderateContent(content: string) {
  return await azureOpenAI.moderateContent(content);
}
```

**Cas d'usage interdits:**
```typescript
// ❌ INTERDIT - Chatbot érotique
async function generateEroticMessage(context: any) {
  // NE PAS FAIRE - Violation Microsoft ToS
  throw new Error('Chatbot érotique interdit par Azure OpenAI');
}

// ❌ INTERDIT - Contenu sexuel explicite
async function generateExplicitContent(prompt: string) {
  // NE PAS FAIRE - Violation Microsoft ToS
  throw new Error('Contenu explicite interdit par Azure OpenAI');
}
```

### Alternative pour Contenu Adulte

**Si besoin d'IA pour contenu adulte:**
```typescript
// Option 1: Fournisseur alternatif (avec KYC et garde-fous)
const adultContentAI = {
  provider: 'alternative-ai-provider', // Pas Azure
  requiresKYC: true,
  ageVerification: true,
  consentRequired: true,
};

// Option 2: Pas d'IA pour contenu adulte
// Créateur écrit manuellement le contenu explicite
```

---

## 🇬🇧 2. UK Online Safety Act

### Règles Ofcom

**Source:** [Ofcom UK](https://www.ofcom.org.uk/)

**Obligation:**
- Services qui "permettent la pornographie" doivent:
  - ✅ Vérification d'âge "hautement efficace"
  - ✅ Application dès 2025
  - ✅ Conformité Ofcom

### ✅ Solution: Pas de Contenu Explicite Public

**Architecture:**
```
HUNTAZE PLATFORM
├── Contenu Public: AUCUN contenu explicite
│   ├── Landing pages: PG-13
│   ├── Marketing: PG-13
│   └── Documentation: PG-13
│
├── Contenu Privé (S3): Pas affiché publiquement
│   ├── Bibliothèque créateur (privée)
│   ├── URLs signées (temporaires)
│   └── Accès authentifié uniquement
│
└── Contenu Explicite: Délégué à OnlyFans
    └── OnlyFans gère la vérification d'âge
```

**Implémentation:**
```typescript
// ✅ Pas de contenu explicite public
class ContentService {
  async uploadContent(file: File, creator: Creator) {
    // Modération automatique
    const moderation = await moderateContent(file);
    
    if (moderation.isExplicit) {
      // Contenu explicite → S3 privé uniquement
      return await this.uploadToPrivateS3(file, creator);
    } else {
      // Contenu PG-13 → Peut être utilisé pour marketing
      return await this.uploadToMarketingLibrary(file, creator);
    }
  }
  
  async uploadToPrivateS3(file: File, creator: Creator) {
    // Upload vers S3 privé
    const key = `private/${creator.id}/${file.name}`;
    await s3.upload({
      Bucket: 'huntaze-private-content',
      Key: key,
      Body: file,
      ACL: 'private', // Pas d'accès public
    });
    
    // Générer URL signée (temporaire)
    const signedUrl = await s3.getSignedUrl('getObject', {
      Bucket: 'huntaze-private-content',
      Key: key,
      Expires: 3600, // 1 heure
    });
    
    return {
      key,
      signedUrl,
      isPublic: false,
      expiresAt: new Date(Date.now() + 3600000),
    };
  }
}
```

**Si besoin de vérification d'âge future:**
```typescript
// Si Huntaze affiche du contenu explicite public un jour
class AgeVerificationService {
  async verifyAge(user: User): Promise<boolean> {
    // Intégration avec service de vérification d'âge conforme Ofcom
    // Ex: Yoti, Jumio, etc.
    
    const result = await ageVerificationProvider.verify({
      userId: user.id,
      document: user.idDocument,
      selfie: user.selfie,
    });
    
    return result.isOver18 && result.confidence > 0.95;
  }
}
```

---

## 🔐 3. Sécurité S3/CloudFront

### Règles AWS

**Source:** [AWS Documentation](https://docs.aws.amazon.com/)

**Best Practices:**
- ✅ Buckets S3 privés par défaut
- ✅ OAC CloudFront (Origin Access Control)
- ✅ URLs signées avec durée courte
- ✅ IP scoping si nécessaire
- ❌ Pas de fichiers publics
- ❌ Pas de CDN ouvert

### ✅ Solution: Architecture Sécurisée

**Configuration S3:**
```typescript
// Configuration bucket S3 privé
const s3BucketConfig = {
  Bucket: 'huntaze-private-content',
  ACL: 'private',
  PublicAccessBlockConfiguration: {
    BlockPublicAcls: true,
    IgnorePublicAcls: true,
    BlockPublicPolicy: true,
    RestrictPublicBuckets: true,
  },
  VersioningConfiguration: {
    Status: 'Enabled',
  },
  ServerSideEncryptionConfiguration: {
    Rules: [{
      ApplyServerSideEncryptionByDefault: {
        SSEAlgorithm: 'AES256',
      },
    }],
  },
};
```

**Configuration CloudFront avec OAC:**
```typescript
// CloudFront Distribution avec Origin Access Control
const cloudFrontConfig = {
  Origins: [{
    Id: 'S3-huntaze-private-content',
    DomainName: 'huntaze-private-content.s3.amazonaws.com',
    OriginAccessControlId: 'OAC-huntaze',
    // Pas d'accès public direct au bucket
  }],
  DefaultCacheBehavior: {
    TargetOriginId: 'S3-huntaze-private-content',
    ViewerProtocolPolicy: 'redirect-to-https',
    AllowedMethods: ['GET', 'HEAD'],
    CachedMethods: ['GET', 'HEAD'],
    // Pas de cache pour contenu privé
    MinTTL: 0,
    DefaultTTL: 0,
    MaxTTL: 0,
  },
  // Pas de distribution publique
  Enabled: false,
};
```

**URLs Signées:**
```typescript
// Génération d'URLs signées sécurisées
class SecureContentService {
  async getSecureUrl(
    contentKey: string,
    userId: string,
    options: {
      expiresIn?: number; // secondes
      ipAddress?: string;
    } = {}
  ): Promise<string> {
    // Vérifier que l'utilisateur a accès
    const hasAccess = await this.checkAccess(contentKey, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }
    
    // Générer URL signée
    const signedUrl = await cloudfront.getSignedUrl({
      url: `https://cdn.huntaze.com/${contentKey}`,
      expires: Math.floor(Date.now() / 1000) + (options.expiresIn || 3600),
      // IP restriction optionnelle
      ipAddress: options.ipAddress,
    });
    
    // Logger l'accès
    await this.logAccess({
      userId,
      contentKey,
      timestamp: new Date(),
      ipAddress: options.ipAddress,
    });
    
    return signedUrl;
  }
  
  private async checkAccess(
    contentKey: string,
    userId: string
  ): Promise<boolean> {
    // Vérifier que le contenu appartient à l'utilisateur
    const content = await db.content.findUnique({
      where: { key: contentKey },
    });
    
    return content?.userId === userId;
  }
}
```

---

## 🏗️ 4. Architecture de Conformité

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────┐
│                   HUNTAZE PLATFORM                       │
│                  (Conforme & Sécurisé)                   │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   CONTENU    │  │  PAIEMENTS   │  │      IA      │
│              │  │              │  │              │
│ PG-13 Public │  │ Stripe: SaaS │  │ Azure: PG-13 │
│ Privé: S3    │  │ OnlyFans: $$ │  │ Modération   │
│ URLs signées │  │ Séparation   │  │ Human-loop   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  MARKETING   │  │   MESSAGING  │  │   STORAGE    │
│              │  │              │  │              │
│ APIs Offic.  │  │ Suggestions  │  │ S3 Privé     │
│ IG/TikTok    │  │ Pas d'auto   │  │ CloudFront   │
│ Modération   │  │ Human-loop   │  │ OAC + Signed │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Flux de Conformité

**1. Upload de Contenu:**
```
Créateur upload fichier
         ↓
Modération automatique (Azure Content Moderator)
         ↓
    ┌────┴────┐
    │         │
    ▼         ▼
Explicite   PG-13
    │         │
    ▼         ▼
S3 Privé   Marketing OK
URLs signées  Public OK
```

**2. Génération de Message:**
```
Fan envoie message
         ↓
IA analyse (Azure OpenAI PG-13)
         ↓
IA génère SUGGESTION
         ↓
Créateur VOIT suggestion
         ↓
Créateur VALIDE/MODIFIE
         ↓
Créateur ENVOIE manuellement
```

**3. Publication Marketing:**
```
Créateur crée post
         ↓
Modération automatique
         ↓
    ┌────┴────┐
    │         │
    ▼         ▼
Non-conforme  Conforme
    │         │
    ▼         ▼
Rejeté    API Officielle
         (IG/TikTok)
```

---

## ✅ 5. Checklist de Conformité

### OnlyFans
- [ ] Pas d'envoi automatique de messages
- [ ] Suggestions IA avec validation humaine
- [ ] Pas d'APIs non-officielles
- [ ] Pas de scraping
- [ ] Documentation utilisateur claire

### Instagram/TikTok
- [ ] APIs officielles uniquement
- [ ] Contenu PG-13 vérifié
- [ ] Modération automatique avant publication
- [ ] Pas de spam
- [ ] Respect des quotas API

### Stripe
- [ ] Abonnement SaaS uniquement
- [ ] Pas de vente de contenu adulte
- [ ] Séparation juridique claire
- [ ] Documentation légale

### Azure OpenAI
- [ ] Pas de chatbot érotique
- [ ] Usage PG-13 uniquement
- [ ] Modération activée
- [ ] Logs de conformité

### UK Online Safety Act
- [ ] Pas de contenu explicite public
- [ ] S3 privé pour contenu sensible
- [ ] URLs signées temporaires
- [ ] Vérification d'âge si nécessaire

### S3/CloudFront
- [ ] Buckets privés par défaut
- [ ] OAC CloudFront configuré
- [ ] URLs signées avec expiration
- [ ] Logs d'accès activés
- [ ] Encryption at rest

---

**📖 Voir aussi:**
- `HUNTAZE_COMPLIANCE_LEGAL.md` - Conformité légale
- `HUNTAZE_SECURITY.md` - Sécurité technique
