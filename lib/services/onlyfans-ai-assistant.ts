/**
 * OnlyFans AI Assistant - Main Export
 * Provides a unified interface for AI message generation with optional memory
 */

export {
  onlyFansAIAssistant,
  OnlyFansAIAssistantWrapper,
  type AIAssistantConfig
} from './onlyfans-ai-assistant-wrapper';

export {
  onlyFansAIAssistantEnhanced,
  OnlyFansAIAssistantEnhanced,
  type EnhancedMessageContext,
  type EnhancedMessageSuggestion
} from './onlyfans-ai-assistant-enhanced';

export {
  onlyFansAISuggestions,
  OnlyFansAISuggestionsService,
  type MessageContext,
  type MessageSuggestion
} from './onlyfans-ai-suggestions.service';

// Re-export for convenience
export { onlyFansAIAssistant as default };
