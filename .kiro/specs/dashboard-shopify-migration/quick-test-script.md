# Quick Testing Script for Task 47

## 🚀 Quick Start

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your browser** to: http://localhost:3000

3. **Open DevTools** (F12 or Cmd+Option+I)

4. **Follow the testing sequence below**

---

## 📋 Testing Sequence (30 minutes)

### Step 1: Analytics Page (5 min)

1. Navigate to `/analytics`
2. **Check Console** - No errors?
3. **Visual Check**:
   - White cards on pale gray background?
   - Electric Indigo (#6366f1) on buttons?
   - Soft shadows visible?
3. **Functionality**:
   - If no integrations: "Connect Accounts" button visible?
   - Click "Connect Accounts" → redirects to `/integrations`?
   - Revenue optimization cards clickable?
4. **Performance**:
   - Open Performance Monitor (bottom-right button)
   - Page load < 3s?
   - Check FPS while scrolling

**✅ Pass / ❌ Fail**: _____

---

### Step 2: Content Page (8 min)

1. Navigate to `/content`
2. **Check Console** - No errors?
3. **Visual Check**:
   - Stats cards at top with white backgrounds?
   - Tab navigation with Electric Indigo active state?
   - Search bar styled correctly?
4. **Functionality**:
   - Click each tab (All, Draft, Scheduled, Published) - works?
   - Type in search bar - debouncing works (300ms delay)?
   - Click "Create Content" - modal opens?
   - Try to create content - form works?
   - Try to edit content - works?
   - Try to delete content - confirmation works?
   - Scroll down - "Load More" button appears?
5. **Performance**:
   - Search is responsive (no lag)?
   - Scrolling is smooth (60 FPS)?

**✅ Pass / ❌ Fail**: _____

---

### Step 3: Messages Page (8 min)

1. Navigate to `/messages`
2. **Check Console** - No errors?
3. **Visual Check**:
   - Three-column layout?
   - Platform selector (left) white background?
   - Thread list (middle) white background?
   - Conversation area (right) pale gray background?
4. **Functionality**:
   - Click different platforms - filter works?
   - Click different filters (All, Unread, Starred) - works?
   - Click a thread - conversation displays?
   - Type in message input - works?
   - Click "Send" - message sends?
   - Scroll thread list - "Load More" appears?
5. **Error Handling**:
   - If error occurs - retry button appears?
   - Click retry - works?
   - Auto-retry happens (max 3 times)?
6. **Performance**:
   - Initial load < 2s?
   - Pagination fast?

**✅ Pass / ❌ Fail**: _____

---

### Step 4: Integrations Page (5 min)

1. Navigate to `/integrations`
2. **Check Console** - No errors?
3. **Visual Check**:
   - Integration cards white backgrounds?
   - Icons display correctly (no broken images)?
   - "Add app" buttons styled with Electric Indigo?
4. **Functionality**:
   - Click "Add app" - OAuth flow starts?
   - If connected: "Disconnect" button visible?
   - Click "Disconnect" - confirmation works?
   - Toast notifications appear?
5. **Loading States**:
   - Skeleton loaders during initial load?
   - No black blocks during loading?
6. **Performance**:
   - Initial load < 2s?
   - Images load with fallbacks?

**✅ Pass / ❌ Fail**: _____

---

### Step 5: Performance Monitoring (2 min)

1. **Check Performance Monitor**:
   - Floating button visible (bottom-right)?
   - Click button - dashboard opens?
   - Metrics updating every 2 seconds?
   - API calls listed?
   - FPS displayed?
   - Color coding works (green/yellow/red)?

2. **Check Console**:
   - Web Vitals logged?
   - No errors?

**✅ Pass / ❌ Fail**: _____

---

### Step 6: Mobile Responsive (2 min)

1. **Open DevTools** → Toggle device toolbar (Cmd+Shift+M)
2. **Select iPhone 12 Pro** (or similar)
3. **Test each page**:
   - Analytics - cards stack vertically?
   - Content - search bar full width?
   - Messages - layout adapts?
   - Integrations - cards stack?
4. **Test interactions**:
   - Buttons tappable?
   - No horizontal scroll?
   - Text readable?

**✅ Pass / ❌ Fail**: _____

---

## 🎯 Quick Verification Checklist

After completing all steps, verify:

- [ ] No console errors on any page
- [ ] All pages use Shopify design system (white cards, pale gray background, Electric Indigo)
- [ ] All loading states work (spinners, skeleton loaders)
- [ ] All error boundaries work (try throwing an error)
- [ ] Performance Monitor works and shows metrics
- [ ] All pages load < 3 seconds
- [ ] All pages responsive on mobile
- [ ] No dark mode remnants visible

---

## 🐛 Common Issues to Check

### Visual Issues
- [ ] Dark mode classes still present (search for `dark:` in DevTools)
- [ ] Hardcoded colors instead of CSS variables
- [ ] Inconsistent spacing (should be 24px gaps)
- [ ] Missing shadows on cards
- [ ] Wrong border radius (should be 16px)

### Functional Issues
- [ ] Buttons not working
- [ ] Forms not submitting
- [ ] Navigation not working
- [ ] Search not filtering
- [ ] Pagination not loading more

### Performance Issues
- [ ] Page load > 3 seconds
- [ ] API calls > 2 seconds
- [ ] Scroll FPS < 60
- [ ] Layout shifts during load
- [ ] Memory leaks (check DevTools Memory tab)

---

## 📊 Performance Targets

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Analytics Load | < 3s | _____ | ☐ |
| Content Load | < 2s | _____ | ☐ |
| Messages Load | < 2s | _____ | ☐ |
| Integrations Load | < 2s | _____ | ☐ |
| API Response | < 2s | _____ | ☐ |
| Scroll FPS | ≥ 60 | _____ | ☐ |

---

## ✅ Final Checklist

- [ ] All pages tested
- [ ] All functionality works
- [ ] All loading states work
- [ ] All error states work
- [ ] Performance targets met
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No visual issues
- [ ] Results documented in `task-47-testing-results.md`

---

## 🎉 Ready to Complete Task 47?

If all checks pass:
1. Fill out `task-47-testing-results.md`
2. Mark Task 47 as complete
3. Celebrate! 🎊

If issues found:
1. Document in `task-47-testing-results.md`
2. Create GitHub issues for each problem
3. Fix issues
4. Re-test

---

**Happy Testing!** 🚀

