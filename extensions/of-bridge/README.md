# Huntaze OF Bridge (Web Extension)

Extension Chrome (MV3) pour connecter un compte OnlyFans via l’interface Huntaze **sans manipuler de cookies manuellement**.

## Principe

1. L’utilisateur ouvre la page `of-connect` de l’app. Le serveur injecte un **token d’ingest** (via `<meta name="of-bridge-token">` ou un bridge JSON `<meta name="of-bridge">`).
2. L’extension transmet le token au Service Worker (MV3) et le stocke en **storage.session** (éphémère, recommandé pour MV3).
3. L’utilisateur se connecte sur `onlyfans.com`. À chaque fin de navigation sur OnlyFans, l’extension lit les **cookies du domaine onlyfans.com** et les envoie à `POST {apiBase}/api/of/cookies/ingest` avec `Authorization: Bearer {ingestToken}`.
4. Le backend chiffre et stocke la session (KMS + DDB). La page `of-connect` affiche alors l’état `CONNECTED`.

## Installation (dev)

1. Ouvrir Chrome > `chrome://extensions` > Activer **Developer mode**.
2. `Load unpacked` > sélectionner le dossier `extensions/of-bridge` du repo.
3. Dans l’app Huntaze, aller sur `/of-connect` (connecté). Vérifier que la page contient le méta `of-bridge-token` (ou `of-bridge`).
4. Ouvrir `https://onlyfans.com/login` dans le même navigateur et se connecter. Une fois connecté, l’extension POSTe la session au backend.
5. Revenir sur `/of-connect` : l’état doit passer à **CONNECTED**.

## Permissions

- `cookies`, `storage`, `webNavigation`, `tabs`
- `host_permissions`: `https://onlyfans.com/*`, `https://*.onlyfans.com/*`, `https://app.huntaze.com/*`, `http://localhost:3000/*`

## Fichiers

- `manifest.json`: Manifest MV3.
- `content.js`: Sur `/of-connect`, envoie au SW un token d’ingest (ou un bridge JSON) via `chrome.runtime.sendMessage` → persisté en `chrome.storage.session`.
- `background.js` (MV3 SW): écoute `webNavigation.*` et `cookies.onChanged`, récupère les cookies onlyfans.com (+ partitionKey si exposé), POSTe à `/api/of/cookies/ingest`, puis invalide le token.

## Sécurité

- Les mots de passe OF ne sont **jamais** vus ni stockés par Huntaze: l’utilisateur se connecte sur `onlyfans.com`.
- Transport TLS + token d’ingest. Le backend chiffre via **AWS KMS** avant stockage.
- CORS côté API `of/cookies/ingest` autorise l’origine d’extension (`chrome-extension://...`).
- Permissions minimales (onlyfans.com + app.huntaze.com), pas de logs sensibles.
- `incognito: split` pour isoler les sessions privées.

## Dépannage

- Assurez‑vous que `/of-connect` affiche bien `<meta name="of-bridge-token">` (ou `of-bridge`).
- Vérifiez les cookies: `chrome://settings/cookies/detail?site=onlyfans.com` (après login).
- Côté serveur, consultez les logs de `POST /api/of/cookies/ingest` et l’état `/api/of/connect/status`.
- En SPA, les transitions sont aussi captées via `onHistoryStateUpdated`.
- Incognito: le SW résout le `storeId` adéquat via `getAllCookieStores`.
