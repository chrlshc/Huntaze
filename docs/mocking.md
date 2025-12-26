# Mocking (API_MODE)

Objectif: garder des mocks “re-câblables” pour démos/vidéos, sans bloquer le fonctionnement normal en prod.

## Switch global

- `API_MODE=real` (défaut): l’app utilise les vraies routes internes (`/api/...`) et **n’active pas** MSW.
- `API_MODE=mock`: l’app active MSW (Mock Service Worker) et sert des fixtures locales à la place des appels réseau.

Optionnel (équivalent côté client): `NEXT_PUBLIC_API_MODE=mock|real` (utile si votre environnement ne propage pas `API_MODE` au bundle client).

## Activer le mode mock

1) Ajouter dans `.env.local`:
```env
API_MODE=mock
```

2) Lancer:
- `npm run dev:mock`

Pour un build démo:
- `npm run build`
- `API_MODE=mock npm run start`

## Désactiver

Supprimer `API_MODE` ou le remettre à `real`, puis relancer le serveur Next.js.

## Nettoyer un Service Worker MSW déjà enregistré

- En mode `API_MODE=real`, l'app tente de désenregistrer `mockServiceWorker.js` au chargement.
- Si besoin, côté navigateur: DevTools → Application → Service Workers → Unregister `mockServiceWorker.js`, puis refresh.

## Smoke backend réel (sans MSW)

- Exécuter un smoke sans interceptions: `npm run test:smoke:real`
- Requis: `E2E_TEST_USER_ID=<id numérique>` pour aligner les tests E2E sur un utilisateur existant en base (les tests skip sinon).
- Optionnel: `E2E_DESTRUCTIVE=1` pour activer les actions destructives (toggle/re-engage/send message/settings/activation automation/schedule+publish).
- Optionnel: `E2E_NAME_PREFIX=E2E_SMOKE_<run>` ou `E2E_RUN_ID=<run>` pour préfixer les objets créés.

## Comment ça marche (MSW)

- Browser: `app/providers.tsx` démarre le worker MSW **uniquement** si `API_MODE=mock`.
- Worker script: `public/mockServiceWorker.js` (généré via `npx msw init public --save`).

## Ce qui est mocké (actuel)

Les handlers MSW se trouvent dans `src/mocks/handlers-internal.ts` et couvrent notamment:
- `/api/content`
- `/api/marketing/campaigns`
- `/api/offers` (+ `/api/offers/:id`, `/api/offers/:id/duplicate`)
- `/api/automations` (+ `/api/automations/analytics`)
- `/api/content/templates` (+ `/api/content/templates/:id/use`)
- `/api/dashboard`
- `/api/revenue/pricing`
- `/api/ai/content-trends/*`

## Limites

- Mode mock = **démo/vidéo** uniquement (ne pas activer en prod).
- Tous les endpoints ne sont pas mockés (les requêtes non gérées sont `bypass`).
- Certains endpoints côté serveur restent “placeholder/mock” (voir `docs/api-map.md`).
