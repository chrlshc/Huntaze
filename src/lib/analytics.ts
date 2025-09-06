"use client";

type Params = Record<string, any>;

export function track(event: string, params: Params = {}): void {
  try {
    if (typeof window === "undefined") return;
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", event, params);
    } else if (typeof w.dataLayer !== "undefined") {
      w.dataLayer.push({ event, ...params });
    } else if (process.env.NODE_ENV !== "production") {
      console.debug("[analytics]", event, params);
    }
  } catch (e) {
    // no-op
  }
}

export const events = {
  ctaClick: (params: { location: string; label: string }) => track("cta_click", params),
  pricingToggle: (params: { billing: "monthly" | "yearly" }) => track("pricing_toggle", params),
  planSelect: (params: { plan: string; billing: "monthly" | "yearly" }) => track("plan_select", params),
  faqOpen: (params: { question: string; index: number }) => track("faq_open", params),
  newsletterClick: (params: { location: string }) => track("newsletter_subscribe_click", params),
};

