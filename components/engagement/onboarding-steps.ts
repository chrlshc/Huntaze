/**
 * Onboarding Steps Configuration
 * 
 * Defines the default onboarding steps for new users.
 * These steps guide users through the essential features of the platform.
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  order: number;
}

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'complete-profile',
    title: 'Complete your profile',
    description: 'Add your name, bio, and profile picture',
    order: 1,
  },
  {
    id: 'connect-first-integration',
    title: 'Connect your first integration',
    description: 'Link your social media accounts to get started',
    order: 2,
  },
  {
    id: 'create-first-campaign',
    title: 'Create your first campaign',
    description: 'Set up a campaign to start tracking your content',
    order: 3,
  },
  {
    id: 'invite-team-member',
    title: 'Invite a team member',
    description: 'Collaborate with your team by inviting members',
    order: 4,
  },
  {
    id: 'explore-analytics',
    title: 'Explore analytics dashboard',
    description: 'View insights and metrics for your campaigns',
    order: 5,
  },
];
