/**
 * Message Packs Checkout Component
 * 
 * Premium UI for purchasing message packs with Stripe
 */

'use client';

import { useState } from 'react';
import { useCheckoutWithRedirect, PackType, PACK_INFO, formatMessageCount } from '@/hooks/billing/useCheckout';
import { CreditCard, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export function MessagePacksCheckout() {
  const { purchasePack, loading, error, correlationId } = useCheckoutWithRedirect();
  const [selectedPack, setSelectedPack] = useState<PackType | null>(null);

  const handlePurchase = async (pack: PackType) => {
    setSelectedPack(pack);
    await purchasePack(pack);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50"></div>
              <CreditCard className="relative w-12 h-12 text-purple-600" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              Message Packs
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Choose the perfect pack for your needs
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
              {correlationId && (
                <p className="text-red-600 text-sm mt-1">
                  Correlation ID: {correlationId}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(PACK_INFO) as PackType[]).map((pack, index) => {
            const info = PACK_INFO[pack];
            const isPopular = pack === '100k';
            const isLoading = loading && selectedPack === pack;

            return (
              <div
                key={pack}
                className={`relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 ${
                  isPopular
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 p-[3px]'
                    : 'bg-gradient-to-br from-gray-300 to-gray-400 p-[2px]'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-1 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                      <Sparkles className="w-3 h-3" />
                      POPULAR
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-8 h-full flex flex-col">
                  {/* Pack Name */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {info.name}
                    </h3>
                    <p className="text-gray-600">{info.description}</p>
                  </div>

                  {/* Message Count */}
                  <div className="mb-6">
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatMessageCount(info.messages)}
                    </div>
                    <div className="text-gray-600 mt-1">messages</div>
                  </div>

                  {/* Features */}
                  <div className="mb-8 space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>AI-powered suggestions</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-600" />
                      <span>Analytics dashboard</span>
                    </div>
                    {isPopular && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Best value</span>
                      </div>
                    )}
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={() => handlePurchase(pack)}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-105'
                        : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:shadow-lg hover:scale-105'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Purchase Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span>24/7 Support</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Powered by Stripe • Secure checkout
          </p>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-900 font-medium">Redirecting to checkout...</p>
            <p className="text-gray-600 text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}
    </div>
  );
}
