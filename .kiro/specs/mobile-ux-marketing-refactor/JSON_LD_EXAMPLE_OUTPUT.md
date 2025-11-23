# JSON-LD Example Output

## What Gets Rendered

When a marketing page is rendered, the following JSON-LD structured data is automatically injected into the HTML:

### Organization Schema

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Huntaze",
  "url": "https://huntaze.com",
  "logo": "https://huntaze.com/logo.png",
  "description": "AI-powered platform for OnlyFans creators to manage content, engage fans, and optimize revenue",
  "sameAs": [
    "https://twitter.com/huntaze",
    "https://linkedin.com/company/huntaze"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "email": "support@huntaze.com"
  }
}
</script>
```

### WebSite Schema

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Huntaze",
  "url": "https://huntaze.com",
  "description": "AI-powered platform for OnlyFans creators",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://huntaze.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

### Product Schema (Example for Pricing Page)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Huntaze Pro",
  "description": "Premium AI tools for OnlyFans creators",
  "image": "https://huntaze.com/product.png",
  "brand": {
    "@type": "Brand",
    "name": "Huntaze"
  },
  "offers": {
    "@type": "Offer",
    "price": "99.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://huntaze.com/pricing"
  }
}
</script>
```

## How Search Engines Use This Data

### Google Search Results

With this structured data, Google can display:

1. **Rich Snippets**
   - Company logo in search results
   - Star ratings (if added)
   - Price information
   - Availability status

2. **Knowledge Graph**
   - Company information panel
   - Social media links
   - Contact information

3. **Site Search Box**
   - Search box directly in Google results
   - Faster access to site content

### Example Rich Result

```
┌─────────────────────────────────────────────────────┐
│ 🔍 Huntaze                                          │
│ https://huntaze.com                                 │
│                                                     │
│ [Logo] Huntaze                                      │
│ AI-powered platform for OnlyFans creators          │
│                                                     │
│ 🔗 Twitter  🔗 LinkedIn                            │
│                                                     │
│ Products:                                           │
│ • Huntaze Pro - $99.00 ✓ In Stock                 │
│                                                     │
│ [Search this site] [_______________] 🔍            │
└─────────────────────────────────────────────────────┘
```

## Validation

You can validate the structured data using:

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Paste your page URL or HTML
   - See how Google interprets the data

2. **Schema.org Validator**
   - URL: https://validator.schema.org/
   - Validates against schema.org specifications

3. **Google Search Console**
   - Monitor structured data errors
   - Track rich result impressions
   - See which pages have valid markup

## Browser DevTools Inspection

To see the JSON-LD in your browser:

1. Open DevTools (F12)
2. Go to Elements/Inspector tab
3. Search for `application/ld+json`
4. You'll see the script tags with structured data

```html
<head>
  <!-- Other head elements -->
  
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Organization",...}
  </script>
  
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"WebSite",...}
  </script>
</head>
```

## SEO Impact Timeline

- **Immediate**: Structured data is crawlable
- **1-2 weeks**: Google indexes the data
- **2-4 weeks**: Rich results may start appearing
- **1-3 months**: Full SEO benefits realized

## Best Practices

1. ✅ Keep data accurate and up-to-date
2. ✅ Match visible page content
3. ✅ Use specific schema types
4. ✅ Include all recommended properties
5. ✅ Test before deploying
6. ✅ Monitor Search Console for errors

## Common Issues and Solutions

### Issue: Schema not appearing in search results
**Solution**: Wait 2-4 weeks for Google to recrawl and process

### Issue: Validation errors in Search Console
**Solution**: Use the Rich Results Test to identify specific issues

### Issue: Multiple schemas conflicting
**Solution**: Ensure each schema has unique, non-overlapping data

### Issue: Schema data doesn't match page content
**Solution**: Update schema to accurately reflect visible content
