# DesignCharles Pack

This folder snapshots the UI/UX changes we applied to stabilize and style the beta landing:

- Hero CTA contrast (white-on-white fixes) with hard overrides
- Beta landing layout (hero, benefits, steps, stats, FAQ, final CTA)
- Selection/interaction fixes (no violet highlight, no accidental selection)
- Beta components and pages (home content sections, banner, join, UI review)

## Files

- css/
  - selection-fixes.css — site-wide selection + interaction fixes
  - beta-landing-fixes.css — hero/benefits/steps/stats/FAQ visual improvements
  - cta-override.css — inline CSS equivalent used in app/layout to force hero CTA contrast
- components/
  - HeroSection.tsx — marketing hero with Beta badge and CTAs
  - BetaBanner.tsx — global dismissible beta banner
  - beta/*.tsx — sections: Benefits, Features, HowItWorks, SocialProof, FAQ, FinalCTA
- pages/
  - home.page.tsx — current home page (app/page.tsx)
  - join.page.tsx — beta join page (app/join/page.tsx)
  - ui-review.page.tsx — UI Review Hub (app/ui/review/page.tsx)
- manifest.json — map of source files to this snapshot

## Integration tips

- Include css/selection-fixes.css and css/beta-landing-fixes.css in your head after your base styles
- Keep the inline cta-override (or load css/cta-override.css last) to survive external overrides
- Use HeroSection + Beta sections in your home to keep structure consistent

