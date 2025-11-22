/**
 * Lambda@Edge function for intelligent image format optimization
 * 
 * This function runs at CloudFront edge locations on origin-request events
 * to serve optimal image formats (AVIF, WebP) based on browser capabilities.
 * 
 * Deploy to us-east-1 region (required for Lambda@Edge)
 */

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;
  const uri = request.uri;

  // Only process image requests
  const imageExtensions = /\.(jpg|jpeg|png|gif)$/i;
  if (!imageExtensions.test(uri)) {
    return request;
  }

  // Get Accept header to detect browser capabilities
  const acceptHeader = headers['accept'] ? headers['accept'][0].value : '';
  
  // Check for AVIF support (best compression, newest format)
  const supportsAVIF = acceptHeader.includes('image/avif');
  
  // Check for WebP support (good compression, wide support)
  const supportsWebP = acceptHeader.includes('image/webp');

  // Modify request URI to get optimized format
  // Priority: AVIF > WebP > Original
  if (supportsAVIF) {
    // Request AVIF version
    request.uri = uri.replace(imageExtensions, '.avif');
    console.log(`Requesting AVIF: ${request.uri}`);
  } else if (supportsWebP) {
    // Request WebP version
    request.uri = uri.replace(imageExtensions, '.webp');
    console.log(`Requesting WebP: ${request.uri}`);
  }

  // Add custom header to track optimization
  request.headers['x-image-optimization'] = [{
    key: 'X-Image-Optimization',
    value: supportsAVIF ? 'avif' : (supportsWebP ? 'webp' : 'original')
  }];

  // Handle query string parameters for dynamic image sizing
  if (request.querystring) {
    const params = new URLSearchParams(request.querystring);
    
    // Width parameter
    const width = params.get('w') || params.get('width');
    if (width && /^\d+$/.test(width)) {
      request.headers['x-image-width'] = [{
        key: 'X-Image-Width',
        value: width
      }];
    }
    
    // Quality parameter
    const quality = params.get('q') || params.get('quality');
    if (quality && /^\d+$/.test(quality)) {
      request.headers['x-image-quality'] = [{
        key: 'X-Image-Quality',
        value: quality
      }];
    }
  }

  // Add device type headers for responsive images
  const userAgent = headers['user-agent'] ? headers['user-agent'][0].value : '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  
  request.headers['x-device-type'] = [{
    key: 'X-Device-Type',
    value: isMobile ? 'mobile' : (isTablet ? 'tablet' : 'desktop')
  }];

  return request;
};
