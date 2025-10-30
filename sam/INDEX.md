# 📚 Documentation Index - Beta Launch

## 🚀 Quick Start (Start Here!)

1. **[BETA_LAUNCH_README.md](./BETA_LAUNCH_README.md)** ⭐
   - Overview complet
   - Architecture déployée
   - Status et checklist
   - **Start here if you're new**

2. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⚡
   - Commandes rapides copy-paste
   - URLs monitoring
   - Decision matrix
   - **Keep this handy during launch**

---

## 📖 Guides Opérationnels

### Pour la Beta Fermée (3h)

3. **[BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md)** 📋
   - Playbook détaillé phase par phase
   - Timeline H+0 → H+3
   - Seuils Go/No-Go
   - Procédures rollback
   - **Follow this during beta launch**

4. **[BETA_IMPLEMENTATION_COMPLETE.md](./BETA_IMPLEMENTATION_COMPLETE.md)** ✅
   - Récapitulatif de l'implémentation
   - Composants déployés
   - Fonctionnalités implémentées
   - Tests et résultats
   - **Read this to understand what's deployed**

---

## 🔧 Guides Techniques

### Monitoring & Debugging

5. **[LOGS_INSIGHTS_QUERIES.md](./LOGS_INSIGHTS_QUERIES.md)** 📊
   - 8 requêtes production-ready
   - Syntaxe et patterns
   - Tips et best practices
   - Dashboard widgets
   - **Use this for CloudWatch Logs Insights**

6. **[XRAY_TRACING_GUIDE.md](./XRAY_TRACING_GUIDE.md)** 🔍
   - Annotations X-Ray
   - Filtres console et CLI
   - Debugging workflows
   - X-Ray Insights
   - **Use this for X-Ray debugging**

### Infrastructure

7. **[README.md](./README.md)** 🏗️
   - Documentation technique complète
   - Architecture détaillée
   - Configuration SAM
   - Déploiement et tests
   - **Read this for technical details**

---

## 🛠️ Scripts

### Scripts Opérationnels

8. **[enable-canary.sh](./enable-canary.sh)** 🎛️
   ```bash
   ./enable-canary.sh
   ```
   - Active le canary 1%
   - Déploie feature flag AppConfig
   - Affiche les commandes de monitoring

9. **[monitor-beta.sh](./monitor-beta.sh)** 📈
   ```bash
   ./monitor-beta.sh          # Snapshot
   ./monitor-beta.sh --watch  # Continuous
   ./monitor-beta.sh --test   # Generate traffic
   ```
   - Monitoring temps réel
   - Métriques Lambda
   - Status alarmes
   - Logs récents

10. **[test-beta-ready.sh](./test-beta-ready.sh)** 🧪
    ```bash
    ./test-beta-ready.sh
    ```
    - 12 tests automatisés
    - Validation infrastructure
    - Vérification configurations
    - Tests bout en bout

---

## 📁 Fichiers de Configuration

### Infrastructure as Code

11. **[template.yaml](./template.yaml)** ☁️
    - SAM template complet
    - Lambda functions
    - AppConfig
    - CloudWatch alarms
    - CodeDeploy

12. **[cloudwatch-dashboard.json](./cloudwatch-dashboard.json)** 📊
    - Dashboard configuration
    - Widgets métriques
    - Logs Insights queries
    - Annotations

---

## 🎯 Par Cas d'Usage

### Je veux lancer la beta
1. [BETA_LAUNCH_README.md](./BETA_LAUNCH_README.md) - Overview
2. [test-beta-ready.sh](./test-beta-ready.sh) - Vérifier readiness
3. [BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md) - Suivre le playbook
4. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Commandes rapides

### Je veux monitorer la beta
1. [monitor-beta.sh](./monitor-beta.sh) - Script monitoring
2. [LOGS_INSIGHTS_QUERIES.md](./LOGS_INSIGHTS_QUERIES.md) - Requêtes Logs
3. [XRAY_TRACING_GUIDE.md](./XRAY_TRACING_GUIDE.md) - Traces X-Ray
4. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - URLs et commandes

### Je veux débugger un problème
1. [XRAY_TRACING_GUIDE.md](./XRAY_TRACING_GUIDE.md) - Debugging workflows
2. [LOGS_INSIGHTS_QUERIES.md](./LOGS_INSIGHTS_QUERIES.md) - Query 7 (erreurs)
3. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Commandes logs
4. [BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md) - Section Troubleshooting

### Je veux faire un rollback
1. [BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md) - Section Rollback
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Commandes rollback
3. [enable-canary.sh](./enable-canary.sh) - Re-run pour désactiver

### Je veux comprendre l'architecture
1. [BETA_LAUNCH_README.md](./BETA_LAUNCH_README.md) - Diagramme architecture
2. [README.md](./README.md) - Documentation technique
3. [BETA_IMPLEMENTATION_COMPLETE.md](./BETA_IMPLEMENTATION_COMPLETE.md) - Composants
4. [template.yaml](./template.yaml) - Infrastructure as Code

---

## 📊 Monitoring URLs

### CloudWatch
- **Dashboard:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=huntaze-prisma-migration
- **Logs Insights:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:logs-insights
- **Alarms:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:

### X-Ray
- **Service Map:** https://console.aws.amazon.com/xray/home?region=us-east-1#/service-map
- **Traces (all):** https://console.aws.amazon.com/xray/home?region=us-east-1#/traces
- **Traces (canary):** https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=annotation.canary%20%3D%20true
- **Traces (errors):** https://console.aws.amazon.com/xray/home?region=us-east-1#/traces?filter=error%20%3D%20true

### AWS Console
- **Lambda:** https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions
- **AppConfig:** https://console.aws.amazon.com/systems-manager/appconfig
- **CodeDeploy:** https://console.aws.amazon.com/codesuite/codedeploy/applications

---

## 🎓 Learning Path

### Débutant
1. [BETA_LAUNCH_README.md](./BETA_LAUNCH_README.md) - Comprendre l'architecture
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Apprendre les commandes
3. [test-beta-ready.sh](./test-beta-ready.sh) - Exécuter les tests

### Intermédiaire
4. [BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md) - Suivre le playbook
5. [monitor-beta.sh](./monitor-beta.sh) - Utiliser le monitoring
6. [LOGS_INSIGHTS_QUERIES.md](./LOGS_INSIGHTS_QUERIES.md) - Analyser les logs

### Avancé
7. [XRAY_TRACING_GUIDE.md](./XRAY_TRACING_GUIDE.md) - Debugging avancé
8. [README.md](./README.md) - Architecture technique
9. [template.yaml](./template.yaml) - Infrastructure as Code

---

## 📝 Checklist Documentation

- [x] Overview complet (BETA_LAUNCH_README.md)
- [x] Playbook détaillé (BETA_PLAYBOOK.md)
- [x] Commandes rapides (QUICK_REFERENCE.md)
- [x] Logs Insights queries (LOGS_INSIGHTS_QUERIES.md)
- [x] X-Ray guide (XRAY_TRACING_GUIDE.md)
- [x] Documentation technique (README.md)
- [x] Récapitulatif implémentation (BETA_IMPLEMENTATION_COMPLETE.md)
- [x] Scripts opérationnels (3 scripts)
- [x] Configuration infrastructure (template.yaml)
- [x] Index navigation (INDEX.md)

---

## 🆘 Emergency

**Rollback Automatique:**
- CloudWatch Alarm → CodeDeploy rollback
- Pas d'intervention nécessaire

**Rollback Manuel:**
```bash
./enable-canary.sh  # Re-run pour désactiver
```

**Support:**
- Voir [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Section Rollback
- Voir [BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md) - Section Rollback

---

## 📞 Contacts

**Documentation:**
- Questions architecture: [README.md](./README.md)
- Questions opérationnelles: [BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md)
- Questions monitoring: [LOGS_INSIGHTS_QUERIES.md](./LOGS_INSIGHTS_QUERIES.md)

**AWS Support:**
- Console: https://console.aws.amazon.com/support/

---

## 🎯 Quick Navigation

| Je veux... | Fichier |
|------------|---------|
| Lancer la beta | [BETA_PLAYBOOK.md](./BETA_PLAYBOOK.md) |
| Voir les commandes | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| Monitorer | [monitor-beta.sh](./monitor-beta.sh) |
| Analyser les logs | [LOGS_INSIGHTS_QUERIES.md](./LOGS_INSIGHTS_QUERIES.md) |
| Débugger X-Ray | [XRAY_TRACING_GUIDE.md](./XRAY_TRACING_GUIDE.md) |
| Comprendre l'archi | [BETA_LAUNCH_README.md](./BETA_LAUNCH_README.md) |
| Faire un rollback | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| Tester readiness | [test-beta-ready.sh](./test-beta-ready.sh) |

---

**📚 Total: 12 fichiers de documentation + 3 scripts opérationnels**

**🎉 Everything you need for a successful beta launch!**

