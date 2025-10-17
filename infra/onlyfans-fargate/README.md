# Déploiement Fargate du scraper OnlyFans

Ce dossier contient les artefacts d’infrastructure pour déployer un agent Puppeteer-Stealth dans AWS Fargate. L’agent consomme les jobs envoyés par le dispatcher Lambda ➜ API Gateway WebSocket déjà en place.

## Prérequis

- ECR repository `huntaze-onlyfans-scraper`
- IAM roles :
  - `ecsTaskExecutionRole` (policy `AmazonECSTaskExecutionRolePolicy` + accès ECR)
  - `huntazeScraperTaskRole` (S3 PutObject, CloudWatch logs, SSM ParameterStore si credentials)
- VPC privé + subnets + NAT gateways pour sortir sur Internet
- SQS / Lambda / DynamoDB existants pour l’orchestration

## Étapes

1. **Build & push** l’image (voir `agents/onlyfans-scraper/README.md`).
2. **Créer le groupe CloudWatch logs** : `/ecs/huntaze-scraper`.
3. **Enregistrer la task definition** :

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.sample.json
```

4. **Créer ou mettre à jour le service ECS** :

```bash
aws ecs create-service \
  --cluster huntaze-cluster \
  --service-name onlyfans-scraper \
  --task-definition huntaze-onlyfans-scraper \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-1,subnet-2],securityGroups=[sg-1],assignPublicIp=DISABLED}"
```

5. **Auto-scaling** (optionnel) : scale up/down selon la taille SQS (`approximateNumberOfMessages`).
6. **Rotation NAT/IP** : prévoir un script Lambda (voir notes d’architecture) pour recréer les NAT Gateways à intervalle défini.

## Variables importantes

- `WS_URL` : URL WebSocket du dispatcher (API Gateway).
- `RESULT_BUCKET` : Bucket S3 où l’agent dépose les résultats.
- `WS_TOKEN` : JWT signé par le backend pour authentifier l’agent (optionnel).
- `AWS_REGION` : Région pour AWS SDK.

## Flux complet

1. **SQS** reçoit un job `onlyfans_scrape`.
2. **Lambda dispatcher** assigne un agent (DynamoDB) et envoie `job_assign` via WebSocket.
3. **Agent Fargate** lance Puppeteer + empreinte client, scrappe OF, sauvegarde JSON dans S3.
4. **Webhook**/WS `job_complete` : le backend met à jour DynamoDB, déclenche traitement (Prisma).
5. **UI Huntaze** affiche les métriques alimentées par Prisma.

## Sécurité

- Stocker les cookies et secrets OnlyFans dans **AWS Secrets Manager** ; l’agent peut les récupérer sur demande.
- Utiliser **AWS WAF** / rate-limiting côté API Gateway pour protéger le dispatcher.
- Journaliser les actions (CloudWatch) et surveiller les erreurs.

## Observabilité

- Métriques CloudWatch : `JobsAssigned`, `DispatcherBatchItemFailures`, `ScrapeDuration` (à ajouter côté agent).
- Alertes SNS en cas d’échecs répétés.
- Traces X-Ray si besoin.
