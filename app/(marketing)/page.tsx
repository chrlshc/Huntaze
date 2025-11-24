import Link from 'next/link';
import { Users, Sparkles, BarChart3 } from 'lucide-react';

// Use dynamic rendering
export const dynamicParams = true;
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#EDEDEF]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="text-xl font-medium text-white">
            Huntaze
          </div>
          <div className="flex gap-4">
            <Link 
              href="/auth/login"
              className="text-sm font-medium text-gray-400 no-underline hover:text-gray-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#151516] focus:outline-none rounded"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="rounded-md bg-[#7D57C1] px-4 py-2 text-sm font-medium text-white no-underline transition-all hover:bg-[#8E65D4] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151516] focus:outline-none"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-20 lg:py-24 text-center md:px-6 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Beta Badge Animé */}
          <div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 mb-6 backdrop-blur-sm">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse motion-reduce:animate-none" />
            Closed Beta • Invite only
          </div>
          
          <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent">
              Run Your Creator Business
            </span>
            <br />
            <span className="bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
              on Autopilot.
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-[600px] text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-400">
            Focus on creating content. We handle the analytics, marketing, and growth.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)] transition-all duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none text-base font-medium text-white no-underline focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none"
            >
              Request Early Access
            </Link>
          </div>
          
          {/* Dashboard Preview 3D (desktop only) */}
          <div className="mt-16 relative hidden md:block">
            <div 
              className="relative rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl transition-transform duration-500 hover:scale-[1.01] motion-reduce:transition-none motion-reduce:hover:transform-none"
              style={{ transform: 'perspective(1000px) rotateX(5deg)' }}
            >
              <div className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 aspect-video flex items-center justify-center">
                <p className="text-gray-500">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="bg-[#18181B] px-4 py-16 md:py-20 lg:py-24 md:px-6">
        <div className="mx-auto max-w-[700px] text-center">
          <h3 className="mb-4 text-2xl md:text-3xl font-medium text-white">
            Stop juggling apps
          </h3>
          <p className="text-base md:text-lg leading-relaxed text-gray-400">
            Being a creator shouldn't mean being a data analyst or a manager. Huntaze brings calm to your workflow by putting everything in one place.
          </p>
        </div>
      </section>

      {/* The Benefits */}
      <section className="px-4 py-16 md:py-20 lg:py-24 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { 
                icon: BarChart3, 
                title: 'Clarity', 
                subtitle: 'See clearly',
                desc: 'Track your revenue and growth across all platforms instantly. No more spreadsheets.' 
              },
              { 
                icon: Sparkles, 
                title: 'Freedom', 
                subtitle: 'Save time',
                desc: 'Your AI assistant works 24/7. It handles messages and routine tasks so you can sleep.' 
              },
              { 
                icon: Users, 
                title: 'Connection', 
                subtitle: 'Know your fans',
                desc: 'Identify your top supporters and build real relationships with the people who matter most.' 
              }
            ].map((feature, i) => (
              <div key={i} className="group p-8 bg-[#18181B] border border-[#27272A] rounded-2xl transition-all duration-300 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(125,87,193,0.3)] md:hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-purple-400 transition-all duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-500">
                  {feature.title}
                </div>
                <h3 className="mb-3 text-xl font-medium text-white">
                  {feature.subtitle}
                </h3>
                <p className="text-base md:text-lg leading-relaxed text-gray-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section className="bg-[#18181B] px-4 py-16 md:py-20 lg:py-24 md:px-6">
        <div className="mx-auto max-w-[700px] text-center">
          <h3 className="mb-4 text-2xl md:text-3xl font-medium text-white">
            Your business, safe and secure
          </h3>
          <p className="text-base md:text-lg leading-relaxed text-gray-400">
            We built Huntaze to protect your work. We never see your passwords, and your data stays yours. Forever.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-20 lg:py-24 text-center md:px-6">
        <div className="mx-auto max-w-[600px]">
          <h2 className="mb-8 text-3xl md:text-4xl lg:text-5xl font-medium text-white">
            Ready to upgrade your workflow?
          </h2>
          <Link
            href="/auth/register"
            className="inline-block rounded-md bg-[#7D57C1] px-8 py-3 text-base font-medium text-white no-underline hover:bg-[#8E65D4] focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F10] focus:outline-none"
          >
            Request Access
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 bg-[#18181B] px-4 py-12 md:px-6 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-900/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-7xl text-center text-sm text-gray-500">
          © 2025 Huntaze. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
