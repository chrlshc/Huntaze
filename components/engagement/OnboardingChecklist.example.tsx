/**
 * Example usage of OnboardingChecklist component with confetti trigger
 * 
 * This file demonstrates how to integrate the OnboardingChecklist component
 * in a real application with server-side data fetching.
 */

import { OnboardingChecklist, type OnboardingStep } from './OnboardingChecklist';
import { getOnboardingProgress } from '@/app/actions/onboarding';

/**
 * Example 1: Basic Dashboard Integration
 * 
 * This example shows how to use the OnboardingChecklist in a dashboard page
 * with server-side data fetching.
 */
export async function DashboardWithOnboarding() {
  // Fetch user's current progress from the database
  const progress = await getOnboardingProgress();
  
  // Define the onboarding steps for your application
  const steps: OnboardingStep[] = [
    {
      id: 'complete-profile',
      title: 'Complete your profile',
      description: 'Add your name, avatar, and bio to personalize your account',
      completed: progress?.completedSteps.includes('complete-profile') || false,
      order: 1,
    },
    {
      id: 'connect-integration',
      title: 'Connect your first integration',
      description: 'Link your social media account to start managing content',
      completed: progress?.completedSteps.includes('connect-integration') || false,
      order: 2,
    },
    {
      id: 'create-post',
      title: 'Create your first post',
      description: 'Share something with your audience to get started',
      completed: progress?.completedSteps.includes('create-post') || false,
      order: 3,
    },
    {
      id: 'invite-team',
      title: 'Invite team members',
      description: 'Collaborate with your team by inviting them to join',
      completed: progress?.completedSteps.includes('invite-team') || false,
      order: 4,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Welcome to Huntaze! 🎉
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Onboarding Checklist in Sidebar */}
          <aside className="lg:col-span-1">
            <OnboardingChecklist initialSteps={steps} />
          </aside>
          
          {/* Main Content */}
          <main className="lg:col-span-2">
            <div className="bg-surface rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Your Dashboard
              </h2>
              <p className="text-muted">
                Complete the onboarding steps to unlock all features!
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 2: Role-Based Onboarding Steps
 * 
 * This example shows how to customize onboarding steps based on user role.
 */
export async function RoleBasedOnboarding({ userRole }: { userRole: 'creator' | 'manager' | 'viewer' }) {
  const progress = await getOnboardingProgress();
  
  // Define different steps based on user role
  const getStepsForRole = (role: string): OnboardingStep[] => {
    const baseSteps: OnboardingStep[] = [
      {
        id: 'complete-profile',
        title: 'Complete your profile',
        description: 'Add your basic information',
        completed: progress?.completedSteps.includes('complete-profile') || false,
        order: 1,
      },
    ];

    if (role === 'creator') {
      return [
        ...baseSteps,
        {
          id: 'connect-onlyfans',
          title: 'Connect OnlyFans',
          description: 'Link your OnlyFans account for content management',
          completed: progress?.completedSteps.includes('connect-onlyfans') || false,
          order: 2,
        },
        {
          id: 'setup-automation',
          title: 'Set up automation',
          description: 'Configure automated responses and workflows',
          completed: progress?.completedSteps.includes('setup-automation') || false,
          order: 3,
        },
      ];
    }

    if (role === 'manager') {
      return [
        ...baseSteps,
        {
          id: 'add-creators',
          title: 'Add creators',
          description: 'Invite creators to your agency',
          completed: progress?.completedSteps.includes('add-creators') || false,
          order: 2,
        },
        {
          id: 'setup-billing',
          title: 'Set up billing',
          description: 'Configure payment and subscription settings',
          completed: progress?.completedSteps.includes('setup-billing') || false,
          order: 3,
        },
      ];
    }

    return baseSteps;
  };

  const steps = getStepsForRole(userRole);

  return (
    <div className="p-6">
      <OnboardingChecklist initialSteps={steps} />
    </div>
  );
}

/**
 * Example 3: Confetti Celebration Demo
 * 
 * This example demonstrates the confetti trigger behavior.
 * When the user completes the last step, confetti will automatically fire!
 */
export async function ConfettiDemo() {
  const progress = await getOnboardingProgress();
  
  // Example with 2 of 3 steps already completed
  // Completing the last step will trigger confetti! 🎉
  const almostCompleteSteps: OnboardingStep[] = [
    {
      id: 'step-1',
      title: 'First step',
      description: 'This step is already completed',
      completed: true, // ✅ Already done
      order: 1,
    },
    {
      id: 'step-2',
      title: 'Second step',
      description: 'This step is also completed',
      completed: true, // ✅ Already done
      order: 2,
    },
    {
      id: 'step-3',
      title: 'Final step',
      description: 'Complete this to see confetti! 🎉',
      completed: false, // ⏳ Click this to trigger confetti!
      order: 3,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Almost There! 🎯
          </h2>
          <p className="text-muted">
            Complete the final step to see the confetti celebration!
          </p>
        </div>
        
        <OnboardingChecklist initialSteps={almostCompleteSteps} />
        
        <div className="mt-6 p-4 bg-surface rounded-lg border border-border">
          <p className="text-sm text-muted">
            💡 <strong>Tip:</strong> When you click the final checkbox, you'll see:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted ml-4">
            <li>✨ Instant UI update (optimistic)</li>
            <li>🎉 Confetti celebration</li>
            <li>💾 Progress saved to database</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 4: Sidebar Integration
 * 
 * This example shows how to integrate the checklist in a sidebar layout.
 */
export async function SidebarLayout({ children }: { children: React.ReactNode }) {
  const progress = await getOnboardingProgress();
  
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome tour',
      description: 'Take a quick tour of the platform',
      completed: progress?.completedSteps.includes('welcome') || false,
      order: 1,
    },
    {
      id: 'settings',
      title: 'Configure settings',
      description: 'Set up your preferences',
      completed: progress?.completedSteps.includes('settings') || false,
      order: 2,
    },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar with Onboarding */}
      <aside className="w-80 bg-surface border-r border-border p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Getting Started
          </h2>
          <OnboardingChecklist initialSteps={steps} />
        </div>
        
        {/* Other sidebar content */}
        <nav className="space-y-2">
          <a href="/dashboard" className="block p-2 hover:bg-background rounded">
            Dashboard
          </a>
          <a href="/content" className="block p-2 hover:bg-background rounded">
            Content
          </a>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

/**
 * Example 5: Modal/Dialog Integration
 * 
 * This example shows how to display the checklist in a modal on first visit.
 */
export async function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const progress = await getOnboardingProgress();
  
  const steps: OnboardingStep[] = [
    {
      id: 'intro',
      title: 'Watch intro video',
      description: 'Learn the basics in 2 minutes',
      completed: progress?.completedSteps.includes('intro') || false,
      order: 1,
    },
    {
      id: 'explore',
      title: 'Explore features',
      description: 'Check out what you can do',
      completed: progress?.completedSteps.includes('explore') || false,
      order: 2,
    },
    {
      id: 'first-action',
      title: 'Take your first action',
      description: 'Create or connect something',
      completed: progress?.completedSteps.includes('first-action') || false,
      order: 3,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-md w-full p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            Welcome! Let's get you started 🚀
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <OnboardingChecklist initialSteps={steps} />
        
        <button
          onClick={onClose}
          className="mt-4 w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}

/**
 * Confetti Configuration Examples
 * 
 * The confetti is automatically triggered with these settings:
 * 
 * ```typescript
 * confetti({
 *   particleCount: 100,      // Number of confetti pieces
 *   spread: 70,              // Spread angle in degrees
 *   origin: { y: 0.6 },      // Start position (60% from top)
 *   colors: [                // Brand colors
 *     '#5E6AD2',             // Magic Blue (primary)
 *     '#EDEDED',             // Light (foreground)
 *     '#8A8F98',             // Muted (secondary)
 *   ],
 * });
 * ```
 * 
 * The confetti will ONLY trigger when:
 * ✅ The user completes the LAST remaining step
 * ✅ The server action returns success
 * ✅ All steps are marked as completed (100%)
 * 
 * The confetti will NOT trigger when:
 * ❌ Completing non-final steps
 * ❌ Server action fails
 * ❌ Steps are already completed
 */
