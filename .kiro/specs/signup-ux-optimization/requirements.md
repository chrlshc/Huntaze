# Requirements Document

## Introduction

Le site Huntaze staging présente actuellement un bug critique empêchant l'inscription des utilisateurs (erreur "CSRF token is required"), ainsi que plusieurs problèmes d'expérience utilisateur qui réduisent les conversions. Cette spec vise à corriger le bug CSRF, simplifier le processus d'inscription selon les meilleures pratiques SaaS 2025, et améliorer l'accessibilité et l'onboarding pour maximiser l'activation des utilisateurs beta.

## Glossary

- **CSRF Token**: Cross-Site Request Forgery token, un mécanisme de sécurité qui valide que les requêtes proviennent du site légitime
- **SSO**: Single Sign-On, méthode d'authentification permettant de se connecter via un compte existant (Google, Apple, etc.)
- **Progressive Disclosure**: Technique UX qui révèle progressivement les informations pour réduire la charge cognitive
- **Onboarding**: Processus d'accueil et de formation des nouveaux utilisateurs
- **Activation**: Moment où un utilisateur réalise la valeur du produit pour la première fois
- **Form Validation**: Vérification en temps réel de la validité des données saisies dans un formulaire
- **WCAG**: Web Content Accessibility Guidelines, normes d'accessibilité web
- **Beta Signup Form**: Formulaire d'inscription pour accéder à la version beta fermée de Huntaze

## Requirements

### Requirement 1: CSRF Token Implementation (Critical Bug Fix)

**User Story:** En tant qu'utilisateur potentiel, je veux pouvoir créer un compte sans erreur technique, afin de tester la plateforme Huntaze.

#### Acceptance Criteria

1. WHEN a user loads the beta signup form THEN the system SHALL generate and inject a valid CSRF token into the form
2. WHEN a user submits the signup form THEN the system SHALL validate the CSRF token before processing the request
3. IF the CSRF token is missing or invalid THEN the system SHALL display a clear error message with instructions to refresh the page
4. THE system SHALL use Next.js built-in CSRF protection mechanisms or a proven library (next-csrf, iron-session)
5. WHEN the CSRF token expires THEN the system SHALL automatically refresh it without requiring page reload

### Requirement 2: Simplified Signup Flow

**User Story:** En tant qu'utilisateur potentiel, je veux un processus d'inscription rapide et simple, afin de ne pas abandonner avant de tester le produit.

#### Acceptance Criteria

1. THE initial signup form SHALL request ONLY the email address as the first step
2. WHEN a user submits their email THEN the system SHALL send a verification email with a magic link or verification code
3. WHEN a user clicks the magic link THEN the system SHALL authenticate them and redirect to onboarding
4. THE system SHALL allow users to set a password AFTER they have explored the platform (optional, not required initially)
5. THE signup form SHALL NOT require more than 2 fields on the initial screen (email + optional name)

### Requirement 3: Social Sign-On (SSO) Integration

**User Story:** En tant qu'utilisateur potentiel, je veux me connecter rapidement avec mon compte Google ou Apple, afin d'éviter de créer un nouveau mot de passe.

#### Acceptance Criteria

1. THE signup page SHALL display prominent buttons for "Continue with Google" and "Continue with Apple"
2. WHEN a user clicks a social login button THEN the system SHALL initiate OAuth flow with the selected provider
3. WHEN OAuth authentication succeeds THEN the system SHALL create or link the user account and redirect to onboarding
4. THE system SHALL request minimal permissions from OAuth providers (email and basic profile only)
5. IF OAuth fails THEN the system SHALL display a clear error message and offer the email signup alternative

### Requirement 4: Real-Time Form Validation

**User Story:** En tant qu'utilisateur remplissant le formulaire, je veux voir immédiatement si mes entrées sont valides, afin de corriger les erreurs avant la soumission.

#### Acceptance Criteria

1. WHEN a user types in the email field THEN the system SHALL validate email format in real-time (after 500ms debounce)
2. WHEN an email is invalid THEN the system SHALL display an inline error message below the field with a red border
3. WHEN an email is valid THEN the system SHALL display a green checkmark icon
4. IF a password field is present THEN the system SHALL show password strength indicator (weak/medium/strong)
5. THE system SHALL display password requirements (minimum 8 characters, 1 uppercase, 1 number) before the user starts typing

### Requirement 5: Accessible Error Messaging

**User Story:** En tant qu'utilisateur rencontrant une erreur, je veux comprendre clairement ce qui ne va pas et comment le corriger, afin de ne pas être bloqué.

#### Acceptance Criteria

1. WHEN a form validation error occurs THEN the system SHALL display the error message with WCAG AA compliant contrast (4.5:1 minimum)
2. THE error messages SHALL use both color AND icons to convey error state (not color alone)
3. WHEN multiple errors exist THEN the system SHALL display a summary list at the top of the form with links to each error
4. THE error messages SHALL use clear, human-friendly language (e.g., "Please enter a valid email address" not "Invalid input")
5. WHEN an error is corrected THEN the system SHALL immediately remove the error message and visual indicator

### Requirement 6: Progressive Onboarding

**User Story:** En tant que nouvel utilisateur, je veux découvrir progressivement les fonctionnalités de la plateforme, afin de ne pas être submergé d'informations.

#### Acceptance Criteria

1. WHEN a user completes signup THEN the system SHALL redirect to a welcome screen with a single primary action
2. THE onboarding SHALL consist of maximum 3 steps: (1) Connect first platform, (2) View dashboard preview, (3) Explore features
3. WHEN a user completes an onboarding step THEN the system SHALL display progress indicator (e.g., "Step 2 of 3")
4. THE system SHALL allow users to skip onboarding steps with a clear "Skip for now" option
5. WHEN a user skips onboarding THEN the system SHALL provide access to onboarding checklist in the dashboard for later completion

### Requirement 7: Interactive Product Preview

**User Story:** En tant qu'utilisateur potentiel, je veux voir le produit en action avant de m'inscrire, afin de comprendre sa valeur.

#### Acceptance Criteria

1. THE homepage SHALL include an interactive demo or video showing the dashboard in action (not just "Coming soon")
2. WHEN a user views the demo THEN the system SHALL display real (anonymized) or realistic sample data
3. THE demo SHALL be accessible without signup and load in less than 3 seconds
4. THE demo SHALL include tooltips or annotations explaining key features
5. WHEN a user interacts with the demo THEN the system SHALL track engagement and display a CTA to sign up

### Requirement 8: Improved Visual Contrast and Accessibility

**User Story:** En tant qu'utilisateur avec une déficience visuelle, je veux pouvoir lire tout le contenu du site, afin d'évaluer si le produit me convient.

#### Acceptance Criteria

1. THE system SHALL ensure all text meets WCAG 2.0 AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
2. WHEN text is displayed on purple or dark backgrounds THEN the system SHALL use white or light gray with sufficient contrast
3. THE system SHALL NOT rely solely on color to convey information (e.g., error states must use icons + color)
4. THE system SHALL provide focus indicators for all interactive elements with 2px visible outline
5. WHEN a user enables high contrast mode THEN the system SHALL adapt colors to maintain readability

### Requirement 9: Consistent Call-to-Action

**User Story:** En tant qu'utilisateur naviguant sur le site, je veux des appels à l'action clairs et cohérents, afin de savoir exactement quoi faire ensuite.

#### Acceptance Criteria

1. THE system SHALL use a single, consistent CTA text across all pages (e.g., "Request Early Access" OR "Join Beta", not both)
2. THE primary CTA button SHALL use the same styling (color, size, text) on all marketing pages
3. WHEN a user is already signed in THEN the system SHALL replace "Sign Up" CTAs with "Go to Dashboard"
4. THE system SHALL limit to maximum 2 CTAs per section (1 primary, 1 secondary)
5. THE CTA buttons SHALL include clear microcopy indicating what happens next (e.g., "Request Access → Check your email")

### Requirement 10: Mobile-Optimized Signup Experience

**User Story:** En tant qu'utilisateur mobile, je veux un processus d'inscription adapté à mon écran tactile, afin de m'inscrire facilement depuis mon téléphone.

#### Acceptance Criteria

1. THE signup form SHALL use large touch targets (minimum 44px × 44px) for all buttons and inputs
2. WHEN a user focuses an input field on mobile THEN the system SHALL scroll the field into view above the keyboard
3. THE system SHALL use appropriate input types (type="email", inputmode="email") to trigger correct mobile keyboards
4. THE signup form SHALL NOT require horizontal scrolling on any mobile device (320px minimum width)
5. WHEN a user submits the form on mobile THEN the system SHALL prevent double-submission with a loading state

### Requirement 11: Performance Optimization

**User Story:** En tant qu'utilisateur avec une connexion lente, je veux que le site se charge rapidement, afin de ne pas abandonner par frustration.

#### Acceptance Criteria

1. THE signup page SHALL achieve a Lighthouse performance score of at least 90
2. THE system SHALL load critical CSS inline and defer non-critical styles
3. WHEN images are used THEN the system SHALL use Next.js Image component with appropriate sizes and lazy loading
4. THE system SHALL implement code splitting to load only necessary JavaScript for the signup flow
5. THE First Contentful Paint (FCP) SHALL be under 1.5 seconds on 3G connection

### Requirement 12: Analytics and Conversion Tracking

**User Story:** En tant que propriétaire du produit, je veux comprendre où les utilisateurs abandonnent le processus d'inscription, afin d'optimiser le funnel.

#### Acceptance Criteria

1. THE system SHALL track funnel events: page view, form start, form submit, signup success, signup error
2. WHEN a user abandons the form THEN the system SHALL log which field they were on and time spent
3. THE system SHALL track conversion rate from landing page to completed signup
4. THE system SHALL log all CSRF errors with context (browser, timestamp, user agent) for debugging
5. THE analytics SHALL respect user privacy and comply with GDPR (no tracking without consent)

