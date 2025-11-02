/**
 * Database Repositories
 * 
 * Repositories provide a clean interface to interact with PostgreSQL tables.
 * They replace the in-memory stores with persistent database storage.
 */

export { FansRepository } from './fansRepository';
export { ConversationsRepository } from './conversationsRepository';
export { MessagesRepository } from './messagesRepository';
export { CampaignsRepository } from './campaignsRepository';
export { UserProfilesRepository } from './userProfilesRepository';
export { AIConfigsRepository } from './aiConfigsRepository';

// TODO: Add more repositories as needed:
// export { CampaignsRepository } from './campaignsRepository';
// export { PlatformConnectionsRepository } from './platformConnectionsRepository';
// export { QuickRepliesRepository } from './quickRepliesRepository';
