export function ValuesSectionSimple() {
  const values = [
    {
      icon: "🚀",
      title: "Constant Innovation",
      description: "We push the boundaries of technology to create exceptional experiences for creators."
    },
    {
      icon: "💡",
      title: "Simplicity First",
      description: "Intuitive interfaces that make business management accessible to everyone."
    },
    {
      icon: "🤝",
      title: "Human-Centered",
      description: "Technology serving human relationships, not the other way around."
    },
    {
      icon: "⚡",
      title: "Speed of Execution",
      description: "Lightning-fast results without compromising quality or security."
    },
    {
      icon: "🎯",
      title: "Creator Focus",
      description: "Every feature is built with creators' success as the primary goal."
    },
    {
      icon: "🔒",
      title: "Privacy & Trust",
      description: "Your data is sacred. We protect it with enterprise-grade security."
    }
  ];

  return (
    <section id="values" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 animate-fadeIn">
          <span className="overline">Our Values</span>
          <h2 className="heading-1 mt-4 mb-6">
            Principles That Drive Us Forward
          </h2>
          <p className="lead max-w-3xl mx-auto">
            These core values guide every decision, from product development to company culture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div
              key={value.title}
              className={`group bg-gray-50 p-8 rounded-2xl hover-lift animate-slideUp delay-${(index + 1) * 100}`}
            >
              <div className="text-5xl mb-6 animate-float">
                {value.icon}
              </div>
              <h3 className="feature-title mb-4 text-gray-900">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
              <div className="mt-6 h-1 w-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}