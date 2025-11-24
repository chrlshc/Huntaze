# Hypothèse E : Corruption de l'Artefact de Build (Redis Timeout)

## 🎯 Hypothèse Critique

**Cause probable :** Les timeouts Redis pendant le build corrompent l'artefact Next.js, causant l'erreur ENOENT sur `page_client-reference-manifest.js`.

## 🔍 Preuves

### 1. API Routes fonctionnent ✅
```bash
curl https://staging.huntaze.com/api/health
# Résultat : 200 OK
```
**Conclusion :** Le runtime Node.js fonctionne, mais le SSR échoue.

### 2. Pages React échouent ❌
```bash
curl https://staging.huntaze.com/
# Résultat : 500 Internal Server Error
```
**Conclusion :** Le problème est dans le rendu côté serveur.

### 3. Logs de Build Précédents
```
Error: ENOENT: no such file or directory, copyfile .../page_client-reference-manifest.js
```
**Conclusion :** Le fichier manifeste n'a pas été créé correctement.

### 4. Timeouts Redis Observés
```
[Redis] Connection timeout: ETIMEDOUT
```
**Conclusion :** Le build perd du temps à tenter de se connecter à Redis.

## 💡 Théorie

1. **Phase de Build :** Next.js tente de générer les pages statiques
2. **Tentative de Connexion :** Le code essaie de se connecter à Redis/DB
3. **Timeout :** La connexion échoue après plusieurs secondes
4. **Worker Killed :** Le worker Amplify est tué ou manque de temps
5. **Fichiers Manquants :** Les manifestes ne sont pas écrits sur le disque
6. **Copie Échoue :** L'étape `copyfile` échoue avec ENOENT
7. **Runtime Corrompu :** L'application démarre mais ne peut pas rendre les pages

## ✅ Solution Appliquée

### 1. Désactivation Explicite au Build

**Fichier :** `amplify.yml`

```yaml
build:
  commands:
    # CRITICAL: Disable Redis/DB during build
    - export DISABLE_REDIS_CACHE=true
    - export DISABLE_DATABASE=true
    - npm run build
```

### 2. Vérification dans les Clients

**Fichier :** `lib/redis-client.ts`

```typescript
export function getRedisClient(): Redis | null {
  // CRITICAL: Force disable if explicitly requested
  if (process.env.DISABLE_REDIS_CACHE === 'true') {
    console.log('[Redis] Explicitly disabled via DISABLE_REDIS_CACHE');
    return null;
  }
  // ... rest of code
}
```

**Fichier :** `lib/db-client.ts`

```typescript
export function getPrismaClient(): PrismaClient | null {
  // CRITICAL: Force disable if explicitly requested
  if (process.env.DISABLE_DATABASE === 'true') {
    console.log('[Prisma] Explicitly disabled via DISABLE_DATABASE');
    return null;
  }
  // ... rest of code
}
```

### 3. Output Standalone Déjà Commenté

**Fichier :** `next.config.ts`

```typescript
// Output for Amplify Compute (ECS Fargate)
// Temporarily disabled to debug ENOENT errors
// output: 'standalone',
```

## 🧪 Tests Attendus

### Scénario 1 : Build Réussit ✅

**Indicateurs :**
- Pas d'erreur ENOENT dans les logs
- Logs montrent : `[Redis] Explicitly disabled via DISABLE_REDIS_CACHE`
- Logs montrent : `[Prisma] Explicitly disabled via DISABLE_DATABASE`
- Build se termine en < 5 minutes

**Résultat attendu :**
```bash
curl -I https://staging.huntaze.com/
# HTTP/2 200 OK
```

### Scénario 2 : Build Échoue Encore ❌

**Actions suivantes :**
1. Vérifier les logs CloudWatch pour l'erreur exacte
2. Vérifier si ENOENT réapparaît
3. Considérer de désactiver complètement le cache webpack
4. Vérifier les permissions de fichiers dans le build

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| Redis au build | Tentative de connexion | Désactivé explicitement |
| Database au build | Tentative de connexion | Désactivé explicitement |
| Timeout risk | Élevé | Nul |
| Build time | 8-10 min | 4-6 min (estimé) |
| ENOENT errors | Présents | Éliminés (espéré) |

## 🔧 Pourquoi Cette Solution

### Redis/DB ne sont PAS nécessaires au build

- **Build time :** Next.js génère du code statique
- **Runtime :** Les connexions sont établies quand l'app démarre
- **Séparation :** Build ≠ Runtime

### Les timeouts corrompent le build

- **Worker timeout :** Amplify limite le temps de build
- **Disk I/O :** Les timeouts retardent l'écriture des fichiers
- **Race condition :** Le worker peut être tué avant la fin

### Désactivation explicite > Fallback

- **Fallback :** Essaie de se connecter, échoue, continue (lent)
- **Désactivation :** Ne tente jamais la connexion (rapide)

## 📝 Logs à Surveiller

Après le déploiement, cherchez dans les logs :

```bash
# Logs de build (bon signe)
[Redis] Explicitly disabled via DISABLE_REDIS_CACHE
[Prisma] Explicitly disabled via DISABLE_DATABASE

# Logs de runtime (bon signe)
[Redis] Connecting to AWS ElastiCache
[Prisma] Client initialized successfully

# Erreur à éviter
Error: ENOENT: no such file or directory, copyfile
```

## ⏱️ Timeline

- **15:00** - Hypothèse E identifiée
- **15:05** - Solution appliquée (3 fichiers modifiés)
- **15:10** - Déploiement en cours
- **15:15** - Test attendu

## 🎯 Prédiction

**Probabilité de succès :** 85%

**Si ça fonctionne :**
- Le problème était bien les timeouts Redis/DB au build
- L'artefact sera propre et complet
- Les pages se rendront correctement

**Si ça échoue :**
- Le problème est ailleurs (layout, composant, config)
- Consulter les logs CloudWatch pour l'erreur exacte
- Considérer une approche différente

---

**Status :** Solution appliquée, en attente du build  
**Commit suivant :** À créer  
**ETA :** ~10 minutes
