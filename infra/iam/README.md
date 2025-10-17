# GitHub OIDC → IAM (of-worker ECR push)

Fichiers JSON prêts à adapter (remplacez `ACCOUNT_ID`, `ORG`, `REPO`, `REGION`). Aucune exécution côté repo.

## 1) Trust policy (assume OIDC GitHub, tags v*)

Fichier: `infra/iam/trust-policy.template.json`

- Restreint au repo `ORG/REPO`
- Autorise uniquement les tags `v*` (ex: `v1.2.3`)

## 2) Policy ECR (push of-worker)

Fichier: `infra/iam/ecr-policy.template.json`

- `ecr:GetAuthorizationToken` sur `*`
- Création/Describe du repo (si absent)
- Push/PutImage sur `arn:aws:ecr:REGION:ACCOUNT_ID:repository/of-worker`

## 3) Création rapide (CLI)

```bash
# 0) OIDC provider (si absent)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --client-id-list sts.amazonaws.com

# 1) Rôle assumable via OIDC
aws iam create-role \
  --role-name GitHubActionsECRPush \
  --assume-role-policy-document file://infra/iam/trust-policy.json \
  --max-session-duration 3600

# 2) Attacher la policy ECR (inline)
aws iam put-role-policy \
  --role-name GitHubActionsECRPush \
  --policy-name GitHubActionsECRPushPolicy \
  --policy-document file://infra/iam/ecr-policy.json
```

## 4) GitHub Actions

- Secret repo `AWS_ROLE_TO_ASSUME_ARN` = ARN du rôle `GitHubActionsECRPush`.
- Workflow: `.github/workflows/of-worker-ecr.yml` (déjà présent; déclenché sur tags `v*`).

***

Astuce: si besoin d’autoriser `main`, ajoutez dans la trust policy:

```json
"StringLike": {
  "token.actions.githubusercontent.com:sub": [
    "repo:ORG/REPO:ref:refs/tags/v*",
    "repo:ORG/REPO:ref:refs/heads/main"
  ]
}
```
