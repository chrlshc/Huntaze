'use client'

export default function SimpleHero() {
  return (
    <section className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          The platform built for<br />
          premium creators
        </h1>
        <p className="text-white/70 mb-8 max-w-md mx-auto">
          Automate conversations, boost revenue, and scale your exclusive content business with AI.
        </p>
        
        {/* Simple Mobile Mockup */}
        <div className="relative w-full max-w-[320px] mx-auto aspect-[9/16] rounded-[22px] border-2 border-white/20 bg-gray-800 p-4">
          <h2 className="text-white font-semibold mb-4">Weekly Revenue</h2>
          
          {/* Simple Chart */}
          <svg viewBox="0 0 300 150" className="w-full h-32">
            <defs>
              <linearGradient id="simpleGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            <line x1="0" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.1)" />
            <line x1="0" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.1)" />
            
            {/* Line chart */}
            <polyline
              points="20,120 60,100 100,80 140,90 180,60 220,40 260,20"
              fill="none"
              stroke="url(#simpleGradient)"
              strokeWidth="3"
            />
            
            {/* Data points */}
            <circle cx="20" cy="120" r="4" fill="white" />
            <circle cx="60" cy="100" r="4" fill="white" />
            <circle cx="100" cy="80" r="4" fill="white" />
            <circle cx="140" cy="90" r="4" fill="white" />
            <circle cx="180" cy="60" r="4" fill="white" />
            <circle cx="220" cy="40" r="4" fill="white" />
            <circle cx="260" cy="20" r="5" fill="#ec4899" />
          </svg>
          
          <div className="mt-4 text-white">
            <p className="text-2xl font-bold">$36,518</p>
            <p className="text-sm text-white/60">This week's total</p>
          </div>
        </div>
      </div>
    </section>
  )
}