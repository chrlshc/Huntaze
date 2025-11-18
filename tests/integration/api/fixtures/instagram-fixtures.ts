/**
 * Instagram API Test Fixtures
 * 
 * Sample data for Instagram publish endpoint testing
 */

// Valid image publish request
export const validImageRequest = {
  mediaType: 'IMAGE' as const,
  mediaUrl: 'https://example.com/test-image.jpg',
  caption: 'Test image post from integration tests #testing',
};

// Valid video publish request
export const validVideoRequest = {
  mediaType: 'VIDEO' as const,
  mediaUrl: 'https://example.com/test-video.mp4',
  coverUrl: 'https://example.com/test-cover.jpg',
  caption: 'Test video post 🎥',
};

// Valid carousel publish request
export const validCarouselRequest = {
  mediaType: 'CAROUSEL' as const,
  children: [
    { mediaType: 'IMAGE' as const, mediaUrl: 'https://example.com/carousel-1.jpg' },
    { mediaType: 'IMAGE' as const, mediaUrl: 'https://example.com/carousel-2.jpg' },
    { mediaType: 'VIDEO' as const, mediaUrl: 'https://example.com/carousel-3.mp4' },
  ],
  caption: 'Test carousel post with multiple items',
};

// Request with location
export const requestWithLocation = {
  mediaType: 'IMAGE' as const,
  mediaUrl: 'https://example.com/location-test.jpg',
  locationId: '123456789',
  caption: 'Test post with location',
};

// Request with max caption length
export const requestWithMaxCaption = {
  mediaType: 'IMAGE' as const,
  mediaUrl: 'https://example.com/max-caption.jpg',
  caption: 'a'.repeat(2200),
};

// Invalid requests for testing validation
export const invalidMediaType = {
  mediaType: 'INVALID_TYPE',
  mediaUrl: 'https://example.com/test.jpg',
};

export const missingMediaUrl = {
  mediaType: 'IMAGE' as const,
  caption: 'Missing media URL',
};

export const invalidMediaUrl = {
  mediaType: 'IMAGE' as const,
  mediaUrl: 'not-a-valid-url',
};

export const carouselTooFewItems = {
  mediaType: 'CAROUSEL' as const,
  children: [
    { mediaType: 'IMAGE' as const, mediaUrl: 'https://example.com/1.jpg' },
  ],
};

export const carouselTooManyItems = {
  mediaType: 'CAROUSEL' as const,
  children: Array.from({ length: 11 }, (_, i) => ({
    mediaType: 'IMAGE' as const,
    mediaUrl: `https://example.com/${i}.jpg`,
  })),
};

export const captionTooLong = {
  mediaType: 'IMAGE' as const,
  mediaUrl: 'https://example.com/test.jpg',
  caption: 'a'.repeat(2201),
};
