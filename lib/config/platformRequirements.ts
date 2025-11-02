export interface PlatformRequirements {
  name: string;
  text: {
    maxLength: number;
    minLength?: number;
  };
  image?: {
    maxSizeMB: number;
    formats: string[];
    aspectRatios: Array<{ width: number; height: number; label: string }>;
    minWidth?: number;
    minHeight?: number;
  };
  video?: {
    maxSizeMB: number;
    maxDurationSeconds: number;
    minDurationSeconds?: number;
    formats: string[];
    aspectRatios: Array<{ width: number; height: number; label: string }>;
  };
  hashtags?: {
    max: number;
    recommended: number;
  };
}

export const PLATFORM_REQUIREMENTS: Record<string, PlatformRequirements> = {
  instagram: {
    name: 'Instagram',
    text: { maxLength: 2200, minLength: 1 },
    image: {
      maxSizeMB: 8,
      formats: ['jpg', 'jpeg', 'png'],
      aspectRatios: [
        { width: 1, height: 1, label: 'Square' },
        { width: 4, height: 5, label: 'Portrait' },
        { width: 16, height: 9, label: 'Landscape' }
      ],
      minWidth: 320,
      minHeight: 320
    },
    video: {
      maxSizeMB: 100,
      maxDurationSeconds: 60,
      minDurationSeconds: 3,
      formats: ['mp4', 'mov'],
      aspectRatios: [
        { width: 9, height: 16, label: 'Stories/Reels' },
        { width: 1, height: 1, label: 'Square' },
        { width: 4, height: 5, label: 'Portrait' }
      ]
    },
    hashtags: { max: 30, recommended: 10 }
  },
  tiktok: {
    name: 'TikTok',
    text: { maxLength: 2200 },
    video: {
      maxSizeMB: 287,
      maxDurationSeconds: 600,
      minDurationSeconds: 3,
      formats: ['mp4', 'mov'],
      aspectRatios: [{ width: 9, height: 16, label: 'Vertical' }]
    },
    hashtags: { max: 100, recommended: 5 }
  },
  twitter: {
    name: 'Twitter',
    text: { maxLength: 280 },
    image: {
      maxSizeMB: 5,
      formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      aspectRatios: [
        { width: 16, height: 9, label: 'Landscape' },
        { width: 1, height: 1, label: 'Square' }
      ]
    },
    video: {
      maxSizeMB: 512,
      maxDurationSeconds: 140,
      formats: ['mp4', 'mov'],
      aspectRatios: [
        { width: 16, height: 9, label: 'Landscape' },
        { width: 1, height: 1, label: 'Square' }
      ]
    },
    hashtags: { max: 10, recommended: 2 }
  },
  facebook: {
    name: 'Facebook',
    text: { maxLength: 63206 },
    image: {
      maxSizeMB: 10,
      formats: ['jpg', 'jpeg', 'png'],
      aspectRatios: [
        { width: 1, height: 1, label: 'Square' },
        { width: 16, height: 9, label: 'Landscape' }
      ],
      minWidth: 600,
      minHeight: 600
    },
    video: {
      maxSizeMB: 1024,
      maxDurationSeconds: 240,
      formats: ['mp4', 'mov'],
      aspectRatios: [
        { width: 16, height: 9, label: 'Landscape' },
        { width: 1, height: 1, label: 'Square' }
      ]
    },
    hashtags: { max: 50, recommended: 3 }
  },
  linkedin: {
    name: 'LinkedIn',
    text: { maxLength: 3000 },
    image: {
      maxSizeMB: 10,
      formats: ['jpg', 'jpeg', 'png'],
      aspectRatios: [
        { width: 1, height: 1, label: 'Square' },
        { width: 16, height: 9, label: 'Landscape' }
      ]
    },
    video: {
      maxSizeMB: 200,
      maxDurationSeconds: 600,
      formats: ['mp4', 'mov'],
      aspectRatios: [{ width: 16, height: 9, label: 'Landscape' }]
    },
    hashtags: { max: 30, recommended: 5 }
  },
  youtube: {
    name: 'YouTube',
    text: { maxLength: 5000 },
    video: {
      maxSizeMB: 256000,
      maxDurationSeconds: 43200,
      formats: ['mp4', 'mov', 'avi'],
      aspectRatios: [{ width: 16, height: 9, label: 'Standard' }]
    },
    hashtags: { max: 15, recommended: 3 }
  }
};
