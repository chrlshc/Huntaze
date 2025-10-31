# BIMI Quick Reference

## 🚀 Quick Commands

```bash
# Validate BIMI logo locally
npm run bimi:validate

# Test complete BIMI setup (DNS, DMARC, SPF, logo)
npm run bimi:test

# Check production status (after deployment)
npm run bimi:check

# Send test email
npm run test:email
```

## 📋 Current Status Checklist

- [x] BIMI logo created (`public/bimi-logo.svg`)
- [x] Logo validated (SVG Tiny-PS compliant)
- [x] BIMI DNS record configured
- [x] SPF record configured
- [ ] **DMARC policy needs update** (currently `p=none`)
- [ ] Logo deployed to production
- [ ] Test emails sent
- [ ] Logo visible in Gmail

## ⚠️ Critical Action Required

**Update DMARC DNS record** from `p=none` to `p=quarantine`:

```
v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@huntaze.com; ruf=mailto:dmarc@huntaze.com; fo=1
```

See: `docs/DMARC_UPDATE_REQUIRED.md`

## 🔍 DNS Checks

```bash
# Check BIMI record
dig TXT default._bimi.huntaze.com +short

# Check DMARC policy
dig TXT _dmarc.huntaze.com +short

# Check SPF record
dig TXT huntaze.com +short | grep spf
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `public/bimi-logo.svg` | BIMI-compliant logo (798 bytes) |
| `docs/BIMI_SETUP.md` | Complete setup guide |
| `docs/DMARC_UPDATE_REQUIRED.md` | Critical DNS update instructions |
| `docs/BIMI_LOGO_CUSTOMIZATION.md` | Logo design guide |
| `BIMI_SETUP_SUMMARY.md` | What was done summary |

## 🛠️ Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Validate Logo | `npm run bimi:validate` | Check SVG compliance |
| Test Setup | `npm run bimi:test` | Test all BIMI requirements |
| Check Production | `npm run bimi:check` | Verify production deployment |
| Send Test Email | `npm run test:email` | Test email with logo |

## 📊 Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Create logo | ✅ Done | Complete |
| Update DMARC DNS | 5 min | **Action needed** |
| DNS propagation | 5-30 min | Waiting |
| Deploy to production | 5 min | Pending |
| Gmail cache update | 24-48h | Waiting |

## 🎯 Next Steps

### 1. Update DMARC (5 minutes)
```bash
# Update DNS TXT record for _dmarc.huntaze.com
# See: docs/DMARC_UPDATE_REQUIRED.md
```

### 2. Deploy to Production (5 minutes)
```bash
git add .
git commit -m "Add BIMI logo and configuration"
git push
```

### 3. Verify Deployment (1 minute)
```bash
npm run bimi:check
```

### 4. Test Email (1 minute)
```bash
npm run test:email
```

### 5. Wait for Gmail (24-48 hours)
- Check inbox for logo display
- Logo appears as circular avatar
- May take time for first appearance

## 🔗 Resources

- **BIMI Validator**: https://bimigroup.org/bimi-generator/
- **BIMI Group**: https://bimigroup.org/
- **Gmail BIMI Docs**: https://support.google.com/a/answer/10911027
- **DMARC Guide**: https://dmarc.org/

## 💡 Tips

- Logo appears as **circular avatar** in Gmail (design accordingly)
- First appearance can take **24-48 hours**
- Gmail caches logos (updates may be delayed)
- Without VMC: logo shows but no verified checkmark
- With VMC ($1,500+/year): verified checkmark appears

## 🐛 Troubleshooting

### Logo not appearing?
1. Wait 24-48 hours
2. Check DMARC is `p=quarantine` or `p=reject`
3. Verify logo is accessible: `curl https://huntaze.com/bimi-logo.svg`
4. Run: `npm run bimi:check`

### DMARC test failing?
1. Update DNS record (see `docs/DMARC_UPDATE_REQUIRED.md`)
2. Wait 5-30 minutes for propagation
3. Run: `npm run bimi:test`

### Logo not accessible in production?
1. Ensure file is in `public/` directory
2. Deploy to production
3. Check: `curl https://huntaze.com/bimi-logo.svg`

## 📞 Support

- BIMI Group: https://bimigroup.org/
- Gmail Support: https://support.google.com/a/
- AWS SES Docs: https://docs.aws.amazon.com/ses/

---

**Quick Start**: Update DMARC → Deploy → Wait 24-48h → Check Gmail  
**Status**: Ready (pending DMARC update)  
**Created**: October 31, 2024
