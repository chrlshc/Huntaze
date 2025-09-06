"use client";

import { motion } from "framer-motion";
import HeaderImproved from "@/src/components/header-improved";
import FooterImproved from "@/src/components/footer-improved";
import { MapPin, Clock, DollarSign, Heart, Zap, Users, Rocket, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: DollarSign,
    title: "Competitive Salary",
    description: "Top of market compensation + equity"
  },
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "100% covered health, dental, vision"
  },
  {
    icon: Coffee,
    title: "Work-Life Balance",
    description: "Flexible hours, unlimited PTO"
  },
  {
    icon: Rocket,
    title: "Growth & Learning",
    description: "$5k annual learning budget"
  }
];

const openPositions = [
  {
    title: "Senior Backend Engineer",
    department: "Engineering",
    location: "Remote (US/EU)",
    type: "Full-time",
    description: "Build scalable AI infrastructure processing millions of messages daily.",
    requirements: [
      "5+ years Python/Node.js experience",
      "Experience with ML/AI systems",
      "Strong AWS/GCP knowledge",
      "API design expertise"
    ]
  },
  {
    title: "AI/ML Engineer",
    department: "AI Team",
    location: "Remote (Global)",
    type: "Full-time",
    description: "Develop and train AI models that understand creator communication styles.",
    requirements: [
      "3+ years ML experience",
      "PyTorch/TensorFlow expertise",
      "NLP experience preferred",
      "Production ML deployment"
    ]
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote (US)",
    type: "Full-time",
    description: "Design intuitive interfaces that creators love to use every day.",
    requirements: [
      "4+ years product design",
      "SaaS design experience",
      "Strong Figma skills",
      "User research experience"
    ]
  },
  {
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Remote (US/EU)",
    type: "Full-time",
    description: "Drive creator acquisition and retention through data-driven campaigns.",
    requirements: [
      "3+ years growth marketing",
      "Creator economy knowledge",
      "Paid social expertise",
      "Strong analytical skills"
    ]
  }
];

const values = [
  {
    title: "Creator First",
    description: "Everything we build starts with creator needs",
    icon: Users
  },
  {
    title: "Move Fast",
    description: "Ship quickly, learn faster, iterate always",
    icon: Zap
  },
  {
    title: "Be Transparent",
    description: "Open communication, honest feedback, no BS",
    icon: Heart
  },
  {
    title: "Think Big",
    description: "10x thinking, ambitious goals, global impact",
    icon: Rocket
  }
];

export default function CareersPage() {
  return (
    <>
      <HeaderImproved />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-purple-50 to-white dark:from-gray-950 dark:to-black">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Join the team
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                building the future
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8">
              Help 100k+ creators earn more while working less
            </p>
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              View open positions
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800">
        <div className="container-width">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold">45+</p>
              <p className="text-gray-600 dark:text-gray-400">Team members</p>
            </div>
            <div>
              <p className="text-3xl font-bold">15</p>
              <p className="text-gray-600 dark:text-gray-400">Countries</p>
            </div>
            <div>
              <p className="text-3xl font-bold">$25M</p>
              <p className="text-gray-600 dark:text-gray-400">Funding raised</p>
            </div>
            <div>
              <p className="text-3xl font-bold">10K+</p>
              <p className="text-gray-600 dark:text-gray-400">Creators served</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container-width">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="container-width">
          <h2 className="text-3xl font-bold text-center mb-12">Benefits & Perks</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-black rounded-2xl p-6 border border-gray-200 dark:border-gray-800"
              >
                <benefit.icon className="w-10 h-10 text-purple-600 mb-3" />
                <h3 className="font-semibold mb-1">{benefit.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20">
        <div className="container-width">
          <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {openPositions.map((position, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-semibold mb-2">{position.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <Button className="mt-4 md:mt-0">
                    Apply Now
                  </Button>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {position.description}
                </p>
                
                <div>
                  <p className="font-medium mb-2">Requirements:</p>
                  <ul className="space-y-1">
                    {position.requirements.map((req, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container-width text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Don't see your role?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            We're always looking for exceptional talent. Send us your resume and we'll keep you in mind.
          </p>
          <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
            Send us your resume
          </Button>
        </div>
      </section>

      <FooterImproved />
    </>
  );
}