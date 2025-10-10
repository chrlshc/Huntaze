# Rebuild: Nodes and Connector Graph

This change aligns connector “cards” across key sections, simplifies the visual state, and standardizes layout.

## Summary

- Introduced a reusable ConnectorGraph with two layouts: `grid` (x/y based) and `row` (single line).
- Standardized card sizes and the background panel height to prevent visual conflicts.
- Removed status badges and “Connect” buttons for a clean, scan‑friendly view.
- Ensured only the content area scrolls; header and sidebar are fixed.

## Files

- components/hz/ConnectorGraph.tsx
  - New props: `layout` (`'grid' | 'row'`), `hideStatus`, `hideActions`, `includeHub`, `cardWidth`.
  - Row layout evenly spaces nodes horizontally and centers them vertically.
  - SVG uses `preserveAspectRatio="none"` for consistent line alignment.

- styles/hz-theme.css
  - `.hz-graph`: taller (520px), subtle border, larger padding.
  - `.hz-node-card`: larger cards; icon and typography adjusted.
  - `.hz-app`/`.hz-main`: content scroll only; header/sidebar fixed.

- Pages updated to a single‑row layout with no badges/buttons:
  - app/social-marketing/page.tsx
  - app/home/page.tsx
  - app/analytics/page.tsx
  - app/onlyfans-assisted/page.tsx
  - app/cinai/page.tsx

## Layouts

- Grid (with hub + lines): default across pages now; three outer nodes + a center hub.
- Row: available for compact layouts but not used by default after rebuild.

Cards are ≈ 220px wide, centered precisely.

## Line colors (status)

- Default (not connected): gray `#d1d5db`
- Connected: black `#0a0a0a`
- Error: red dashed `#ef4444`

Badges are hidden; the link color communicates connection state. Buttons “Connect” are visible.
