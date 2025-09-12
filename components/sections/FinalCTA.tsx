'use client';

import Link from 'next/link';
import { Shield, CheckCircle, Users } from 'lucide-react';

export default function FinalCTA() {


  return (
    <section className="relative py-20 px-4 overflow-hidden bg-black">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-200/20 rounded-full filter blur-3xl"
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Main CTA Content */}
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Ready to grow your{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              creator business
            </span>?
          </h2>
          
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join 5,000+ creators using Huntaze to automate
            fan engagement and boost revenue.
          </p>
          
          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span className="text-gray-300">20+ hours saved/week</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span className="text-gray-300">+32% average revenue*</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span className="text-gray-300">Without hiring</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col items-center gap-6">
          <Link 
            href="/auth"
            className="cta-gradient cta-large"
          >
            {/* Button content */}
            <span className="relative z-10 flex flex-col items-center gap-1">
              <span className="flex items-center gap-2">
                Start free trial
                <span>→</span>
              </span>
              <span className="text-sm font-normal opacity-90">14 days free • No card required</span>
            </span>
          </Link>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              GDPR compliant
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              5,000+ active creators
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              Secure data
            </span>
          </div>
        </div>

        {/* Pricing Teaser */}
        <div className="mt-16 text-center">
          {/* Offre spéciale sans timer */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full border border-purple-500/20 mb-4">
            <span className="text-purple-400 font-semibold">Offre limitée</span>
            <span className="text-gray-300">-50% le premier mois</span>
          </div>
          <p className="text-gray-400 mb-4">Tarification simple et transparente</p>
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <span>• Starter: €49/mois</span>
            <span>• Pro: €99/mois</span>
            <span>• Scale: €299/mois</span>
          </div>
          <Link 
            href="/pricing"
            className="text-purple-600 hover:text-purple-700 mt-4 inline-block text-sm font-medium"
          >
            View detailed pricing →
          </Link>
        </div>
      </div>
    </section>
  );
}