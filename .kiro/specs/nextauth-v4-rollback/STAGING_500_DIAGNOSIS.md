# Diagnostic de l'erreur 500 sur staging

## Situation actuelle

✅ Variables d'environnement correctement configurées sur Amplify :
- `NEXTAUTH_URL` = `https://staging.huntaze.com`
- `NEXTAUTH_SECRET` = `E6PNdnUax3RLDfRLF8Tt9l4mlILP1/jofVdt5Nb3eNg=`
- Toutes les autres variables (DB, Redis, OAuth, etc.)

✅ Build réussi (Job #127)

❌ Erreur 500 sur `/api/auth/signin`

## Code actuel

La route `app/api/auth/[...nextauth]/route.ts` est ultra-minimale :
- Pas de DB
- Pas de Redis
- Juste NextAuth v4 avec CredentialsProvider
- Debug activé

## Hypothèses

### 1. Problème de runtime Amplify avec NextAuth v4

NextAuth v4 pourrait ne pas être compatible avec l'environnement serverless d'Amplify. Les routes dynamiques `[...nextauth]` peuvent causer des problèmes.

### 2. Problème d'import ou de dépendances

Le module `next-auth` pourrait ne pas se charger correctement dans l'environnement Amplify.

### 3. Problème de configuration Next.js

Le `next.config.ts` pourrait avoir une configuration qui bloque NextAuth.

## Solutions à tester

### Solution 1 : Vérifier les logs CloudWatch

```bash
bash scripts/check-staging-logs.sh
```

Chercher les messages d'erreur exacts dans les logs.

### Solution 2 : Tester avec une route API simple

Créer une route `/api/test/route.ts` ultra-simple pour vérifier que les routes API fonctionnent :

```typescript
export async function GET() {
  return Response.json({ 
    status: 'ok',
    env: {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    }
  });
}
```

### Solution 3 : Simplifier encore plus NextAuth

Retirer même le CredentialsProvider et tester avec une config vide.

### Solution 4 : Vérifier next.config.ts

S'assurer qu'il n'y a pas de configuration qui bloque les routes API dynamiques.

### Solution 5 : Passer à NextAuth v5 (Auth.js)

NextAuth v5 est mieux optimisé pour les environnements serverless modernes.

## Prochaines étapes

1. Vérifier les logs CloudWatch pour l'erreur exacte
2. Tester une route API simple pour isoler le problème
3. Si c'est NextAuth v4 le problème, migrer vers v5
