# Requirements Document - AWS Security & Cost Optimization

## Introduction

Suite au déploiement réussi du production hardening initial (alarmes, logs, X-Ray, DLQ), cette feature vise à implémenter 4 optimisations stratégiques AWS pour renforcer la posture de sécurité et la maîtrise des coûts. Ces "next wins" représentent un impact fort avec un effort faible, et complètent la stack de production hardening existante.

## Glossary

- **AWS_System**: L'infrastructure AWS Huntaze comprenant Lambda, RDS, API Gateway, CloudWatch, et les services de sécurité
- **Cost_Anomaly_Detection**: Service AWS qui détecte automatiquement les dépenses inhabituelles via machine learning
- **Security_Hub**: Service centralisé AWS qui agrège et priorise les alertes de sécurité
- **GuardDuty**: Service de détection de menaces qui surveille l'activité malveillante
- **WAF**: Web Application Firewall qui protège les API contre les attaques
- **PITR**: Point-In-Time Recovery, capacité de restaurer une base de données à un instant précis
- **Rate_Limit**: Limitation du nombre de requêtes par IP/client sur une période donnée

## Requirements

### Requirement 1: Cost Monitoring & Alerting

**User Story:** En tant qu'administrateur système, je veux être alerté automatiquement des anomalies de coûts AWS, afin de détecter rapidement les dérapages budgétaires ou les configurations incorrectes.

#### Acceptance Criteria

1. WHEN THE AWS_System détecte une dépense mensuelle dépassant le seuil configuré, THE AWS_System SHALL envoyer une alerte SNS à l'équipe d'administration
2. WHEN Cost_Anomaly_Detection identifie une anomalie de dépense via machine learning, THE AWS_System SHALL notifier l'équipe dans les 24 heures
3. THE AWS_System SHALL maintenir un budget mensuel configuré avec des seuils à 50%, 80% et 100% du montant alloué
4. THE AWS_System SHALL fournir une visibilité sur les coûts par service AWS via le dashboard Cost Explorer

### Requirement 2: Security Posture Management

**User Story:** En tant que responsable sécurité, je veux une vue centralisée des vulnérabilités et menaces de sécurité, afin de prioriser et corriger les risques rapidement.

#### Acceptance Criteria

1. WHEN Security_Hub est activé avec le standard AWS Foundational Best Practices, THE AWS_System SHALL évaluer la conformité de toutes les ressources AWS
2. WHEN GuardDuty détecte une activité suspecte ou malveillante, THE AWS_System SHALL générer une alerte de sécurité dans les 15 minutes
3. THE AWS_System SHALL agréger les findings de sécurité provenant de Security_Hub et GuardDuty dans un dashboard unique
4. THE AWS_System SHALL fournir un score de sécurité global et des recommandations de remédiation priorisées

### Requirement 3: API Protection & Rate Limiting

**User Story:** En tant qu'ingénieur infrastructure, je veux protéger les API contre les attaques par déni de service et les bots malveillants, afin de garantir la disponibilité du service pour les utilisateurs légitimes.

#### Acceptance Criteria

1. WHEN une adresse IP effectue plus de 2000 requêtes en 5 minutes vers l'API Gateway, THE AWS_System SHALL bloquer temporairement cette IP pendant 10 minutes
2. WHEN WAF détecte un pattern d'attaque connu (SQL injection, XSS), THE AWS_System SHALL bloquer la requête et logger l'événement
3. THE AWS_System SHALL maintenir une liste blanche d'IPs de confiance exemptées des rate limits
4. THE AWS_System SHALL fournir des métriques WAF (requêtes bloquées, IPs bannies) dans CloudWatch

### Requirement 4: Database Backup & Recovery

**User Story:** En tant qu'administrateur de base de données, je veux pouvoir restaurer la base de données à n'importe quel instant des 7 derniers jours, afin de récupérer rapidement d'une corruption de données ou d'une erreur humaine.

#### Acceptance Criteria

1. THE AWS_System SHALL configurer RDS avec une rétention de sauvegardes automatiques de 7 jours minimum
2. THE AWS_System SHALL activer PITR sur l'instance RDS de production
3. WHEN une restauration PITR est demandée, THE AWS_System SHALL permettre la restauration à n'importe quelle seconde dans la fenêtre de rétention
4. THE AWS_System SHALL tester automatiquement la restauration d'une sauvegarde chaque mois et alerter en cas d'échec
5. THE AWS_System SHALL documenter la procédure de disaster recovery avec des temps de récupération estimés (RTO/RPO)
