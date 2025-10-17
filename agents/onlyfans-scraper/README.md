# Huntaze OnlyFans Scraper Agent (Fargate)

Agent Node.js exécuté dans AWS Fargate pour consommer les jobs envoyés par le dispatcher WebSocket (SQS ➜ Lambda ➜ API Gateway). Il applique une empreinte navigateur (Puppeteer Stealth), navigue sur OnlyFans et renvoie les données vers S3 + WebSocket.

## Structure

```
agents/onlyfans-scraper/
├─ Dockerfile           # image Fargate (Node.js + Chromium deps)
├─ package.json
├─ tsconfig.json
├─ src/
│  └─ agent.ts          # WebSocket client + Puppeteer-Stealth scraper
└─ README.md
```

## Variables d'environnement

| Variable         | Description                                                   |
|------------------|---------------------------------------------------------------|
| `WS_URL`         | URL WebSocket du dispatcher API Gateway (`wss://.../prod`)    |
| `WS_TOKEN`       | (optionnel) Jeton JWT si le dispatcher le requiert            |
| `AGENT_ID`       | (optionnel) Identifiant statique de l'agent                   |
| `AWS_REGION`     | Région AWS (défaut `us-east-1`)                               |
| `RESULT_BUCKET`  | (optionnel) Bucket S3 où stocker les résultats JSON           |
| `AGENT_VERSION`  | (optionnel) Version affichée lors du register                 |

## Build & push

```bash
# À la racine du repo
cd agents/onlyfans-scraper
npm install
npm run build

# Build docker
docker build -t huntaze-onlyfans-scraper .

# Tag & push vers ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag huntaze-onlyfans-scraper:latest <account>.dkr.ecr.<region>.amazonaws.com/huntaze-onlyfans-scraper:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/huntaze-onlyfans-scraper:latest
```

## Déploiement Fargate (extrait Terraform / CloudFormation)

```json
{
  "family": "huntaze-onlyfans-scraper",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/huntazeScraperTaskRole",
  "containerDefinitions": [
    {
      "name": "puppeteer-agent",
      "image": "ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/huntaze-onlyfans-scraper:latest",
      "essential": true,
      "environment": [
        { "name": "WS_URL", "value": "wss://XXXX.execute-api.REGION.amazonaws.com/prod" },
        { "name": "RESULT_BUCKET", "value": "huntaze-scraper-results" },
        { "name": "AWS_REGION", "value": "REGION" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/huntaze-scraper",
          "awslogs-region": "REGION",
          "awslogs-stream-prefix": "fargate"
        }
      }
    }
  ]
}
```

## Flux de job

1. Dispatcher Lambda envoie `job_assign` `{ type: "onlyfans_scrape", scrapeType: "posts" }`.
2. Agent sélectionne un profil navigateur, lance Puppeteer-Stealth, applique fingerprint.
3. Navigation et extraction (posts, messages, analytics).
4. Résultat JSON enregistré dans S3 (si `RESULT_BUCKET` présent) + accusé via WebSocket.
5. Dispatcher marque le job comme complété (DynamoDB + métriques).

## Notes

- Le scraper suppose que les cookies/credentials valides sont fournis dans le job (`payload.cookies` ou `payload.credentials`).
- N'oublie pas de branchement avec la logique Huntaze (persist S3 ➜ Lambda ➜ Prisma).
- Pour la rotation d'IP, déploie les tâches Fargate sur plusieurs subnets + NAT gateways distincts ou across accounts.
- Ajoute un auto-scaling ECS se basant sur la profondeur de la queue SQS.
```
