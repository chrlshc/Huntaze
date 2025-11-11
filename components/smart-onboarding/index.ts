// Smart Onboarding UI Components
export { default as AdaptiveOnboardingStep } from './AdaptiveOnboardingStep';
export { default as AdaptiveContent } from './AdaptiveContent';
export { default as ProgressIndicator } from './ProgressIndicator';
export { default as SmartNavigation } from './SmartNavigation';

// Intervention System Components
export { default as InterventionOverlay } from './InterventionOverlay';
export { default as ContextualTooltip } from './ContextualTooltip';
export { default as ProgressiveAssistance } from './ProgressiveAssistance';

// Real-time Feedback Components
export { default as RealTimeFeedback } from './RealTimeFeedback';
export { default as CelebrationModal } from './CelebrationModal';
export { default as MotivationalElements } from './MotivationalElements';

// Types
export interface SmartOnboardingProps {
    userId: string;
    stepId: string;
    onStepComplete: (stepId: string, data: any) => void;
    onStepChange: (direction: 'next' | 'previous') => void;
}

export interface InterventionConfig {
    type: 'hint' | 'guidance' | 'tutorial';
    trigger: 'struggle' | 'time' | 'manual';
    content: {
        title: string;
        message: string;
        steps?: string[];
        actionLabel?: string;
    };
}

export interface FeedbackConfig {
    enableRealTimeFeedback: boolean;
    enableCelebrations: boolean;
    enableMotivationalMessages: boolean;
    feedbackFrequency: 'low' | 'medium' | 'high';
}