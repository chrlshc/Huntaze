# Guide Rapide : OnlyFans Pixel-Perfect Polish

Guide de référence pour les micro-corrections visuelles sur les vues OnlyFans (Smart Messages, Fans, PPV).

## 🎯 Objectif

Atteindre le dernier 5% de polish visuel pour un rendu production-ready, niveau SaaS premium.

## 📐 Système de Grille d'Espacement

**Règle d'or** : Tous les espacements sont des multiples de 4px.

```css
/* Échelle de base */
--space-1: 4px;   /* Label → helper text */
--space-2: 8px;   /* Gaps entre éléments */
--space-3: 12px;  /* Padding interne card */
--space-4: 16px;  /* Padding standard card */
--space-5: 20px;  /* Padding large card */
--space-6: 24px;  /* Espacement sections */
--space-8: 32px;  /* Espacement sections majeures */
```

## 🎨 Design Tokens

### Border Radius
```css
--radius-card: 12px;    /* Cards, blocs larges */
--radius-input: 8px;    /* Inputs, buttons */
--radius-chip: 999px;   /* Pills, badges */
```

### Borders
```css
--border-width: 1px;
--border-color: #E5E7EB;
```

### Shadows
```css
--shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-card-hover: 0 4px 6px rgba(0, 0, 0, 0.1);
```

### Typography
```css
/* Tailles */
--text-xs: 11px;    /* Labels uppercase */
--text-sm: 12px;    /* Texte secondaire */
--text-base: 14px;  /* Corps de texte */
--text-lg: 16px;    /* Titres de section */
--text-xl: 18px;    /* Titres de section alt */
--text-2xl: 24px;   /* Titres de page */

/* Poids */
--font-normal: 400;
--font-semibold: 600;
```

## 📋 Checklist par Vue

### Smart Messages

#### Banner AI-Powered Messaging
- [ ] Margin top/bottom : 16-24px
- [ ] Label : 11px uppercase gray
- [ ] Titre : 16px
- [ ] Espacement vers Auto-reply : 24px ou 32px

#### Auto-Reply Card
- [ ] Header : titre + toggle alignés sur même ligne
- [ ] Séparation header/inputs : 8-12px ou ligne
- [ ] Label → helper text : 4px
- [ ] Helper text → input : 8px
- [ ] Time inputs : même hauteur et largeur
- [ ] Lien "Learn what AI analyzes" : 8px au-dessus

#### Message Templates Grid
- [ ] Toutes les cards : hauteur identique
- [ ] Padding cards : 12-16px uniforme
- [ ] Header : tag left, usage count right, même baseline
- [ ] Nom template : 14px bold
- [ ] Preview : 14px normal, max 2 lignes
- [ ] Action icons : séparateur ou 8-12px spacing
- [ ] Icons : même baseline, 8px gap
- [ ] Section header : titre left, "+ New Template" right

#### AI Recommendations
- [ ] 3 cards individuelles
- [ ] Gap entre cards : 8-12px
- [ ] Border radius : 12px chacune
- [ ] Contenu : icon, titre, button sur même ligne
- [ ] Spacing interne : max 8px

#### Automation Rules Table
- [ ] Rule Name : 16px left padding
- [ ] Hover : #F9FAFB background
- [ ] Header : titre left, "+ New Rule" right

### Fans

#### Filters
- [ ] Chips inactifs : border 1px #E5E7EB
- [ ] Hover chips : light gray background
- [ ] Tous les chips : hauteur identique (36px ou 40px)

#### Search & Filters
- [ ] Search bar : même hauteur que dropdowns
- [ ] "More filters" : 8px du bord droit

#### Table
- [ ] Colonnes "Lifetime Value" / "Churn Risk" : column-gap adéquat
- [ ] Risk chips : padding 2px vertical / 8px horizontal
- [ ] Low risk : light green bg + dark green text
- [ ] Medium/High : orange/red bg + dark text
- [ ] Pagination : centrée verticalement
- [ ] "Next" button : margin du bord droit

### PPV Content

#### KPI Cards
- [ ] 4 cards : largeur identique
- [ ] Padding : uniforme sur toutes
- [ ] Valeurs métriques : alignées sur même baseline

#### Filter Bar
- [ ] Tabs "All/Active/Drafts" : 8px margin en dessous

#### Card Grid
- [ ] Stats "Sent – Opened – Purchased" : line-height identique
- [ ] Toutes les cards : même hauteur totale
- [ ] Action buttons : barre 40-44px uniforme
- [ ] Mobile : layout 2 colonnes

#### Status Badges
- [ ] Position : top-right, offset 8px/8px
- [ ] Style : background et radius uniformes
- [ ] Draft : gray
- [ ] Active : green
- [ ] Sent : blue

## 🎯 Règles Universelles

### Alignement
- [ ] Page title, cards, tables : même x-coordinate à gauche
- [ ] Colonnes numériques : right-aligned
- [ ] Monospace pour les chiffres (optionnel)

### Hover States
- [ ] Cards : subtle shadow increase
- [ ] Table rows : #F9FAFB background
- [ ] Buttons : darken + small shadow

### Couleurs des Chips
```css
/* VIP */
background: #DEF7EC;
color: #03543F;

/* Low Risk */
background: light green;
color: dark green;

/* Medium Risk */
background: orange;
color: dark orange;

/* High Risk */
background: red;
color: dark red;

/* Sent */
background: blue;
color: dark blue;

/* Draft */
background: gray;
color: dark gray;

/* Active */
background: green;
color: dark green;
```

## 🔧 Implémentation Rapide

### 1. Créer le fichier de tokens
```bash
# Créer styles/onlyfans-polish-tokens.css
```

### 2. Appliquer par vue
```bash
# Smart Messages
app/(app)/onlyfans/smart-messages/page.tsx

# Fans
app/(app)/onlyfans/fans/page.tsx

# PPV
app/(app)/onlyfans/ppv/page.tsx
```

### 3. Test visuel rapide (30 secondes)
1. Ouvrir chaque vue
2. Vérifier espacements avec DevTools
3. Mesurer avec règle (cmd+shift+p → "ruler")
4. Comparer hover states

## 📏 Outils de Mesure

### Chrome DevTools
```
1. Inspect element
2. Computed → voir padding/margin
3. Vérifier que tout est multiple de 4px
```

### Mesure visuelle
```
cmd + shift + p → "Show rulers"
```

### Vérification rapide
```css
/* Ajouter temporairement pour debug */
* {
  outline: 1px solid rgba(255, 0, 0, 0.1);
}
```

## ✅ Validation Finale

- [ ] Tous les espacements sont multiples de 4px
- [ ] Tous les border-radius sont cohérents
- [ ] Toutes les cards ont le même style
- [ ] Tous les chips ont la même hauteur
- [ ] Tous les hover states fonctionnent
- [ ] Alignement gauche uniforme
- [ ] Colonnes numériques right-aligned

## 🚀 Commandes Rapides

```bash
# Vérifier les tokens
grep -r "padding\|margin" app/(app)/onlyfans/**/*.tsx

# Trouver les valeurs non-multiples de 4
grep -r "padding.*[13579]px" app/(app)/onlyfans/

# Vérifier border-radius
grep -r "border-radius" app/(app)/onlyfans/
```

---

**Temps estimé** : 2-3h pour les 3 vues
**Impact** : Passage de "bon" à "production-ready premium"
