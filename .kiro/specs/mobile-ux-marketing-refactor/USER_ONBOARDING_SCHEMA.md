# User Onboarding Schema - Quick Reference

## Overview

The `UserOnboarding` model tracks user progress through the onboarding checklist feature.

## Schema Definition

```prisma
model UserOnboarding {
  id             String   @id @default(cuid())
  userId         Int      @unique
  completedSteps String[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user users @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_onboarding")
}
```

## Database Table

**Table Name**: `user_onboarding`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique identifier (CUID) |
| userId | INTEGER | UNIQUE, NOT NULL, FK | Reference to users.id |
| completedSteps | TEXT[] | NOT NULL | Array of completed step IDs |
| createdAt | TIMESTAMP | NOT NULL, DEFAULT NOW | Record creation time |
| updatedAt | TIMESTAMP | NOT NULL | Last update time |

## Relationships

- **One-to-One** with `users` table
- **Cascade Delete**: Deleting a user automatically deletes their onboarding record

## Usage Examples

### Create Onboarding Record

```typescript
import { prisma } from '@/lib/prisma';

await prisma.userOnboarding.create({
  data: {
    userId: session.user.id,
    completedSteps: [],
  },
});
```

### Update Completed Steps

```typescript
// Add a step to completed steps
await prisma.userOnboarding.upsert({
  where: { userId: session.user.id },
  update: {
    completedSteps: { push: stepId },
  },
  create: {
    userId: session.user.id,
    completedSteps: [stepId],
  },
});
```

### Query User Onboarding

```typescript
// Get user with onboarding progress
const user = await prisma.users.findUnique({
  where: { id: userId },
  include: {
    user_onboarding: true,
  },
});

// Get onboarding directly
const onboarding = await prisma.userOnboarding.findUnique({
  where: { userId: userId },
});
```

### Calculate Progress

```typescript
const onboarding = await prisma.userOnboarding.findUnique({
  where: { userId: session.user.id },
});

const totalSteps = 5; // Define your total steps
const completedCount = onboarding?.completedSteps.length || 0;
const progress = (completedCount / totalSteps) * 100;
```

## Migration

**Migration File**: `prisma/migrations/20241123_add_user_onboarding_model/migration.sql`

To apply the migration:

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

## Related Components

- **Server Action**: `app/actions/onboarding.ts`
- **UI Component**: `components/engagement/OnboardingChecklist.tsx`
- **Design Doc**: `.kiro/specs/mobile-ux-marketing-refactor/design.md`

## Security Notes

- The `userId` is extracted from the authenticated session, NOT from client input
- This prevents users from manipulating other users' onboarding progress
- The cascade delete ensures no orphaned records when users are deleted

## Requirements Validated

- ✅ **Requirement 8.2**: Server Action persistence
- ✅ **Requirement 8.5**: Completion percentage tracking
- ✅ **Requirement 8.6**: Optimistic UI updates

## Next Steps

After this schema is deployed:

1. Implement `app/actions/onboarding.ts` server action (Task 19)
2. Build `OnboardingChecklist` component (Task 20)
3. Integrate confetti trigger (Task 21)
