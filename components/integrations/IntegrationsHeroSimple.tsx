export function IntegrationsHeroSimple() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50" />
      
      <div className="relative max-w-6xl mx-auto text-center">
        <span className="overline animate-fadeIn">Integrations</span>
        
        <h1 className="heading-1 mt-4 mb-6 gradient-text-animated animate-slideUp delay-200">
          One Platform.<br />
          All Your Tools.
        </h1>
        
        <p className="lead max-w-3xl mx-auto mb-12 animate-slideUp delay-400">
          Connect Huntaze with 20+ platforms you already use. 
          Manage everything from one unified dashboard.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 animate-scaleIn delay-600">
          <span className="px-4 py-2 bg-white rounded-full shadow-md text-sm font-medium hover-lift">
            ✅ Instagram
          </span>
          <span className="px-4 py-2 bg-white rounded-full shadow-md text-sm font-medium hover-lift">
            ✅ TikTok
          </span>
          <span className="px-4 py-2 bg-white rounded-full shadow-md text-sm font-medium hover-lift">
            ✅ OnlyFans
          </span>
          <span className="px-4 py-2 bg-white rounded-full shadow-md text-sm font-medium hover-lift">
            ✅ Stripe
          </span>
          <span className="px-4 py-2 bg-white rounded-full shadow-md text-sm font-medium hover-lift">
            + 20 more
          </span>
        </div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-200 rounded-full blur-2xl opacity-30 animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-pink-200 rounded-full blur-2xl opacity-30 animate-float delay-200" />
    </section>
  );
}