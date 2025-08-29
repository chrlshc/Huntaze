# Huntaze Quick Start Guide

## 🚀 New Features

### 1. Roadmap & Voting (/roadmap)
Vote weekly for the features you want to see built.
- **Vote weight**: Starter=1, Pro=1, Scale=2, Enterprise=3
- **Results**: Visible in real time
- **Development**: Top 3 features get built

### 2. Repost Engine (/repost)
Maximize revenue by smartly reposting your best content.

#### Steps:
1. **Import your performance** (OnlyFans CSV)
2. **See your top content** ranked by ROI
3. **Pick an optimized slot**
4. **Enable A/B testing** (optional)

#### A/B Testing Example:
- Variant A: "New content dropping 🔥 Check DMs"
- Variant B: "Special surprise in your inbox 💕"
- Tracking: `/r?rid=varA` vs `/r?rid=varB`

### 3. Smart Scheduler (/schedule)
Schedule posts at the best times.

#### Features:
- **AI Suggestions**: Based on 30 days of data
- **Multi-platform**: OnlyFans, Fansly
- **Preview**: See exactly what will be posted
- **Reminders**: Notifications before publishing

### 4. Commission Tracker (Dashboard)
See your monthly platform commission in real time.
- **Progress bar**: X$ used out of Y$ cap
- **Full transparency**: Know exactly what you pay
- **History**: Month-by-month tracking

## 📊 Analytics & Attribution

### Tracked Links
Replace all your links with the `/r` format:

```
# Old link
https://onlyfans.com/tonprofil

# New tracked link
https://huntaze.com/r?rid=bio&assetId=main&platform=ONLYFANS&to=https://onlyfans.com/tonprofil
```

### Examples by context:

1. **Instagram/Twitter bio**
```
https://huntaze.com/r?rid=bio_ig&assetId=profile&platform=ONLYFANS&to=https://onlyfans.com/tonprofil
```

2. **Promo Story**
```
https://huntaze.com/r?rid=story_promo&assetId=asset123&platform=ONLYFANS&to=https://onlyfans.com/tonprofil/campaign/summer
```

3. **Post with PPV**
```
https://huntaze.com/r?rid=ppv_tease&assetId=ppv456&platform=ONLYFANS&to=https://onlyfans.com/tonprofil/post/789
```

### Data Import

#### Via CSV (OnlyFans Export)
1. Export CSV from OnlyFans Analytics
2. Upload on `/repost` → "Import CSV"
3. Map columns: Date, Impressions, Clicks, Revenue

#### Via API (Automatic)
```bash
POST /api/repost/import
{
  "records": [{
    "assetUrl": "https://cdn/video.mp4",
    "platformType": "ONLYFANS",
    "date": "2025-01-15",
    "impressions": 5000,
    "clicks": 450,
    "ppvPurchases": 23,
    "revenueCents": 45600
  }]
}
```

## 🎯 Optimal Workflow

### Typical Week:

**Mon**: Vote on /roadmap for features
**Tue**: Import OF weekend performance
**Wed**: Schedule reposts via /repost
**Thu**: Check analytics, adjust strategy
**Fri**: Prepare weekend content with A/B
**Sat/Sun**: Post at peak hours

### Best Practices:

1. **Track everything**: Use `/r` for ALL links
2. **A/B everything**: Test at least 2 variants
3. **Weekly analysis**: Check top performers
4. **Smart repost**: Respect 7–14 day cooldown
5. **Peak hours**: Trust AI recommendations

## 🔧 Troubleshooting

### "No data in Repost Engine"
→ Import your OnlyFans CSV or create assets manually

### "Generic schedule suggestions"
→ The more data you import, the more precise it gets

### "A/B test: how to see the winner?"
→ Check CTR in analytics after 24–48h

### "Commission meter empty"
→ Normal at start of month or if no tracked revenue yet

## 📈 Metrics to Track

1. **CTR** (Click-Through Rate) : Cibles 8-12%
2. **Conversion PPV** : Cibles 15-25% des clics
3. **Revenue per Repost**: Track improvement vs. original
4. **Best Hours**: Note patterns by day
5. **A/B Winners**: Build a swipe file of top variants

---

💡 **Pro Tip**: Set reminders to import your data weekly. The more you feed the system, the smarter it gets!
