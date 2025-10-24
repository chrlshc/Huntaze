# 🚀 HUNTAZE UPGRADE PLAN 2025

## 0️⃣ PRÉPARATION

```bash
# Nouvelle branche
git checkout -b chore/upgrade-2025

# Node 22 LTS (obligatoire)
nvm use 22 || volta pin node@22

# Vérifier la version
node --version  # doit afficher v22.x.x
```

## 📦 PACKAGE.JSON DIFF COMPLET

Remplace ton `package.json` par cette version upgradée :

```json
{
  "name": "huntaze",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "start:test": "next build && next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:regression": "vitest run tests/regression",
    "test:performance": "node scripts/run-performance-tests.mjs",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:all": "npm run test:coverage && npm run test:performance && npm run e2e:smoke",
    "e2e": "playwright test",
    "e2e:smoke": "playwright test --grep '@smoke'",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug",
    "lighthouse": "lhci autorun",
    "security:audit": "npm audit --audit-level high",
    "security:check": "node scripts/security-checklist.mjs",
    "ci:install": "npm ci && npx playwright install --with-deps",
    "ci:test": "npm run test:coverage && npm run e2e:smoke && npm run lighthouse",
    "ci:quality": "npm run lint && npm run typecheck && npm run security:check",
    "requirements:matrix": "node scripts/requirements-matrix.mjs",
    "coverage:check": "node scripts/check-coverage.mjs 80 80 80 80",
    "load-test": "tsx scripts/run-load-test.ts",
    "load-test:smoke": "tsx scripts/run-load-test.ts smoke",
    "load-test:load": "tsx scripts/run-load-test.ts load",
    "load-test:stress": "tsx scripts/run-load-test.ts stress",
    "load-test:spike": "tsx scripts/run-load-test.ts spike",
    "health-check": "curl -f http://localhost:3000/api/health || exit 1",
    "api:validate": "npm run health-check && npm run load-test:smoke",
    "validate:optimizations": "tsx scripts/validate-optimizations.ts",
    "setup:monitoring": "chmod +x scripts/setup-monitoring.sh && ./scripts/setup-monitoring.sh",
    "monitoring:start": "cd monitoring && ./start.sh",
    "monitoring:stop": "cd monitoring && ./stop.sh",
    "debug:all": "tsx scripts/debug-optimizations.ts",
    "debug:types": "tsx scripts/debug-types.ts",
    "debug:deps": "tsx scripts/debug-dependencies.ts",
    "debug:quick": "npm run debug:deps && npm run debug:types",
    "debug:master": "tsx scripts/debug-master.ts",
    "validate:tests": "node scripts/validate-tests.mjs",
    "test:validate": "npm run validate:tests",
    "test:tailwind": "vitest run tests/unit/tailwind-*.test.ts tests/integration/tailwind-*.test.ts tests/regression/tailwind-*.test.ts",
    "test:auth": "vitest run tests/unit/auth-endpoints-simple.test.ts tests/unit/auth-coverage-validation.test.ts tests/integration/auth-flow-integration.test.ts tests/regression/auth-security-regression.test.ts",
    "test:auth:e2e": "playwright test tests/e2e/auth-endpoints.spec.ts",
    "test:tailwind:watch": "vitest watch tests/unit/tailwind-*.test.ts tests/integration/tailwind-*.test.ts tests/regression/tailwind-*.test.ts",
    "validate:tailwind": "npm run test:tailwind && npm run lint",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "@aws-sdk/client-cloudwatch-logs": "^3.700.0",
    "@aws-sdk/client-eventbridge": "^3.700.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/client-sqs": "^3.700.0",
    "@headlessui/react": "^2.2.0",
    "@tanstack/react-query": "^5.62.0",
    "@trpc/client": "^11.0.0",
    "@trpc/next": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "@types/pg": "^8.15.5",
    "@upstash/ratelimit": "^2.0.6",
    "@upstash/redis": "^1.35.6",
    "bcryptjs": "^3.0.2",
    "chart.js": "^4.5.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "csv-parse": "^6.1.0",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.23.24",
    "ioredis": "^5.8.2",
    "jose": "^6.1.0",
    "jszip": "^3.10.1",
    "lucide-react": "^0.546.0",
    "next": "^15.1.0",
    "nodemailer": "^6.9.0",
    "openai": "^5.0.0",
    "p-queue": "^9.0.0",
    "pg": "^8.16.3",
    "prisma": "^6.0.0",
    "@prisma/client": "^6.0.0",
    "prom-client": "^15.1.3",
    "rate-limiter-flexible": "^8.1.0",
    "react": "^19.0.0",
    "react-chartjs-2": "^5.3.0",
    "react-countup": "^6.5.3",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.0",
    "react-intersection-observer": "^9.16.0",
    "stripe": "^19.1.0",
    "tailwind-merge": "^3.3.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.9.0",
    "web-vitals": "^3.5.0",
    "zod": "^4.1.12",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.0",
    "@tailwindcss/upgrade": "^4.0.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^22.0.0",
    "@types/nodemailer": "^6.4.19",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.7.0",
    "@vitest/coverage-v8": "^3.0.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.1.0",
    "glob": "^11.0.0",
    "husky": "^9.0.0",
    "jest-axe": "^8.0.0",
    "jsdom": "^25.0.0",
    "lint-staged": "^16.0.0",
    "postcss": "^8.4.35",
    "prettier": "^3.6.0",
    "tsx": "^4.7.0",
    "vitest": "^3.0.0",
    "wait-on": "^8.0.0"
  },
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=10.0.0"
  },
  "packageManager": "npm@10.0.0"
}
```

## 1️⃣ CORE UPGRADE: Next 15 + React 19 + TS 5.9

```bash
# Option A (recommandé) - Codemod automatique
npx @next/codemod@canary upgrade latest

# Option B (manuel si codemod échoue)
npm install -E next@15.1.0 react@19.0.0 react-dom@19.0.0 eslint-config-next@15.1.0 typescript@5.9.0 @types/react@19.0.0 @types/react-dom@19.0.0
```

### 🔧 Corrections obligatoires (Breaking Changes)

#### A. APIs asynchrones dans App Router
```typescript
// AVANT (Next 14)
import { cookies } from 'next/headers';
const token = cookies().get('token')?.value;

// APRÈS (Next 15)
import { cookies } from 'next/headers';
const token = (await cookies()).get('token')?.value;
```

#### B. Autres APIs à corriger
```typescript
// headers(), draftMode(), params, searchParams deviennent async
const headersList = await headers();
const { isEnabled } = await draftMode();
const params = await props.params;
const searchParams = await props.searchParams;
```

## 2️⃣ UI UPGRADE: Tailwind v4

```bash
# Upgrade automatique v3 → v4
npx @tailwindcss/upgrade

# Puis upgrade des dépendances UI
npm install -E @headlessui/react@2.2.0 framer-motion@12.23.24 lucide-react@0.546.0
```

### 🎨 Corrections Tailwind v4

#### A. CSS principal
```css
/* AVANT (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* APRÈS (v4) */
@import "tailwindcss";
```

#### B. Classes renommées
```bash
# Renommages automatiques (l'outil les fait)
shadow-sm → shadow-xs
outline-none → outline-hidden
ring-offset-white → ring-offset-white
```

## 3️⃣ LINTING: ESLint 9 (Flat Config)

```bash
npm install -D -E eslint@9.0.0
```

### 📝 Nouvelle config ESLint

Créer `eslint.config.mjs` :
```javascript
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
```

Supprimer `.eslintrc.json` ou `.eslintrc.js`.

## 4️⃣ STATE/FORMS/SERVER: tRPC 11, Zod 4, TanStack v5, RHF 7

```bash
npm install -E @trpc/server@11.0.0 @trpc/client@11.0.0 @trpc/next@11.0.0 @trpc/react-query@11.0.0 zod@4.1.12 @tanstack/react-query@5.62.0 zustand@5.0.8 react-hook-form@7.54.0
```

### 🔄 Corrections de migration

#### A. TanStack Query v5 (API object)
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

#### B. tRPC 11 (minimal changes)
```typescript
// La plupart du code reste identique
// Vérifier la doc officielle pour les edge cases
```

## 5️⃣ DATA LAYER: Prisma 6

```bash
npm install -E prisma@6.0.0 @prisma/client@6.0.0
npx prisma generate
```

### 🗄️ Corrections Prisma 6
- Vérifier le guide officiel pour les breaking changes spécifiques
- La plupart des APIs restent compatibles

## 6️⃣ CACHE/SESSIONS: Redis 8 + Upstash

```bash
npm install -E @upstash/redis@1.35.6 ioredis@5.8.2
```

### 🔄 Upgrade infrastructure Redis
- Mettre à jour Redis vers 8.0.x (sécurité critique)
- Vérifier la compatibilité des clients

## 7️⃣ SDKs EXTERNES

```bash
npm install -E openai@5.0.0 stripe@19.1.0 @aws-sdk/client-s3@3.700.0 nodemailer@6.9.0
```

### 🔧 Corrections SDK

#### A. OpenAI v5
```typescript
// AVANT (v4)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// APRÈS (v5) - API similaire mais vérifier les types
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

## 8️⃣ TESTS & TOOLING

```bash
npm install -D -E vitest@3.0.0 @testing-library/react@16.0.0 @testing-library/jest-dom@6.9.1 playwright@1.56.0 prettier@3.6.0 husky@9.0.0 lint-staged@16.0.0
```

## ✅ CHECKPOINTS (après chaque étape)

### Build + TypeCheck
```bash
npm run build && npm run typecheck
```

### Tests
```bash
npm run test
npx playwright test
```

### Lint/Format
```bash
npm run lint && npm run format:check
```

## 🚨 POINTS DE FRICTION ANTICIPÉS

### 1. Next 15 / React 19
- **cookies/headers async** : Codemod disponible
- **React 19 types** : Possibles conflits avec les anciens types

### 2. Tailwind v4
- **@import change** : Obligatoire dans CSS
- **Classes renommées** : Outil automatique
- **PostCSS plugin** : Nouveau `@tailwindcss/postcss`

### 3. ESLint 9
- **Flat config** : Migration manuelle nécessaire
- **Plugins compatibility** : Vérifier que tous les plugins supportent ESLint 9

### 4. Prisma 6
- **Schema changes** : Possibles breaking selon les features utilisées
- **Client generation** : Regénérer après upgrade

### 5. Tests
- **Vitest 3** : Possibles breaking dans la config
- **Testing Library 16** : Types plus stricts

## 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ

1. **Prépa** : Node 22 + branche
2. **Package.json** : Remplacer par la version ci-dessus
3. **Install** : `npm install`
4. **Next 15** : Codemod + corrections async
5. **Tailwind v4** : Upgrade + corrections CSS
6. **ESLint 9** : Nouvelle config
7. **Tests** : Corrections Vitest/Playwright
8. **Checkpoint** : Build + tests + lint

## 📚 RESSOURCES

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/12/05/react-19)
- [Tailwind CSS v4 Upgrade](https://tailwindcss.com/docs/v4-beta)
- [ESLint 9 Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [tRPC 11 Migration](https://trpc.io/docs/migrate-from-v10-to-v11)

Prêt pour l'upgrade ? 🚀