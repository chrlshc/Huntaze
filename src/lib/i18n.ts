export type Language = 'en';

export type TranslationKey = 
  | 'onboarding.welcome.title'
  | 'onboarding.welcome.subtitle'
  | 'onboarding.platforms.title'
  | 'onboarding.platforms.connect'
  | 'onboarding.platforms.disconnect'
  | 'onboarding.ai.title'
  | 'onboarding.ai.personality.flirty'
  | 'onboarding.ai.personality.friendly'
  | 'onboarding.ai.personality.playful'
  | 'onboarding.gdpr.title'
  | 'onboarding.gdpr.consent.data'
  | 'onboarding.gdpr.consent.marketing'
  | 'onboarding.next'
  | 'onboarding.previous'
  | 'onboarding.complete';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    'onboarding.welcome.title': 'Welcome to Huntaze!',
    'onboarding.welcome.subtitle': 'Let\'s set up your platform in a few simple steps',
    'onboarding.platforms.title': 'Connect your platforms',
    'onboarding.platforms.connect': 'Connect',
    'onboarding.platforms.disconnect': 'Disconnect',
    'onboarding.ai.title': 'Configure your AI personality',
    'onboarding.ai.personality.flirty': 'Sophisticated seductress',
    'onboarding.ai.personality.friendly': 'Warm friend',
    'onboarding.ai.personality.playful': 'Playful and teasing',
    'onboarding.gdpr.title': 'Data Protection',
    'onboarding.gdpr.consent.data': 'I accept data processing',
    'onboarding.gdpr.consent.marketing': 'I accept marketing communications',
    'onboarding.next': 'Next',
    'onboarding.previous': 'Previous',
    'onboarding.complete': 'Complete',
  }
};

export function getTranslation(key: TranslationKey, language: Language): string {
  return translations[language][key];
}
