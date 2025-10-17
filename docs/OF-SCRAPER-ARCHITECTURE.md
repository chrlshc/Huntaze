# OnlyFans Scraper - Architecture mixte (Dispatcher + Fargate)

Ce document détaille comment orchestrer le scraping OnlyFans en réutilisant l’infrastructure SQS ➜ Lambda ➜ API Gateway existante et en déléguant l’exécution headless à des agents Puppeteer dans Fargate.

## Flux end-to-end

```
Huntaze Backend
   │
   ├─> SQS (queue scraper)
   │      message: { jobId, type: "onlyfans_scrape", scrapeType }
   │
   └─ Lambda dispatcher (infra existante)
          • vérifie l’agent dans DynamoDB
          • envoie `job_assign` via WebSocket API GW

Fargate agent (agents/onlyfans-scraper)
   • applique un profil navigateur (Puppeteer-Stealth)
   • se loggue (cookies fournis) et scrappe OF
   • sauvegarde JSON (S3) + `job_complete` via WebSocket

Lambda ingestion (à ajouter)
   • consomme `job_complete`
   • charge les JSON S3 -> Prisma (`Content`, `ContentPerformance`, `Fan`)
   • déclenche recalcul analytics/autopilot
```

## Déploiement

1. **Build** l’image Docker (`agents/onlyfans-scraper`).
2. **Publier** sur ECR par région.
3. **Enregistrer** la task definition (cf. `infra/onlyfans-fargate/task-definition.sample.json`).
4. **Créer le service** Fargate (≥2 tâches pour HA) dans des subnets privés + NAT.
5. **Configurer** auto-scaling selon la profondeur SQS (CloudWatch alarm ➜ Application Auto Scaling).

## Rotation d’IP

- Subnets multi-AZ + NAT gateways (une par AZ) pour varier les IP publiques.
- Lambda périodique pour recréer les NAT (optionnel, si besoin de cycle IP court).
- Possibilité d’utiliser des comptes AWS secondaires pour élargir la plage IP.

## Sécurité

- Credentials/cookies OnlyFans stockés dans AWS Secrets Manager ; l’agent les récupère via AWS SDK (SSM ou Secrets).
- IAM minimum : S3 PutObject, CloudWatch Logs, GetSecretValue, DynamoDB access (pour ack jobs si nécessaire).
- WAF sur API Gateway pour protéger le dispatcher.

## Points à implémenter côté Huntaze

- Créer un Lambda `onlyfans-job-result` (HTTP ou SQS) pour ingérer les résultats JSON si besoin.
- Mapper `scrapeType` ➜ parseur (posts/messages/analytics) et remplir Prisma (`huntaze-starter/prisma`).
- Exposer une API `/api/onlyfans/scrape` pour déclencher manuellement les jobs depuis l’UI.

## Monitoring

- CloudWatch metrics : `JobsAssigned`, `JobFailures`, `ScrapeDuration` (à instrumenter dans l’agent).
- Logs Fargate agrégés dans `/ecs/huntaze-scraper` (recherche des erreurs Puppeteer).
- Alerting SNS quand `DispatcherBatchItemFailures` > seuil.

## Limitations

- Nécessite des cookies OF valides et le respect des CGU.
- OF peut changer ses protections (fingerprinting, captcha). Prévoir des mises à jour régulières.
- Les temps de scraping doivent rester bas (< 5 min) pour éviter les timeouts Fargate.

Cette solution offre un scraping fiable sans proxy payant, tout en exploitant ta stack AWS existante et en conservant une empreinte client réaliste.
