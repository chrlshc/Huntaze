# 🎨 HUNTAZE - Frontend Détaillé

## 📋 Table des Matières

1. [Architecture Frontend](#architecture-frontend)
2. [Composants](#composants)
3. [State Management](#state-management)
4. [Routing](#routing)
5. [Styling](#styling)

---

## 🏗️ Architecture Frontend

### Structure des Dossiers

```
huntaze/
├── app/                        # Next.js App Router
│   ├── (dashboard)/            # Route groups protégées
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── content-creation/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── inbox/
│   │   │   └── page.tsx
│   │   └── layout.tsx          # Layout dashboard
│   │
│   ├── (auth)/                 # Route groups auth
│   │   ├── signin/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── globals.css             # Styles globaux
│   ├── layout.tsx              # Layout racine
│   └── page.tsx                # Page d'accueil
│
├── components/                 # Composants réutilisables
│   ├── ui/                     # Composants de base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Spinner.tsx
│   │
│   ├── forms/                  # Formulaires
│   │   ├── LoginForm.tsx
│   │   ├── ContentForm.tsx
│   │   └── ProfileForm.tsx
│   │
│   ├── charts/                 # Graphiques
│   │   ├── RevenueChart.tsx
│   │   ├── EngagementChart.tsx
│   │   └── PerformanceChart.tsx
│   │
│   └── admin/                  # Interface admin
│       ├── Layout.tsx
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── Footer.tsx
│
├── lib/                        # Logique frontend
│   ├── hooks/                  # Custom hooks
│   │   ├── use-api-integration.ts
│   │   ├── use-sse-client.ts
│   │   ├── use-optimistic-mutations.ts
│   │   └── use-conflict-resolution.ts
│   │
│   ├── stores/                 # Zustand stores
│   │   ├── user-store.ts
│   │   ├── content-store.ts
│   │   └── ui-store.ts
│   │
│   └── utils/                  # Utilitaires
│       ├── api.ts
│       ├── format.ts
│       └── validation.ts
│
└── public/                     # Assets statiques
    ├── images/
    ├── icons/
    └── fonts/
```

---

## 🧩 Composants

### Layout Principal

**Fichier:** `components/admin/Layout.tsx`

**Description:** Layout principal de l'application avec sidebar et header

**Props:**
```typescript
interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode[];
}
```

**Usage:**
```tsx
<Layout 
  title="Dashboard"
  primaryAction={<Button>Créer</Button>}
>
  <DashboardContent />
</Layout>
```

**Fonctionnalités:**
- Sidebar responsive avec navigation
- Header avec actions
- Mobile-friendly avec overlay
- Breadcrumbs automatiques

---

### Composants UI

#### Button

**Fichier:** `components/ui/Button.tsx`

**Variants:**
- `primary` - Bouton principal (bleu)
- `secondary` - Bouton secondaire (gris)
- `danger` - Bouton danger (rouge)
- `ghost` - Bouton transparent

**Sizes:**
- `sm` - Petit
- `md` - Moyen (default)
- `lg` - Grand

**Usage:**
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Enregistrer
</Button>
```

---

#### Card

**Fichier:** `components/ui/Card.tsx`

**Props:**
```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}
```

**Usage:**
```tsx
<Card 
  title="Statistiques"
  subtitle="Derniers 30 jours"
  actions={<Button>Voir plus</Button>}
>
  <RevenueChart />
</Card>
```

---

#### Modal

**Fichier:** `components/ui/Modal.tsx`

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

**Usage:**
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Créer du contenu"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Annuler
      </Button>
      <Button variant="primary" onClick={handleSubmit}>
        Créer
      </Button>
    </>
  }
>
  <ContentForm />
</Modal>
```

---

### Formulaires

#### LoginForm

**Fichier:** `components/forms/LoginForm.tsx`

**Fonctionnalités:**
- Validation avec React Hook Form + Zod
- Gestion des erreurs
- Remember me
- Loading states

**Usage:**
```tsx
<LoginForm 
  onSuccess={(user) => router.push('/dashboard')}
  onError={(error) => toast.error(error.message)}
/>
```

---

#### ContentForm

**Fichier:** `components/forms/ContentForm.tsx`

**Fonctionnalités:**
- Upload de fichiers
- Preview en temps réel
- Suggestions IA
- Validation

**Usage:**
```tsx
<ContentForm
  initialData={content}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

---

### Graphiques

#### RevenueChart

**Fichier:** `components/charts/RevenueChart.tsx`

**Props:**
```typescript
interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
  }>;
  period: '7d' | '30d' | '90d' | '1y';
  onPeriodChange: (period: string) => void;
}
```

**Usage:**
```tsx
<RevenueChart
  data={revenueData}
  period="30d"
  onPeriodChange={setPeriod}
/>
```

---

## 🗄️ State Management

### User Store

**Fichier:** `lib/stores/user-store.ts`

**State:**
```typescript
interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
```

**Actions:**
```typescript
{
  setUser: (user: User) => void;
  clearUser: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

**Usage:**
```tsx
const { user, isLoading, updateProfile } = useUserStore();

const handleUpdate = async () => {
  await updateProfile({ name: 'New Name' });
};
```

---

### Content Store

**Fichier:** `lib/stores/content-creation-store.ts`

**State:**
```typescript
interface ContentState {
  contents: Content[];
  selectedContent: Content | null;
  isGenerating: boolean;
  filters: ContentFilters;
}
```

**Actions:**
```typescript
{
  addContent: (content: Content) => void;
  updateContent: (id: string, data: Partial<Content>) => void;
  deleteContent: (id: string) => void;
  generateIdeas: (profile: CreatorProfile) => Promise<void>;
  setFilters: (filters: ContentFilters) => void;
}
```

---

### UI Store

**Fichier:** `lib/stores/ui-store.ts`

**State:**
```typescript
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}
```

**Actions:**
```typescript
{
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}
```

---

## 🪝 Custom Hooks

### useAPIIntegration

**Fichier:** `lib/hooks/use-api-integration.ts`

**Description:** Hook pour appels API avec circuit breaker et retry

**Usage:**
```tsx
const { data, isLoading, error, refetch } = useAPIIntegration<Content[]>(
  '/api/content',
  {
    retry: 3,
    retryDelay: 1000,
  }
);
```

**Fonctionnalités:**
- Circuit breaker automatique
- Retry avec backoff exponentiel
- Request coalescing
- Cache intelligent

---

### useSSEClient

**Fichier:** `lib/hooks/use-sse-client.ts`

**Description:** Hook pour Server-Sent Events (streaming)

**Usage:**
```tsx
const { data, isConnected, error } = useSSEClient<AIChunk>(
  '/api/ai/generate',
  {
    onMessage: (chunk) => console.log(chunk),
    onError: (error) => console.error(error),
  }
);
```

---

### useOptimisticMutations

**Fichier:** `lib/hooks/use-optimistic-mutations.ts`

**Description:** Hook pour mutations optimistes

**Usage:**
```tsx
const { mutate, isLoading } = useOptimisticMutations({
  mutationFn: updateContent,
  onSuccess: () => toast.success('Mis à jour'),
  onError: () => toast.error('Erreur'),
});

mutate({ id: '123', title: 'New Title' });
```

---

## 🎨 Styling

### Tailwind CSS

**Configuration:** `tailwind.config.js`

**Thème personnalisé:**
```javascript
{
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f8fafc',
      500: '#64748b',
      900: '#0f172a',
    },
  },
  fontFamily: {
    sans: ['Inter', 'sans-serif'],
  },
}
```

---

### CSS Modules

**Usage:**
```tsx
import styles from './Component.module.css';

<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

---

### Framer Motion

**Animations:**
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## 🛣️ Routing

### App Router (Next.js 14)

**Structure:**
```
app/
├── (dashboard)/
│   ├── layout.tsx              # Layout partagé
│   ├── dashboard/page.tsx      # /dashboard
│   ├── inbox/page.tsx          # /inbox
│   └── analytics/page.tsx      # /analytics
│
├── (auth)/
│   ├── signin/page.tsx         # /signin
│   └── signup/page.tsx         # /signup
│
└── page.tsx                    # /
```

**Navigation:**
```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
router.back();
router.refresh();
```

---

**📖 Voir aussi :**
- `HUNTAZE_INTEGRATION.md` - Intégration Frontend-Backend
- `HUNTAZE_BACKEND_DETAILED.md` - Backend en détail
