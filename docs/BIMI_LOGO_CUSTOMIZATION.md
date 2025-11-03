# BIMI Logo Customization Guide

## Current Logo Design

The Huntaze BIMI logo (`public/bimi-logo.svg`) features:

```
┌─────────────────────────┐
│    ●                    │  ← Blue accent dot (#3b82f6)
│                         │
│   ██      ██            │
│   ██      ██            │  ← White "H" lettermark
│   ██████████            │
│   ██      ██            │
│   ██      ██            │
│                         │
│  Dark background        │  ← #1a1a1a
└─────────────────────────┘
```

## Design Specifications

- **Size**: 512x512px (1:1 ratio required)
- **Background**: Dark circle (#1a1a1a)
- **Letter**: White "H" with rounded corners
- **Accent**: Blue dot (#3b82f6) - Huntaze brand color
- **Style**: Modern, geometric, minimal

## Customization Options

### Option 1: Change Colors

Edit `public/bimi-logo.svg`:

```xml
<!-- Background color -->
<circle cx="256" cy="256" r="240" fill="#1a1a1a"/>  <!-- Change this -->

<!-- Letter color -->
<g fill="#ffffff">  <!-- Change this -->

<!-- Accent color -->
<circle cx="390" cy="180" r="18" fill="#3b82f6"/>  <!-- Change this -->
```

**Recommended color schemes:**

**Dark theme (current):**
- Background: `#1a1a1a`
- Letter: `#ffffff`
- Accent: `#3b82f6`

**Light theme:**
- Background: `#ffffff`
- Letter: `#1a1a1a`
- Accent: `#3b82f6`

**Brand colors:**
- Background: `#3b82f6` (blue)
- Letter: `#ffffff`
- Accent: `#fbbf24` (yellow/gold)

### Option 2: Use Your Existing Logo

If you have a logo in another format (PNG, AI, etc.):

1. **Convert to SVG** using:
   - Adobe Illustrator
   - Inkscape (free)
   - Online converter: https://convertio.co/png-svg/

2. **Optimize for BIMI**:
   - Save as "SVG Tiny 1.2"
   - Remove all scripts, animations, external links
   - Ensure square aspect ratio (1:1)
   - Keep under 32KB

3. **Validate**:
   ```bash
   node scripts/validate-bimi.js
   ```

### Option 3: Professional Design

For a custom professional logo:

1. **Hire a designer** on:
   - Fiverr (search "BIMI logo")
   - Upwork
   - 99designs

2. **Provide requirements**:
   - SVG Tiny-PS format
   - 512x512px, square
   - No scripts or animations
   - Under 32KB
   - Works on light and dark backgrounds

3. **Budget**: $50-$500 depending on complexity

## Testing Your Logo

After making changes:

```bash
# 1. Validate SVG compliance
node scripts/validate-bimi.js

# 2. Test complete setup
node scripts/test-bimi-setup.js

# 3. Preview in browser
open public/bimi-logo.svg

# 4. Deploy and test in Gmail
git add public/bimi-logo.svg
git commit -m "Update BIMI logo"
git push
```

## Design Best Practices

### ✅ Do:
- Use simple, bold shapes
- Ensure good contrast
- Test on both light and dark backgrounds
- Keep it recognizable at small sizes (32x32px)
- Use your brand colors
- Make it square (1:1 ratio)

### ❌ Don't:
- Use thin lines (may not render well)
- Include small text (won't be readable)
- Use complex gradients (may not display correctly)
- Add animations or scripts (forbidden by BIMI)
- Use external images or fonts
- Make it too detailed (simplicity is key)

## Gmail Display

Your logo will appear as:

**In inbox list:**
- 32x32px circular avatar
- Next to sender name
- Cropped to circle (design accordingly)

**In email view:**
- Larger circular avatar
- Top of email
- More visible

**Note**: Gmail crops square logos to circles, so:
- Keep important elements in the center
- Avoid text near edges
- Test circular crop: https://crop-circle.imageonline.co/

## Updating the Logo

1. **Edit** `public/bimi-logo.svg`
2. **Validate**: `node scripts/validate-bimi.js`
3. **Deploy** to production
4. **Wait** 24-48 hours for Gmail to update cache
5. **Force refresh** by sending from different IP/server

## Logo Variations

You can create multiple versions for different use cases:

```
public/
  ├── bimi-logo.svg           # BIMI version (for email)
  ├── huntaze-logo.png        # Website version
  ├── logo-dark.svg           # Dark theme
  └── logo-light.svg          # Light theme
```

Only `bimi-logo.svg` needs to be BIMI-compliant.

## Resources

- [SVG Tiny-PS Spec](https://www.w3.org/TR/SVGTiny12/)
- [BIMI Logo Guidelines](https://bimigroup.org/creating-bimi-svg-logo-files/)
- [Inkscape (Free SVG Editor)](https://inkscape.org/)
- [SVGOMG (SVG Optimizer)](https://jakearchibald.github.io/svgomg/)

---

**Current Logo**: Modern "H" lettermark with blue accent  
**File Size**: 798 bytes  
**Status**: ✅ BIMI compliant
