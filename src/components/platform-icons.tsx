'use client'

import React from 'react'
import Image from 'next/image'

type IconProps = { className?: string }

// Using official logos with proper brand guidelines
export const OnlyFansLogoIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <Image
    src="/logos/onlyfans.svg"
    alt="OnlyFans"
    width={48}
    height={48}
    className={className}
    priority
  />
)

export const InstagramLogoIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <Image
    src="/logos/instagram.svg"
    alt="Instagram"
    width={48}
    height={48}
    className={className}
    priority
  />
)

export const TikTokLogoIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <Image
    src="/logos/tiktok.svg"
    alt="TikTok"
    width={48}
    height={48}
    className={className}
    priority
  />
)

export const RedditLogoIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <Image
    src="/logos/reddit.svg"
    alt="Reddit"
    width={48}
    height={48}
    className={className}
    priority
  />
)

export const ThreadsLogoIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <Image
    src="/logos/threads.svg"
    alt="Threads"
    width={48}
    height={48}
    className={className}
    priority
  />
)