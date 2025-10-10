import { z } from 'zod';

const brand = Symbol('brand');

export type Brand<T, TBrand> = T & { readonly [brand]: TBrand };

export type UserId = Brand<string, 'UserId'>;
export type CampaignId = Brand<string, 'CampaignId'>;
export type EmailAddress = Brand<string, 'EmailAddress'>;
export type PlanTier = Brand<'starter' | 'pro' | 'scale' | 'enterprise', 'PlanTier'>;
export type ModuleStatus = Brand<'active' | 'idle' | 'error', 'ModuleStatus'>;
export type SessionToken = Brand<string, 'SessionToken'>;

const userIdSchema = z.string().regex(/^user_[A-Za-z0-9]{4,}$/);
export function createUserId(id: string): UserId {
  return userIdSchema.parse(id) as UserId;
}

const campaignIdSchema = z.string().regex(/^camp_[A-Za-z0-9]{4,}$/);
export function createCampaignId(id: string): CampaignId {
  return campaignIdSchema.parse(id) as CampaignId;
}

const emailSchema = z.string().email();
export function createEmailAddress(email: string): EmailAddress {
  return emailSchema.parse(email) as EmailAddress;
}

const planTierSchema = z.enum(['starter', 'pro', 'scale', 'enterprise']);
export function createPlanTier(tier: string): PlanTier {
  return planTierSchema.parse(tier) as PlanTier;
}

const moduleStatusSchema = z.enum(['active', 'idle', 'error']);
export function createModuleStatus(status: string): ModuleStatus {
  return moduleStatusSchema.parse(status) as ModuleStatus;
}

export function readModuleStatus(status: ModuleStatus): 'active' | 'idle' | 'error' {
  return status as unknown as 'active' | 'idle' | 'error';
}

const sessionTokenSchema = z.string().min(32);
export function createSessionToken(token: string): SessionToken {
  return sessionTokenSchema.parse(token) as SessionToken;
}
