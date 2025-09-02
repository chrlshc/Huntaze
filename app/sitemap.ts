import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://huntaze.com'
  
  // Static pages
  const staticPages = [
    '',
    '/pricing',
    '/about',
    '/join',
    '/demo',
    '/features/ai-chat',
    '/features/analytics',
    '/features/automation',
    // '/features/dashboard', // removed: page does not exist
    // '/learn', // placeholder removed until page exists
    '/terms',
    '/privacy',
  ]

  const staticUrls = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return [...staticUrls]
}
