/**
 * Type definitions for Shopify-style onboarding components
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

export type StepStatus = 'todo' | 'done' | 'skipped';
export type UserRole = 'owner' | 'staff' | 'admin';

export interface OnboardingStep {
  id: string;
  version: number;
  title: string;
  description?: string;
  required: boolean;
  weight: number;
  status: StepStatus;
  roleRestricted?: UserRole;
  completedAt?: string;
  completedBy?: string;
  // Optional UX metadata to highlight value
  badge?: string;            // e.g., "Quick win", "ROI+"
  impact?: 'Low' | 'Medium' | 'High';
  timeEstimate?: string;     // e.g., "2 min", "5 min"
}

export interface SetupGuideProps {
  steps: OnboardingStep[];
  progress: number;
  onStepUpdate: (stepId: string, status: 'done' | 'skipped') => Promise<void>;
  onLearnMore: (stepId: string) => void;
  userRole: UserRole;
  loading?: boolean;
}

export interface StepItemProps {
  step: OnboardingStep;
  onUpdate: (stepId: string, status: 'done' | 'skipped') => Promise<void>;
  onLearnMore: (stepId: string) => void;
  userRole: UserRole;
}
