# Guide de Déploiement AWS pour Huntaze

## 🚀 Déploiement Rapide

### Prérequis
- Une instance EC2 (Ubuntu 20.04 ou plus récent recommandé)
- Un nom de domaine pointant vers votre instance EC2
- Accès SSH à votre instance

### Étape 1: Configuration initiale de l'instance EC2

Connectez-vous à votre instance EC2 et exécutez :

```bash
# Télécharger le script de configuration
wget https://raw.githubusercontent.com/your-repo/huntaze/main/site-web/setup-aws.sh
chmod +x setup-aws.sh
./setup-aws.sh
```

### Étape 2: Configuration des variables d'environnement

Sur votre instance EC2 :

```bash
cd ~/huntaze
nano .env
```

Ajoutez vos variables (basé sur .env.example) :

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://huntaze.com
# Ajoutez les autres variables nécessaires
```

### Étape 3: Déploiement de l'application

Depuis votre machine locale :

```bash
cd site-web
./deploy-simple.sh <IP-DE-VOTRE-EC2>
```

### Étape 4: Configuration SSL (HTTPS)

Sur votre instance EC2 :

```bash
sudo certbot --nginx -d huntaze.com -d www.huntaze.com
```

## 📋 Scripts Disponibles

### `deploy-simple.sh`
Script de déploiement simple sans Docker. Idéal pour les petites instances.

**Usage :**
```bash
./deploy-simple.sh <IP-EC2>
```

### `deploy-aws.sh`
Script de déploiement complet avec Docker et ECR. Pour une infrastructure plus robuste.

**Usage :**
```bash
./deploy-aws.sh production
```

**Configuration requise :**
- AWS CLI configuré
- ECR repository créé
- Modifier les variables dans le script :
  - `REGISTRY_URL`
  - `AWS_REGION`
  - `EC2_HOST`

### `setup-aws.sh`
Script d'installation initiale sur EC2. Installe Node.js, PM2, Nginx, etc.

## 🔧 Gestion de l'Application

### Voir les logs
```bash
pm2 logs huntaze-site
```

### Redémarrer l'application
```bash
pm2 restart huntaze-site
```

### Voir le statut
```bash
pm2 status
```

### Monitorer l'application
```bash
pm2 monit
```

## 🔍 Dépannage

### L'écran noir persiste ?

1. **Vérifier les logs PM2 :**
   ```bash
   pm2 logs huntaze-site --lines 100
   ```

2. **Vérifier nginx :**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Vérifier que l'app écoute sur le bon port :**
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

4. **Tester en local sur le serveur :**
   ```bash
   curl http://localhost:3000
   ```

### Erreur de build ?

1. **Vérifier la mémoire disponible :**
   ```bash
   free -h
   ```
   
   Si insuffisant, créer un swap :
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Nettoyer et rebuild :**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

### Problème de certificat SSL ?

```bash
# Renouveler manuellement
sudo certbot renew --dry-run

# Si erreur, recréer
sudo certbot delete --cert-name huntaze.com
sudo certbot --nginx -d huntaze.com -d www.huntaze.com
```

## 🔒 Sécurité

### Configurer le firewall
```bash
sudo ufw status
sudo ufw allow from <VOTRE-IP> to any port 22  # SSH seulement depuis votre IP
```

### Sauvegardes automatiques
Ajoutez au crontab :
```bash
crontab -e
# Ajouter :
0 2 * * * tar -czf ~/backups/huntaze-$(date +\%Y\%m\%d).tar.gz ~/huntaze
```

## 📊 Monitoring

### Avec PM2
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Health Check
L'endpoint `/api/health` doit retourner un status 200.

Test :
```bash
curl -f https://huntaze.com/api/health
```

## 🚨 Rollback

Si quelque chose ne va pas :

```bash
# Voir les versions déployées
pm2 list

# Redémarrer avec la version précédente
cd ~/huntaze
git checkout <commit-precedent>
npm install
npm run build
pm2 restart huntaze-site
```

## 📞 Support

Pour toute question ou problème :
1. Vérifiez d'abord les logs
2. Consultez la documentation Next.js
3. Ouvrez une issue sur le repository