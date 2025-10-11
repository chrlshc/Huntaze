# Feuille de Route – Système OnlyFans « Production‑Ready »

Ce document décrit un plan concret en 8 volets pour livrer un système OnlyFans prêt pour la production (remplacement de SuperCreator), sécurisé, scalable et centré créateur. Chaque volet inclut des précisions techniques et des extraits de code pour guider l’implémentation.

---

## 1) Intégration « Opt‑In » et Authentification

- Page `/of-connect` (mobile‑first): formulaire email, mot de passe, 2FA; rappel d’usage et consentement explicite.
- Stockage sécurisé des identifiants: vérification immédiate (Playwright/API), puis stockage chiffré dans AWS Secrets Manager.
- Cookies de session: récupération après login (navigateur headless), chiffrement via AWS KMS, persistance en base (p.ex. DynamoDB) liés à l’utilisateur.
- Consentement explicite: case à cocher + horodatage/version des CGU, enregistré en base pour audit.

Exemple Node.js (Express):

```js
// Endpoint /of-connect – traite la soumission du formulaire de login OnlyFans
app.post('/of-connect', async (req, res) => {
  const { email, password, otpCode } = req.body;
  const loginSuccess = await verifyOnlyFansCredentials(email, password, otpCode);
  if (!loginSuccess) return res.status(401).send("Échec de l'authentification OnlyFans");

  await secretsManager.putSecretValue({
    SecretId: `of/creds/${userId}`,
    SecretString: JSON.stringify({ email, password })
  }).promise();

  const cookies = await fetchOnlyFansSessionCookies(email, password, otpCode);
  const encrypted = await kms.encrypt({
    KeyId: 'alias/OnlyFansCookieKey',
    Plaintext: JSON.stringify(cookies)
  }).promise();

  await dynamoDB.put({
    TableName: 'Sessions',
    Item: {
      userId,
      cookies: encrypted.CiphertextBlob.toString('base64'),
      consentedAt: new Date().toISOString(),
      requiresAction: false
    }
  }).promise();

  res.send('Connexion réussie et accès OnlyFans autorisé.');
});
```

---

## 2) Browser Worker Playwright (AWS Lambda)

- Image Docker Lambda (Node 18) avec Playwright + deps (Chromium headless).
- Lancement Chromium: `--no-sandbox`, `--disable-dev-shm-usage`.
- Handler:
  - Déchiffre cookies (KMS) → `context.addCookies([...])`.
  - Contexte réaliste: `userAgent`, `locale`, `timezoneId`.
  - Actions DOM: inbox (lecture), send (envoi), avec timeouts et `finally { browser.close() }`.

Snippet:

```js
const { chromium } = require('playwright-core');
const AWS = require('aws-sdk');
const kms = new AWS.KMS();

module.exports.handler = async (event) => {
  const encrypted = Buffer.from(event.encryptedCookies, 'base64');
  const { Plaintext } = await kms.decrypt({ CiphertextBlob: encrypted }).promise();
  const cookies = JSON.parse(Plaintext.toString());

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ userAgent: event.userAgent, locale: event.locale, timezoneId: event.timezone });
  await context.addCookies(cookies);
  const page = await context.newPage();
  try {
    if (event.action === 'inbox') {
      await page.goto('https://onlyfans.com/my/messages', { waitUntil: 'networkidle' });
      const newMessages = await page.evaluate(() => /* extraction DOM */ []);
      return { newMessages };
    } else if (event.action === 'send') {
      await page.goto(`https://onlyfans.com/my/messages/${event.message.threadId}`);
      await page.fill('textarea.message-input', event.message.content);
      await page.click('button.send-message');
      return { status: 'sent' };
    }
  } finally {
    await browser.close();
  }
};
```

---

## 3) Orchestration Serverless (EventBridge, SQS, DynamoDB)

- EventBridge: règles planifiées (inbox sync toutes les 5 min, envois programmés).
- SQS: file de jobs d’envoi (découplage, résilience).
- Lambda SendWorker: déclenché par SQS (batches de 10), invoque Browser Worker.
- DynamoDB:
  - Table `Sessions`: cookies chiffrés, `requiresAction`, timestamps.
  - Table `Messages`: historique, statuts (new/pending/sent/error), timestamps.

---

## 4) Livraison des Messages (Rate‑limit, Mutex, Kill‑switch)

- SendWorker: vérifie kill‑switch global, acquiert un lock par user (DynamoDB conditionnel), rate‑limit (≥1 s/envoi), invoque le Browser Worker pour chaque message.
- Mise à jour `Messages`: statut `sent` ou `error` + info.
- Mutex/Concurrence: lock distribué (DynamoDB) ou orchestration SQS; éviter plusieurs envois simultanés par compte.

---

## 5) Anti‑Détection & Proxy

- IP fixe: VPC + NAT Gateway + Elastic IP (ou Global Accelerator).
- Stealth Playwright: masquer `navigator.webdriver`, ajuster timezone/locale, empreinte réaliste (UA, WebGL, plugins), délais aléatoires 500–1500 ms.
- Proxy résidentiel optionnel par créateur: `browser.newContext({ proxy: { server, username, password } })`.

---

## 6) Observabilité & Monitoring

- CloudWatch Logs (JSON structuré): `{ action, userId, durationMs, success, errorCode }`.
- Métriques custom: `InboxSyncDuration`, `MessagesSentCount`, `FailureRate` + alarmes (>5% sur 10 min).
- SNS: notifications (erreurs, requiresAction=true).
- Dashboard temps‑réel: Next.js (WebSocket/SSE/polling) pour stats de sessions, messages, latences.

---

## 7) UI & UX Creator‑First

- Mobile‑first (Tailwind, Grid/Flex).
- Onboarding guidé (connexion, consentement, test, préférences).
- Notifications push (SNS+FCM/APNS ou Web Push API).
- Analytics clés: nouveaux messages/jour, temps de réponse, campagnes.

---

## 8) Sécurité & Conformité

- Chiffrement at‑rest/in‑transit: KMS, TLS, ACM, backups chiffrés.
- Consentement & révocation: purge cookies, secrets, stop workers; droit à l’effacement (RGPD, TTL).
- Logs d’audit: envois et connexions (rétention 90j, export admin).
- ToS OnlyFans: consentement créateur requis; plan anti‑blocage (captcha, IP, kill‑switch).

---

## Prochaines Étapes Recommandées

1. Implémenter Playwright réel (send + inbox) dans `src/lib/workers/of-browser-worker.ts`.
2. Basculer les Maps mémoire (sessions/conversations/messages) vers DynamoDB (schéma minimal).
3. Exposer des endpoints REST `/api/of/*` adossés aux workers (send, inbox, campaigns).
4. Déployer l’orchestration EventBridge + SQS + Lambdas (SendWorker, BrowserWorker).
5. Activer les métriques & alarmes CloudWatch + SNS.
6. Écrire la doc de consentement & révocation + ajouter le bouton “Révoquer l’accès”.

