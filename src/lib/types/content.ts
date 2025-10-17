export type Platform = "instagram" | "tiktok" | "reddit";

export type Asset =
  | { kind: "image"; uri: string; width?: number; height?: number; bytes?: number }
  | { kind: "video"; uri: string; durationSec?: number; bytes?: number; aspect?: string };

export interface ContentItem {
  id: string;
  idea: string;
  text: string;
  title?: string;
  hashtags?: string[];
  mentions?: string[];
  linkUrl?: string;
  nsfw?: boolean;
  assets: Asset[];
  preferences?: Record<string, unknown>;
}

export interface PublishResult {
  platform: Platform;
  externalId: string;
  publishedAt: string; // ISO
  raw?: any;
}

