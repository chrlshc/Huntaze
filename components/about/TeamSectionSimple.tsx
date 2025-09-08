export function TeamSectionSimple() {
  const team = [
    {
      name: "Sarah Chen",
      role: "Co-Founder & CEO",
      bio: "Former creator turned tech entrepreneur. 10M+ follower journey.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah"
    },
    {
      name: "Marcus Rodriguez",
      role: "Co-Founder & CTO",
      bio: "AI researcher from Stanford. Built ML systems at Google.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus"
    },
    {
      name: "Emily Watson",
      role: "Head of Product",
      bio: "Product leader from Instagram. Creator economy expert.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily"
    },
    {
      name: "David Park",
      role: "Head of Engineering",
      bio: "Scaled systems at TikTok. Distributed systems architect.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=david"
    },
    {
      name: "Luna Patel",
      role: "Head of Design",
      bio: "Design lead from Stripe. Human-centered design advocate.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=luna"
    },
    {
      name: "Alex Thompson",
      role: "Head of Growth",
      bio: "Growth expert from OnlyFans. Data-driven strategist.",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex"
    }
  ];

  return (
    <section id="team" className="py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 animate-fadeIn">
          <span className="overline">Our Team</span>
          <h2 className="heading-1 mt-4 mb-6">
            Meet the Humans Behind Huntaze
          </h2>
          <p className="lead max-w-3xl mx-auto">
            A diverse team of creators, engineers, and dreamers united by one mission: 
            empowering creators worldwide.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div 
              key={member.name} 
              className={`text-center hover-scale animate-slideUp delay-${(index + 1) * 100}`}
            >
              <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="feature-title mb-1">{member.name}</h3>
              <p className="text-purple-600 font-medium mb-3">{member.role}</p>
              <p className="text-gray-600 text-sm">{member.bio}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center animate-fadeIn delay-800">
          <p className="text-2xl font-semibold mb-6">Want to join our mission?</p>
          <a 
            href="/careers" 
            className="btn btn-primary inline-flex items-center gap-2 hover-lift"
          >
            View Open Positions
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}