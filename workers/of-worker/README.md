# of-worker (Playwright ECS Runner)

Worker Playwright “on-demand” lancé par ECS Fargate. Lit le job depuis S3 (`JOB_S3_KEY`), récupère cookies/proxy (Secrets Manager), exécute l’action et écrit `result.json` dans S3.

## Prérequis
- Docker Buildx + AWS CLI v2
- ECR repo `of-worker` (ou adapte le nom)
- Variables:
  - `AWS_ACCOUNT_ID` (12 chiffres)
  - `AWS_REGION` (ex: eu-west-1)

## 1) Créer le repo ECR (si besoin)
```bash
aws ecr create-repository \
  --repository-name of-worker \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=KMS \
  --region ${AWS_REGION}
```

## 2) Build (linux/amd64) et push

```bash
export AWS_ACCOUNT_ID=123456789012
export AWS_REGION=eu-west-1
export ECR_URI=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/of-worker

# Login ECR
aws ecr get-login-password --region ${AWS_REGION} \
| docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build multi-arch ciblé (Fargate x86_64)
docker buildx build --platform linux/amd64 -t of-worker:latest .

# Tag + push
docker tag of-worker:latest ${ECR_URI}:latest
docker push ${ECR_URI}:latest
```

> Le CDK pointe sur l’image `of-worker:latest` en ECR. Aucune action de déploiement ici.

## Variables attendues à l’exécution (injectées par le dispatcher)

* `STAGE`: `prod` | `staging`
* `RESULTS_BUCKET`: nom du bucket S3 résultats
* **Job** (une des deux):

  * `JOB_S3_KEY`: clé S3 de l’input (recommandé)
  * `JOB_JSON_B64`: fallback si S3 non utilisé
* **Résolution de secrets (via SDK dans le worker)**:

  * `of/cookies/{CREATOR_ID}` (JSON: `storageState` ou `cookies`)
  * `of/proxy/{CREATOR_ID}` (JSON: `{ "url": "http://user:pass@host:port" }`)

## Notes

* L’image runtime est **Playwright v1.47** (Chromium/FF/WebKit préinstallés).
* Le TaskDefinition ECS est forcé en **x86_64 + Linux**. Build l’image avec `--platform linux/amd64`.
* Aucun secret n’est “baked” dans l’image. Tous les secrets sont récupérés à l’exécution via Secrets Manager.
* Logs → CloudWatch `OfWorkerLogs`. Évite `DEBUG` en prod.
* Pour tests locaux (facultatif), fournis des AWS creds et des variables minimales; **ne** pousse pas de secrets en clair.

