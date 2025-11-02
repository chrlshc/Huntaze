# Email System - Huntaze

Ce module gère l'envoi d'emails transactionnels via AWS SES (Simple Email Service).

## 📧 Types d'Emails

### 1. Email de Vérification
Envoyé lors de l'inscription d'un nouvel utilisateur.

**Déclencheur :** POST `/api/auth/register`

**Contenu :**
- Message de bienvenue personnalisé
- Lien de vérification (valide 24h)
- Instructions claires
- Design responsive

**Fonction :** `sendVerificationEmail(email, name, token)`

### 2. Email de Bienvenue
Envoyé après vérification réussie de l'email.

**Déclencheur :** GET `/api/auth/verify-email?token=xxx`

**Contenu :**
- Confirmation de vérification
- Lien vers le dashboard
- Message d'encouragement

**Fonction :** `sendWelcomeEmail(email, name)`

## 🔧 Configuration

### Variables d'Environnement

```env
# Email d'envoi (doit être vérifié dans AWS SES)
FROM_EMAIL=noreply@huntaze.com

# Région AWS
AWS_REGION=us-east-1

# Credentials AWS (ou utiliser IAM role)
AWS_ACCESS_KEY_ID=REDACTED-key
AWS_SECRET_ACCESS_KEY=REDACTED-secret

# URL de l'application (pour les liens)
NEXT_PUBLIC_APP_URL=https://huntaze.com
```

### AWS SES Setup

#### 1. Vérifier l'Email/Domaine

**Option A : Vérifier un email**
```bash
aws ses verify-email-identity --email-address noreply@huntaze.com
# Vérifier l'email reçu
```

**Option B : Vérifier un domaine (recommandé)**
```bash
aws ses verify-domain-identity --domain huntaze.com
# Ajouter les enregistrements DNS fournis
```

#### 2. Sortir du Sandbox Mode

En mode sandbox, vous ne pouvez envoyer qu'à des emails vérifiés.

```bash
# Via Console AWS
1. Allez dans SES → Account dashboard
2. Cliquez "Request production access"
3. Remplissez le formulaire
4. Attendez l'approbation (24-48h)
```

#### 3. Configurer les Permissions IAM

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🧪 Tests

### Test Local

```bash
# Test avec email par défaut
npm run test:email

# Test avec email spécifique
npm run test:email user@example.com

# Test avec email et nom
npm run test:email user@example.com "John Doe"
```

### Test via API

```bash
# Créer un compte (envoie l'email de vérification)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Vérifier l'email (envoie l'email de bienvenue)
curl http://localhost:3000/api/auth/verify-email?token=YOUR_TOKEN
```

## 📝 Utilisation

### Envoyer un Email de Vérification

```typescript
import { sendVerificationEmail } from '@/lib/email/ses';
import { createVerificationToken } from '@/lib/auth/tokens';

// Créer un token
const token = await createVerificationToken(userId, email);

// Envoyer l'email
await sendVerificationEmail(email, name, token);
```

### Envoyer un Email de Bienvenue

```typescript
import { sendWelcomeEmail } from '@/lib/email/ses';

await sendWelcomeEmail(email, name);
```

### Envoyer un Email Personnalisé

```typescript
import { sendEmail } from '@/lib/email/ses';

await sendEmail({
  to: 'user@example.com',
  subject: 'Mon Sujet',
  htmlBody: '<h1>Hello</h1><p>Message HTML</p>',
  textBody: 'Hello\n\nMessage texte',
});
```

## 🎨 Templates d'Emails

Les templates sont définis directement dans `lib/email/ses.ts`.

### Structure HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <!-- Header -->
    <tr>
      <td style="padding: 40px; text-align: center;">
        <h1 style="color: #6366f1;">Huntaze</h1>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 0 40px 40px;">
        <!-- Votre contenu ici -->
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 20px; background-color: #f9fafb; text-align: center;">
        <p style="color: #6b7280; font-size: 12px;">
          © 2025 Huntaze. Tous droits réservés.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Bonnes Pratiques

1. **Toujours fournir une version texte** - Certains clients email n'affichent pas le HTML
2. **Utiliser des tables pour la mise en page** - Meilleure compatibilité
3. **Styles inline** - Les CSS externes ne fonctionnent pas
4. **Tester sur plusieurs clients** - Gmail, Outlook, Apple Mail, etc.
5. **Responsive design** - Utiliser `max-width` et `width="100%"`
6. **Liens absolus** - Toujours utiliser des URLs complètes

## 📊 Monitoring

### CloudWatch Logs

```bash
# Voir les logs d'envoi
aws logs tail /aws/lambda/your-function --follow --filter "Email sent"

# Voir les erreurs
aws logs tail /aws/lambda/your-function --follow --filter "Failed to send email"
```

### Métriques SES

Dans AWS Console → SES → Reputation dashboard :

- **Bounce rate** : Doit être < 5%
- **Complaint rate** : Doit être < 0.1%
- **Emails sent** : Nombre total
- **Emails delivered** : Taux de livraison

### Alertes CloudWatch

Créer des alarmes pour :
- Bounce rate > 5%
- Complaint rate > 0.1%
- Erreurs d'envoi

## 🔧 Troubleshooting

### Email Non Reçu

**Causes possibles :**
1. Email dans le dossier spam
2. FROM_EMAIL non vérifié dans SES
3. SES en mode sandbox et TO_EMAIL non vérifié
4. Quotas SES dépassés
5. Email invalide

**Solutions :**
```bash
# Vérifier le statut de l'email
aws ses get-identity-verification-attributes \
  --identities noreply@huntaze.com

# Vérifier les quotas
aws ses get-send-quota

# Vérifier les statistiques d'envoi
aws ses get-send-statistics
```

### Erreur "MessageRejected"

```
Error: MessageRejected: Email address is not verified
```

**Solution :** Vérifier FROM_EMAIL dans AWS SES Console

### Erreur "Daily sending quota exceeded"

```
Error: Daily sending quota exceeded
```

**Solution :** 
- En sandbox : 200 emails/jour
- Production : Demander une augmentation de quota

### Erreur "Credentials not found"

```
Error: CredentialsError: Missing credentials in config
```

**Solution :**
```bash
# Option 1: Variables d'environnement
export AWS_ACCESS_KEY_ID=REDACTED-key
export AWS_SECRET_ACCESS_KEY=REDACTED-secret

# Option 2: AWS CLI
aws configure

# Option 3: IAM Role (recommandé en production)
# Attacher le rôle à l'instance/lambda
```

## 📚 Ressources

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [AWS SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [Email Design Guide](https://www.campaignmonitor.com/css/)
- [Can I Email](https://www.caniemail.com/) - Compatibilité CSS

## 🔐 Sécurité

### Bonnes Pratiques

1. **Ne jamais exposer les credentials** - Utiliser IAM roles en production
2. **Valider les emails** - Vérifier le format avant d'envoyer
3. **Rate limiting** - Limiter le nombre d'emails par utilisateur
4. **Logs** - Logger tous les envois pour audit
5. **DKIM/SPF** - Configurer pour éviter le spam

### Rate Limiting

```typescript
// Exemple de rate limiting
const MAX_EMAILS_PER_HOUR = 5;

async function canSendEmail(userId: number): Promise<boolean> {
  const count = await query(
    `SELECT COUNT(*) FROM email_logs 
     WHERE user_id = $1 
     AND created_at > NOW() - INTERVAL '1 hour'`,
    [userId]
  );
  
  return count.rows[0].count < MAX_EMAILS_PER_HOUR;
}
```

---

**Dernière mise à jour :** 31 octobre 2025  
**Maintenu par :** Équipe Huntaze
