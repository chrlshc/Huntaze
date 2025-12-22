# OnlyFans SaaS Refinements - Visual Test Guide (30 seconds)

**Quick visual verification checklist for the SaaS refinements**

---

## 🎯 Smart Messages Page

### Check These Elements:

1. **AI Banner** (top)
   - [ ] Border is thin (1px), not thick
   - [ ] Padding looks comfortable (not cramped)
   - [ ] "Learn more →" has proper spacing

2. **Auto-Reply Card**
   - [ ] Input fields have comfortable padding (not cramped)
   - [ ] "min" text has small gap from input (not touching)
   - [ ] Time pickers are TWO separate inputs (not one with divider)
   - [ ] All inputs have thin 1px borders

3. **Message Templates Grid**
   - [ ] Action icons at bottom have thin border-top (1px)
   - [ ] Icons have 8px gaps between them
   - [ ] Cards have subtle shadows

4. **AI Recommendations**
   - [ ] THREE separate cards (not fused blocks)
   - [ ] Each card has its own 1px border
   - [ ] 12px gaps between cards
   - [ ] Icons are in rounded circles

---

## 🎯 Fans Page

### Check These Elements:

1. **Filter Pills** (top)
   - [ ] Pills are ROUNDED (999px radius), not rectangles
   - [ ] Borders are thin (1px), not thick
   - [ ] Active pill is dark (#111827)
   - [ ] Hover shows light gray background

2. **Search Bar**
   - [ ] Input has comfortable padding (not cramped)
   - [ ] Border is thin (1px)
   - [ ] Height is 40px (matches filter pills)

3. **Table - Lifetime Value Column**
   - [ ] Numbers are aligned right
   - [ ] Numbers use monospace font (tabular-nums)
   - [ ] No collisions with next column

4. **Table - Churn Risk Column**
   - [ ] Chips are ROUNDED pills (999px)
   - [ ] Padding is 2px 8px (not cramped)
   - [ ] Colors are clear (green/yellow/red)

5. **Pagination**
   - [ ] Page numbers are 32px circles
   - [ ] 8px gaps between elements
   - [ ] Active page is dark

---

## 🎯 PPV Page

### Check These Elements:

1. **Tabs** (below filters)
   - [ ] Tabs have 16px spacing between them
   - [ ] Active tab has 2px bottom border
   - [ ] 8px margin below tabs

2. **Filter Bar**
   - [ ] Search input has comfortable padding
   - [ ] Dropdowns have 8px gap between them
   - [ ] All inputs are 40px height
   - [ ] Borders are thin (1px)

3. **PPV Cards - Stats Section**
   - [ ] "$20" and "2 videos" have clear separation (not touching)
   - [ ] Stats use `justify-between` (not cramped grid)
   - [ ] Numbers are in larger font (16px)
   - [ ] Labels are in smaller font (11px)

4. **PPV Cards - Performance Stats**
   - [ ] "156 Sent 89 Opened 23 Purchased" are SEPARATED
   - [ ] Each stat has number above, label below
   - [ ] Stats use monospace font (tabular-nums)
   - [ ] 16px gaps between stat groups

5. **PPV Cards - Action Bar**
   - [ ] Action bar has thin border-top (1px)
   - [ ] Buttons have 8px gaps
   - [ ] Bar height is uniform (44px)
   - [ ] Icons are properly sized

---

## ✅ Quick Pass/Fail Criteria

### PASS if:
- ✅ All borders look thin and subtle (1px)
- ✅ No text/numbers are touching badges/chips
- ✅ Filter pills are rounded (not rectangles)
- ✅ Inputs have comfortable padding (not cramped)
- ✅ Stats are properly separated with gaps
- ✅ Time pickers are two separate inputs
- ✅ AI Recommendations are 3 distinct cards

### FAIL if:
- ❌ Borders look thick (2-3px)
- ❌ Numbers touch badges ("$2,450Low")
- ❌ Filter pills are rectangles
- ❌ Inputs look cramped
- ❌ Stats are colliding ("156 Sent89 Opened")
- ❌ Time pickers have a divider line
- ❌ AI Recommendations are fused blocks

---

## 🎨 Visual Reference

### Border Thickness
- **GOOD**: Thin, subtle, barely visible
- **BAD**: Thick, heavy, dominant

### Number + Badge
- **GOOD**: `$2,450 [gap] Low`
- **BAD**: `$2,450Low`

### Filter Pills
- **GOOD**: Rounded pills with 999px radius
- **BAD**: Rectangles with 8px radius

### Stats Spacing
- **GOOD**: `156 [gap] 89 [gap] 23`
- **BAD**: `15689 23`

---

## 🚀 Browser Test

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

All should look identical with:
- Thin borders
- Proper spacing
- No collisions
- Comfortable padding

---

**Total Test Time**: ~30 seconds per page = 90 seconds total

**Expected Result**: Professional SaaS polish matching Shopify/Linear/Stripe quality
