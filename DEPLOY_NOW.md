# 🚀 DEPLOY NOW - 3 Commandes

## Checkpoint Avant Exécution

```bash
# 1. Vérifier la branche
git branch
# ✅ Doit afficher: * main

# 2. Dry-run pour voir ce qui sera supprimé
bash scripts/cleanup-for-production.sh --dry-run
# ✅ Confirme ~178 fichiers à supprimer
```

## Exécution (Copy-Paste)

```bash
# Étape 1: Cleanup (5 min)
bash scripts/cleanup-for-production.sh

# Étape 2: Commit
git commit -m "chore: cleanup for production beta - reduce to 500 files"

# Étape 3: Fix & Deploy (18 min)
bash scripts/fix-dependencies.sh
git push origin main
```

## Résultat Attendu

- ✅ Fichiers: 130,495 → ~500
- ✅ Build: SUCCESS en 6-8 min
- ✅ Beta: LIVE dans 23 minutes

## Si Problème

```bash
# Restaurer le backup
git stash list
git stash apply stash@{0}
```

---

**Prêt?** Execute les 3 commandes ci-dessus 🚀
