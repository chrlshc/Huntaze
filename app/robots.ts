import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/debug/'] },
    ],
    sitemap: process.env.SITEMAP_URL,
  }
}

