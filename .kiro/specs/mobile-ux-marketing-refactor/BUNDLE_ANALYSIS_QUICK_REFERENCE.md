# Bundle Analysis - Quick Reference

## 🚀 Quick Commands

```bash
# Visualize bundle composition (opens in browser)
npm run build:analyze

# Verify bundles meet 200KB requirement
npm run build && npm run bundle:verify

# Normal build (no analysis)
npm run build
```

## 📊 What Gets Checked

- **Initial Bundles**: main, framework, webpack chunks
- **Limit**: 200KB per bundle (Requirement 2.5)
- **Exit Code**: 0 = pass, 1 = fail (CI/CD friendly)

## ✅ Success Output

```
✅ main-abc123.js          145.32 KB
✅ framework-xyz789.js     178.45 KB
✅ webpack-def456.js        52.18 KB
```

## ❌ Failure Output

```
❌ main-abc123.js          245.32 KB (EXCEEDS 200KB LIMIT!)

💡 Recommendations:
   1. Use dynamic imports for heavy components
   2. Review dependencies and consider lighter alternatives
   3. Enable tree-shaking for unused code
   4. Run `npm run build:analyze` to visualize bundle composition
```

## 🔧 Quick Fixes

### Bundle Too Large?

1. **Find the culprit:**
   ```bash
   npm run build:analyze
   ```

2. **Use dynamic imports:**
   ```typescript
   const Heavy = dynamic(() => import('./Heavy'), { ssr: false });
   ```

3. **Check for duplicates:**
   ```bash
   npm ls <package-name>
   ```

## 📚 Full Documentation

See: `.kiro/specs/mobile-ux-marketing-refactor/BUNDLE_ANALYSIS_GUIDE.md`

## 🎯 Performance Budget

| Bundle | Target | Max | Current |
|--------|--------|-----|---------|
| Main | <150KB | 200KB | ✅ |
| Framework | <180KB | 200KB | ✅ |
| Pages | <100KB | 200KB | ✅ |

## 🔗 Related

- Task 6: Dynamic Marketing Imports
- Task 7: Navigation Optimization
- Requirement 2.5: Bundle size limits
