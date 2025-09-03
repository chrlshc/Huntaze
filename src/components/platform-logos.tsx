'use client'

import { motion } from 'framer-motion'
import { OnlyFansLogoIcon, InstagramLogoIcon, TikTokLogoIcon, RedditLogoIcon, ThreadsLogoIcon } from './platform-icons'

const PlatformLogos = () => {
  const platforms = [
    { name: 'OnlyFans', icon: OnlyFansLogoIcon },
    { name: 'Instagram', icon: InstagramLogoIcon },
    { name: 'TikTok', icon: TikTokLogoIcon },
    { name: 'Reddit', icon: RedditLogoIcon },
    { name: 'Threads', icon: ThreadsLogoIcon },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-16 text-center"
    >
      {/* Removed 'Trusted by creators on' text */}
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="group"
            title={platform.name}
          >
            <platform.icon className="w-12 h-12" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default PlatformLogos
