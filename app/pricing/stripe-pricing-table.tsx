'use client';

import { useEffect } from 'react';

export default function StripePricingTable() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full">
      <stripe-pricing-table 
        pricing-table-id="prctbl_1S2JNw2KbmGn7DBK0obEMJZM"
        publishable-key="pk_live_51RxE912KbmGn7DBK56bX8wioig3vLUAGDKmjRScketMFKJrRYjlXWG81WJAn97opJWPd1XZVaI9VhNDejoBbvLJF00AyA6grdI"
      />
    </div>
  );
}