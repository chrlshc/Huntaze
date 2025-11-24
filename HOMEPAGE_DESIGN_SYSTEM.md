# 🎨 Homepage Design System - Premium SaaS

## 🎯 Inspiration
Linear, Vercel, Raycast - Les meilleures interfaces SaaS modernes

---

## 1. TYPOGRAPHIE

### Police
**Inter** (Google Fonts)
- Géométrique, moderne, tech
- Excellente lisibilité
- Variable font pour performance

### Hiérarchie des Tailles
```
H1 (Hero):     text-6xl md:text-7xl  (60px → 72px)
H2 (CTA):      text-5xl              (48px)
H3 (Sections): text-3xl              (30px)
H4 (Cards):    text-2xl              (24px)
Body Large:    text-xl               (20px)
Body:          text-lg               (18px)
Body Small:    text-base             (16px)
Micro:         text-sm               (14px)
Label:         text-xs               (12px)
```

### Hiérarchie des Couleurs
```css
/* Titres principaux */
--text-primary: #F8F9FA (blanc quasi-pur)

/* Sous-titres */
--text-secondary: #E2E8F0 (gris très clair)

/* Body text */
--text-body: #A0AEC0 (gris moyen)

/* Text muted */
--text-muted: #94A3B8 (gris doux)

/* Accent */
--accent: #7D57C1 (violet)
```

---

## 2. COULEURS

### Palette Principale
```css
/* Backgrounds */
--bg-primary: #0F0F10    /* Fond principal */
--bg-surface: #18181B    /* Cartes, surfaces */
--bg-elevated: #131316   /* Sections alternées */

/* Borders */
--border-subtle: #27272A /* Bordures fines */
--border-accent: #7D57C1 /* Bordures hover */

/* Accent Colors */
--purple-light: #8E65D4
--purple-main: #7D57C1
--purple-glow: rgba(125, 87, 193, 0.4)
```

### Dégradés
```css
/* Boutons */
background: linear-gradient(to right, #8E65D4, #7D57C1)

/* Texte Hero */
background: linear-gradient(to bottom, #F8F9FA, #E2E8F0)
-webkit-background-clip: text
-webkit-text-fill-color: transparent

/* Background Hero */
background: linear-gradient(to bottom, rgba(125, 87, 193, 0.1), transparent)
```

---

## 3. EFFETS & ANIMATIONS

### Ombres (Shadows)
```css
/* Cartes */
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5)

/* Boutons normaux */
box-shadow: 0 4px 14px 0 rgba(125, 87, 193, 0.4)

/* Boutons hover */
box-shadow: 0 6px 20px 0 rgba(125, 87, 193, 0.6)

/* Cartes hover (glow) */
box-shadow: 0 0 30px rgba(125, 87, 193, 0.3)
```

### Transitions
```css
/* Standard */
transition: all 0.2s ease

/* Hover cards */
transition: all 0.3s ease

/* Transforms */
transition: transform 0.2s ease
```

### Hover Effects

**Boutons:**
```css
hover:-translate-y-0.5
hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)]
```

**Cartes:**
```css
hover:-translate-y-1
hover:border-[#7D57C1]
hover:shadow-[0_0_30px_rgba(125,87,193,0.3)]
```

**Shine Effect (Boutons):**
```css
.group:hover .shine {
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
  opacity: 1;
}
```

---

## 4. COMPOSANTS

### Header
```
- Sticky top
- Backdrop blur (backdrop-blur-xl)
- Border bottom subtile
- Background semi-transparent (#0F0F10/80)
```

### Hero Section
```
- Padding top: 32 (pt-32)
- Gradient background subtil
- H1 avec gradient text
- Bouton avec glow effect
- Dashboard preview avec perspective 3D
```

### Feature Cards
```
- Background: #18181B
- Border: #27272A
- Hover: border violet + glow
- Icon dans cercle avec background violet/10
- Label en uppercase violet
- Transform hover: -translate-y-1
```

### CTA Buttons
```
- Gradient background
- Shadow avec couleur accent
- Hover: shadow plus forte + translate-y
- Shine effect au hover
- Padding généreux (px-8 py-4)
```

---

## 5. LAYOUT & SPACING

### Conteneurs
```css
max-w-4xl  /* Hero, textes centrés */
max-w-6xl  /* Grilles, contenus larges */
max-w-3xl  /* Sections texte */
```

### Padding Sections
```css
py-24  /* Sections standard */
py-32  /* Hero, CTA finale */
px-6   /* Padding horizontal */
```

### Gaps
```css
gap-4   /* Petits espacements */
gap-6   /* Grilles de cartes */
gap-10  /* Espacements généreux */
```

---

## 6. EFFETS SPÉCIAUX

### Dashboard Preview (3D Tilt)
```css
transform: perspective(1000px) rotateX(5deg) scale(1.02)
```

### Background Shield (Watermark)
```css
opacity: 0.02
position: absolute
width: 600px
height: 600px
color: #7D57C1
```

### Gradient Fade (Bottom)
```css
background: linear-gradient(to top, #0F0F10, transparent)
position: absolute
inset: 0
z-index: 10
```

### Backdrop Blur (Header)
```css
backdrop-blur-xl
background: #0F0F10/80
```

---

## 7. RESPONSIVE

### Breakpoints
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### Adaptations Mobile
```
- H1: text-6xl → text-7xl (md)
- Grid: 1 col → 3 cols (md)
- Padding réduit sur mobile
- Dashboard tilt désactivé sur mobile
```

---

## 8. ACCESSIBILITÉ

### Contraste
- Texte principal: 15:1 (WCAG AAA)
- Texte secondaire: 7:1 (WCAG AA)
- Boutons: 4.5:1 minimum

### Focus States
```css
focus:outline-none
focus:ring-2
focus:ring-[#7D57C1]
focus:ring-offset-2
focus:ring-offset-[#0F0F10]
```

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. PERFORMANCE

### Optimisations
- Font display: swap
- Images: Next.js Image avec lazy loading
- Backdrop blur: GPU accelerated
- Transforms: GPU accelerated (translate, scale)

### Critical CSS
```css
/* Inline dans <head> */
- Font-face declarations
- Above-the-fold styles
- Layout shifts prevention
```

---

## 10. CHECKLIST DESIGN

### ✅ Typographie
- [x] Police Inter chargée
- [x] Hiérarchie claire (5 niveaux)
- [x] Line-height optimisé
- [x] Letter-spacing sur labels

### ✅ Couleurs
- [x] Palette cohérente
- [x] Dégradés subtils
- [x] Contraste WCAG AA+
- [x] Accent violet utilisé stratégiquement

### ✅ Effets
- [x] Shadows avec couleur accent
- [x] Hover states sur tous les interactifs
- [x] Transitions fluides
- [x] Glow effects sur focus

### ✅ Layout
- [x] Spacing cohérent
- [x] Sections bien séparées
- [x] Responsive design
- [x] Max-width appropriés

### ✅ Composants
- [x] Header sticky avec blur
- [x] Hero avec gradient
- [x] Cards avec hover effects
- [x] Buttons avec glow
- [x] Dashboard preview 3D

---

## 11. COMPARAISON AVANT/APRÈS

### Avant (Wireframe)
```
- Police système
- Couleurs plates
- Pas d'ombres
- Pas d'effets hover
- Layout basique
```

### Après (Premium)
```
✨ Police Inter moderne
✨ Hiérarchie de couleurs
✨ Ombres avec glow
✨ Hover effects sophistiqués
✨ Layout avec profondeur
✨ Dashboard preview 3D
✨ Gradient backgrounds
✨ Backdrop blur
```

---

## 12. MAINTENANCE

### Quand Mettre à Jour
- Nouveau screenshot dashboard → remplacer placeholder
- Feedback utilisateurs → ajuster spacing
- A/B testing → tester variations
- Performance issues → optimiser animations

### Variables à Tweaker
```css
/* Facilement ajustables */
--glow-intensity: 0.4
--hover-lift: -4px
--transition-speed: 0.2s
--border-radius: 12px
```

---

## 13. INSPIRATION & RÉFÉRENCES

### Sites Référence
- **Linear** : Typographie, spacing, subtilité
- **Vercel** : Dégradés, effets, modernité
- **Raycast** : Cartes, hover effects, polish

### Principes Appliqués
1. **Moins c'est plus** : Effets subtils, pas exagérés
2. **Hiérarchie claire** : Guidage visuel évident
3. **Profondeur** : Layers, ombres, élévation
4. **Fluidité** : Transitions douces, naturelles
5. **Premium** : Attention aux détails

---

*Document créé le 24 novembre 2024*  
*Version 1.0 - Premium SaaS Design*  
*Style: Linear/Vercel inspired*
