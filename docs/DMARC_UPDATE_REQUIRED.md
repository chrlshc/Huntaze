# ⚠️ DMARC Update Required for BIMI

## Current Issue

Your DMARC policy is set to `p=none`, but **BIMI requires `p=quarantine` or `p=reject`**.

## Current DMARC Record

```
v=DMARC1; p=none; rua=mailto:dmarc@huntaze.com
```

## Required Change

Update your DNS TXT record for `_dmarc.huntaze.com` to:

### Option 1: Quarantine (Recommended for transition)
```
v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@huntaze.com; ruf=mailto:dmarc@huntaze.com; fo=1
```

### Option 2: Reject (Strictest, use after testing)
```
v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@huntaze.com; ruf=mailto:dmarc@huntaze.com; fo=1
```

## Explanation

- `p=quarantine` - Failed emails go to spam (safer for testing)
- `p=reject` - Failed emails are rejected (strictest)
- `pct=100` - Apply policy to 100% of emails
- `rua=` - Aggregate reports email
- `ruf=` - Forensic reports email
- `fo=1` - Generate forensic reports for any failure

## ⚠️ Important: Test Before Changing

**Before changing to quarantine/reject:**

1. **Monitor current DMARC reports** at dmarc@huntaze.com
2. **Verify SPF and DKIM are passing** for all your email sources
3. **Start with pct=10** (10% of emails) if unsure:
   ```
   v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc@huntaze.com
   ```
4. **Gradually increase** pct to 100% over 2-4 weeks

## Safe Transition Plan

### Week 1: Monitor Only (Current)
```
v=DMARC1; p=none; rua=mailto:dmarc@huntaze.com
```
- Monitor reports
- Ensure SPF/DKIM pass

### Week 2: Quarantine 10%
```
v=DMARC1; p=quarantine; pct=10; rua=mailto:dmarc@huntaze.com
```
- Test with small percentage
- Check for delivery issues

### Week 3: Quarantine 50%
```
v=DMARC1; p=quarantine; pct=50; rua=mailto:dmarc@huntaze.com
```
- Increase coverage
- Monitor reports

### Week 4: Quarantine 100%
```
v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@huntaze.com
```
- Full protection
- **BIMI will now work!**

### Future: Reject (Optional)
```
v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@huntaze.com
```
- Maximum security
- Only after confirming no issues

## Quick Start (If you're confident)

If your SPF and DKIM are already working perfectly, you can go directly to:

```
v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@huntaze.com; ruf=mailto:dmarc@huntaze.com; fo=1
```

## How to Update DNS

1. **Go to your DNS provider** (where you manage huntaze.com DNS)
2. **Find the TXT record** for `_dmarc.huntaze.com`
3. **Update the value** to one of the options above
4. **Wait for DNS propagation** (5-30 minutes usually)
5. **Verify the change**:
   ```bash
   dig TXT _dmarc.huntaze.com +short
   ```

## Verify Your Email Authentication

Before changing DMARC policy, verify everything passes:

```bash
# Check SPF
dig TXT huntaze.com +short | grep spf

# Check DKIM (check your email headers for the selector)
dig TXT [selector]._domainkey.huntaze.com +short

# Send test email and check headers
node scripts/test-email.js
```

In the received email, check headers for:
- `spf=pass`
- `dkim=pass`
- `dmarc=pass`

## After Updating DMARC

Once you update to `p=quarantine` or `p=reject`:

1. **Wait 24-48 hours** for DNS propagation
2. **Run the test again**:
   ```bash
   node scripts/test-bimi-setup.js
   ```
3. **Deploy your BIMI logo** to production
4. **Send test emails** and check Gmail
5. **Logo should appear** within 24-48 hours

## Resources

- [DMARC.org](https://dmarc.org/)
- [Google DMARC Guide](https://support.google.com/a/answer/2466580)
- [DMARC Analyzer](https://www.dmarcanalyzer.com/)

---

**Current Status**: ❌ DMARC policy too permissive for BIMI  
**Required Action**: Update DMARC to `p=quarantine` or `p=reject`  
**Estimated Time**: 5 minutes to update + 24-48h for propagation
