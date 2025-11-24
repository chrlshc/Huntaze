# Migration: Add User Onboarding Model

**Date**: 2024-11-23
**Feature**: Mobile UX Marketing Refactor - Onboarding Checklist
**Task**: 18. Database Schema

## Overview

This migration adds the `UserOnboarding` model to track user onboarding progress through the application's onboarding checklist feature.

## Changes

### New Table: `user_onboarding`

- **id**: Primary key (CUID)
- **userId**: Foreign key to `users.id` (unique, one-to-one relationship)
- **completedSteps**: Array of step IDs that the user has completed
- **createdAt**: Timestamp when the record was created
- **updatedAt**: Timestamp when the record was last updated

### Relationships

- One-to-one relationship with `users` table
- Cascade delete: When a user is deleted, their onboarding record is also deleted

## Usage

This model is used by the onboarding checklist component to:
1. Track which onboarding steps a user has completed
2. Calculate completion percentage
3. Persist progress across sessions
4. Trigger confetti animation when all steps are complete

## Related Files

- `prisma/schema.prisma` - Schema definition
- `app/actions/onboarding.ts` - Server actions for updating progress
- `components/engagement/OnboardingChecklist.tsx` - UI component

## Requirements Validated

- **Requirement 8.2**: Server Action persistence of onboarding progress
- **Requirement 8.5**: Completion percentage tracking
- **Requirement 8.6**: Optimistic UI updates

## Migration Notes

- This migration is safe to run on existing databases
- No data migration required (new feature)
- The `completedSteps` array starts empty for new records
- The unique constraint on `userId` ensures one onboarding record per user
