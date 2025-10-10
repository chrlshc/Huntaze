# Huntaze UI Rebuild — Worklog & Decisions

## Résumé rapide

- Passage d’un socle **App Router** à une **architecture `pages/`** dédiée pour la landing, l’auth et le dashboard.
- Normalisation Tailwind + typographie `Inter`, focus sur un **design dark minimal type Linear + Shopify**.
- Mise en place d’un **flow d’auth à 2 étapes** (email → mot de passe) avec toasts, rate‑limit et endpoints mockés.

---

## Infra / Config

| Zone | Détails |
| --- | --- |
| `pages/_app.tsx` | Wrapper global avec Inter (`next/font`), import `styles/globals.css`, provider de toasts. |
| `styles/globals.css` | Nouvelle base : thème sombre (bg gray‑900), tokens couleur primaire/secondaire/tertiaire + utilitaires (boutons, KPI, chips) alignés sur les composants `huntaze-starter`. |
| `tailwind.config.mjs` | Ajout `fontFamily.sans` + nettoyage pour s’appuyer sur Inter. |
| `next.config.mjs` | Suppression des rewrites App Router + table unique de redirections `/app/**` → `/dashboard/**` pour éviter la double arborescence. |

---

## Primitives UI

- `components/ui/button.tsx` : variantes `primary`, `secondary`, `ghost`, `subtle`, `danger`, gestion `loading`.
- `components/ui/input.tsx` : champ accessible, gestion état erreur.
- `components/ui/card.tsx` : surface neutre (bg gray‑800, border gray‑700).
- `components/ui/toast.tsx` : provider + hook `useToast`, auto-dismiss 4s, aria-live polite.

---

## Layouts & Navigation (type Linear / Shopify)

- `components/Sidebar.tsx` : colonne 64px, icônes centrées, pastilles focus/active, tooltips accessibles.
- `components/Header.tsx` : top-bar gray‑800, champ de recherche factice, actions (help/notifs/avatar).
- `components/DashboardLayout.tsx` : assemble sidebar + header, contenu `p-6`.
- `components/AuthLayout.tsx` : conteneur centré pour les étapes d’auth.

---

## Landing Page (Linear-like)

Modules isolés :
- `HeroSection`, `ProductSection`, `PricingSection`, `ClientsSection`.
- Header (`LandingHeader`), footer (`LandingFooter`) et page combinée `LandingPage`.
- `pages/index.tsx` et `app/page.tsx` consomment le même composant.

---

## Dashboard Pages (connectées aux données)

- `pages/dashboard/messages.tsx` — nouvelle inbox React (liste + thread + composer) alimentée par `/api/crm/**`, AI draft local, plus aucune dépendance aux composants `app-visuel`.
- `pages/dashboard/analytics.tsx` — consomme `/api/analytics/overview`, graphiques inline + états loading/erreur/empty.
- `pages/dashboard/fans.tsx` — segments / next actions (placeholder).
- `pages/dashboard/settings.tsx` — profil + section sécurité.
- Redirection `/dashboard` → `/dashboard/messages`.

---

## Auth à 2 étapes (type Shopify)

### Endpoints API mockés

- `POST /api/auth/start` → `{ exists: boolean }` (mock : e-mails `@huntaze.com` → `true`).
- `POST /api/auth/complete` → `{ ok: boolean }` (mot de passe ≥ 8 caractères).
- Rate-limit en mémoire `lib/server/rate-limit.ts`.

### Interface

- **Étape 1** `pages/auth/login/index.tsx` : saisie email, route vers étape 2, toasts en cas d’erreur.
- **Étape 2** `pages/auth/login/password.tsx` : rappelle l’email, gère `mode` signin/signup, feedback toast.

---

## À suivre / pistes

1. Déplacer le reste des pages `huntaze-starter` (fans, automations…) vers `pages/dashboard/**`.
2. Ajouter une config ESLint partagée pour rendre `npm run lint` non interactif.
3. Continuer la purge des feuilles `styles/*.css` devenues orphelines après la consolidation.
