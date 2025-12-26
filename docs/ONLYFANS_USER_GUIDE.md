# OnlyFans CRM - Guide Utilisateur

## Vue d'ensemble

Le système OnlyFans CRM vous permet de gérer vos fans, conversations et campagnes de messages en masse avec rate limiting automatique pour respecter les limites de la plateforme.

---

## Fonctionnalités

### 1. Gestion des Fans

#### Lister tous les fans
```
GET /api/crm/fans
```

Retourne la liste de tous vos fans avec leurs informations (nom, plateforme, valeur lifetime, dernière activité, etc.).

#### Voir un fan spécifique
```
GET /api/crm/fans/[id]
```

Affiche les détails complets d'un fan incluant tags, notes, historique de valeur.

#### Mettre à jour un fan
```
PUT /api/crm/fans/[id]
Body: {
  "name": "John Doe Updated",
  "tags": ["vip", "whale", "active"],
  "notes": "Very engaged customer",
  "valueCents": 55000
}
```

#### Supprimer un fan
```
DELETE /api/crm/fans/[id]
```

---

### 2. Import CSV OnlyFans

Importez vos fans depuis un export CSV OnlyFans.

#### Format CSV supporté
```csv
Username,Display Name,Email,Subscription Tier,Total Spent,Last Seen
johndoe,John Doe,john@example.com,Premium,$500.00,2025-11-01
janedoe,Jane Doe,jane@example.com,Basic,$100.00,2025-10-30
```

#### Endpoint
```
POST /api/onlyfans/import/csv
Content-Type: multipart/form-data
Body: file=onlyfans_export.csv
```

#### Limites
- Taille max: 10MB
- Format: .csv uniquement
- Rate limit: 10 imports par heure

#### Response
```json
{
  "summary": {
    "totalRows": 100,
    "successfulInserts": 95,
    "skipped": 3,
    "errors": [
      { "row": 42, "error": "Invalid email format" }
    ]
  }
}
```

---

### 3. Conversations et Messages

#### Lister les conversations
```
GET /api/crm/conversations
```

Retourne toutes vos conversations avec les fans, enrichies avec les informations du fan (avatar, nom, handle).

#### Voir les messages d'une conversation
```
GET /api/crm/conversations/[id]/messages?limit=100&offset=0
```

Supporte la pagination pour charger l'historique complet.

#### Envoyer un message
```
POST /api/crm/conversations/[id]/messages
Body: {
  "text": "Thanks for your support!",
  "priceCents": 500,
  "attachments": [
    {
      "type": "image",
      "url": "https://s3.amazonaws.com/media/photo.jpg"
    }
  ]
}
```

Le message est automatiquement rate-limited via AWS SQS (10 messages/minute).

---

### 4. Bulk Messaging (Campagnes)

Envoyez un message à plusieurs fans en une seule opération.

#### Endpoint
```
POST /api/messages/bulk
Body: {
  "recipientIds": [1, 2, 3, 4, 5],
  "content": "Special offer for you! 🎉",
  "mediaUrls": ["https://s3.amazonaws.com/promo.jpg"],
  "campaignName": "Black Friday 2025",
  "priority": 8
}
```

#### Limites
- Max 100 recipients par campagne
- Rate limit: 5 campagnes par heure
- Envoi automatique par batches de 10 (limite SQS)

#### Response
```json
{
  "campaignId": 42,
  "totalRecipients": 5,
  "queued": 5,
  "failed": 0,
  "estimatedCompletionTime": "2025-11-01T12:05:00Z",
  "status": "queued"
}
```

#### Suivi de campagne
Les métriques sont automatiquement trackées :
- Messages envoyés
- Messages délivrés
- Taux d'ouverture
- Revenue généré

---

### 5. Rate Limiting

Le système utilise AWS SQS + Lambda + Redis pour limiter automatiquement à **10 messages par minute** (limite OnlyFans).

#### Comment ça marche ?
1. Vous envoyez un message via l'API
2. Le message est mis en queue SQS
3. Lambda traite la queue avec rate limiting Redis
4. Le message est envoyé à OnlyFans
5. Vous recevez une confirmation

#### Statut de la queue
```
GET /api/onlyfans/messages/status
```

Response:
```json
{
  "queueDepth": 42,
  "messagesInFlight": 5,
  "dlqCount": 2,
  "lastProcessedAt": "2025-11-01T12:00:00Z"
}
```

---

### 6. Monitoring

#### Health Check
```
GET /api/monitoring/onlyfans
```

Vérifie la santé du système :
- Database connectivity
- SQS queue status
- Rate limiter status
- DLQ count

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00Z",
  "components": {
    "database": {
      "status": "healthy",
      "latencyMs": 15
    },
    "sqs": {
      "status": "healthy",
      "queueDepth": 42,
      "messagesInFlight": 5,
      "dlqCount": 2
    },
    "rateLimiter": {
      "status": "healthy",
      "enabled": true
    }
  }
}
```

---

## Workflow Recommandé

### 1. Import Initial
1. Exportez vos fans depuis OnlyFans (CSV)
2. Importez via `POST /api/onlyfans/import/csv`
3. Vérifiez le summary pour les erreurs

### 2. Gestion Quotidienne
1. Consultez vos conversations (`GET /api/crm/conversations`)
2. Répondez aux messages (`POST /api/crm/conversations/[id]/messages`)
3. Mettez à jour les tags/notes des fans importants

### 3. Campagnes Marketing
1. Identifiez vos fans cibles (par tags, valeur, etc.)
2. Créez une campagne bulk (`POST /api/messages/bulk`)
3. Suivez les métriques dans la table `campaigns`

### 4. Monitoring
1. Vérifiez le health check régulièrement
2. Surveillez le DLQ count (devrait rester < 10)
3. Consultez les logs CloudWatch pour les erreurs

---

## Erreurs Courantes

### Rate Limit Exceeded (429)
**Cause**: Trop de requêtes API  
**Solution**: Respectez les limites (60 req/min pour write, 5/h pour bulk)

### Fan Not Found (404)
**Cause**: Fan ID invalide ou fan supprimé  
**Solution**: Vérifiez que le fan existe avec `GET /api/crm/fans`

### CSV Import Failed (400)
**Cause**: Format CSV invalide ou colonnes manquantes  
**Solution**: Vérifiez que le CSV contient au moins "Username" ou "Display Name"

### Queue Depth Too High
**Cause**: Trop de messages en attente (> 1000)  
**Solution**: Attendez que la queue se vide avant d'envoyer plus de messages

---

## Limites et Quotas

| Opération | Limite | Fenêtre |
|-----------|--------|---------|
| Read API | Illimité | - |
| Write API | 60 req | 1 minute |
| CSV Import | 10 imports | 1 heure |
| Bulk Messaging | 5 campagnes | 1 heure |
| Recipients/Campaign | 100 max | - |
| CSV File Size | 10 MB | - |
| OnlyFans Messages | 10 msg | 1 minute |

---

## Support

Pour toute question ou problème :
1. Consultez les logs CloudWatch (namespace: `Huntaze/OnlyFans`)
2. Vérifiez le health check (`/api/monitoring/onlyfans`)
3. Consultez la documentation développeur (`docs/ONLYFANS_DEVELOPER_GUIDE.md`)

---

## Prochaines Fonctionnalités

- [ ] UI Conversations (chat interface)
- [ ] UI Analytics (dashboard avec KPIs)
- [ ] Automated campaigns (drip campaigns)
- [ ] AI-powered message suggestions
- [ ] Revenue optimization ML model
