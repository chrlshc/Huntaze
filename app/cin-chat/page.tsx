"use client";

import { ShopifyShell } from "@/components/ShopifyShell";

export default function CinChatPage() {
  return (
    <ShopifyShell
      title="CIN chat"
      description="Server-side intent engine for scheduling, A/B, pricing and VIP."
    >
      <div className="shopify-card-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <div className="shopify-card">
          <h2>Intents</h2>
        </div>
        <div className="shopify-card">
          <h2>Actions</h2>
        </div>
      </div>
    </ShopifyShell>
  );
}
