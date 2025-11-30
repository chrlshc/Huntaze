# Task 33: Visual Baseline - Quick Start Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Validate Setup
```bash
npm run test:visual:validate
```
Expected: ✅ 9/9 checks passed

### Step 2: Start Dev Server
```bash
npm run dev
```
Wait for: `Ready on http://localhost:3000`

### Step 3: Capture Baselines
```bash
npm run test:visual:update
```
This will:
- Run 20+ test cases
- Capture ~36 screenshots
- Save to `tests/visual/__screenshots__/`
- Take ~2-3 minutes

### Step 4: Review Screenshots
```bash
open tests/visual/__screenshots__/
```
Check that screenshots look correct:
- Components render properly
- Pages load completely
- Colors are consistent
- No visual glitches

### Step 5: Run Tests
```bash
npm run test:visual
```
Expected: All tests pass ✅

## 📝 What You Get

### Files Created
```
tests/visual/
├── design-system-baseline.spec.ts    # 20+ test cases
├── README.md                          # Documentation
└── __screenshots__/                   # Baseline images (after capture)

scripts/
├── capture-visual-baseline.ts         # Capture script
└── validate-visual-baseline-setup.ts  # Validation script

.kiro/specs/design-system-unification/
├── VISUAL-BASELINE-GUIDE.md          # Complete guide
├── TASK-33-COMPLETE.md               # Implementation details
└── TASK-33-VISUAL-SUMMARY.md         # Visual summary
```

### NPM Commands
```bash
npm run test:visual              # Run tests
npm run test:visual:update       # Update baselines
npm run test:visual:ui           # Interactive mode
npm run test:visual:report       # View report
npm run test:visual:validate     # Validate setup
npm run test:visual:capture      # Capture with script
```

## 🎯 Test Coverage

### Components (3)
- Button (variants, hover, focus)
- Card (glass effect, hover)
- Input (default, focus, error)

### Pages (4)
- Dashboard Home
- Analytics
- Integrations
- Messages

### Viewports (3)
- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1920x1080)

### Design Tokens (28+)
- Colors (8 tokens)
- Typography (7 tokens)
- Spacing (6 tokens)
- Effects (4 tokens)
- Animations (3 tokens)

## 🔄 Daily Workflow

### Making Changes
```bash
# 1. Make your design changes
vim components/ui/button.tsx

# 2. Run visual tests
npm run test:visual

# 3. Review differences
npm run test:visual:report

# 4. Update if intentional
npm run test:visual:update
```

### Reviewing Changes
```bash
# View test report in browser
npm run test:visual:report

# Check diff images
open test-results/
```

## ⚠️ Troubleshooting

### Tests Fail on First Run
**Solution**: Capture baselines first
```bash
npm run test:visual:update
```

### Dev Server Not Running
**Solution**: Start it in another terminal
```bash
npm run dev
```

### Playwright Not Installed
**Solution**: Install browsers
```bash
npx playwright install
```

### Screenshots Look Different
**Solution**: 
1. Check if fonts loaded
2. Wait for network idle
3. Disable animations (automatic)

## 📚 Documentation

- **Complete Guide**: `.kiro/specs/design-system-unification/VISUAL-BASELINE-GUIDE.md`
- **Test Documentation**: `tests/visual/README.md`
- **Implementation Details**: `TASK-33-COMPLETE.md`
- **Visual Summary**: `TASK-33-VISUAL-SUMMARY.md`

## ✅ Validation

Run validation to ensure everything is set up:
```bash
npm run test:visual:validate
```

Expected output:
```
✅ Test Suite
✅ Documentation
✅ Capture Script
✅ Usage Guide
✅ Playwright Config
✅ NPM Scripts
✅ Playwright Installation
✅ Test File Syntax
✅ Test Coverage

Summary: 9/9 checks passed
```

## 🎉 Success!

You now have:
- ✅ Automated visual regression testing
- ✅ 20+ test cases covering major components
- ✅ ~36 baseline screenshots
- ✅ Complete documentation
- ✅ CI/CD ready workflow

## 🚀 Next Steps

1. **Commit Baselines**:
   ```bash
   git add tests/visual/__screenshots__/
   git commit -m "Add visual regression baselines"
   ```

2. **Integrate into CI**:
   - Add to GitHub Actions
   - Configure artifact uploads

3. **Train Team**:
   - Share documentation
   - Demonstrate workflow

4. **Move to Task 34**:
   - Final checkpoint
   - Ensure all tests pass

## 📞 Need Help?

- Check `tests/visual/README.md` for detailed docs
- Review `VISUAL-BASELINE-GUIDE.md` for comprehensive guide
- Run `npm run test:visual:validate` to check setup
- Check Playwright docs: https://playwright.dev

---

**Task 33 Complete!** ✨

Ready for Task 34: Final checkpoint 🎯
