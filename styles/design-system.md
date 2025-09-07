# Premium SaaS Design System

## Couleurs Exactes

### Linear (Dark Mode)
- Background: #0F0F10 (presque noir)
- Background Secondary: #151516
- Text Primary: #EEEFF1 (presque blanc)
- Text Secondary: #9CA3AF
- Accent Blue: #635BFF (Cornflower Blue)
- Border: #2A2A2A
- Surface: #1A1A1A

### Influences
- Background: #FFFFFF
- Surface: #F6F6F7
- Text Primary: #212529 (très foncé)
- Text Secondary: #6C757D
- Success Green: #008060
- Primary Blue: #006494
- Border: #E1E3E5

### Stripe
- Background Dark: #0A2540 (Downriver)
- Background Light: #F6F9FC (Black Squeeze)
- Accent Purple: #635BFF (même que Linear!)
- Text on Dark: #FFFFFF
- Text on Light: #0A2540
- Border Light: #E6E6E6

## Typographie

### Font Family
- Tous utilisent **Inter** comme police principale
- Font weights:
  - Regular: 400
  - Medium: 500
  - Semibold: 600
  - Bold: 700

### Tailles de texte
- Hero Heading: 48-72px (mobile: 36-48px)
- Section Heading: 36-48px (mobile: 28-36px)
- Subheading: 24-32px (mobile: 20-24px)
- Body Large: 18-20px
- Body: 16px
- Small: 14px

### Line Height
- Headings: 1.1-1.2
- Body: 1.5-1.6

## Contraste et Lisibilité

### Règles WCAG AAA
- Text/Background: Ratio minimum 7:1
- Large Text: Ratio minimum 4.5:1
- Interactive elements: Ratio minimum 3:1

### Exemples de contrastes corrects
- Noir (#0F0F10) sur Blanc (#FFFFFF): 20.06:1 ✓
- Gris foncé (#212529) sur Blanc: 16.04:1 ✓
- Blanc sur Bleu (#635BFF): 4.96:1 ✓
- Gris (#6C757D) sur Blanc: 4.48:1 ✓

## Espacements

### Système 8px
- xs: 8px
- sm: 16px
- md: 24px
- lg: 32px
- xl: 48px
- 2xl: 64px
- 3xl: 96px

## Ombres

### Linear/Stripe style
- Pas d'ombres ou très subtiles
- shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
- shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1)

### Brand style
- Plus d'ombres mais douces
- shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)
- shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 15px rgba(0, 0, 0, 0.1)

## Gradients

### Linear style
- Très subtils, presque invisibles
- from-gray-900 to-black
- from-purple-600/10 to-transparent

### Stripe style
- Plus vibrants mais contrôlés
- from-purple-600 to-blue-600
- from-#635BFF to-#4F46E5
