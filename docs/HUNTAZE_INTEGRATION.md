# 🔗 HUNTAZE - Intégration Frontend-Backend

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Flux de Données](#flux-de-données)
3. [Communication API](#communication-api)
4. [Authentification](#authentification)
5. [Gestion d'État](#gestion-détat)
6. [Exemples Complets](#exemples-complets)

---

## 🌐 Vue d'Ensemble

### Architecture de Communication

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │   Pages    │  │ Components │  │   Hooks    │           │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │
│        │                │                │                   │
│        └────────────────┴────────────────┘                   │
│                         │                                     │
│                         ▼                                     │
│              ┌──────────────────────┐                        │
│              │   State Management   │                        │
│              │  (Zustand + React    │                        │
│              │       Query)         │                        │
│              └──────────┬───────────┘                        │
│                         │                                     │
│                         ▼                                     │
│              ┌──────────────────────┐                        │
│              │    API Client        │                        │
│              │  (fetch + retry +    │                        │
│              │   circuit breaker)   │                        │
│              └──────────┬───────────┘                        │
└─────────────────────────┼─────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│              ┌──────────────────────┐                        │
│              │   API Routes         │                        │
│              │  (Next.js)           │                        │
│              └──────────┬───────────┘                        │
│                         │                                     │
│        ┌────────────────┼────────────────┐                  │
│        │                │                │                   │
│        ▼                ▼                ▼                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐             │
│  │Middleware│  │   Services    │  │ Database │             │
│  └──────────┘  └──────────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux de Données

### 1. Flux Simple (Lecture)

```
User Action → Component → Hook → API Client → Backend API
                                                    ↓
                                              Database Query
                                                    ↓
Response ← Component ← Hook ← API Client ← Backend API
```

**Exemple:** Afficher la liste des contenus

```tsx
// 1. Component
function ContentList() {
  // 2. Hook (React Query)
  const { data, isLoading } = useQuery({
    queryKey: ['contents'],
    queryFn: () => api.getContents(),
  });

  if (isLoading) return <Spinner />;
  
  return (
    <div>
      {data?.map(content => (
        <ContentCard key={content.id} content={content} />
      ))}
    </div>
  );
}

// 3. API Client
const api = {
  getContents: async () => {
    const response = await fetch('/api/content', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    return response.json();
  },
};

// 4. Backend API
export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  const contents = await prisma.content.findMany({
    where: { userId: user.id },
  });
  return NextResponse.json(contents);
}
```

---

### 2. Flux Complexe (Écriture avec Optimistic Update)

```
User Action → Component → Optimistic Update → Store
                              ↓
                         API Call → Backend
                              ↓
                    Success/Error → Store Update
                              ↓
                         UI Refresh
```

**Exemple:** Créer un contenu avec mise à jour optimiste

```tsx
// 1. Component
function CreateContentButton() {
  const { mutate, isLoading } = useOptimisticMutation({
    mutationFn: api.createContent,
    onMutate: async (newContent) => {
      // Optimistic update
      const previousContents = queryClient.getQueryData(['contents']);
      queryClient.setQueryData(['contents'], (old) => [
        ...old,
        { ...newContent, id: 'temp-id', status: 'creating' },
      ]);
      return { previousContents };
    },
    onError: (err, newContent, context) => {
      // Rollback on error
      queryClient.setQueryData(['contents'], context.previousContents);
      toast.error('Erreur lors de la création');
    },
    onSuccess: (data) => {
      // Update with real data
      queryClient.invalidateQueries(['contents']);
      toast.success('Contenu créé !');
    },
  });

  return (
    <Button onClick={() => mutate(contentData)} disabled={isLoading}>
      Créer
    </Button>
  );
}

// 2. API Client
const api = {
  createContent: async (data: CreateContentData) => {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create content');
    }
    
    return response.json();
  },
};

// 3. Backend API
export const POST = withAuth(
  withValidation(CreateContentSchema)(
    async (req, data) => {
      const user = (req as any).user;
      
      const content = await prisma.content.create({
        data: {
          ...data,
          userId: user.id,
        },
      });
      
      return NextResponse.json(content, { status: 201 });
    }
  )
);
```

---

### 3. Flux Streaming (Server-Sent Events)

```
User Action → Component → SSE Connection → Backend Stream
                              ↓
                    Chunks Received → UI Update (real-time)
                              ↓
                         Complete → Final State
```

**Exemple:** Génération de contenu IA avec streaming

```tsx
// 1. Component
function AIContentGenerator() {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = async () => {
    setIsGenerating(true);
    setContent('');

    try {
      // 2. SSE Connection
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'Generate content...' }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content') {
              // 3. Real-time UI Update
              setContent(prev => prev + data.content);
            }
          }
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <Button onClick={generateContent} disabled={isGenerating}>
        Générer
      </Button>
      <div className="content-preview">
        {content}
        {isGenerating && <Spinner />}
      </div>
    </div>
  );
}

// 4. Backend API (Streaming)
export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  const { prompt } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Generate content with AI
        const aiStream = await aiService.generateTextStream({ prompt });

        for await (const chunk of aiStream) {
          // Send chunk to client
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 🔐 Authentification

### Flux d'Authentification

```
1. Login → POST /api/auth/signin
              ↓
2. Backend validates credentials
              ↓
3. Generate JWT tokens (access + refresh)
              ↓
4. Return tokens to frontend
              ↓
5. Store tokens (memory + HTTP-only cookie)
              ↓
6. Subsequent requests include access token
              ↓
7. Token expires → Refresh with refresh token
```

### Implémentation

**Frontend:**
```tsx
// lib/auth/auth-service.ts
class AuthService {
  private accessToken: string | null = null;

  async signin(email: string, password: string) {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const { user, accessToken } = await response.json();
    
    // Store access token in memory
    this.accessToken = accessToken;
    
    // Store user in store
    useUserStore.getState().setUser(user);
    
    return user;
  }

  async refreshToken() {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Include HTTP-only cookie
    });

    if (!response.ok) {
      this.signout();
      throw new Error('Session expired');
    }

    const { accessToken } = await response.json();
    this.accessToken = accessToken;
    
    return accessToken;
  }

  getAccessToken() {
    return this.accessToken;
  }

  signout() {
    this.accessToken = null;
    useUserStore.getState().clearUser();
  }
}

export const authService = new AuthService();
```

**API Client avec Auto-Refresh:**
```tsx
// lib/utils/api.ts
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authService.getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  // If 401, try to refresh token
  if (response.status === 401) {
    try {
      await authService.refreshToken();
      
      // Retry request with new token
      const newToken = authService.getAccessToken();
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    } catch (error) {
      // Refresh failed, redirect to login
      window.location.href = '/signin';
      throw error;
    }
  }

  return response;
}
```

---

## 📊 Gestion d'État

### Architecture de State Management

```
┌─────────────────────────────────────────┐
│         Application State                │
├─────────────────────────────────────────┤
│                                          │
│  ┌────────────────┐  ┌────────────────┐│
│  │  Server State  │  │   Local State  ││
│  │ (React Query)  │  │   (Zustand)    ││
│  └────────────────┘  └────────────────┘│
│          │                    │          │
│          ▼                    ▼          │
│  ┌────────────────┐  ┌────────────────┐│
│  │  - Contents    │  │  - UI State    ││
│  │  - Analytics   │  │  - User Prefs  ││
│  │  - User Data   │  │  - Temp Data   ││
│  └────────────────┘  └────────────────┘│
└─────────────────────────────────────────┘
```

### Server State (React Query)

**Pour les données du serveur:**
```tsx
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['contents', filters],
  queryFn: () => api.getContents(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Mutate data
const { mutate } = useMutation({
  mutationFn: api.createContent,
  onSuccess: () => {
    queryClient.invalidateQueries(['contents']);
  },
});
```

### Local State (Zustand)

**Pour l'état UI et préférences:**
```tsx
// Store
const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
  setTheme: (theme) => set({ theme }),
}));

// Usage
const { sidebarOpen, toggleSidebar } = useUIStore();
```

---

## 💡 Exemples Complets

### Exemple 1: Dashboard avec Analytics

**Page:**
```tsx
// app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RevenueCard />
        <EngagementCard />
        <ContentCard />
      </div>
      
      <div className="mt-8">
        <RevenueChart />
      </div>
    </Layout>
  );
}
```

**Component:**
```tsx
// components/dashboard/RevenueCard.tsx
function RevenueCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['revenue', '30d'],
    queryFn: () => api.getRevenue('30d'),
  });

  if (isLoading) return <CardSkeleton />;

  return (
    <Card title="Revenus">
      <div className="text-3xl font-bold">
        {formatCurrency(data.totalRevenue)}
      </div>
      <div className="text-sm text-gray-500">
        {data.growth > 0 ? '+' : ''}{data.growth}% vs mois dernier
      </div>
    </Card>
  );
}
```

**API:**
```tsx
// app/api/analytics/revenue/route.ts
export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';

  const revenue = await analyticsService.getRevenue(user.id, period);

  return NextResponse.json(revenue);
}
```

---

### Exemple 2: Création de Contenu avec IA

**Page:**
```tsx
// app/(dashboard)/content-creation/page.tsx
export default function ContentCreationPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Layout 
      title="Création de Contenu"
      primaryAction={
        <Button onClick={() => setIsModalOpen(true)}>
          Générer des idées
        </Button>
      }
    >
      <ContentList />
      
      <AIIdeaGeneratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Layout>
  );
}
```

**Modal:**
```tsx
// components/content/AIIdeaGeneratorModal.tsx
function AIIdeaGeneratorModal({ isOpen, onClose }) {
  const { mutate, isLoading, data } = useMutation({
    mutationFn: api.generateContentIdeas,
  });

  const handleGenerate = () => {
    mutate({
      creatorProfile: {
        // ... profile data
      },
      options: {
        count: 5,
        creativity: 'balanced',
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Générer des idées">
      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? 'Génération...' : 'Générer'}
      </Button>
      
      {data && (
        <div className="mt-4 space-y-4">
          {data.ideas.map(idea => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </Modal>
  );
}
```

---

**📖 Voir aussi :**
- `HUNTAZE_BACKEND_DETAILED.md` - Backend en détail
- `HUNTAZE_FRONTEND_DETAILED.md` - Frontend en détail
- `HUNTAZE_AI_SERVICES.md` - Services IA
