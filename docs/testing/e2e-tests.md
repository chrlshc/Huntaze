# Guide des Tests E2E (End-to-End)

Guide complet pour écrire et maintenir les tests end-to-end avec Playwright dans Huntaze.

## Vue d'ensemble

Les tests E2E simulent des parcours utilisateur complets dans un navigateur réel. Ils vérifient que l'application fonctionne correctement du point de vue de l'utilisateur final.

## Structure des Tests

```
tests/e2e/
├── setup/
│   ├── global-setup.ts          # Setup global (serveur, DB)
│   ├── global-teardown.ts       # Cleanup global
│   └── auth-helper.ts           # Helpers d'authentification
├── fixtures/
│   ├── test-users.ts            # Utilisateurs de test
│   └── test-data.ts             # Données de test
├── workflows/
│   ├── authentication/
│   │   ├── login.spec.ts
│   │   └── oauth-instagram.spec.ts
│   ├── content/
│   │   ├── create-content.spec.ts
│   │   └── schedule-content.spec.ts
│   ├── messages/
│   │   └── send-message.spec.ts
│   └── revenue/
│       └── pricing-changes.spec.ts
└── smoke/
    └── critical-paths.spec.ts   # Tests smoke
```

## Configuration Playwright

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  
  reporter: [
    ['html', { outputFolder: 'test-results/e2e-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  
  webServer: {
    command: 'npm run start',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Écrire un Test E2E

### Structure de Base

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: naviguer vers la page
    await page.goto('/');
  });

  test('should perform user action', async ({ page }) => {
    // Arrange: préparer l'état
    await page.fill('[data-testid="input"]', 'test value');
    
    // Act: exécuter l'action
    await page.click('[data-testid="submit-button"]');
    
    // Assert: vérifier le résultat
    await expect(page.locator('[data-testid="success-message"]'))
      .toBeVisible();
  });
});
```

### Exemple Complet: Login Flow

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Error message should appear
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Invalid credentials');
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });
});
```

### Exemple: Content Creation Workflow

```typescript
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../setup/auth-helper';

test.describe('Content Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsTestUser(page, 'creator');
  });

  test('should create and save content', async ({ page }) => {
    // Navigate to content page
    await page.goto('/content');
    await page.click('[data-testid="create-content-button"]');
    
    // Fill content form
    await page.selectOption('[data-testid="platform-select"]', 'instagram');
    await page.selectOption('[data-testid="type-select"]', 'post');
    await page.fill('[data-testid="caption-input"]', 'Test post caption');
    
    // Upload media (optional)
    const fileInput = page.locator('[data-testid="media-upload"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');
    
    // Save as draft
    await page.click('[data-testid="save-draft-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-toast"]'))
      .toContainText('Content saved');
    
    // Verify content appears in list
    await page.goto('/content');
    await expect(page.locator('[data-testid="content-list"]'))
      .toContainText('Test post caption');
  });

  test('should schedule content for future publication', async ({ page }) => {
    await page.goto('/content');
    await page.click('[data-testid="create-content-button"]');
    
    // Fill form
    await page.selectOption('[data-testid="platform-select"]', 'instagram');
    await page.fill('[data-testid="caption-input"]', 'Scheduled post');
    
    // Set schedule
    await page.click('[data-testid="schedule-toggle"]');
    await page.fill('[data-testid="schedule-date"]', '2025-12-31');
    await page.fill('[data-testid="schedule-time"]', '14:00');
    
    // Save
    await page.click('[data-testid="schedule-button"]');
    
    // Verify scheduled
    await expect(page.locator('[data-testid="success-toast"]'))
      .toContainText('Content scheduled');
    
    // Check calendar view
    await page.goto('/content/calendar');
    await expect(page.locator('[data-date="2025-12-31"]'))
      .toContainText('Scheduled post');
  });
});
```

## Helpers et Utilities

### Auth Helper

```typescript
// tests/e2e/setup/auth-helper.ts
import { Page } from '@playwright/test';

export async function loginAsTestUser(
  page: Page,
  userType: 'creator' | 'admin' = 'creator'
): Promise<void> {
  await page.goto('/login');
  
  const credentials = {
    creator: {
      email: 'creator@test.com',
      password: 'test123',
    },
    admin: {
      email: 'admin@test.com',
      password: 'admin123',
    },
  };
  
  const { email, password } = credentials[userType];
  
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

export async function waitForDashboardLoad(page: Page): Promise<void> {
  await page.waitForSelector('[data-testid="dashboard-metrics"]');
  await page.waitForLoadState('networkidle');
}
```

### Page Object Model

```typescript
// tests/e2e/pages/content-page.ts
import { Page, Locator } from '@playwright/test';

export class ContentPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly platformSelect: Locator;
  readonly captionInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('[data-testid="create-content-button"]');
    this.platformSelect = page.locator('[data-testid="platform-select"]');
    this.captionInput = page.locator('[data-testid="caption-input"]');
    this.saveButton = page.locator('[data-testid="save-draft-button"]');
  }

  async goto() {
    await this.page.goto('/content');
  }

  async createPost(platform: string, caption: string) {
    await this.createButton.click();
    await this.platformSelect.selectOption(platform);
    await this.captionInput.fill(caption);
    await this.saveButton.click();
  }
}

// Usage
test('should create content using page object', async ({ page }) => {
  const contentPage = new ContentPage(page);
  await contentPage.goto();
  await contentPage.createPost('instagram', 'Test post');
});
```

## Sélecteurs et Locators

### Best Practices

```typescript
// ✅ Bon - utiliser data-testid
await page.click('[data-testid="submit-button"]');

// ✅ Bon - utiliser role
await page.click('button:has-text("Submit")');

// ❌ Mauvais - utiliser des classes CSS
await page.click('.btn-primary');

// ❌ Mauvais - utiliser des sélecteurs fragiles
await page.click('div > div > button:nth-child(2)');
```

### Attendre les Éléments

```typescript
// Attendre qu'un élément soit visible
await page.waitForSelector('[data-testid="content"]', { state: 'visible' });

// Attendre qu'un élément disparaisse
await page.waitForSelector('[data-testid="loading"]', { state: 'hidden' });

// Attendre une navigation
await page.waitForURL('/dashboard');

// Attendre que le réseau soit idle
await page.waitForLoadState('networkidle');
```

## Assertions

### Assertions Courantes

```typescript
// Visibilité
await expect(page.locator('[data-testid="element"]')).toBeVisible();
await expect(page.locator('[data-testid="element"]')).toBeHidden();

// Contenu texte
await expect(page.locator('h1')).toContainText('Dashboard');
await expect(page.locator('h1')).toHaveText('Dashboard');

// Valeurs de formulaire
await expect(page.locator('input')).toHaveValue('test');

// URL
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/\/dashboard/);

// Nombre d'éléments
await expect(page.locator('.item')).toHaveCount(5);

// Attributs
await expect(page.locator('button')).toBeDisabled();
await expect(page.locator('button')).toBeEnabled();
```

## Gestion des Données de Test

### Fixtures

```typescript
// tests/e2e/fixtures/test-users.ts
export const testUsers = {
  creator: {
    email: 'creator@test.com',
    password: 'test123',
    name: 'Test Creator',
  },
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Test Admin',
  },
};
```

### Setup et Teardown

```typescript
test.beforeAll(async () => {
  // Setup global: créer des données de test
  await seedTestDatabase();
});

test.afterAll(async () => {
  // Cleanup global
  await cleanupTestDatabase();
});

test.beforeEach(async ({ page }) => {
  // Setup par test
  await page.goto('/');
});

test.afterEach(async ({ page }, testInfo) => {
  // Capture d'écran en cas d'échec
  if (testInfo.status !== 'passed') {
    await page.screenshot({
      path: `test-results/failure-${testInfo.title}.png`,
    });
  }
});
```

## Tests Multi-Navigateurs

```typescript
test.describe('Cross-browser tests', () => {
  test('should work on all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Test spécifique au navigateur
    if (browserName === 'webkit') {
      // Safari-specific test
    }
    
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## Tests Mobile

```typescript
import { devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test('should work on mobile', async ({ page }) => {
  await page.goto('/');
  
  // Test mobile-specific features
  await page.click('[data-testid="mobile-menu"]');
  await expect(page.locator('[data-testid="nav-menu"]')).toBeVisible();
});
```

## Debugging

### Mode Debug

```bash
# Ouvrir Playwright Inspector
npx playwright test --debug

# Ouvrir pour un test spécifique
npx playwright test login.spec.ts --debug
```

### Pause dans le Test

```typescript
test('debug test', async ({ page }) => {
  await page.goto('/');
  
  // Pause pour inspecter
  await page.pause();
  
  await page.click('button');
});
```

### Traces

```typescript
// Activer les traces
test.use({ trace: 'on' });

// Voir les traces après échec
npx playwright show-trace test-results/trace.zip
```

## Exécution des Tests

### Commandes de Base

```bash
# Tous les tests E2E
npx playwright test

# Tests spécifiques
npx playwright test login.spec.ts

# Mode headed (avec navigateur visible)
npx playwright test --headed

# Mode debug
npx playwright test --debug

# Navigateur spécifique
npx playwright test --project=chromium

# Avec UI
npx playwright test --ui
```

### Rapports

```bash
# Générer et ouvrir le rapport HTML
npx playwright show-report

# Rapport JSON
npx playwright test --reporter=json
```

## Best Practices

### 1. Utiliser data-testid

```typescript
// ✅ Bon
<button data-testid="submit-button">Submit</button>
await page.click('[data-testid="submit-button"]');

// ❌ Mauvais
<button className="btn-primary">Submit</button>
await page.click('.btn-primary');
```

### 2. Attendre Correctement

```typescript
// ✅ Bon - attendre explicitement
await page.waitForSelector('[data-testid="content"]');
await page.click('[data-testid="button"]');

// ❌ Mauvais - timeout arbitraire
await page.waitForTimeout(1000);
await page.click('[data-testid="button"]');
```

### 3. Tests Indépendants

```typescript
// ✅ Bon - chaque test est indépendant
test('test 1', async ({ page }) => {
  await loginAsTestUser(page);
  // test logic
});

test('test 2', async ({ page }) => {
  await loginAsTestUser(page);
  // test logic
});

// ❌ Mauvais - dépendance entre tests
test('test 1', async ({ page }) => {
  await loginAsTestUser(page);
  // creates data
});

test('test 2', async ({ page }) => {
  // assumes data from test 1 exists
});
```

### 4. Noms Descriptifs

```typescript
// ✅ Bon
test('should display error when email is invalid', async ({ page }) => {});

// ❌ Mauvais
test('email test', async ({ page }) => {});
```

### 5. Éviter les Sélecteurs Fragiles

```typescript
// ✅ Bon
await page.click('[data-testid="submit"]');
await page.click('button:has-text("Submit")');

// ❌ Mauvais
await page.click('div > div > button:nth-child(2)');
await page.click('.container .form .btn');
```

## Troubleshooting

### Tests qui échouent de manière intermittente

**Cause**: Conditions de course, attentes insuffisantes
**Solution**: Utiliser des attentes explicites, vérifier les états

### Timeouts

**Cause**: Opérations longues, réseau lent
**Solution**: Augmenter le timeout, optimiser l'application

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // test logic
});
```

### Sélecteurs qui ne fonctionnent pas

**Cause**: Sélecteurs incorrects, éléments non chargés
**Solution**: Vérifier les sélecteurs, attendre le chargement

## Ressources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- Tests existants dans `tests/e2e/`
- `.kiro/specs/production-testing-suite/design.md`

## Support

Pour questions ou problèmes:
- Consulter les tests existants
- Vérifier la documentation Playwright
- Créer une issue dans Linear
