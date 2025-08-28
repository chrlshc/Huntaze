# Guide de Démarrage Rapide Huntaze

## 🚀 Nouvelles Fonctionnalités

### 1. Roadmap & Vote (/roadmap)
Vote chaque semaine pour les features que tu veux voir développées.
- **Poids des votes** : Starter=1, Pro=1, Scale=2, Enterprise=3
- **Résultats** : Visibles en temps réel
- **Développement** : Les 3 features gagnantes sont développées

### 2. Repost Engine (/repost)
Maximise tes revenus en repostant intelligemment ton meilleur contenu.

#### Étapes :
1. **Importe tes performances** (OnlyFans CSV)
2. **Vois ton top content** classé par ROI
3. **Sélectionne un créneau** optimisé
4. **Active l'A/B testing** (optionnel)

#### Exemple A/B Testing :
- Variante A : "New content dropping 🔥 Check DMs"
- Variante B : "Special surprise in your inbox 💕"
- Tracking : `/r?rid=varA` vs `/r?rid=varB`

### 3. Smart Scheduler (/schedule)
Planifie tes posts aux meilleurs moments.

#### Features :
- **Suggestions AI** : Basées sur 30j de données
- **Multi-plateforme** : OnlyFans, Fansly
- **Preview** : Vois exactement ce qui sera posté
- **Rappels** : Notifications avant publication

### 4. Commission Tracker (Dashboard)
Visualise ta commission mensuelle en temps réel.
- **Barre de progression** : X$ utilisés sur cap de Y$
- **Transparence totale** : Sais exactement ce que tu paies
- **Historique** : Suivi mois par mois

## 📊 Analytics & Attribution

### Liens Trackés
Remplace tous tes liens par le format `/r` :

```
# Ancien lien
https://onlyfans.com/tonprofil

# Nouveau lien tracké
https://huntaze.com/r?rid=bio&assetId=main&platform=ONLYFANS&to=https://onlyfans.com/tonprofil
```

### Exemples par Contexte :

1. **Bio Instagram/Twitter**
```
https://huntaze.com/r?rid=bio_ig&assetId=profile&platform=ONLYFANS&to=https://onlyfans.com/tonprofil
```

2. **Story Promo**
```
https://huntaze.com/r?rid=story_promo&assetId=asset123&platform=ONLYFANS&to=https://onlyfans.com/tonprofil/campaign/summer
```

3. **Post avec PPV**
```
https://huntaze.com/r?rid=ppv_tease&assetId=ppv456&platform=ONLYFANS&to=https://onlyfans.com/tonprofil/post/789
```

### Import de Données

#### Via CSV (OnlyFans Export)
1. Exporte ton CSV depuis OnlyFans Analytics
2. Upload sur `/repost` → "Import CSV"
3. Map les colonnes : Date, Impressions, Clicks, Revenue

#### Via API (Automatique)
```bash
POST /api/repost/import
{
  "records": [{
    "assetUrl": "https://cdn/video.mp4",
    "platformType": "ONLYFANS",
    "date": "2025-01-15",
    "impressions": 5000,
    "clicks": 450,
    "ppvPurchases": 23,
    "revenueCents": 45600
  }]
}
```

## 🎯 Workflow Optimal

### Semaine Type :

**Lundi** : Vote sur /roadmap pour les features
**Mardi** : Import performances OF du weekend
**Mercredi** : Planifie reposts via /repost
**Jeudi** : Check analytics, ajuste stratégie
**Vendredi** : Prépare contenu weekend avec A/B
**Samedi/Dimanche** : Posts optimisés aux heures peak

### Best Practices :

1. **Toujours tracker** : Utilise `/r` pour TOUS tes liens
2. **A/B tout** : Teste 2 variantes minimum
3. **Analyse weekly** : Check tes top performers
4. **Repost smart** : Respecte cooldown 7-14j
5. **Peak hours** : Trust les recommendations AI

## 🔧 Troubleshooting

### "Pas de données dans Repost Engine"
→ Importe ton CSV OnlyFans ou crée des assets manuellement

### "Suggestions d'horaires génériques"
→ Plus tu importes de données, plus c'est précis

### "A/B test : comment voir le gagnant ?"
→ Check CTR dans analytics après 24-48h

### "Commission meter vide"
→ Normal si début de mois ou pas encore de revenus trackés

## 📈 Métriques à Suivre

1. **CTR** (Click-Through Rate) : Cibles 8-12%
2. **Conversion PPV** : Cibles 15-25% des clics
3. **Revenue per Repost** : Track amélioration vs original
4. **Best Hours** : Note les patterns par jour
5. **A/B Winners** : Build une "swipe file" des meilleures variantes

---

💡 **Pro Tip** : Configure des rappels pour importer tes données chaque semaine. Plus tu nourris le système, plus il devient intelligent !