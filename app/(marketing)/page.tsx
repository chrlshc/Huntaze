import React from 'react';
import Link from 'next/link';
import { BarChart3, Sparkles, Users, Shield } from 'lucide-react';

// Use dynamic rendering
export const dynamicParams = true;
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F0F10] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#27272A] bg-[#0F0F10]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-semibold text-[#F8F9FA]">
            Huntaze
          </div>
          <div className="flex gap-6 items-center">
            <Link 
              href="/auth/login"
              className="text-sm font-medium text-[#A0AEC0] hover:text-[#F8F9FA] transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#8E65D4] to-[#7D57C1] rounded-lg hover:shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-20 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#7D57C1]/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6 bg-gradient-to-b from-[#F8F9FA] to-[#E2E8F0] bg-clip-text text-transparent">
            Run Your Creator Business on Autopilot
          </h1>
          <p className="text-xl text-[#A0AEC0] leading-relaxed mb-10 max-w-2xl mx-auto">
            Focus on creating content. We handle the analytics, marketing, and growth.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/auth/register"
              className="group relative px-8 py-4 text-base font-semibold bg-gradient-to-r from-[#8E65D4] to-[#7D57C1] rounded-xl shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)] transition-all duration-200 hover:-translate-y-0.5"
            >
              Request Early Access
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <span className="text-sm text-[#94A3B8]">
              Closed Beta • Invite only
            </span>
          </div>

          {/* Dashboard Preview Placeholder */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F10] via-transparent to-transparent z-10 pointer-events-none" />
            <div 
              className="relative rounded-2xl overflow-hidden border border-[#27272A] shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
              style={{
                transform: 'perspective(1000px) rotateX(5deg) scale(1.02)',
              }}
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-[#18181B] to-[#0F0F10] flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-[#7D57C1] mx-auto mb-4 opacity-50" />
                  <p className="text-[#94A3B8]">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="relative px-6 py-24 bg-gradient-to-b from-transparent via-[#131316]/50 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-semibold text-[#E2E8F0] mb-4">
            Stop juggling apps
          </h3>
          <p className="text-lg text-[#A0AEC0] leading-relaxed">
            Being a creator shouldn't mean being a data analyst or a manager. Huntaze brings calm to your workflow by putting everything in one place.
          </p>
        </div>
      </section>

      {/* The Benefits */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: BarChart3, 
                label: 'CLARITY',
                title: 'See clearly',
                desc: 'Track your revenue and growth across all platforms instantly. No more spreadsheets.' 
              },
              { 
                icon: Sparkles, 
                label: 'FREEDOM',
                title: 'Save time',
                desc: 'Your AI assistant works 24/7. It handles messages and routine tasks so you can sleep.' 
              },
              { 
                icon: Users, 
                label: 'CONNECTION',
                title: 'Know your fans',
                desc: 'Identify your top supporters and build real relationships with the people who matter most.' 
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group relative p-8 bg-[#18181B] border border-[#27272A] rounded-2xl hover:border-[#7D57C1] hover:shadow-[0_0_30px_rgba(125,87,193,0.3)] transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-[#7D57C1]/10 flex items-center justify-center mb-6 group-hover:bg-[#7D57C1]/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-[#7D57C1]" strokeWidth={1.5} />
                </div>
                <div className="text-xs font-semibold text-[#7D57C1] tracking-wider mb-2">
                  {feature.label}
                </div>
                <h3 className="text-2xl font-semibold text-[#F8F9FA] mb-3">
                  {feature.title}
                </h3>
                <p className="text-base text-[#A0AEC0] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="relative px-6 py-24 bg-gradient-to-b from-transparent via-[#131316]/50 to-transparent overflow-hidden">
        {/* Background Shield Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
          <Shield className="w-[600px] h-[600px] text-[#7D57C1]" />
        </div>
        
        <div className="relative max-w-3xl mx-auto text-center">
          <h3 className="text-3xl font-semibold text-[#E2E8F0] mb-4">
            Your business, safe and secure
          </h3>
          <p className="text-lg text-[#A0AEC0] leading-relaxed">
            We built Huntaze to protect your work. We never see your passwords, and your data stays yours. Forever.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-32">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-[#F8F9FA] mb-12">
            Ready to upgrade your workflow?
          </h2>
          <Link
            href="/auth/register"
            className="group relative inline-block px-10 py-5 text-lg font-semibold bg-gradient-to-r from-[#8E65D4] to-[#7D57C1] rounded-xl shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)] transition-all duration-200 hover:-translate-y-0.5"
          >
            Request Access
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#27272A] px-6 py-8 bg-[#0F0F10]">
        <div className="max-w-6xl mx-auto text-center text-sm text-[#94A3B8]">
          © 2025 Huntaze. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
