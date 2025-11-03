/**
 * Content Extractor Service
 * Extracts content from URLs including text, images, and metadata
 */

interface ExtractedContent {
  title: string;
  description: string;
  content: string;
  images: string[];
  author?: string;
  publishedDate?: string;
  siteName?: string;
  url: string;
}

interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  url?: string;
}

interface TwitterCardData {
  title?: string;
  description?: string;
  image?: string;
  site?: string;
}

/**
 * Extract content from a URL
 */
export async function extractContentFromUrl(url: string): Promise<ExtractedContent> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol. Only HTTP and HTTPS are supported.');
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentBot/1.0)',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Parse HTML and extract content
    const extracted = parseHtmlContent(html, url);
    
    return extracted;
  } catch (error) {
    console.error('Error extracting content from URL:', error);
    throw new Error(`Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse HTML content and extract relevant information
 */
function parseHtmlContent(html: string, url: string): ExtractedContent {
  // Extract Open Graph tags
  const ogData = extractOpenGraphData(html);
  
  // Extract Twitter Card tags
  const twitterData = extractTwitterCardData(html);
  
  // Extract standard meta tags
  const metaData = extractMetaTags(html);
  
  // Extract main content
  const mainContent = extractMainContent(html);
  
  // Extract images
  const images = extractImages(html, url);
  
  // Combine data with priority: OG > Twitter > Meta > Parsed
  return {
    title: ogData.title || twitterData.title || metaData.title || extractTitle(html) || 'Untitled',
    description: ogData.description || twitterData.description || metaData.description || '',
    content: mainContent,
    images: images,
    author: metaData.author,
    publishedDate: metaData.publishedDate,
    siteName: ogData.siteName || twitterData.site || extractSiteName(url),
    url: url,
  };
}

/**
 * Extract Open Graph metadata
 */
function extractOpenGraphData(html: string): OpenGraphData {
  const ogData: OpenGraphData = {};
  
  const ogRegex = /<meta\s+property=["']og:([^"']+)["']\s+content=["']([^"']+)["']/gi;
  let match;
  
  while ((match = ogRegex.exec(html)) !== null) {
    const property = match[1];
    const content = match[2];
    
    switch (property) {
      case 'title':
        ogData.title = content;
        break;
      case 'description':
        ogData.description = content;
        break;
      case 'image':
        ogData.image = content;
        break;
      case 'site_name':
        ogData.siteName = content;
        break;
      case 'type':
        ogData.type = content;
        break;
      case 'url':
        ogData.url = content;
        break;
    }
  }
  
  return ogData;
}

/**
 * Extract Twitter Card metadata
 */
function extractTwitterCardData(html: string): TwitterCardData {
  const twitterData: TwitterCardData = {};
  
  const twitterRegex = /<meta\s+name=["']twitter:([^"']+)["']\s+content=["']([^"']+)["']/gi;
  let match;
  
  while ((match = twitterRegex.exec(html)) !== null) {
    const property = match[1];
    const content = match[2];
    
    switch (property) {
      case 'title':
        twitterData.title = content;
        break;
      case 'description':
        twitterData.description = content;
        break;
      case 'image':
        twitterData.image = content;
        break;
      case 'site':
        twitterData.site = content;
        break;
    }
  }
  
  return twitterData;
}

/**
 * Extract standard meta tags
 */
function extractMetaTags(html: string) {
  const metaData: {
    title?: string;
    description?: string;
    author?: string;
    publishedDate?: string;
  } = {};
  
  // Extract description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (descMatch) {
    metaData.description = descMatch[1];
  }
  
  // Extract author
  const authorMatch = html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i);
  if (authorMatch) {
    metaData.author = authorMatch[1];
  }
  
  // Extract published date
  const dateMatch = html.match(/<meta\s+(?:name|property)=["'](?:article:published_time|datePublished)["']\s+content=["']([^"']+)["']/i);
  if (dateMatch) {
    metaData.publishedDate = dateMatch[1];
  }
  
  return metaData;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Extract main content from HTML
 */
function extractMainContent(html: string): string {
  // Remove script and style tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Try to find main content areas
  const mainMatch = content.match(/<(?:main|article|div\s+class=["'][^"']*content[^"']*["'])[^>]*>([\s\S]*?)<\/(?:main|article|div)>/i);
  if (mainMatch) {
    content = mainMatch[1];
  }
  
  // Remove HTML tags
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  // Limit to first 5000 characters
  return content.substring(0, 5000);
}

/**
 * Extract images from HTML
 */
function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  
  while ((match = imgRegex.exec(html)) !== null) {
    let imgUrl = match[1];
    
    // Convert relative URLs to absolute
    if (imgUrl.startsWith('/')) {
      const urlObj = new URL(baseUrl);
      imgUrl = `${urlObj.protocol}//${urlObj.host}${imgUrl}`;
    } else if (!imgUrl.startsWith('http')) {
      imgUrl = new URL(imgUrl, baseUrl).href;
    }
    
    // Filter out small images (likely icons)
    if (!imgUrl.includes('icon') && !imgUrl.includes('logo') && !imgUrl.includes('avatar')) {
      images.push(imgUrl);
    }
  }
  
  // Also check Open Graph image
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch && !images.includes(ogImageMatch[1])) {
    images.unshift(ogImageMatch[1]); // Add to beginning
  }
  
  // Limit to 10 images
  return images.slice(0, 10);
}

/**
 * Extract site name from URL
 */
function extractSiteName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

/**
 * Validate extracted content
 */
export function validateExtractedContent(content: ExtractedContent): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!content.title || content.title.length < 3) {
    errors.push('Title is too short or missing');
  }
  
  if (!content.content || content.content.length < 50) {
    errors.push('Content is too short or missing');
  }
  
  if (!content.url) {
    errors.push('URL is missing');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
