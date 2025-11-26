# 🚀 Guide Rapide - Configuration SES Staging

**Temps total:** ~15 minutes

---

## ✅ Ce qui est déjà fait

- ✅ Code mis à jour pour supporter SES
- ✅ AWS SES vérifié et configuré
- ✅ Identités vérifiées:
  - `huntaze.com` (domaine)
  - `no-reply@huntaze.com` (expéditeur automatique)
  - `hc.hbtpro@gmail.com` (votre email de test)
  - `charles@huntaze.com` (email de test)

---

## 📝 Ce qu'il reste à faire

### Étape 1: Ajouter les Variables d'Environnement (5 min)

1. **Aller sur AWS Amplify Console:**
   ```
   https://console.aws.amazon.com/amplify/
   ```

2. **Sélectionner votre app → Environment variables**

3. **Ajouter ces variables:**

```
AWS_ACCESS_KEY_ID=REDACTED_access_key_id
AWS_SECRET_ACCESS_KEY=REDACTED_secret_access_key
AWS_SESSION_TOKEN=REDACTED_session_token_if_needed
AWS_REGION=us-east-1
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=no-reply@huntaze.com
EMAIL_FROM=no-reply@huntaze.com
NEXTAUTH_URL=https://staging.huntaze.com
```

4. **Sauvegarder**

### Étape 2: Déployer le Code (5 min)

```bash
git add .
git commit -m "feat: configure AWS SES for email verification"
git push origin main
```

Attendre ~5 minutes que Amplify build et déploie.

### Étape 3: Tester (2 min)

**Test 1: Endpoint de Debug**
```bash
curl -X POST https://staging.huntaze.com/api/debug/email \
  -H "Content-Type: application/json" \
  -d '{"to":"hc.hbtpro@gmail.com"}'
```

**Résultat attendu:**
```json
{
  "success": true,
  "provider": "ses",
  "message": "Test email sent successfully"
}
```

**Test 2: Flow d'Inscription**
1. Aller sur: https://staging.huntaze.com/signup
2. Entrer: `hc.hbtpro@gmail.com`
3. Cliquer "Continue with Email"
4. Vérifier votre Gmail
5. Cliquer sur le lien magic link

---

## ⚠️ Important: Mode Sandbox

Vous êtes en **mode sandbox**, donc:
- ✅ Vous pouvez envoyer à `hc.hbtpro@gmail.com`
- ✅ Vous pouvez envoyer à `charles@huntaze.com`
- ❌ Vous NE pouvez PAS envoyer à d'autres emails

**Pour tester avec d'autres emails:**

**Option A: Vérifier l'email dans SES**
1. Aller sur: https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities
2. Cliquer "Create identity" → Email address
3. Entrer l'email de test
4. Vérifier l'email dans la boîte de réception

**Option B: Demander l'accès production (Recommandé)**
1. Aller sur: https://console.aws.amazon.com/ses/home?region=us-east-1#/account
2. Cliquer "Request production access"
3. Remplir le formulaire
4. Attendre 24-48h

---

## 🔍 Dépannage

### Erreur: "Email address is not verified"
→ L'email destinataire n'est pas vérifié dans SES (mode sandbox)
→ Solution: Vérifier l'email ou demander l'accès production

### Erreur: "Could not load credentials"
→ Les variables d'environnement ne sont pas configurées dans Amplify
→ Solution: Vérifier l'étape 1

### Erreur: "Access Denied"
→ Problème de permissions IAM
→ Solution: Vérifier que les credentials ont les permissions `ses:SendEmail`

### Pas d'email reçu
→ Vérifier les logs CloudWatch dans Amplify Console
→ Chercher "Failed to send magic link email"

---

## 📊 Vérifier les Logs

1. **Aller sur Amplify Console**
2. **Sélectionner votre app → Hosting → Logs**
3. **Chercher:**
   - "Magic link email sent" (succès)
   - "Failed to send magic link email" (erreur)

---

## ✅ Checklist Rapide

- [ ] Variables d'environnement ajoutées dans Amplify
- [ ] Code déployé sur staging
- [ ] Test avec `/api/debug/email` réussi
- [ ] Email reçu dans Gmail
- [ ] Test du flow d'inscription réussi
- [ ] Magic link fonctionne

---

## 🎯 Après les Tests

Si tout fonctionne:
1. ✅ Demander l'accès production SES
2. ✅ Attendre l'approbation (24-48h)
3. ✅ Tester avec des emails non vérifiés
4. ✅ Déployer en production

---

**Temps total:** ~15 minutes  
**Prêt à commencer!** 🚀
