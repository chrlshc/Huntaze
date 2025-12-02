# 🚀 Azure OpenAI pour Huntaze

## Déploiement en 1 commande

```bash
cd infra/terraform/azure-ai && ./deploy-simple.sh
```

## Documentation

- **[START-HERE-AZURE.md](START-HERE-AZURE.md)** - Commencer ici
- **[AZURE-DOCS-INDEX.md](AZURE-DOCS-INDEX.md)** - Tous les guides
- **[MISSION-COMPLETE.md](MISSION-COMPLETE.md)** - Résumé complet

## Ce qui sera créé

- Azure OpenAI (5 modèles : GPT-4 Turbo, GPT-4, GPT-3.5, Vision, Embeddings)
- Cognitive Search (recherche vectorielle)
- Key Vault (secrets)
- Application Insights (monitoring)

## Coût estimé

~$50-100/mois avec usage normal

## Impact sur AWS

Aucun. AWS reste intact.

---

**Durée:** 10 minutes  
**Prérequis:** Azure CLI + Terraform
