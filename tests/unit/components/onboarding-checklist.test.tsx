import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingChecklist, type OnboardingStep } from '@/components/engagement/OnboardingChecklist';
import * as onboardingActions from '@/app/actions/onboarding';
import confetti from 'canvas-confetti';

// Mock dependencies
vi.mock('@/app/actions/onboarding', () => ({
  toggleOnboardingStep: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useOptimistic hook (React 19 feature)
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useOptimistic: (state: any, updateFn: any) => {
      const [optimisticState, setOptimisticState] = (actual as any).useState(state);
      
      const updateOptimistic = (action: any) => {
        const newState = updateFn(optimisticState, action);
        setOptimisticState(newState);
      };
      
      return [optimisticState, updateOptimistic];
    },
  };
});

describe('OnboardingChecklist', () => {
  const mockSteps: OnboardingStep[] = [
    {
      id: 'step-1',
      title: 'Complete your profile',
      description: 'Add your name and avatar',
      completed: false,
      order: 1,
    },
    {
      id: 'step-2',
      title: 'Connect your first integration',
      description: 'Link your social media account',
      completed: false,
      order: 2,
    },
    {
      id: 'step-3',
      title: 'Create your first post',
      description: 'Share something with your audience',
      completed: false,
      order: 3,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the checklist in expanded state by default', () => {
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Complete your profile')).toBeInTheDocument();
      expect(screen.getByText('Connect your first integration')).toBeInTheDocument();
      expect(screen.getByText('Create your first post')).toBeInTheDocument();
    });

    it('should display progress indicator', () => {
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();
    });

    it('should render steps in order', () => {
      const unorderedSteps = [
        { ...mockSteps[2], order: 3 },
        { ...mockSteps[0], order: 1 },
        { ...mockSteps[1], order: 2 },
      ];
      
      render(<OnboardingChecklist initialSteps={unorderedSteps} />);
      
      const stepTitles = screen.getAllByRole('button', { name: /Complete/ });
      expect(stepTitles[0]).toHaveAttribute('aria-label', expect.stringContaining('Complete your profile'));
      expect(stepTitles[1]).toHaveAttribute('aria-label', expect.stringContaining('Connect your first integration'));
      expect(stepTitles[2]).toHaveAttribute('aria-label', expect.stringContaining('Create your first post'));
    });

    it('should show completed steps with checkmark', () => {
      const stepsWithCompleted = [
        { ...mockSteps[0], completed: true },
        ...mockSteps.slice(1),
      ];
      
      render(<OnboardingChecklist initialSteps={stepsWithCompleted} />);
      
      expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
      expect(screen.getByLabelText('Complete your profile completed')).toBeInTheDocument();
    });
  });

  describe('Collapse/Expand', () => {
    it('should collapse when collapse button is clicked', () => {
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      const collapseButton = screen.getByLabelText('Collapse onboarding checklist');
      fireEvent.click(collapseButton);
      
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
      expect(screen.getByText('Onboarding: 0%')).toBeInTheDocument();
    });

    it('should expand when collapsed indicator is clicked', () => {
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      // Collapse first
      const collapseButton = screen.getByLabelText('Collapse onboarding checklist');
      fireEvent.click(collapseButton);
      
      // Then expand
      const collapsedIndicator = screen.getByText('Onboarding: 0%');
      fireEvent.click(collapsedIndicator);
      
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should show correct progress percentage in collapsed state', () => {
      const stepsWithProgress = [
        { ...mockSteps[0], completed: true },
        { ...mockSteps[1], completed: true },
        mockSteps[2],
      ];
      
      render(<OnboardingChecklist initialSteps={stepsWithProgress} />);
      
      const collapseButton = screen.getByLabelText('Collapse onboarding checklist');
      fireEvent.click(collapseButton);
      
      expect(screen.getByText('Onboarding: 67%')).toBeInTheDocument();
    });
  });

  describe('Step Completion', () => {
    it('should call toggleOnboardingStep when a step is clicked', async () => {
      vi.mocked(onboardingActions.toggleOnboardingStep).mockResolvedValue({ success: true });
      
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      const firstStepButton = screen.getByLabelText('Complete Complete your profile');
      fireEvent.click(firstStepButton);
      
      await waitFor(() => {
        expect(onboardingActions.toggleOnboardingStep).toHaveBeenCalledWith('step-1');
      });
    });

    it('should not call toggleOnboardingStep for already completed steps', () => {
      const stepsWithCompleted = [
        { ...mockSteps[0], completed: true },
        ...mockSteps.slice(1),
      ];
      
      render(<OnboardingChecklist initialSteps={stepsWithCompleted} />);
      
      const completedStepButton = screen.getByLabelText('Complete your profile completed');
      fireEvent.click(completedStepButton);
      
      expect(onboardingActions.toggleOnboardingStep).not.toHaveBeenCalled();
    });

    it('should handle server action errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(onboardingActions.toggleOnboardingStep).mockResolvedValue({
        success: false,
        error: 'Database error',
      });
      
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      const firstStepButton = screen.getByLabelText('Complete Complete your profile');
      fireEvent.click(firstStepButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update:', 'Database error');
      });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Confetti Trigger', () => {
    it('should trigger confetti when completing the last step', async () => {
      vi.mocked(onboardingActions.toggleOnboardingStep).mockResolvedValue({ success: true });
      
      const almostCompleteSteps = [
        { ...mockSteps[0], completed: true },
        { ...mockSteps[1], completed: true },
        mockSteps[2],
      ];
      
      render(<OnboardingChecklist initialSteps={almostCompleteSteps} />);
      
      const lastStepButton = screen.getByLabelText('Complete Create your first post');
      fireEvent.click(lastStepButton);
      
      await waitFor(() => {
        expect(confetti).toHaveBeenCalledWith({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5E6AD2', '#EDEDED', '#8A8F98'],
        });
      });
    });

    it('should not trigger confetti when completing non-final steps', async () => {
      vi.mocked(onboardingActions.toggleOnboardingStep).mockResolvedValue({ success: true });
      
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      const firstStepButton = screen.getByLabelText('Complete Complete your profile');
      fireEvent.click(firstStepButton);
      
      await waitFor(() => {
        expect(onboardingActions.toggleOnboardingStep).toHaveBeenCalled();
      });
      
      expect(confetti).not.toHaveBeenCalled();
    });

    it('should not trigger confetti if server action fails', async () => {
      vi.mocked(onboardingActions.toggleOnboardingStep).mockResolvedValue({
        success: false,
        error: 'Failed',
      });
      
      const almostCompleteSteps = [
        { ...mockSteps[0], completed: true },
        { ...mockSteps[1], completed: true },
        mockSteps[2],
      ];
      
      render(<OnboardingChecklist initialSteps={almostCompleteSteps} />);
      
      const lastStepButton = screen.getByLabelText('Complete Create your first post');
      fireEvent.click(lastStepButton);
      
      await waitFor(() => {
        expect(onboardingActions.toggleOnboardingStep).toHaveBeenCalled();
      });
      
      expect(confetti).not.toHaveBeenCalled();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate 0% progress when no steps are completed', () => {
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();
    });

    it('should calculate 33% progress when 1 of 3 steps are completed', () => {
      const stepsWithProgress = [
        { ...mockSteps[0], completed: true },
        ...mockSteps.slice(1),
      ];
      
      render(<OnboardingChecklist initialSteps={stepsWithProgress} />);
      
      expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
    });

    it('should calculate 100% progress when all steps are completed', () => {
      const allCompleted = mockSteps.map(step => ({ ...step, completed: true }));
      
      render(<OnboardingChecklist initialSteps={allCompleted} />);
      
      expect(screen.getByText('3 of 3 completed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for checkboxes', () => {
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      expect(screen.getByLabelText('Complete Complete your profile')).toBeInTheDocument();
      expect(screen.getByLabelText('Complete Connect your first integration')).toBeInTheDocument();
      expect(screen.getByLabelText('Complete Create your first post')).toBeInTheDocument();
    });

    it('should have proper ARIA label for collapse button', () => {
      render(<OnboardingChecklist initialSteps={mockSteps} />);
      
      expect(screen.getByLabelText('Collapse onboarding checklist')).toBeInTheDocument();
    });

    it('should disable completed step buttons', () => {
      const stepsWithCompleted = [
        { ...mockSteps[0], completed: true },
        ...mockSteps.slice(1),
      ];
      
      render(<OnboardingChecklist initialSteps={stepsWithCompleted} />);
      
      const completedButton = screen.getByLabelText('Complete your profile completed');
      expect(completedButton).toBeDisabled();
    });
  });
});
