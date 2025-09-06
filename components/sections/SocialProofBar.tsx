"use client";

import { motion } from "framer-motion";

const logos = [
  { name: "Instagram", src: "/logos/instagram.svg" },
  { name: "TikTok", src: "/logos/tiktok.svg" },
  { name: "OnlyFans", src: "/logos/onlyfans.svg" },
  { name: "Fansly", src: "/logos/fansly.svg" },
  { name: "Reddit", src: "/logos/reddit.svg" },
  { name: "Twitter", src: "/logos/twitter.svg" },
];

export function SocialProofBar() {
  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800">
      <div className="container-width">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-8">
          Trusted by 10,000+ creators across all major platforms
        </p>
        
        <div className="flex items-center justify-center flex-wrap gap-8 md:gap-12">
          {logos.map((logo, index) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="h-8 md:h-10 w-auto"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}