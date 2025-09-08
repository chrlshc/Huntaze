export function HeroSectionSimple() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="display-1 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent animate-fadeIn">
          We're Reinventing
          <br />
          Creator Business
        </h1>
        
        <p className="lead mt-8 max-w-3xl mx-auto animate-slideUp delay-300">
          Huntaze transforms how creators manage their business. 
          No more tedious processes, just authentic human connections powered by AI.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center animate-scaleIn delay-600">
          <a 
            href="#our-story"
            className="btn btn-primary text-lg px-8 py-4 hover-lift"
          >
            Learn Our Story
          </a>
          <a 
            href="/demo"
            className="btn btn-secondary text-lg px-8 py-4 hover-scale"
          >
            See Demo
          </a>
        </div>

        {/* Floating elements */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-30 animate-float" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-30 animate-float delay-500" />
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse">
        <svg width="24" height="40" viewBox="0 0 24 40" className="text-gray-400">
          <rect x="1" y="1" width="22" height="38" rx="11" stroke="currentColor" strokeWidth="2" fill="none"/>
          <circle cx="12" cy="10" r="3" fill="currentColor" className="animate-slideUp">
            <animate attributeName="cy" values="10;20;10" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>
    </section>
  );
}