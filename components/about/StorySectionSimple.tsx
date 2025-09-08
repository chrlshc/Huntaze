export function StorySectionSimple() {
  const milestones = [
    {
      year: "2021",
      title: "The Spark",
      description: "Two creators frustrated with managing their business meet at a conference."
    },
    {
      year: "2022",
      title: "The Vision",
      description: "AI meets creator economy. We build our first prototype in a garage."
    },
    {
      year: "2023",
      title: "The Launch",
      description: "1,000 creators join our beta. Revenue automation changes everything."
    },
    {
      year: "2024",
      title: "The Growth",
      description: "50,000+ creators. $100M+ managed. The future is here."
    }
  ];

  return (
    <section id="our-story" className="py-32 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20 animate-fadeIn">
          <span className="overline">Our Journey</span>
          <h2 className="heading-1 mt-4 mb-6">
            From Frustration to Revolution
          </h2>
          <p className="lead max-w-3xl mx-auto">
            Every great company starts with a problem that needs solving. 
            Ours was simple: why is managing a creator business so hard?
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-purple-300 to-pink-300" />
          
          {/* Timeline items */}
          <div className="space-y-20">
            {milestones.map((milestone, index) => (
              <div 
                key={milestone.year}
                className={`flex items-center gap-8 ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div 
                  className={`w-1/2 ${
                    index % 2 === 0 ? 'text-right pr-12' : 'text-left pl-12'
                  } animate-slideIn${index % 2 === 0 ? 'Right' : 'Left'} delay-${(index + 1) * 200}`}
                >
                  <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {milestone.year}
                  </span>
                  <h3 className="feature-title mt-4 mb-3">{milestone.title}</h3>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
                
                {/* Timeline dot */}
                <div className="relative z-10 w-6 h-6 bg-white border-4 border-purple-500 rounded-full animate-scaleIn delay-${(index + 1) * 200}" />
                
                <div className="w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}