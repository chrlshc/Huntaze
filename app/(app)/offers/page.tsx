"use client";

export const dynamic = 'force-dynamic';

import { ShopifyShell } from "@/components/ShopifyShell";

export default function OffersPage() {
  return (
    <ShopifyShell title="Réductions" description={undefined}>
      <div className="shopify-card">
        <h2>Discounts</h2>
      </div>
    </ShopifyShell>
  );
}
