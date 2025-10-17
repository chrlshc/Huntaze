# 💰 Comparaison des Coûts AWS : CloudFormation vs Amplify

## 📊 Vue d'ensemble

| Aspect | CloudFormation Direct | Amplify Hosting |
|--------|----------------------|-----------------|
| **Cognito** | Identique | Identique |
| **Hébergement** | Vercel/Netlify | AWS Amplify |
| **CI/CD** | GitHub Actions | Amplify Build |
| **Coût mensuel estimé** | ~$0-50 | ~$12-100+ |

## 🔐 AWS Cognito (Identique pour les deux)

### Tier Gratuit (50,000 MAU gratuits)
- **0-50,000 utilisateurs actifs mensuels** : GRATUIT
- Inclut : Sign-up, Sign-in, Token refresh, Forgot password

### Au-delà du tier gratuit
- **50,001-100,000 MAU** : $0.0055/MAU
- **100,001+ MAU** : $0.0046/MAU

### Fonctionnalités avancées (optionnelles)
- **MFA SMS** : $0.06/SMS
- **Advanced Security** (Plus tier) : +$0.05/MAU
- **SAML/OIDC federation** : Gratuit

## 🚀 Option 1 : CloudFormation + Vercel/Netlify

### Coûts Infrastructure
```
Cognito User Pool : $0 (< 50k users)
CloudFormation    : $0 (gratuit)
Vercel Hobby      : $0
Vercel Pro        : $20/mois (team)
```

### Avantages financiers
- ✅ Hébergement gratuit possible (Vercel Hobby)
- ✅ Pas de frais AWS supplémentaires
- ✅ CI/CD gratuit avec GitHub Actions
- ✅ CDN global inclus

### Coût total estimé
- **Petit projet** : $0/mois
- **Projet moyen** : $20/mois (Vercel Pro)
- **Grande échelle** : $20 + Cognito MAU

## 🔧 Option 2 : AWS Amplify Full Stack

### Coûts Amplify Hosting
```
Build & Deploy : $0.01/minute de build
Hébergement    : $0.023/GB stocké
Bande passante : $0.15/GB servi
```

### Exemple de calcul mensuel
```
Build (10 déploiements × 5 min)     : $0.50
Stockage (100MB Next.js)            : $0.01
Bande passante (10GB)               : $1.50
Cognito (<50k users)                : $0.00
----------------------------------------
TOTAL                               : ~$2/mois
```

### Coûts cachés potentiels
- 🔴 Build minutes s'accumulent vite
- 🔴 Bande passante plus chère que Vercel
- 🔴 Pas de tier gratuit généreux

## 📈 Comparaison selon la taille

### Startup (0-1000 users)
| Service | CloudFormation + Vercel | Amplify |
|---------|------------------------|---------|
| Cognito | $0 | $0 |
| Hosting | $0 (Hobby) | ~$2-5 |
| **Total** | **$0/mois** | **$2-5/mois** |

### PME (1000-10,000 users)
| Service | CloudFormation + Vercel | Amplify |
|---------|------------------------|---------|
| Cognito | $0 | $0 |
| Hosting | $20 (Pro) | ~$10-30 |
| **Total** | **$20/mois** | **$10-30/mois** |

### Scale-up (50,000+ users)
| Service | CloudFormation + Vercel | Amplify |
|---------|------------------------|---------|
| Cognito | $275 (100k MAU) | $275 |
| Hosting | $20-150 | $50-200 |
| **Total** | **$295-425/mois** | **$325-475/mois** |

## 🎯 Recommandations

### Utilise CloudFormation + Vercel si :
- ✅ Tu veux optimiser les coûts
- ✅ Tu as déjà Vercel/Netlify
- ✅ Tu veux plus de contrôle
- ✅ Tu prévois < 50k users

### Utilise Amplify si :
- ✅ Tu veux tout AWS
- ✅ Tu as besoin de backend complexe
- ✅ Tu préfères une solution intégrée
- ✅ L'équipe connaît AWS

## 💡 Astuces pour réduire les coûts

1. **Cognito**
   - Reste sous 50k MAU
   - Évite SMS MFA → Utilise TOTP
   - Active Advanced Security seulement si nécessaire

2. **Hébergement**
   - CloudFormation : Commence avec Vercel Hobby
   - Amplify : Optimise les builds (cache)
   - Utilise ISR/SSG pour réduire la bande passante

3. **Monitoring**
   - Configure des alertes de budget AWS
   - Monitore les MAU Cognito
   - Track les build minutes Amplify

## 🏁 Conclusion

**Pour Huntaze, je recommande CloudFormation + Vercel** :
- 💰 $0-20/mois vs $2-30/mois
- 🚀 Déploiements plus rapides
- 🌍 Meilleur CDN global
- 🔧 Plus de flexibilité

Tu économises ~$10-50/mois et gardes plus de contrôle !