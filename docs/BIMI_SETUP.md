# BIMI Setup Guide for Huntaze

## What is BIMI?

BIMI (Brand Indicators for Message Identification) displays your logo next to emails in Gmail and other supporting email clients.

## Current Status

✅ DNS BIMI record configured  
✅ SVG Tiny-PS logo created (`public/bimi-logo.svg`)  
❌ **DMARC policy must be updated** (currently `p=none`, needs `p=quarantine` or `p=reject`)  
⏳ Logo needs to be deployed to production  
⏳ Waiting for Gmail to cache and display logo (can take 24-48h)

**⚠️ CRITICAL: See `docs/DMARC_UPDATE_REQUIRED.md` for required DNS changes**

## Files Created

- `public/huntaze-bimi-logo.svg` - BIMI-compliant logo (798 bytes)
- `scripts/validate-bimi.js` - Validation script

## Deployment Steps

### 1. Deploy Logo to Production

The logo must be accessible at:
```
https://huntaze.com/huntaze-bimi-logo.svg
```

**For AWS Amplify:**
- The file in `public/` will automatically be deployed
- Verify after deployment: `curl https://huntaze.com/huntaze-bimi-logo.svg`

### 2. Verify DNS Record

Your BIMI DNS record should look like:
```
default._bimi.huntaze.com. IN TXT "v=BIMI1; l=https://huntaze.com/huntaze-bimi-logo.svg;"
```

Check it:
```bash
dig TXT default._bimi.huntaze.com +short
```

### 3. Validate BIMI Setup

Use the official BIMI validator:
- https://bimigroup.org/bimi-generator/

Or check manually:
```bash
node scripts/validate-bimi.js
```

### 4. Test Email Display

Send test emails:
```bash
node scripts/test-email.js
```

Check in Gmail:
- Logo appears next to sender name
- May take 24-48 hours for first appearance
- Gmail caches logos, so updates may be delayed

## BIMI Requirements Met

✅ **SVG Tiny-PS format** - Strict profile for security  
✅ **Square aspect ratio** - 512x512 viewBox  
✅ **File size < 32KB** - Only 798 bytes  
✅ **No forbidden elements** - No scripts, animations, or external links  
✅ **Proper metadata** - Includes title and description  
✅ **HTTPS hosting** - Will be served over HTTPS  
✅ **DNS record** - Already configured

## Without VMC (Current Setup)

You're using BIMI without a Verified Mark Certificate (VMC):

**Pros:**
- ✅ Works on Gmail
- ✅ Free (no $1500+/year VMC cost)
- ✅ Quick setup

**Cons:**
- ⚠️ Lower trust indicator
- ⚠️ May not work on all email clients
- ⚠️ Gmail shows logo but without "verified" checkmark

**With VMC (Future Option):**
- Blue checkmark in Gmail
- Higher trust signal
- Required for some enterprise email clients
- Cost: ~$1,500-$2,500/year

## Troubleshooting

### Logo not appearing in Gmail?

1. **Wait 24-48 hours** - Gmail caches BIMI data
2. **Check DNS propagation**: `dig TXT default._bimi.huntaze.com`
3. **Verify logo is accessible**: `curl https://huntaze.com/huntaze-bimi-logo.svg`
4. **Check DMARC policy**: Must have `p=quarantine` or `p=reject`
5. **Validate SPF and DKIM**: Must be passing

### Check your email authentication:

```bash
# DMARC
dig TXT _dmarc.huntaze.com +short

# SPF
dig TXT huntaze.com +short | grep spf

# DKIM (check email headers for selector)
dig TXT [selector]._domainkey.huntaze.com +short
```

### Force Gmail to refresh:

1. Clear Gmail cache (sign out/in)
2. Send from different IP/server
3. Wait for natural cache expiration (24-48h)

## Logo Customization

To update the logo, edit `public/huntaze-bimi-logo.svg`:

1. Keep it square (1:1 ratio)
2. Use simple shapes (better rendering)
3. Avoid gradients (may not render well)
4. Test on dark/light backgrounds
5. Validate: `node scripts/validate-bimi.js`

## Resources

- [BIMI Group](https://bimigroup.org/)
- [BIMI Generator/Validator](https://bimigroup.org/bimi-generator/)
- [Gmail BIMI Documentation](https://support.google.com/a/answer/10911027)
- [SVG Tiny-PS Spec](https://www.w3.org/TR/SVGTiny12/)

## Current Logo Design

The Huntaze BIMI logo features:
- Dark circular background (#1a1a1a)
- White "H" lettermark
- Blue accent dot (brand color #3b82f6)
- Clean, modern geometric design
- Optimized for small display sizes

---

**Status**: Ready for deployment  
**Last Updated**: October 31, 2024
