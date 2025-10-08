# Huntaze AWS Deployment Guide

## ✅ Recommended: AWS Amplify Hosting (Staging & Production)

Huntaze now deploys the App Router build through **AWS Amplify Hosting**. Each Amplify environment is connected to a Git branch:

- `staging` branch → Amplify **Staging** environment (preview & QA)
- `main` (or `prod`) branch → Amplify **Production** environment

### 1. Configure environment variables

In the Amplify console, open **App settings → Environment variables** for each environment and make sure the following variables are set:

```
NEXT_PUBLIC_APP_URL=https://staging.huntaze.com   # or https://huntaze.com in production
NEXT_PUBLIC_API_URL=https://api.huntaze.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=…
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=…
TIKTOK_CLIENT_KEY=…
TIKTOK_CLIENT_SECRET=…
TIKTOK_SANDBOX_MODE=true
STAGING_BYPASS_AUTH=true          # optional, staging only
```

See `aws-amplify-env-vars.txt` for the latest list pulled from recent build logs.

### 2. Push the desired branch

Amplify watches the GitHub repository `github.com/chrlshc/huntaze`. From your local clone:

```bash
git remote add amplify https://github.com/chrlshc/huntaze.git  # once
git push amplify staging                                      # deploy to Amplify Staging
git push amplify main                                         # deploy to Amplify Production
```

Amplify will:
1. Install dependencies (`npm ci`)
2. Run `npm run build`
3. Host the Next.js SSR build on the managed infrastructure

### 3. Monitor builds

- Open the Amplify console → *Front-end environments* → select **Staging** or **Production**
- Check the build logs, verify status `SUCCEEDED`
- Use “Redeploy this version” if you need to re-run a failed build without new commits

> 💡 The sections below cover **legacy EC2/ECS scripts**. Keep them for fall-back or self-managed hosting, but Amplify is the current path for staging/production.

## 🚀 Quick Deployment

### Prerequisites
- An EC2 instance (Ubuntu 20.04+ recommended)
- A domain pointing to your EC2 instance
- SSH access to your instance

### Step 1: Initial EC2 setup

SSH into your EC2 instance and run:

```bash
# Download setup script
wget https://raw.githubusercontent.com/your-repo/huntaze/main/site-web/setup-aws.sh
chmod +x setup-aws.sh
./setup-aws.sh
```

### Step 2: Environment variables

On your EC2 instance:

```bash
cd ~/huntaze
nano .env
```

Add your variables (based on .env.example):

```env
NODE_ENV=production
# Frontend/App URL
NEXT_PUBLIC_APP_URL=https://huntaze.com
# API origin (no trailing slash, no "/api")
NEXT_PUBLIC_API_URL=https://api.huntaze.com
# Add other required variables
```

### Step 3: Deploy the app

From your local machine:

```bash
cd site-web
./deploy-simple.sh <YOUR-EC2-IP>
```

### Step 4: SSL (HTTPS) setup

On your EC2 instance:

```bash
sudo certbot --nginx -d huntaze.com -d www.huntaze.com
```

## 📋 Available Scripts

### `deploy-simple.sh`
Simple deployment without Docker. Ideal for small instances.

**Usage:**
```bash
./deploy-simple.sh <IP-EC2>
```

### `deploy-aws.sh`
Full deployment with Docker and ECR. For a more robust setup.

**Usage:**
```bash
./deploy-aws.sh production
```

**Requirements:**
- AWS CLI configured
- ECR repository created
- Update variables in the script:
  - `REGISTRY_URL`
  - `AWS_REGION`
  - `EC2_HOST`

### `setup-aws.sh`
Initial EC2 setup script. Installs Node.js, PM2, Nginx, etc.

## 🔧 App Management

### View logs
```bash
pm2 logs huntaze-site
```

### Restart the app
```bash
pm2 restart huntaze-site
```

### View status
```bash
pm2 status
```

### Monitor the app
```bash
pm2 monit
```

## 🔍 Troubleshooting

### Black screen persists?

1. **Check PM2 logs:**
   ```bash
   pm2 logs huntaze-site --lines 100
   ```

2. **Check nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verify the app listens on the right port:**
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

4. **Test locally on the server:**
   ```bash
   curl http://localhost:3000
   ```

### Build error?

1. **Check available memory:**
   ```bash
   free -h
   ```
   
   If insufficient, create swap:
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **Clean and rebuild:**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

### SSL certificate issues?

```bash
# Renew manually
sudo certbot renew --dry-run

# If error, recreate
sudo certbot delete --cert-name huntaze.com
sudo certbot --nginx -d huntaze.com -d www.huntaze.com
```

## 🔒 Security

### Configure firewall
```bash
sudo ufw status
sudo ufw allow from <YOUR-IP> to any port 22  # SSH only from your IP
```

### Automatic backups
Add to crontab:
```bash
crontab -e
# Add:
0 2 * * * tar -czf ~/backups/huntaze-$(date +\%Y\%m\%d).tar.gz ~/huntaze
```

## 📊 Monitoring

### With PM2
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Health Check
The `/api/health` endpoint should return status 200.

Test:
```bash
curl -f https://huntaze.com/api/health
```

## 🚨 Rollback

If something goes wrong:

```bash
# See deployed versions
pm2 list

# Restart with previous version
cd ~/huntaze
git checkout <commit-precedent>
npm install
npm run build
pm2 restart huntaze-site
```

## 📞 Support

For questions or issues:
1. Check logs first
2. Consult Next.js documentation
3. Open an issue on the repository
