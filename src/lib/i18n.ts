export type Language = 'fr' | 'en' | 'es' | 'de';

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
  fr: {
    'onboarding.welcome.title': 'Bienvenue sur Huntaze!',
    'onboarding.welcome.subtitle': 'Configurons votre plateforme en quelques étapes simples',
    'onboarding.platforms.title': 'Connectez vos plateformes',
    'onboarding.platforms.connect': 'Connecter',
    'onboarding.platforms.disconnect': 'Déconnecter',
    'onboarding.ai.title': 'Configurez votre personnalité AI',
    'onboarding.ai.personality.flirty': 'Séductrice sophistiquée',
    'onboarding.ai.personality.friendly': 'Amie chaleureuse',
    'onboarding.ai.personality.playful': 'Espiègle et taquine',
    'onboarding.gdpr.title': 'Protection de vos données',
    'onboarding.gdpr.consent.data': 'J\'accepte le traitement de mes données',
    'onboarding.gdpr.consent.marketing': 'J\'accepte de recevoir des communications',
    'onboarding.next': 'Suivant',
    'onboarding.previous': 'Précédent',
    'onboarding.complete': 'Terminer',
  },
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
  },
  es: {
    'onboarding.welcome.title': '¡Bienvenido a Huntaze!',
    'onboarding.welcome.subtitle': 'Configuremos tu plataforma en unos simples pasos',
    'onboarding.platforms.title': 'Conecta tus plataformas',
    'onboarding.platforms.connect': 'Conectar',
    'onboarding.platforms.disconnect': 'Desconectar',
    'onboarding.ai.title': 'Configura tu personalidad de IA',
    'onboarding.ai.personality.flirty': 'Seductora sofisticada',
    'onboarding.ai.personality.friendly': 'Amiga cálida',
    'onboarding.ai.personality.playful': 'Juguetona y provocadora',
    'onboarding.gdpr.title': 'Protección de datos',
    'onboarding.gdpr.consent.data': 'Acepto el procesamiento de mis datos',
    'onboarding.gdpr.consent.marketing': 'Acepto recibir comunicaciones',
    'onboarding.next': 'Siguiente',
    'onboarding.previous': 'Anterior',
    'onboarding.complete': 'Completar',
  },
  de: {
    'onboarding.welcome.title': 'Willkommen bei Huntaze!',
    'onboarding.welcome.subtitle': 'Richten Sie Ihre Plattform in wenigen einfachen Schritten ein',
    'onboarding.platforms.title': 'Verbinden Sie Ihre Plattformen',
    'onboarding.platforms.connect': 'Verbinden',
    'onboarding.platforms.disconnect': 'Trennen',
    'onboarding.ai.title': 'Konfigurieren Sie Ihre KI-Persönlichkeit',
    'onboarding.ai.personality.flirty': 'Anspruchsvolle Verführerin',
    'onboarding.ai.personality.friendly': 'Warme Freundin',
    'onboarding.ai.personality.playful': 'Verspielt und neckisch',
    'onboarding.gdpr.title': 'Datenschutz',
    'onboarding.gdpr.consent.data': 'Ich akzeptiere die Datenverarbeitung',
    'onboarding.gdpr.consent.marketing': 'Ich akzeptiere Marketing-Kommunikation',
    'onboarding.next': 'Weiter',
    'onboarding.previous': 'Zurück',
    'onboarding.complete': 'Abschließen',
  },
};

export function getTranslation(key: TranslationKey, language: Language): string {
  return translations[language][key] || translations['fr'][key];
}