# Setup Wizard — Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Run the database migration

```bash
psql $DATABASE_URL < lib/db/migrations/2025-11-11-wizard-completions.sql
```

### 2. Start your dev server

```bash
npm run dev
```

### 3. Navigate to the wizard

```
http://localhost:3000/onboarding/wizard
```

That's it! The wizard is ready to use.

---

## 📖 What You Get

### User Experience
- **4-step wizard** that completes in < 30 seconds
- **Dark Shopify-style UI** with violet/pink glows
- **Smart defaults** (tone defaults to Professional if skipped)
- **Mobile responsive** and fully accessible

### Backend Automation
- **Service activation** based on platform selection
- **Template provisioning** for quick starts
- **Dashboard configuration** based on goals
- **AI prompt generation** based on tone

---

## 🎯 Example Flow

```
User selects:
  Platform: OnlyFans
  Goal: Automate messages
  Tone: [Skipped] → defaults to Professional

Backend activates:
  ✅ OnlyFans scraper (with proxy rotation)
  ✅ Auto-DM engine
  ✅ PPV detector
  ✅ Templates: auto-respond, PPV promo, subscriber welcome
  ✅ Dashboard: unread messages, messages sent, response rate
  ✅ AI: Professional tone, no emojis, concise responses

Time: 28 seconds
```

---

## 🔧 Integration Example

```tsx
import SetupWizard from '@/components/onboarding/huntaze-onboarding/SetupWizard';

function MyPage() {
  const handleComplete = async (data) => {
    const response = await fetch('/api/onboarding/wizard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const config = await response.json();
    console.log('Services enabled:', config.services_enabled);
    
    // Redirect to dashboard
    router.push('/dashboard');
  };
  
  return <SetupWizard onComplete={handleComplete} onSkip={() => router.push('/dashboard')} />;
}
```

---

## 📊 Check It Works

### 1. Complete the wizard
Navigate to `/onboarding/wizard` and complete all steps

### 2. Check the database
```sql
SELECT * FROM user_wizard_completions ORDER BY completed_at DESC LIMIT 1;
```

You should see your wizard data persisted.

### 3. Check the API response
Open browser DevTools → Network tab → Look for POST to `/api/onboarding/wizard`

You should see:
```json
{
  "success": true,
  "services_enabled": [...],
  "templates_loaded": [...],
  "dashboard_config": {...},
  "ai_config": {...}
}
```

---

## 📚 Full Documentation

- **User guide**: `docs/SETUP_WIZARD_GUIDE.md`
- **Developer guide**: `docs/WIZARD_IMPLEMENTATION.md`
- **Summary**: `WIZARD_SETUP_COMPLETE.md`

---

## 🎨 Reuse the Backdrop

The dark Shopify-style backdrop is reusable:

```tsx
import { ShopifyBackdrop } from '@/components/ui';

<ShopifyBackdrop accent1="#a78bfa" accent2="#f472b6">
  {/* Your content */}
</ShopifyBackdrop>
```

---

## ❓ Troubleshooting

### Wizard doesn't load
- Check that migration ran successfully
- Check browser console for errors
- Verify `/api/onboarding/wizard` endpoint exists

### Services not activating
- Check API logs: `grep "Wizard API" logs/app.log`
- Verify database entry exists
- Check service activation logic in `app/api/onboarding/wizard/route.ts`

### Styling looks wrong
- Ensure Tailwind is configured correctly
- Check that dark mode classes are supported
- Verify gradient colors are rendering

---

## ✅ Success!

If you can complete the wizard and see data in the database, you're all set!

Next steps:
1. Customize platforms/goals/tones for your needs
2. Set up analytics tracking
3. Deploy to staging
4. Test with real users
5. Monitor completion rates and times

---

**Need help?** Check the full docs or open an issue.
