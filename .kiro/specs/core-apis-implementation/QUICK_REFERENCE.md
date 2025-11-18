# Quick Reference - APIs Corrections

Guide rapide pour tester et valider les corrections des APIs.

## 🚀 Commandes Rapides

### Tester Toutes les APIs
```bash
./scripts/test-all-missing-apis.sh
```

### Tester une API Spécifique

#### Messages Unread Count
```bash
# Sans authentification (retourne 0)
curl -s "https://staging.huntaze.com/api/messages/unread-count" | jq

# Format attendu:
# {
#   "success": true,
#   "data": {
#     "count": 0,
#     "unreadByPlatform": {...},
#     "lastUpdated": "..."
#   },
#   "meta": {...}
# }
```

#### Messages Metrics
```bash
# Sans paramètres
curl -s "https://staging.huntaze.com/api/messages/metrics" | jq

# Avec période
curl -s "https://staging.huntaze.com/api/messages/metrics?from=2024-11-10&to=2024-11-17" | jq

# Format attendu:
# {
#   "success": true,
#   "data": {
#     "byDay": [],
#     "ttr": [],
#     "slaPct": [],
#     "period": {...},
#     "conversationCount": 0
#   },
#   "meta": {...}
# }
```

#### OnlyFans Campaigns (Déprécié)
```bash
# Vérifier les headers de dépréciation
curl -I -X POST "https://staging.huntaze.com/api/onlyfans/campaigns" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_test","planTier":"pro","campaignName":"Test"}'

# Headers attendus:
# Deprecation: true
# Sunset: Sat, 17 Feb 2025 00:00:00 GMT
# Link: </api/marketing/campaigns>; rel="alternate"
# Warning: 299 - "This API is deprecated..."
```

#### Marketing Campaigns (Nouveau)
```bash
# Lister les campagnes (nécessite auth)
curl -s "https://staging.huntaze.com/api/marketing/campaigns" \
  -H "Authorization: Bearer YOUR_TOKEN" | jq

# Créer une campagne (nécessite auth)
curl -s -X POST "https://staging.huntaze.com/api/marketing/campaigns" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Campaign",
    "channel": "email",
    "goal": "engagement",
    "audienceSegment": "all"
  }' | jq
```

## 🔍 Vérifications

### Vérifier la Compilation TypeScript
```bash
# Vérifier tous les fichiers
npx tsc --noEmit

# Vérifier un fichier spécifique
npx tsc --noEmit app/api/messages/unread-count/route.ts
```

### Vérifier les Diagnostics
```bash
# Utiliser l'outil de diagnostic Kiro
# (si disponible dans votre environnement)
```

### Vérifier le Build
```bash
# Build Next.js
npm run build

# Vérifier les erreurs
echo $?  # Devrait retourner 0
```

## 📊 Tests de Performance

### Test de Charge Simple
```bash
# Tester 100 requêtes
for i in {1..100}; do
  curl -s "https://staging.huntaze.com/api/messages/unread-count" > /dev/null &
done
wait
echo "100 requêtes terminées"
```

### Mesurer le Temps de Réponse
```bash
# Avec curl
curl -w "@curl-format.txt" -o /dev/null -s "https://staging.huntaze.com/api/messages/unread-count"

# Format curl-format.txt:
# time_namelookup:  %{time_namelookup}\n
# time_connect:  %{time_connect}\n
# time_appconnect:  %{time_appconnect}\n
# time_pretransfer:  %{time_pretransfer}\n
# time_redirect:  %{time_redirect}\n
# time_starttransfer:  %{time_starttransfer}\n
# ----------\n
# time_total:  %{time_total}\n
```

## 🐛 Debugging

### Voir les Logs en Temps Réel
```bash
# Logs Next.js (si en dev)
npm run dev

# Logs serveur (si déployé)
# Dépend de votre infrastructure
```

### Tester en Local
```bash
# Démarrer le serveur de dev
npm run dev

# Tester l'API locale
curl -s "http://localhost:3000/api/messages/unread-count" | jq
```

### Vérifier les Variables d'Environnement
```bash
# Afficher les variables (attention aux secrets!)
env | grep -E "(DATABASE|API|NEXT_PUBLIC)"
```

## 📝 Checklist de Déploiement

### Avant le Déploiement
- [ ] Tests locaux passent
- [ ] Compilation TypeScript OK
- [ ] Build Next.js OK
- [ ] Documentation à jour
- [ ] Tests d'intégration passent

### Déploiement Staging
```bash
# Déployer sur staging
git push origin staging

# Attendre le déploiement
# Vérifier les APIs
./scripts/test-all-missing-apis.sh

# Vérifier les logs
# (commande dépend de votre infrastructure)
```

### Déploiement Production
```bash
# Créer une release
git tag -a v1.x.x -m "API corrections"
git push origin v1.x.x

# Déployer sur production
git push origin main

# Vérifier les APIs
BASE_URL=https://huntaze.com ./scripts/test-all-missing-apis.sh

# Monitorer les erreurs
# (utiliser votre outil de monitoring)
```

### Après le Déploiement
- [ ] APIs fonctionnent en production
- [ ] Pas d'erreurs dans les logs
- [ ] Métriques normales
- [ ] Utilisateurs notifiés (si dépréciation)

## 🔧 Commandes de Maintenance

### Nettoyer le Cache
```bash
# Next.js
rm -rf .next

# Node modules
rm -rf node_modules
npm install
```

### Régénérer les Types
```bash
# Prisma
npx prisma generate

# Next.js
npm run build
```

### Mettre à Jour les Dépendances
```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour
npm update

# Ou avec version spécifique
npm install package@version
```

## 📚 Documentation

### Fichiers Importants
- **Audit:** `.kiro/specs/core-apis-implementation/MISSING_APIS_AUDIT.md`
- **Corrections:** `.kiro/specs/core-apis-implementation/CORRECTIONS_SUMMARY.md`
- **Rapport Final:** `.kiro/specs/core-apis-implementation/FINAL_CORRECTIONS_REPORT.md`
- **Migration:** `docs/api/MIGRATION_GUIDE.md`
- **Tests:** `scripts/test-all-missing-apis.sh`

### APIs Modifiées
- `app/api/messages/unread-count/route.ts`
- `app/api/messages/metrics/route.ts`
- `app/api/onlyfans/campaigns/route.ts`

## 🆘 Troubleshooting

### Problème: API retourne 500
```bash
# Vérifier les logs
# Vérifier la base de données
# Vérifier les variables d'environnement
```

### Problème: Format de réponse incorrect
```bash
# Vérifier que createSuccessResponse est importé
# Vérifier la version déployée
# Vérifier le cache
```

### Problème: Headers de dépréciation manquants
```bash
# Vérifier avec curl -I
# Vérifier le code déployé
# Vérifier les logs de warning
```

## 📞 Support

**Besoin d'aide?**
- 📖 Documentation: `docs/api/`
- 💬 Slack: #api-support
- 📧 Email: dev-support@huntaze.com

---

**Dernière mise à jour:** 17 Novembre 2024  
**Version:** 1.0
