# Installation Extension Chrome Huntaze OnlyFans

## 🚀 Installation Rapide

### 1. Prérequis
- Chrome ou Brave Browser
- Compte OnlyFans creator actif

### 2. Installation

1. **Télécharger l'extension**
   - Cloner le repo ou télécharger les fichiers de l'extension

2. **Charger dans Chrome**
   - Ouvrir `chrome://extensions`
   - Activer le **Mode développeur** (en haut à droite)
   - Cliquer sur **Charger l'extension non empaquetée**
   - Sélectionner le dossier `chrome-extension`

3. **Vérifier l'installation**
   - L'icône Huntaze devrait apparaître dans la barre d'outils
   - L'extension devrait afficher "Active" dans chrome://extensions

## 🔧 Configuration AWS

L'extension est **déjà configurée** pour se connecter à AWS:

- **WebSocket URL**: `wss://p6ng3p6f49.execute-api.us-west-1.amazonaws.com/production`
- **Region**: us-west-1
- **Tables DynamoDB**: 
  - `huntaze-onlyfans-scraped-data`
  - `huntaze-onlyfans-connections`

## 📊 Utilisation

1. **Se connecter à OnlyFans**
   - Aller sur https://onlyfans.com
   - Se connecter avec votre compte creator

2. **Scraping Automatique**
   - L'extension commence à scraper automatiquement:
     - Profil creator
     - Liste des fans
     - Messages
     - Transactions
     - Statistiques

3. **Données en Temps Réel**
   - Nouveaux messages
   - Fans en ligne
   - Tips reçus
   - Nouvelles souscriptions

## 🔍 Vérification

Pour vérifier que l'extension fonctionne:

1. **Console Chrome** (F12)
   - Onglet Console
   - Vous devriez voir:
     ```
     Huntaze Background Service Worker initialized
     WebSocket connected to AWS
     Huntaze OnlyFans Manager loaded
     ```

2. **AWS CloudWatch**
   - Les logs des Lambda functions
   - Les données dans DynamoDB

## 🛠️ Dépannage

### WebSocket ne se connecte pas
- Vérifier la connexion internet
- Vérifier dans chrome://extensions que l'extension est activée
- Recharger l'extension

### Données non scrapées
- Vérifier que vous êtes sur onlyfans.com
- Rafraîchir la page
- Vérifier les permissions de l'extension

### Erreurs AWS
- Vérifier les logs CloudWatch
- Vérifier que les tables DynamoDB existent
- Vérifier les permissions Lambda

## 📱 Notifications

L'extension envoie des notifications pour:
- Nouveaux messages de fans VIP
- Tips reçus
- Fans VIP en ligne
- Jalons atteints

## 🔐 Sécurité

- Les données sont cryptées en transit (WSS)
- Stockage sécurisé dans AWS DynamoDB
- Pas de stockage local de données sensibles
- Authentification via cookies OnlyFans

## 📞 Support

En cas de problème:
1. Vérifier les logs dans la console Chrome
2. Vérifier AWS CloudWatch pour les erreurs serveur
3. Contacter le support Huntaze

---

**Version**: 2.0.0  
**Dernière mise à jour**: 24/09/2025  
**AWS Deployment**: Production