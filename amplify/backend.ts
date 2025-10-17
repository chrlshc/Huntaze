import { defineBackend } from '@aws-amplify/backend';
import { defineAuth } from '@aws-amplify/backend';
import { defineData } from '@aws-amplify/backend';
import { defineStorage } from '@aws-amplify/backend';

/**
 * Authentication configuration
 */
const auth = defineAuth({
  loginWith: {
    email: true,
    phone: false,
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    preferredUsername: {
      required: false,
      mutable: true,
    },
  },
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
  },
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: true,
  },
});

/**
 * Data configuration (GraphQL API)
 */
const data = defineData({
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
  schema: /* GraphQL */ `
    type User @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      username: String!
      email: String!
      campaigns: [Campaign] @hasMany
      messages: [Message] @hasMany
      createdAt: AWSDateTime!
      updatedAt: AWSDateTime!
    }

    type Campaign @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      name: String!
      platform: Platform!
      status: CampaignStatus!
      targetAudience: String
      budget: Float
      startDate: AWSDateTime
      endDate: AWSDateTime
      owner: User @belongsTo
      messages: [Message] @hasMany
      analytics: CampaignAnalytics @hasOne
      createdAt: AWSDateTime!
      updatedAt: AWSDateTime!
    }

    type Message @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      content: String!
      recipientId: String!
      campaignId: ID!
      campaign: Campaign @belongsTo
      status: MessageStatus!
      sentAt: AWSDateTime
      readAt: AWSDateTime
      owner: User @belongsTo
      createdAt: AWSDateTime!
      updatedAt: AWSDateTime!
    }

    type CampaignAnalytics @model @auth(rules: [{ allow: owner }]) {
      id: ID!
      campaignId: ID!
      campaign: Campaign @belongsTo
      impressions: Int!
      clicks: Int!
      conversions: Int!
      revenue: Float!
      createdAt: AWSDateTime!
      updatedAt: AWSDateTime!
    }

    enum Platform {
      INSTAGRAM
      TIKTOK
      REDDIT
      ONLYFANS
      TWITTER
    }

    enum CampaignStatus {
      DRAFT
      ACTIVE
      PAUSED
      COMPLETED
    }

    enum MessageStatus {
      PENDING
      SENT
      DELIVERED
      READ
      FAILED
    }
  `,
});

/**
 * Storage configuration
 */
const storage = defineStorage({
  name: 'huntazeStorage',
  access: (allow) => ({
    'media/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'campaigns/*': [
      allow.authenticated.to(['read', 'write']),
    ],
    'analytics/*': [
      allow.authenticated.to(['read']),
    ],
  }),
});

/**
 * Define backend
 */
const backend = defineBackend({
  auth,
  data,
  storage,
});