'use client'

import React from 'react'

type IconProps = { className?: string }

export const OnlyFansLogoIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="OnlyFans logo">
    <circle cx="16" cy="16" r="16" fill="#00D4FF"/>
    <text x="16" y="20" fill="white" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" textAnchor="middle">OF</text>
  </svg>
)

export const InstagramLogoIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Instagram logo">
    <defs>
      <linearGradient id="igGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#405DE6"/>
        <stop offset="100%" stopColor="#E1306C"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#igGradient)"/>
    <rect x="8" y="8" width="16" height="16" rx="4" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="16" cy="16" r="4" stroke="white" strokeWidth="2" fill="none"/>
    <circle cx="20" cy="12" r="1.5" fill="white"/>
  </svg>
)

export const TikTokLogoIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="TikTok logo">
    <rect width="32" height="32" rx="6" fill="#000000"/>
    <path fill="#FF0050" d="M19 8.5c.8 1.2 2.1 2 3.5 2v3c-1.2 0-2.3-.3-3.3-.8v4.8c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8c.4 0 .8 0 1.2.1v4.4c-.4-.1-.8-.1-1.2-.1-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4V8.5H19z"/>
    <path fill="#25F4EE" d="M19 8.5c.8 1.2 2.1 2 3.5 2v3c-1.2 0-2.3-.3-3.3-.8v4.8c0 2.2-.9 4.2-2.4 5.7-.7.7-1.5 1.2-2.4 1.5-1.1.4-2.3.4-3.4 0-.9-.3-1.7-.8-2.4-1.5C7.1 21.9 6.2 19.9 6.2 17.7c0-2.2.9-4.2 2.4-5.7.7-.7 1.5-1.2 2.4-1.5.4-.1.8-.2 1.2-.2v4.4c-.4-.1-.8-.1-1.2-.1-.6 0-1.1.2-1.6.5-.4.3-.7.7-.9 1.2-.1.2-.1.5-.1.7 0 1.1.4 2.1 1.1 2.8.7.7 1.7 1.1 2.8 1.1s2.1-.4 2.8-1.1c.7-.7 1.1-1.7 1.1-2.8V8.5H19z"/>
  </svg>
)

export const RedditLogoIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Reddit logo">
    <circle cx="16" cy="16" r="16" fill="#FF4500"/>
    <path fill="white" d="M24 16c0 1.1-.9 2-2 2-.4 0-.7-.1-1-.3-.6 2.2-2.6 4.3-5.5 4.3s-4.9-2.1-5.5-4.3c-.3.2-.6.3-1 .3-1.1 0-2-.9-2-2s.9-2 2-2c.1 0 .3 0 .4.1C10.2 12.8 12 11 15.5 11s5.3 1.8 6.1 3.1c.1 0 .3-.1.4-.1 1.1 0 2 .9 2 2zM13 17c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1zm6 0c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1zm-3 3c-1.1 0-2-.2-2.5-.5-.1-.1-.1-.3 0-.4.1-.1.3-.1.4 0 .3.2 1.2.4 2.1.4s1.8-.2 2.1-.4c.1-.1.3-.1.4 0 .1.1.1.3 0 .4-.5.3-1.4.5-2.5.5z"/>
  </svg>
)

export const ThreadsLogoIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Threads logo">
    <rect width="32" height="32" rx="8" fill="#000000"/>
    <path fill="white" d="M16 6C10.5 6 6 10.5 6 16s4.5 10 10 10 10-4.5 10-10S21.5 6 16 6zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
    <path fill="white" d="M20.5 12.5c-1.1-1.1-2.6-1.8-4.2-1.9v2c1.1.1 2.1.6 2.8 1.4.7.8 1.1 1.8 1.1 2.9 0 2.2-1.8 4-4 4s-4-1.8-4-4c0-1.1.4-2.1 1.1-2.9.7-.8 1.7-1.3 2.8-1.4v-2c-1.6.1-3.1.8-4.2 1.9C10.7 13.7 10 15.3 10 17c0 3.3 2.7 6 6 6s6-2.7 6-6c0-1.7-.7-3.3-1.5-4.5z"/>
    <circle cx="16" cy="17" r="2" fill="white"/>
  </svg>
)
