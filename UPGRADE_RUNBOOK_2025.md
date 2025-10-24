# 🚀 HUNTAZE UPGRADE RUNBOOK 2025 - OFFICIEL

## 📋 RUNBOOK PRÊT À EXÉCUTER

### 0️⃣ PRÉPARATION

```bash
# Vérifier Node 22 LTS (Node 18 EOL depuis avril 2025)
node --version  # doit être v22.x.x

# Si pas Node 22
nvm use 22 || volta pin node@22

# Nouvelle branche
git checkout -b chore/upgrade-2025

# Sauvegarde
cp package.json package.json.backup
```

### 1️⃣ NEXT 15 + REACT 19 + TS (CODEMODS OFFICIELS)

```bash
# Upgrade global automatique (Next/React/TS + dépendances)
npx @next/codemod@canary upgrade latest

# Mise à jour des types React 19
npm i -E typescript@latest @types/react@latest @types/react-dom@latest

# Codemod APIs async (cookies, headers, draftMode, params, searchParams)
npx @next/codemod@latest next-async-request-api .

# Si tu utilisais experimental-edge
npx @next/codemod@latest app-dir-runtime-config-experimental-edge .

# Si tu utilisais req.geo/req.ip (optionnel)
npx @next/codemod@latest next-request-geo-ip .
```

### 2️⃣ TAILWIND V4 (OUTIL OFFICIEL)

```bash
# Upgrade automatique complet v3 → v4
npx @tailwindcss/upgrade

# Vérifie que @import "tailwindcss" est bien dans ton CSS principal
```

### 3️⃣ ESLINT 9 (FLAT CONFIG)

```bash
# Upgrade ESLint 9
npm i -D -E eslint@latest eslint-config-next@latest

# Créer la nouvelle config (remplace .eslintrc.*)
cat > eslint.config.mjs << 'EOF'
import next from "eslint-config-next";

export default [
  ...next(),
  {
    ignores: [
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage",
      "infrastructure/stripe-eventbridge/cdk.out"
    ]
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
];
EOF

# Supprimer l'ancienne config
rm -f .eslintrc.json .eslintrc.js .eslintrc.yml
```

### 4️⃣ STATE/SERVER LIBS

```bash
# tRPC 11, Zod 4, TanStack v5, Zustand 5, RHF 7
npm i -E @trpc/server@latest @trpc/client@latest @trpc/next@latest @trpc/react-query@latest
npm i -E zod@latest @tanstack/react-query@latest zustand@latest react-hook-form@latest
```

### 5️⃣ DATA LAYER

```bash
# Prisma 6
npm i -E prisma@latest @prisma/client@latest
npx prisma generate

# Note: Planifie Postgres 18 si tu veux les nouveautés (15 reste supportée)
```

### 6️⃣ SÉCURITÉ REDIS

```bash
# Upgrade client Redis
npm i -E @upstash/redis@latest ioredis@latest

# ⚠️ CRITIQUE: Upgrade ton Redis managé/self-hosted vers 8.2.2+
# CVE-2025-49844 corrigée en 8.2.2
# Révise les ACL EVAL/EVALSHA si utilisées
```

### 7️⃣ SDKs EXTERNES

```bash
# OpenAI v5, Stripe latest, AWS SDK v3, Nodemailer
npm i -E openai@latest stripe@latest @aws-sdk/client-s3@latest nodemailer@latest
```

### 8️⃣ TESTS & TOOLING

```bash
# Vitest 3, Testing Library 16, Playwright 1.56, Prettier 3.6
npm i -D -E vitest@latest @testing-library/react@latest @testing-library/jest-dom@latest
npm i -D -E playwright@latest prettier@latest husky@latest lint-staged@latest
```

### 9️⃣ VÉRIFICATIONS

```bash
# Build + TypeCheck
npm run build && npm run typecheck

# Lint avec nouvelle config
npm run lint

# Tests
npm test
npx playwright test
```

## 🔧 SCRIPTS ASSISTANTS AMÉLIORÉS

### Script Principal Optimisé

<function_calls>
<invoke name="strReplace">
<parameter name="path">scripts/upgrade-assistant.mjs
Exéc
ute simplement :
```bash
node scripts/upgrade-assistant.mjs
```

### Script de Validation Post-Upgrade

```bash
# scripts/post-upgrade-validation.mjs
cat > scripts/post-upgrade-validation.mjs << 'EOF'
#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkTailwindImport() {
  const cssFiles = ['app/globals.css', 'styles/globals.css', 'src/styles/globals.css'];
  
  for (const file of cssFiles) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf8');
      if (content.includes('@import "tailwindcss"')) {
        log(`✅ Tailwind v4 import correct dans ${file}`, 'green');
        return true;
      } else if (content.includes('@tailwind')) {
        log(`⚠️ Ancien format Tailwind détecté dans ${file}`, 'yellow');
        log(`   Remplacez par: @import "tailwindcss";`, 'yellow');
        return false;
      }
    }
  }
  
  log('⚠️ Aucun fichier CSS principal trouvé', 'yellow');
  return false;
}

function checkESLintConfig() {
  if (existsSync('eslint.config.mjs') || existsSync('eslint.config.js')) {
    log('✅ ESLint 9 flat config détecté', 'green');
    return true;
  } else {
    log('❌ Config ESLint 9 manquante', 'red');
    return false;
  }
}

function checkNextConfig() {
  if (existsSync('next.config.js') || existsSync('next.config.mjs')) {
    log('✅ Next.js config présent', 'green');
    return true;
  }
  return true; // Optionnel
}

function runValidation() {
  log('🔍 Validation post-upgrade...', 'blue');
  
  const checks = [
    checkTailwindImport(),
    checkESLintConfig(),
    checkNextConfig()
  ];
  
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  
  log(`\n📊 Résultat: ${passed}/${total} vérifications passées`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('🎉 Validation réussie !', 'green');
  } else {
    log('⚠️ Quelques ajustements nécessaires', 'yellow');
  }
}

runValidation();
EOF

chmod +x scripts/post-upgrade-validation.mjs
```

## 🧭 CONTRÔLES MANUELS POST-UPGRADE

### 1. Next.js 15 / React 19

```bash
# Vérifier que les fonctions async utilisent bien await
grep -r "cookies()" app/ --include="*.ts" --include="*.tsx"
grep -r "headers()" app/ --include="*.ts" --include="*.tsx"

# Doit montrer: await cookies(), await headers(), etc.
```

### 2. Tailwind v4

```bash
# Vérifier l'import principal
cat app/globals.css | grep -E "@import|@tailwind"

# Doit montrer: @import "tailwindcss";
```

### 3. Fetch Cache (Breaking Change Next 15)

```typescript
// AVANT (Next 14) - fetch était caché par défaut
fetch('/api/data')

// APRÈS (Next 15) - pas de cache par défaut
fetch('/api/data', { cache: 'force-cache' })  // Si tu veux du cache
// OU dans route.ts:
export const fetchCache = 'default-cache'
```

### 4. TanStack Query v5

```typescript
// AVANT (v4)
useQuery(['users'], fetchUsers, { enabled: true });

// APRÈS (v5)
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  enabled: true
});
```

### 5. Redis 8 Sécurité

```bash
# Vérifier la version Redis
redis-cli INFO server | grep redis_version

# Doit être >= 8.2.2 (CVE-2025-49844)
```

## 🚨 POINTS DE FRICTION ANTICIPÉS

### Next.js 15
- **fetch non caché** : Ajouter `cache: 'force-cache'` si nécessaire
- **Route Handlers** : `export const dynamic = 'force-static'` si besoin
- **Types params/searchParams** : Maintenant `Promise<any>`

### Tailwind v4
- **@import change** : Obligatoire dans CSS principal
- **Classes renommées** : `shadow-sm` → `shadow-xs`, `outline-none` → `outline-hidden`
- **Ring par défaut** : `ring` devient `ring-3`

### ESLint 9
- **Flat config** : Nouvelle syntaxe dans `eslint.config.mjs`
- **Plugins** : Vérifier compatibilité ESLint 9

### React 19
- **Types plus stricts** : Possibles erreurs TypeScript
- **Nouvelles APIs** : `useActionState`, `use()` disponibles

## ✅ CHECKLIST FINALE

- [ ] Node 22 LTS installé et vérifié
- [ ] Branche `chore/upgrade-2025` créée
- [ ] Codemods Next.js 15 exécutés
- [ ] Tailwind v4 upgradé avec outil officiel
- [ ] ESLint 9 flat config créé
- [ ] Toutes les dépendances mises à jour
- [ ] `npm run build` réussi
- [ ] `npm run typecheck` réussi
- [ ] `npm run lint` réussi
- [ ] `npm test` réussi
- [ ] `npx playwright test` réussi
- [ ] Tests manuels dans le navigateur
- [ ] Redis upgradé vers 8.2.2+
- [ ] Commit et push des changements

## 🆘 ROLLBACK SI PROBLÈME

```bash
# Restaurer l'ancien package.json
cp package.json.backup package.json
npm install

# Ou revenir à la branche précédente
git checkout main
git branch -D chore/upgrade-2025
```

## 📚 RÉFÉRENCES OFFICIELLES

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/12/05/react-19)
- [Tailwind CSS v4 Upgrade](https://tailwindcss.com/docs/v4-beta)
- [ESLint 9 Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [tRPC 11 Migration](https://trpc.io/docs/migrate-from-v10-to-v11)
- [Redis 8 Security](https://redis.io/docs/about/releases/)

---

🎉 **Prêt pour l'upgrade ? Lance le runbook et c'est parti !** 🚀