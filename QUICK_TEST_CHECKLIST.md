# ⚡ Checklist Test Rapide - 15 Minutes

## 🎯 Tests Essentiels Avant Lancement

### 1. Vérification Basique (2 min)
- [ ] **URL fonctionne**: https://main.d2yjqfqvvvvvvv.amplifyapp.com
- [ ] **Page d'accueil se charge** sans erreur
- [ ] **Boutons "S'inscrire" et "Se connecter"** sont visibles
- [ ] **Design responsive** sur mobile/desktop

### 2. Inscription/Connexion (3 min)
- [ ] **Créer un compte** avec email/mot de passe
- [ ] **Vérification email** fonctionne (si activée)
- [ ] **Connexion** avec les identifiants créés
- [ ] **Redirection vers dashboard** après connexion

### 3. Onboarding Adaptatif (5 min)
- [ ] **Assessment créateur** s'affiche
- [ ] **Sélection niveau** (Débutant/Intermédiaire/Expert)
- [ ] **Choix objectifs** disponibles
- [ ] **Interface s'adapte** selon le profil
- [ ] **Progression sauvegardée** entre les étapes

### 4. Connexion Plateforme (3 min)
- [ ] **Bouton "Connecter TikTok"** accessible
- [ ] **Flow OAuth TikTok** se lance
- [ ] **Redirection après autorisation** fonctionne
- [ ] **Statut "Connecté"** s'affiche

### 5. Création Contenu (2 min)
- [ ] **Bouton "Créer"** accessible
- [ ] **Éditeur de contenu** se charge
- [ ] **Upload d'image** fonctionne
- [ ] **Prévisualisation** disponible

## 🚨 Bugs Critiques à Identifier

### Bloquants Absolus
- [ ] **500 Server Error** sur pages principales
- [ ] **OAuth complètement cassé** (pas de redirection)
- [ ] **Impossible de créer un compte**
- [ ] **Dashboard vide/erreur** après connexion

### Problèmes Majeurs
- [ ] **Lenteur excessive** (> 10s chargement)
- [ ] **Erreurs JavaScript** visibles utilisateur
- [ ] **Design cassé** sur mobile
- [ ] **Fonctionnalités principales inaccessibles**

## ✅ Critères de Validation

### VERT (Lancement OK)
- Tous les tests essentiels passent
- Aucun bug bloquant
- Performance acceptable (< 5s)
- UX fluide

### ORANGE (Corrections mineures)
- 1-2 bugs non-critiques
- Performance correcte
- UX globalement bonne
- Corrections rapides possibles

### ROUGE (Report nécessaire)
- Bugs bloquants identifiés
- Performance inacceptable
- UX cassée
- Corrections majeures requises

## 🚀 Actions Selon Résultat

### Si VERT → LANCER IMMÉDIATEMENT
```bash
# Prêt pour beta launch !
1. Ouvrir les inscriptions
2. Communiquer sur les réseaux
3. Inviter les premiers testeurs
```

### Si ORANGE → CORRECTIONS RAPIDES
```bash
# Fix rapide puis lancement
1. Identifier les bugs mineurs
2. Corrections en 1-2h
3. Re-test rapide
4. Lancement dans la journée
```

### Si ROUGE → DEBUGGING
```bash
# Investigation approfondie
1. Logs détaillés
2. Corrections prioritaires
3. Tests complets
4. Report de 24-48h
```

## 📱 Test Mobile Rapide

### iOS Safari
- [ ] Chargement correct
- [ ] Navigation tactile
- [ ] Formulaires utilisables

### Android Chrome
- [ ] Performance acceptable
- [ ] Boutons cliquables
- [ ] Pas de débordement

## 🔗 Liens de Test Directs

- **Production**: https://main.d2yjqfqvvvvvvv.amplifyapp.com
- **Inscription**: https://main.d2yjqfqvvvvvvv.amplifyapp.com/auth/register
- **Dashboard**: https://main.d2yjqfqvvvvvvv.amplifyapp.com/dashboard
- **Connexion TikTok**: https://main.d2yjqfqvvvvvvv.amplifyapp.com/platforms/connect/tiktok

---

**⏱️ Temps estimé**: 15 minutes maximum
**🎯 Objectif**: Validation GO/NO-GO pour lancement beta