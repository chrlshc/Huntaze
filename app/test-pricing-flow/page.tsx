'use client';

import Link from 'next/link';

export default function TestPricingFlow() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Pricing Flow</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Links</h2>
            <div className="space-y-3">
              <div>
                <Link href="/pricing" className="text-purple-600 hover:text-purple-700 underline">
                  1. Go to Pricing Page →
                </Link>
                <p className="text-sm text-gray-600 mt-1">View all plans and click "Start free trial"</p>
              </div>
              
              <div>
                <Link href="/auth?plan=pro" className="text-purple-600 hover:text-purple-700 underline">
                  2. Auth with Pro Plan →
                </Link>
                <p className="text-sm text-gray-600 mt-1">Simulate clicking Pro plan button</p>
              </div>
              
              <div>
                <Link href="/onboarding/setup?step=payment&plan=scale" className="text-purple-600 hover:text-purple-700 underline">
                  3. Direct to Payment (Scale) →
                </Link>
                <p className="text-sm text-gray-600 mt-1">Skip to payment step with Scale plan</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Price IDs Configured</h2>
            <div className="space-y-2 font-mono text-sm">
              <p>STARTER: price_1S2JCL2KbmGn7DBKepeN7f8p</p>
              <p>PRO: price_1S2JF62KbmGn7DBK5cGFVP3p</p>
              <p>SCALE: price_1S2JHN2KbmGn7DBKch0hKsBa</p>
              <p>ENTERPRISE: price_1S2JJQ2KbmGn7DBKW080ADI3</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Expected Flow</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>User clicks plan on /pricing</li>
              <li>Redirects to /auth with plan parameter</li>
              <li>After auth, redirects to /onboarding/setup with plan</li>
              <li>Onboarding jumps to payment step</li>
              <li>Stripe Checkout opens with selected plan</li>
              <li>After payment, returns to complete onboarding</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}