# Test du Flow - Guide Rapide

## Serveur Démarré ✅

Le serveur de développement est en cours d'exécution :
- **Local:** http://localhost:3000
- **Network:** http://192.168.1.109:3000

## Test Rapide du Flow

### 1. Homepage
```
URL: http://localhost:3000/
```

**À vérifier :**
- [ ] Page s'affiche correctement
- [ ] Header marketing visible (logo, navigation)
- [ ] Hero section avec headline
- [ ] Bouton "Get Started" visible
- [ ] Footer marketing visible

**Action :**
- Cliquer sur "Get Started"
- Devrait rediriger vers `/signup`

---

### 2. Signup
```
URL: http://localhost:3000/signup
```

**À vérifier :**
- [ ] Page signup s'affiche
- [ ] Logo Huntaze en haut
- [ ] Titre "Create your account"
- [ ] Boutons social auth (Google, GitHub)
- [ ] Formulaire email
- [ ] Lien "Already have an account? Sign in"

**Action :**
- S'inscrire avec email ou social auth
- Devrait rediriger vers `/onboarding`

---

### 3. Onboarding
```
URL: http://localhost:3000/onboarding
```

**À vérifier :**
- [ ] Page onboarding s'affiche
- [ ] Progress bar (Step 1/3, 2/3, 3/3)
- [ ] Step 1: Connect Your Accounts
- [ ] Step 2: Preview Your Dashboard
- [ ] Step 3: Explore Features
- [ ] Boutons Skip et Continue

**Action :**
- Compléter les 3 étapes
- Cliquer sur "Get Started" à la fin
- Devrait rediriger vers `/dashboard`

---

### 4. Dashboard
```
URL: http://localhost:3000/dashboard
```

**À vérifier :**
- [ ] **Header visible** avec :
  - [ ] Logo/titre "Huntaze"
  - [ ] Bouton notifications (cloche)
  - [ ] Avatar utilisateur
  - [ ] Nom et email utilisateur
  - [ ] Bouton logout
  - [ ] Menu hamburger (mobile)

- [ ] **Sidebar visible (desktop)** avec :
  - [ ] Logo "Huntaze"
  - [ ] Navigation items :
    - [ ] Dashboard (actif)
    - [ ] Analytics
    - [ ] Content
    - [ ] Messages
    - [ ] Integrations
    - [ ] Settings
  - [ ] Lien "Back to Home"

- [ ] **Contenu dashboard** :
  - [ ] Titre "Dashboard"
  - [ ] Summary cards (Revenue, Fans, Messages, Engagement)
  - [ ] Quick Actions (si intégrations connectées)
  - [ ] Recent Activity (si intégrations connectées)

**Actions à tester :**
1. Cliquer sur chaque item de navigation
2. Vérifier que l'item actif est highlighted
3. Réduire la fenêtre (mobile)
4. Vérifier que le menu hamburger apparaît
5. Cliquer sur le hamburger
6. Vérifier que la sidebar s'ouvre en overlay
7. Cliquer sur un item
8. Vérifier que la sidebar se ferme
9. Cliquer sur "Back to Home"
10. Vérifier redirection vers homepage

---

## Test Responsive

### Desktop (≥ 768px)
```
Largeur: 1024px ou plus
```

**À vérifier :**
- [ ] Sidebar visible à gauche
- [ ] Header en haut
- [ ] Menu hamburger caché
- [ ] Layout en 2 colonnes (sidebar + content)

### Tablet (768px - 1024px)
```
Largeur: 768px - 1024px
```

**À vérifier :**
- [ ] Sidebar visible mais plus étroite
- [ ] Header en haut
- [ ] Menu hamburger caché
- [ ] Layout adapté

### Mobile (< 768px)
```
Largeur: < 768px
```

**À vérifier :**
- [ ] Sidebar cachée
- [ ] Header en haut
- [ ] Menu hamburger visible
- [ ] Layout en 1 colonne
- [ ] Cliquer hamburger ouvre sidebar
- [ ] Overlay semi-transparent visible
- [ ] Cliquer overlay ferme sidebar

---

## Test des Redirections

### Non-Authentifié

1. **Accès direct à `/dashboard`**
   ```
   http://localhost:3000/dashboard
   ```
   - Devrait rediriger vers `/auth/login`

2. **Accès direct à `/onboarding`**
   ```
   http://localhost:3000/onboarding
   ```
   - Devrait rediriger vers `/auth/login`

### Authentifié (Onboarding Non Complété)

1. **Accès à `/signup`**
   ```
   http://localhost:3000/signup
   ```
   - Devrait rediriger vers `/dashboard`

2. **Accès à `/onboarding`**
   ```
   http://localhost:3000/onboarding
   ```
   - Devrait afficher l'onboarding

### Authentifié (Onboarding Complété)

1. **Accès à `/signup`**
   ```
   http://localhost:3000/signup
   ```
   - Devrait rediriger vers `/dashboard`

2. **Accès à `/onboarding`**
   ```
   http://localhost:3000/onboarding
   ```
   - Devrait rediriger vers `/dashboard`

---

## Test de Navigation

### Depuis Homepage

1. Cliquer "Get Started" (non-auth)
   - [ ] Redirige vers `/signup`

2. Cliquer "Get Started" (auth)
   - [ ] Redirige vers `/dashboard`

### Depuis Dashboard

1. Cliquer "Dashboard"
   - [ ] Reste sur `/dashboard`
   - [ ] Item highlighted

2. Cliquer "Analytics"
   - [ ] Navigue vers `/analytics`
   - [ ] Item highlighted

3. Cliquer "Content"
   - [ ] Navigue vers `/content`
   - [ ] Item highlighted

4. Cliquer "Messages"
   - [ ] Navigue vers `/messages`
   - [ ] Item highlighted

5. Cliquer "Integrations"
   - [ ] Navigue vers `/integrations`
   - [ ] Item highlighted

6. Cliquer "Settings"
   - [ ] Navigue vers `/settings`
   - [ ] Item highlighted

7. Cliquer "Back to Home"
   - [ ] Navigue vers `/`
   - [ ] Homepage s'affiche

---

## Problèmes Connus

### Warning Turbopack
```
⚠ The "middleware" file convention is deprecated
```
- **Impact :** Aucun, juste un warning
- **Solution :** Peut être ignoré pour l'instant

### Redis Errors (Build)
```
[ioredis] Unhandled error event: Error: connect ETIMEDOUT
```
- **Impact :** Aucun, fallback in-memory utilisé
- **Solution :** Normal en développement local sans Redis

---

## Checklist Complète

### Flow Principal
- [ ] Homepage → Signup
- [ ] Signup → Onboarding
- [ ] Onboarding → Dashboard
- [ ] Dashboard avec Header + Sidebar

### Composants
- [ ] Header fonctionne
- [ ] Sidebar fonctionne (desktop)
- [ ] MobileSidebar fonctionne (mobile)
- [ ] Navigation fonctionne
- [ ] État actif fonctionne

### Responsive
- [ ] Desktop layout correct
- [ ] Mobile layout correct
- [ ] Menu hamburger fonctionne
- [ ] Overlay fonctionne

### Redirections
- [ ] Non-auth → login
- [ ] Auth → dashboard
- [ ] Onboarding completed → dashboard

---

## Résultat Attendu

✅ Tous les tests passent
✅ Le flow est fluide
✅ Aucune erreur dans la console
✅ Le design est cohérent
✅ La navigation fonctionne
✅ Le responsive fonctionne

---

## En Cas de Problème

1. **Page ne s'affiche pas**
   - Vérifier que le serveur tourne
   - Vérifier l'URL
   - Rafraîchir la page (Cmd+R)

2. **Erreur 404**
   - Vérifier que la route existe
   - Vérifier l'orthographe de l'URL

3. **Erreur 500**
   - Vérifier la console du serveur
   - Vérifier les logs d'erreur
   - Redémarrer le serveur

4. **Layout ne s'affiche pas**
   - Vérifier que vous êtes authentifié
   - Vérifier que vous êtes sur une route (app)
   - Vérifier la console pour erreurs

5. **Sidebar ne s'affiche pas (desktop)**
   - Vérifier la largeur de la fenêtre (≥ 768px)
   - Vérifier la console pour erreurs
   - Rafraîchir la page

6. **Menu hamburger ne fonctionne pas**
   - Vérifier la largeur de la fenêtre (< 768px)
   - Vérifier la console pour erreurs
   - Cliquer directement sur l'icône

---

**Prêt à tester !** 🚀

Ouvrez http://localhost:3000/ et suivez le flow !
