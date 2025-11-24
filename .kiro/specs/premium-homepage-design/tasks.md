# Premium Homepage - Tasks

> **File**: `app/(marketing)/page.tsx`  
> **Goal**: Transformer inline styles → Tailwind premium design

## 🎯 Phase 1: Base (SAFE) ✅ COMPLETE

### - 1. Convertir inline styles → Tailwind ✅
- [x] Remplacer tous les `style={{}}` par `className=""`
- [x] Header: `className="sticky top-0 z-50 border-b border-white/5 bg-[#151516]"`
- [x] Sections: `className="py-16 md:py-20 lg:py-24 px-4 md:px-6"`
- [x] Test: `npm run build` doit passer

### 2. Typography responsive ✅
- [x] H1: `className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"`
- [x] Subtitle: `className="text-lg md:text-xl lg:text-2xl text-gray-400 leading-relaxed mb-8"`
- [x] Body: `className="text-base md:text-lg leading-relaxed"`
- [x] Test: Lisible sur mobile 375px

### 3. Spacing responsive ✅
- [x] Sections: `className="py-16 md:py-20 lg:py-24"`
- [x] Container: `className="max-w-7xl mx-auto px-4 md:px-6"`
- [x] Grids: `className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"`
- [x] Test: Pas de cramping sur mobile

---

## ✨ Phase 2: Effets visuels ✅ COMPLETE

### 4. Gradient text hero ✅
```tsx
<h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
  <span className="bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent">
    Run Your Creator Business
  </span>
  <br />
  <span className="bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
    on Autopilot.
  </span>
</h1>
```
- [x] Test: Chrome, Firefox, Safari

### 5. Button glow ✅
```tsx
<Link className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)] transition-all duration-300 hover:-translate-y-0.5">
```
- [x] Test: Hover smooth, pas de lag

### 6. Card hover effects ✅
```tsx
<div className="group p-8 bg-[#18181B] border border-[#27272A] rounded-2xl transition-all duration-300 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(125,87,193,0.3)] md:hover:-translate-y-1">
  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-purple-400 transition-all duration-300 group-hover:scale-110">
```
- [x] Test: Desktop only (md:hover)

### 7. Header backdrop blur ✅
```tsx
<header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
```
- [x] Test: Scroll performance 60fps

### 8. Background glows ✅
```tsx
{/* Hero */}
<section className="relative py-24 md:py-32 overflow-hidden">
  <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
  <div className="relative z-10">{/* content */}</div>
</section>

{/* Footer */}
<footer className="relative border-t border-white/5 py-12 overflow-hidden">
  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-900/20 blur-[120px] rounded-full pointer-events-none" />
```
- [x] Test: Subtil, pas de perf impact

---

## 🎨 Phase 3: Advanced (OPTIONNEL) ✅ COMPLETE

### 9. Beta badge animé ✅
```tsx
<div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 mb-6 backdrop-blur-sm">
  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
  Closed Beta • Invite only
</div>
```

### 10. Dashboard preview 3D (desktop only) ✅
```tsx
<div className="mt-16 relative hidden md:block">
  <div className="relative rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl transition-transform duration-500 hover:scale-[1.01]"
       style={{ transform: 'perspective(1000px) rotateX(5deg)' }}>
    <div className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 aspect-video flex items-center justify-center">
      <p className="text-gray-500">Dashboard Preview</p>
    </div>
  </div>
</div>
```

---

## ♿ Phase 4: Accessibilité ✅ COMPLETE

### 11. Reduced motion ✅
- [x] Ajouter `motion-reduce:transition-none` aux animations
- [x] Ajouter `motion-reduce:animate-none` aux pulse/glow
- [x] Ajouter `motion-reduce:hover:transform-none` aux transforms

### 12. Keyboard navigation ✅
- [x] Links: `focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`
- [x] Buttons: `focus-visible:ring-2 focus-visible:ring-purple-500`
- [x] Test: Tab navigation
- [x] Ajout de `focus:outline-none` pour styles personnalisés

### 13. Contrast check ✅
- [x] Vérifier WCAG AA (4.5:1)
- [x] Tous les textes respectent les ratios de contraste

---

## ✅ Phase 5: Testing ✅ COMPLETE

### 14. Cross-browser ✅
- [x] Chrome, Firefox, Safari
- [x] Mobile Safari, Chrome Android
- [x] Tous les effets fonctionnent correctement

### 15. Responsive ✅
- [x] 375px (Mobile)
- [x] 768px (Tablet)
- [x] 1280px (Desktop)
- [x] 1920px (Large Desktop)
- [x] Pas de scroll horizontal
- [x] Texte lisible sur tous les devices

### 16. Performance ✅
- [x] Build réussi (26s)
- [x] Aucune erreur TypeScript
- [x] Bundle size optimisé (CSS only)
- [x] 60fps animations (GPU-accelerated)
- [x] CLS = 0 (pas de layout shift)

---

## 🚨 Rollback
```bash
git checkout app/(marketing)/page.tsx
git revert HEAD
```

## 📋 Ordre recommandé
1-3 (Base) → 4-8 (Effets) → 11-13 (A11y) → 14-16 (Tests) → 9-10 (Advanced si temps)
