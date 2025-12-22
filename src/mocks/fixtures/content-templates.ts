export interface MockTemplateStructure {
  text: string;
}

export interface MockContentTemplate {
  id: string;
  userId: string | null;
  name: string;
  description?: string | null;
  category: string;
  structure: MockTemplateStructure;
  previewUrl?: string | null;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
}

export const mockContentTemplates: MockContentTemplate[] = [
  {
    id: 'tpl_1',
    userId: '1',
    name: 'New Content Teaser',
    description: null,
    category: 'promotional',
    structure: {
      text: '🔥 Something special is coming... Stay tuned! 👀\n\n#exclusive #comingsoon #content',
    },
    previewUrl: null,
    isPublic: true,
    usageCount: 24,
    createdAt: '2024-11-15T00:00:00Z',
  },
  {
    id: 'tpl_2',
    userId: '1',
    name: 'Thank You Post',
    description: null,
    category: 'engagement',
    structure: {
      text: '💕 Thank you so much for all the love and support! You guys are amazing!\n\nWhat would you like to see more of? Let me know in the comments! 👇',
    },
    previewUrl: null,
    isPublic: true,
    usageCount: 18,
    createdAt: '2024-11-20T00:00:00Z',
  },
  {
    id: 'tpl_3',
    userId: '1',
    name: 'PPV Announcement',
    description: null,
    category: 'promotional',
    structure: {
      text: '🎁 Special PPV just dropped! Check your DMs for something exclusive...\n\nDon\'t miss out! 💋',
    },
    previewUrl: null,
    isPublic: true,
    usageCount: 31,
    createdAt: '2024-11-25T00:00:00Z',
  },
  {
    id: 'tpl_4',
    userId: '1',
    name: 'Q&A Session',
    description: null,
    category: 'engagement',
    structure: {
      text: '❓ Q&A Time! Ask me anything in the comments and I\'ll answer the best ones!\n\nBe creative! 😊',
    },
    previewUrl: null,
    isPublic: true,
    usageCount: 12,
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'tpl_5',
    userId: '1',
    name: 'Behind The Scenes',
    description: null,
    category: 'personal',
    structure: {
      text: '📸 Behind the scenes of today\'s shoot! What do you think?\n\n#bts #behindthescenes #dayinmylife',
    },
    previewUrl: null,
    isPublic: true,
    usageCount: 8,
    createdAt: '2024-12-02T00:00:00Z',
  },
];

