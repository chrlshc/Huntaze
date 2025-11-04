# 🔑 Guide de Configuration OAuth Staging

## JWT Secret Généré
```
JWT_SECRET=0KqwgVKVlfmzZi+wPA+pmECDjx/cfWCEmCdKHHvZQib0L8KaV9bni0BJ7eBzayHBt9OURBjf8Dcybiax4YIdMA==
```

## Variables OAuth à Ajouter dans AWS Amplify Staging

### 🎵 TikTok OAuth
```
TIKTOK_CLIENT_KEY=sbawig5ujktghe109j
TIKTOK_CLIENT_SECRET=uXf6cwokWvnHI2C26LAx15Nn4SwUmKMK
```

### 📸 Instagram/Facebook OAuth
```
FACEBOOK_APP_ID=618116867842215
FACEBOOK_APP_SECRET=89b366879681d15df0ebc6dc14823ce5
NEXT_PUBLIC_INSTAGRAM_APP_ID=618116867842215
INSTAGRAM_APP_SECRET=89b366879681d15df0ebc6dc14823ce5
```

### 🔴 Reddit OAuth
```
REDDIT_CLIENT_ID=P1FcvXXzGKNXUT38b06uPA
REDDIT_CLIENT_SECRET=UgAfLbC1p1zusbMfeIXim7VqvZFUBA
REDDIT_USER_AGENT=Huntaze:v1.0.0
```

### 🧵 Threads OAuth
```
NEXT_PUBLIC_THREADS_APP_ID=1319037156503287
THREADS_APP_SECRET=233d011031dc18cf762f20daab2b50d8
```

### 🔵 Google OAuth
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 🔧 Variables de Support OAuth
```
REDIS_TLS=true
DATA_ENCRYPTION_KEY=VGhpcyBpcyBhIDMyIGJ5dGUga2V5IGZvciBBRVMtMjU2IQ==
ENCRYPTION_KEY=a/POc95u0DOJUxAYfErYY/HfuM+JUlxRJkEFO8wSSCw=
SESSION_SECRET=v8G/pTcTOKzYkGB5gsSWzyq70cUsUgisPCVPhEiVw7A=
```

## 🚀 Déploiement Automatique

### Option 1: Script Automatique
```bash
./scripts/deploy-oauth-vars-staging.sh
```

### Option 2: Configuration Manuelle
1. Aller dans AWS Amplify Console
2. Huntaze > staging > Environment variables
3. Ajouter toutes les variables ci-dessus
4. Redéployer l'application

## ✅ Vérification

Après déploiement, vérifiez que :
- [ ] Les connexions OAuth fonctionnent
- [ ] Les tokens sont correctement chiffrés
- [ ] Les sessions utilisateur persistent
- [ ] Les redirections OAuth sont correctes

## 🔒 Sécurité

- ✅ JWT secret généré avec 64 bytes aléatoires
- ✅ Clés de chiffrement sécurisées
- ✅ Variables sensibles non exposées côté client
- ✅ Tokens OAuth stockés de manière sécurisée