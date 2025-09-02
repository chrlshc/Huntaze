import type { Metadata } from 'next';
import StripePricingTable from '../pricing/stripe-pricing-table';

export const metadata: Metadata = {
  title: 'Pricing - Huntaze',
  description: 'Simple, transparent pricing for creators. Free trial available. Cancel anytime.',
};

export default function StripePricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 opacity-70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Choose the perfect plan for your creator journey. Scale as you grow.
            </p>
          </div>
        </div>
      </div>

      {/* Stripe Pricing Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <StripePricingTable />
      </div>

      {/* Trust Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">No Hidden Fees</h3>
              <p className="text-gray-700 mt-2">
                What you see is what you pay. Transparent commission structure.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Cancel Anytime</h3>
              <p className="text-gray-700 mt-2">
                No contracts, no penalties. Stay as long as it works for you.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Instant Setup</h3>
              <p className="text-gray-700 mt-2">
                Get started in minutes. Connect your platforms and go.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}