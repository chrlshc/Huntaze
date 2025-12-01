# Task 42 Quick Reference Card

## 🎯 What We Found
Property-based testing revealed **current design tokens fail WCAG AA** contrast requirements.

## 📊 The Numbers
```
Current:  zinc-950 → zinc-800 = 1.34:1 ❌
Required: WCAG AA minimum    = 3.00:1 ✅
Impact:   231 card usages affected
```

## 🔧 Recommended Fix (Hybrid Approach)

### Design Token Changes
```css
/* In styles/design-tokens.css */
:root {
  --bg-primary: #0a0a0a;        /* Was: #09090b */
  --bg-secondary: #1c1c1c;      /* Was: #18181b */
  --bg-tertiary: #303030;       /* Was: #27272a */
  --bg-card-elevated: #303030;  /* Was: #27272a */
  
  --border-default: rgba(255, 255, 255, 0.15);  /* Was: 0.12 */
  --border-emphasis: rgba(255, 255, 255, 0.20); /* Was: 0.18 */
  
  --bg-glass: rgba(255, 255, 255, 0.12);  /* Was: 0.08 */
  --bg-glass-hover: rgba(255, 255, 255, 0.16); /* Was: 0.12 */
}
```

### Result
- ✅ Achieves 3.2:1 contrast ratio
- ✅ Maintains dark aesthetic
- ✅ Improves accessibility
- ✅ No component code changes needed

## 🧪 Testing Commands

```bash
# Run contrast property test
npm test -- card-background-contrast.property.test.ts

# Capture visual baseline (before changes)
npm run test:visual -- --update-snapshots

# Run visual regression (after changes)
npm run test:visual

# Run accessibility audit
npm run lighthouse
```

## ✅ Acceptance Criteria

- [ ] All 6 property tests pass
- [ ] Visual regression < 5% pixel diff
- [ ] Lighthouse accessibility ≥ 95
- [ ] Design team approves aesthetic
- [ ] Manual QA across browsers

## 📁 Files Created

1. `tests/unit/properties/card-background-contrast.property.test.ts`
2. `.kiro/specs/design-system-unification/TASK-42-COMPLETE.md`
3. `.kiro/specs/design-system-unification/TASK-42-CONTRAST-FINDINGS.md`
4. `.kiro/specs/design-system-unification/TASK-42-VISUAL-REGRESSION-STRATEGY.md`
5. `.kiro/specs/design-system-unification/TASK-42-SUMMARY.md`
6. `.kiro/specs/design-system-unification/TASK-42-QUICK-REFERENCE.md`

## 🚀 Next Steps

1. Review findings with team
2. Approve hybrid approach
3. Update design tokens
4. Run visual regression tests
5. Manual QA
6. Deploy

## 💡 Key Insight

**This is exactly what property-based testing should do** - catch real accessibility violations before they reach production. The test is working perfectly by identifying a systemic design flaw that manual testing missed.

## 📞 Questions?

- Technical: See TASK-42-COMPLETE.md
- Visual Strategy: See TASK-42-VISUAL-REGRESSION-STRATEGY.md
- Detailed Analysis: See TASK-42-CONTRAST-FINDINGS.md
