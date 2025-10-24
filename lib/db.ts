import { PrismaClient } from '@prisma/client';

// Singleton pattern pour éviter la multiplication des connexions en serverless
const globalForPrisma = globalThis as unknown as { 
  prisma?: PrismaClient 
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// En développement, réutiliser la même instance pour éviter les reconnexions
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Gestion propre de la fermeture des connexions
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Helper pour les transactions
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback);
}

// Helper pour les requêtes avec retry
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// Helper pour vérifier la santé de la base de données
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      isHealthy: true,
      latency
    };
  } catch (error) {
    const latency = Date.now() - start;
    
    return {
      isHealthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}